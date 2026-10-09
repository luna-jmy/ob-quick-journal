/**
 * 捕获编排：标题区（带所属日志类型）→ 定位目标笔记 →（不存在则建骨架）→
 * 纯函数出计划 → 原子落盘。界面只管收表单值；覆盖确认由调用方二次调用完成；
 * 段落类型重发即编辑（预填），不走覆盖确认。
 */

import { TFile, type App } from "obsidian";
import type { JournalSection, PeriodType, QJConfig } from "../types";
import { sectionFieldKeys } from "../types";
import {
	currentFieldValues,
	planAppend,
	planDeleteLineAt,
	planEditLineAt,
	planFieldFill,
	planParagraph,
	type WritePlan,
} from "../capture/plan";
import { noteKeyFor, skeletonFor } from "../capture/skeleton";
import { VaultIndex } from "./vault-index";
import { findHeadingIndex, renderFieldLine, sectionRange } from "../parse/field-lines";
import { collectEntries, type SectionEntry } from "../parse/section-entries";
import { convertListTask, toggleTaskLine } from "../parse/line-ops";
import { dateKey } from "../periods/period";
import { applyPlanToFile, ensureNote, readNoteText } from "./file-writer";

export type CaptureResult =
	| { ok: true; path: string; created: boolean; writtenLines: number }
	| { ok: false; reason: "overwrite"; keys: string[]; path: string }
	| { ok: false; reason: "error"; message: string };

export type EntryWriteResult = { ok: true } | { ok: false; message: string };

export class CaptureService {
	constructor(
		private app: App,
		private getConfig: () => QJConfig,
	) {}

	private journal(type: PeriodType) {
		return this.getConfig().journals[type];
	}

	/** 目标笔记路径：先按配置格式生成键，递归找已有笔记（含子目录）；没有则回目录根新建。 */
	notePath(type: PeriodType, now: Date): string {
		const journal = this.journal(type);
		const key = noteKeyFor(type, now, journal.filenameFormat);
		const file = this.noteFile(type, key);
		if (file) return file.path;
		const dir = journal.dir.replace(/\/+$/, "");
		return `${dir}/${key}.md`;
	}

	/** 按期间键递归找已有笔记（归期感知：文件名或 frontmatter journal-date 命中即算）。 */
	private noteFile(type: PeriodType, key: string): TFile | null {
		const journal = this.journal(type);
		const index = new VaultIndex(this.app, journal.dir);
		return type === "daily" ? index.dailyFile(key) : index.fileByKey(key);
	}

	/** 兼容旧调用（面板 / 日志定位用）。 */
	dailyPath(now: Date): string {
		return this.notePath("daily", now);
	}

