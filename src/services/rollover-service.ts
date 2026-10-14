/**
 * 任务滚动服务：收集最近 rolloverDays 天（默认 7，不含今天）所有日日志的未完成任务块，
 * 按旧→新移到今天的日日志——不去重、忠实搬运；窗口外不回溯。
 * 源删除逐文件走 Vault.process 原子回调；目标插入复用 applyPlan（标题锚点连排）。
 */

import { TFile, type App } from "obsidian";
import { blocksToLines, extractUnfinishedBlocks, removeBlocks, type TaskBlock } from "../capture/rollover";
import { planInsertLines } from "../capture/plan";
import { skeletonFor } from "../capture/skeleton";
import type { PeriodType, QJConfig } from "../types";
import { dateKey } from "../periods/period";
import { applyPlanToFile, ensureNote } from "./file-writer";
import { VaultIndex } from "./vault-index";

export interface RolloverSource {
	/** 源日志路径 */
	path: string;
	/** 源日志归属日期（YYYY-MM-DD） */
	date: string;
	blocks: TaskBlock[];
}

export interface RolloverPreview {
	/** 按日期旧→新排序 */
	sources: RolloverSource[];
	/** 全部任务块数 */
	total: number;
}

export type RolloverResult =
	| { ok: true; moved: number; dates: string[] }
	| { ok: false; message: string };

const MAX_LOOKBACK = 365;

export class RolloverService {
	constructor(
		private app: App,
		private getConfig: () => QJConfig,
	) {}

	/** 完整标记集 = 空格（隐含标配）+ 配置的额外标识。 */
	private markers(): string[] {
		return [" ", ...this.getConfig().tasks.markers.open];
	}

	private dir(type: PeriodType): string {
		return this.getConfig().journals[type].dir.replace(/\/+$/, "");
	}

	private dailyPath(dateStr: string): string {
		return `${this.dir("daily")}/${dateStr}.md`;
	}

	/**
	 * 今天日日志（TFile 优先：递归子目录 + 归期感知）。
	 * 此前按目录根拼路径——子目录/非标准文件名的日志被误判缺失时，
	 * ensureNote 会在目录根另建平行笔记：任务「滚动后从日志消失、
	 * 面板还在、跳转找不到」以及与 TaskMatrix 各写一个文件，都源于此。
	 */
	private async todayFile(now: Date): Promise<TFile> {
		const existing = new VaultIndex(this.app, this.dir("daily")).dailyFile(dateKey(now));
		if (existing) return existing;
		return ensureNote(
			this.app,
			this.dailyPath(dateKey(now)),
			skeletonFor("daily", now, this.getConfig().journals.daily.sections),
		);
	}

	/** 配置的回看天数（清洗后仍防御：非有限数或 <1 回默认 7，封顶 MAX_LOOKBACK）。 */
	private rolloverDays(): number {
		const raw = this.getConfig().tasks.rolloverDays;
		return typeof raw === "number" && Number.isFinite(raw) && raw >= 1
			? Math.min(Math.floor(raw), MAX_LOOKBACK)
			: 7;
	}

	/**
	 * 收集最近 rolloverDays 天（不含今天）所有日日志的未完成任务块（递归子目录，按归属日期）。
	 * 不去重、忠实搬运；窗口内没有未完成任务时返回 null，不回溯窗口外
	 * （窗口语义，替代「无限回找最近一篇有未完成任务的日志」的旧行为）。
	 */
	async preview(now: Date): Promise<RolloverPreview | null> {
		const markers = this.markers();
		const today = dateKey(now);
		const start = new Date(now);
		start.setDate(start.getDate() - (this.rolloverDays() - 1));
		const startKey = dateKey(start);
		const entries = new VaultIndex(this.app, this.dir("daily")).dailyEntries();
		const sources: RolloverSource[] = [];
		for (let i = 0; i < entries.length && i <= MAX_LOOKBACK; i++) {
			const entry = entries[i];
			if (entry.date >= today) continue;
			if (entry.date < startKey) break; // 按日期降序，越出窗口即止
			const text = await this.app.vault.cachedRead(entry.file);
			const blocks = extractUnfinishedBlocks(text.split(/\r?\n/), markers);
			if (blocks.length > 0) {
				sources.push({ path: entry.file.path, date: entry.date, blocks });
			}
		}
		if (sources.length === 0) return null;
		sources.reverse(); // 旧 → 新
		return { sources, total: sources.reduce((n, s) => n + s.blocks.length, 0) };
	}

	/** 执行迁移：目标 = 今天日日志的任务列表区（首个行模板带 `[ ]` 的 list 区），多源按旧→新一次写入。 */
	async perform(preview: RolloverPreview, now: Date): Promise<RolloverResult> {
		const config = this.getConfig();

		// 1. 解析今天笔记（TFile 优先，全链路只用 file.path——见 todayFile 注释）
		const today = await this.todayFile(now);
		const todayText = await this.app.vault.cachedRead(today);

		// 2. 目标区：任务列表区（- [ ] 行模板）> 任一列表区 > 笔记末尾
		const sections = config.journals.daily.sections;
		const target =
			sections.find((s) => s.type === "list" && (s.lineTemplate ?? "").includes("[ ]")) ??
			sections.find((s) => s.type === "list");
		const lines = preview.sources.flatMap((source) => blocksToLines(source.blocks));
		const todayLines = todayText.split(/\r?\n/);

		const plan = target
			? planInsertLines(todayLines, {
					heading: target.heading,
					headingMissingCreates: true,
					newLines: lines,
				})
			: planInsertLines(todayLines, {
					heading: "## Tasks",
					headingMissingCreates: true,
					newLines: lines,
				});
		if (plan.status !== "ok") {
			return { ok: false, message: plan.reason };
		}
		await applyPlanToFile(this.app, today.path, plan);

		// 3. 逐源原子删除（标记集与预览一致）；源在预览后消失则跳过——任务已进今天，不阻断
		const markers = this.markers();
		for (const source of preview.sources) {
			const sourceFile = this.app.vault.getAbstractFileByPath(source.path);
			if (!(sourceFile instanceof TFile)) continue;
			await this.app.vault.process(sourceFile, (text) =>
				removeBlocks(text, extractUnfinishedBlocks(text.split(/\r?\n/), markers)),
			);
		}

		return { ok: true, moved: preview.total, dates: preview.sources.map((s) => s.date) };
	}
}
