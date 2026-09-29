/**
 * 任务滚动服务：从最近一期含未完成任务的日志，把任务块移到今天的日日志。
 * 源删除走 Vault.process 原子回调；目标插入复用 applyPlan（标题锚点连排）。
 */

import { TFile, type App } from "obsidian";
import { blocksToLines, extractUnfinishedBlocks, removeBlocks, type TaskBlock } from "../capture/rollover";
import { planInsertLines } from "../capture/plan";
import { skeletonFor } from "../capture/skeleton";
import type { PeriodType, QJConfig } from "../types";
import { dateKey } from "../periods/period";
import { applyPlanToFile, ensureNote } from "./file-writer";
import { VaultIndex } from "./vault-index";

export interface RolloverPreview {
	sourcePath: string;
	sourceDate: string;
	blocks: TaskBlock[];
}

export type RolloverResult =
	| { ok: true; moved: number; from: string }
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

	/** 往回找最近一期有未完成任务的日日志（不含今天；递归子目录，按归属日期倒序）。 */
	async preview(now: Date): Promise<RolloverPreview | null> {
		const markers = this.markers();
		const today = dateKey(now);
		const entries = new VaultIndex(this.app, this.dir("daily")).dailyEntries();
		for (const entry of entries) {
			if (entry.date >= today) continue;
			const text = await this.app.vault.cachedRead(entry.file);
			const blocks = extractUnfinishedBlocks(text.split(/\r?\n/), markers);
			if (blocks.length > 0) {
				return { sourcePath: entry.file.path, sourceDate: entry.date, blocks };
			}
			if (entries.indexOf(entry) >= MAX_LOOKBACK) break;
		}
		return null;
	}

	/** 执行迁移：目标 = 今天日日志的任务列表区（首个行模板带 `[ ]` 的 list 区）。 */
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
		const lines = blocksToLines(preview.blocks);
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

		// 3. 源文件删除（原子，标记集与预览一致）
		const markers = this.markers();
		const sourceFile = this.app.vault.getAbstractFileByPath(preview.sourcePath);
		if (!(sourceFile instanceof TFile)) {
			return { ok: false, message: `note not found: ${preview.sourcePath}` };
		}
		await this.app.vault.process(sourceFile, (text) =>
			removeBlocks(text, extractUnfinishedBlocks(text.split(/\r?\n/), markers)),
		);

		return { ok: true, moved: preview.blocks.length, from: preview.sourceDate };
	}
}