	async performSection(
		type: PeriodType,
		section: JournalSection,
		payload: { values: Record<string, string>; lineValue?: string },
		opts: { overwrite: boolean; now?: Date },
	): Promise<CaptureResult> {
		const now = opts.now ?? new Date();
		const journal = this.journal(type);
		const key = noteKeyFor(type, now, journal.filenameFormat);
		const dir = journal.dir.replace(/\/+$/, "");
		const target = `${dir}/${key}.md`;

		// 先按已有笔记解析成 TFile 再读写（递归子目录 + 归期感知）。
		// 曾出现过解析失配（索引未就绪）→ 误判缺失 → vault.create 落成
		// YYYY-MM-DD(1).md 平行文件的事故，这里全链路只用 file.path 定位
		let file: TFile | null = this.noteFile(type, key);
		let created = false;
		if (file === null) {
			const skeleton = skeletonFor(type, now, journal.sections, journal.filenameFormat);
			file = await ensureNote(this.app, target, skeleton);
			created = file.path === target;
		}
		const path = file.path;
		const text = await this.app.vault.cachedRead(file);

		let plan: WritePlan;
		if (section.type === "paragraph") {
			if (payload.lineValue === undefined || payload.lineValue.trim() === "") {
				return { ok: false, reason: "error", message: "empty value" };
			}
			plan = planParagraph(text.split(/\r?\n/), {
				heading: section.heading,
				headingMissingCreates: true,
				text: this.withTimestamp(section, payload.lineValue),
			});
		} else if (section.type === "list") {
			if (payload.lineValue === undefined || payload.lineValue.trim() === "") {
				return { ok: false, reason: "error", message: "empty value" };
			}
			const template = section.lineTemplate ?? "- {{value}}";
			const line = template.replaceAll(
				"{{value}}",
				this.withTimestamp(section, payload.lineValue),
			);
			plan = planAppend(text.split(/\r?\n/), {
				heading: section.heading,
				headingMissingCreates: true,
				line,
			});
		} else {
			// compare 区的键是 基础键+系列标记（sectionFieldKeys 展开），planFieldFill 键无关
			const fillValues = sectionFieldKeys(section)
				.filter((key) => payload.values[key] !== undefined && payload.values[key] !== "")
				.map((key) => ({ key, value: payload.values[key] }));
			if (fillValues.length === 0) {
				return { ok: false, reason: "error", message: "no values to write" };
			}
			plan = planFieldFill(text.split(/\r?\n/), {
				heading: section.heading,
				headingMissingCreates: true,
				values: fillValues,
			});
		}

		if (plan.status === "error") {
			return { ok: false, reason: "error", message: `${plan.reason}: ${plan.heading}` };
		}
		const overwrites = plan.edits.filter((e) => e.previousValue !== "").map((e) => e.key);
		if (plan.existingContent !== undefined && plan.existingContent !== "") {
			overwrites.push(plan.existingContent);
		}
		if (overwrites.length > 0 && !opts.overwrite) {
			return { ok: false, reason: "overwrite", keys: overwrites, path };
		}
		await applyPlanToFile(this.app, path, plan);
		return {
			ok: true,
			path,
			created,
			writtenLines: plan.edits.length + plan.creates.length,
		};
	}

	/**
	 * 「清空当前内容」：把该标题区已有值的字段全部写回空值行。
	 * 显式操作不走覆盖确认；只清已存在的字段行，不给从未录过的字段补空行。
	 */
	async clearSection(
		type: PeriodType,
		section: JournalSection,
		opts: { now?: Date } = {},
	): Promise<CaptureResult> {
		const now = opts.now ?? new Date();
		const key = noteKeyFor(type, now, this.journal(type).filenameFormat);
		const file = this.noteFile(type, key);
		if (file === null) {
			return { ok: false, reason: "error", message: "note not found" };
		}
		const lines = (await this.app.vault.cachedRead(file)).split(/\r?\n/);
		const keys = sectionFieldKeys(section);
		const current = currentFieldValues(lines, section.heading, keys);
		const targets = keys.filter((k) => k in current);
		if (targets.length === 0) {
			return { ok: true, path: file.path, created: false, writtenLines: 0 };
		}
		const plan = planFieldFill(lines, {
			heading: section.heading,
			headingMissingCreates: false,
			values: targets.map((k) => ({ key: k, value: "" })),
		});
		if (plan.status === "error") {
			return { ok: false, reason: "error", message: `${plan.reason}: ${plan.heading}` };
		}
		await applyPlanToFile(this.app, file.path, plan);
		return { ok: true, path: file.path, created: false, writtenLines: plan.edits.length };
	}

	/**
	 * 时间戳单点：开启后 list / paragraph 的写入内容前加 HH:mm（面板解析显示）。
	 * 取录入当下的钟表时间，与目标日志日解耦——「现在」是选择器选出的归属日
	 *（零点），跟着它走会把时间戳全写成 00:00。
	 */
	private withTimestamp(section: JournalSection, value: string): string {
		if (section.timestamp !== true) return value;
		const at = new Date();
		const hh = String(at.getHours()).padStart(2, "0");
		const mm = String(at.getMinutes()).padStart(2, "0");
		return `${hh}:${mm} ${value}`;
	}

	// ── 速记面板的条目级写回（编辑 / 删除 / 切换，不跳回日志） ───────────────

	async editEntry(
		section: JournalSection,
		entry: SectionEntry,
		content: string,
	): Promise<EntryWriteResult> {
		return this.mutateEntry(section, entry, content);
	}

	async deleteEntry(section: JournalSection, entry: SectionEntry): Promise<EntryWriteResult> {
		return this.mutateEntry(section, entry, null);
	}

	/** 切换任务完成态（面板点击状态符号）：待办/已取消 → 已完成（按配置的 done 标记写入）。 */
	async toggleTaskEntry(section: JournalSection, entry: SectionEntry): Promise<EntryWriteResult> {
		const doneMarkers = this.getConfig().tasks.markers.done;
		return this.rewriteRawLine(entry, (raw) => toggleTaskLine(raw, dateKey(new Date()), doneMarkers));
	}

	/** 列表 ↔ 任务互转（面板条目按钮）。 */
	async convertEntry(section: JournalSection, entry: SectionEntry): Promise<EntryWriteResult> {
		return this.rewriteRawLine(entry, convertListTask);
	}

	/** 归档（面板隐藏）：行尾追加 [archive:: true]（dataview 内联字段，可被外部识别）。 */
	async archiveEntry(section: JournalSection, entry: SectionEntry): Promise<EntryWriteResult> {
		return entry.kind === "paragraph"
			? this.archiveParagraph(section, entry)
			: this.rewriteRawLine(entry, (raw) => `${raw} [archive:: true]`);
	}

	/**
	 * 段落归档：标记加在段落首个非空行行尾（一天一条，区段正文即该条内容）。
	 * 首行做过期校验：与面板看到的条目首行不一致就拒绝，防错行。
	 */
	private async archiveParagraph(
		section: JournalSection,
		entry: SectionEntry,
	): Promise<EntryWriteResult> {
		const lines = await this.readLines(this.entryPath(entry));
		if (lines === null) return { ok: false, message: `note not found: ${entry.date}` };
		const headingIndex = findHeadingIndex(lines, section.heading);
		if (headingIndex < 0) {
			return { ok: false, message: `heading-not-found: ${section.heading}` };
		}
		const range = sectionRange(lines, headingIndex);
		let idx = -1;
		for (let i = range.start; i < range.end; i++) {
			if (lines[i].trim() !== "") {
				idx = i;
				break;
			}
		}
		if (idx === -1) return { ok: false, message: "empty section" };
		const noteFirst = lines[idx].replace(/^\d{1,2}:\d{2}(:\d{2})?\s+/, "").trimEnd();
		const entryFirst = (entry.text.split(/\r?\n/)[0] ?? "").trimEnd();
		if (noteFirst !== entryFirst) return { ok: false, message: "stale-line" };
		await applyPlanToFile(
			this.app,
			this.entryPath(entry),
			planEditLineAt(idx, `${lines[idx]} [archive:: true]`),
		);
		return { ok: true };
	}

	private entryPath(entry: SectionEntry): string {
		// 递归解析（与面板读取同口径）：子目录/非标准名日志的行级写回不再落到根路径
		const file = new VaultIndex(this.app, this.journal("daily").dir).dailyFile(entry.date);
		return file
			? file.path
			: `${this.journal("daily").dir.replace(/\/+$/, "")}/${entry.date}.md`;
	}

	private async readLines(path: string): Promise<string[] | null> {
		try {
			return (await readNoteText(this.app, path)).split(/\r?\n/);
		} catch {
			return null;
		}
	}

	private async rewriteRawLine(
		entry: SectionEntry,
		build: (raw: string) => string | null,
	): Promise<EntryWriteResult> {
		if (entry.lineIndex === undefined || entry.raw === undefined) {
			return { ok: false, message: "not a line entry" };
		}
		const path = this.entryPath(entry);
		const lines = await this.readLines(path);
		if (lines === null) return { ok: false, message: `note not found: ${entry.date}` };
		if (entry.lineIndex >= lines.length || lines[entry.lineIndex] !== entry.raw) {
			return { ok: false, message: "stale-line" };
		}
		const newLine = build(entry.raw);
		if (newLine === null) return { ok: false, message: "unsupported line" };
		await applyPlanToFile(this.app, path, planEditLineAt(entry.lineIndex, newLine));
		return { ok: true };
	}

	/** 段落「重发 = 编辑」：取该期间段落现有内容做表单预填（空返回 ""）。 */
	async paragraphContent(
		type: PeriodType,
		dateStr: string,
		section: JournalSection,
	): Promise<string> {
		const file = this.periodNoteFile(type, dateStr);
		if (file === null) return "";
		const lines = (await this.app.vault.cachedRead(file)).split(/\r?\n/);
		// 段落条目的 text 即去掉时间戳后的整段内容
		const entries = collectEntries(dateStr, lines, [section]);
		return entries[0]?.text ?? "";
	}

	/** 某期间某标题区各字段当前值（打卡/数据/对比表单预填，改的是当前值而非每次从空开始）。
	 * 键口径同写入：compare 区展开为 基础键+系列标记。 */
	async sectionFieldValues(
		type: PeriodType,
		dateStr: string,
		section: JournalSection,
	): Promise<Record<string, string>> {
		const file = this.periodNoteFile(type, dateStr);
		if (file === null) return {};
		const lines = (await this.app.vault.cachedRead(file)).split(/\r?\n/);
		return currentFieldValues(lines, section.heading, sectionFieldKeys(section));
	}

	/** 按期间键在该类型日志目录里递归找笔记（预填用；daily 按归属日，其余按文件名键）。 */
	private periodNoteFile(type: PeriodType, key: string): TFile | null {
		const index = new VaultIndex(this.app, this.journal(type).dir);
		return type === "daily" ? index.dailyFile(key) : index.fileByKey(key);
	}

	private async mutateEntry(
		section: JournalSection,
		entry: SectionEntry,
		content: string | null,
	): Promise<EntryWriteResult> {
		const path = this.entryPath(entry);
		let text: string;
		try {
			text = await readNoteText(this.app, path);
		} catch {
			return { ok: false, message: `note not found: ${entry.date}` };
		}
		const lines = text.split(/\r?\n/);

		let plan: WritePlan;
		if (entry.kind === "paragraph") {
			const body =
				content === null || content.trim() === ""
					? ""
					: entry.time
						? `${entry.time} ${content}`
						: content;
			plan = planParagraph(lines, {
				heading: section.heading,
				headingMissingCreates: false,
				text: body,
			});
		} else {
			// 行级条目：先做过期校验（渲染后笔记被改过就拒绝，防错行）
			if (
				entry.lineIndex === undefined ||
				entry.lineIndex >= lines.length ||
				lines[entry.lineIndex] !== entry.raw
			) {
				return { ok: false, message: "stale-line" };
			}
			if (content === null) {
				plan =
					entry.kind === "field"
						? planEditLineAt(entry.lineIndex, renderFieldLine(entry.key ?? "", ""))
						: planDeleteLineAt(entry.lineIndex);
			} else if (entry.kind === "field") {
				plan = planEditLineAt(entry.lineIndex, renderFieldLine(entry.key ?? "", content));
			} else {
				const line = `${entry.prefix ?? ""}${entry.time ? `${entry.time} ` : ""}${content}`;
				plan = planEditLineAt(entry.lineIndex, line);
			}
		}

		if (plan.status === "error") {
			return { ok: false, message: `${plan.reason}: ${plan.heading ?? section.heading}` };
		}
		await applyPlanToFile(this.app, path, plan);
		return { ok: true };
	}
}
