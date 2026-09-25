/**
 * 捕获编排：标题区 → 定位当天日志 →（不存在则建骨架）→ 纯函数出计划 → 原子落盘。
 * 界面只管收表单值；覆盖确认由调用方二次调用（overwrite: true）完成。
 */

import { TFile, type App } from "obsidian";
import type { JournalSection, QJConfig } from "../types";
import {
	planAppend,
	planDeleteLineAt,
	planEditLineAt,
	planFieldFill,
	planParagraph,
	type WritePlan,
} from "../capture/plan";
import { targetNotePath } from "../capture/variables";
import { dailySkeleton } from "../capture/skeleton";
import { renderFieldLine } from "../parse/field-lines";
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

	dailyPath(now: Date): string {
		return targetNotePath(this.getConfig().dailyDir, "{{date}}", now);
	}

	async performSection(
		section: JournalSection,
		payload: { values: Record<string, string>; lineValue?: string },
		opts: { overwrite: boolean; now?: Date },
	): Promise<CaptureResult> {
		const now = opts.now ?? new Date();
		const path = this.dailyPath(now);

		let text: string;
		let created = false;
		try {
			text = await readNoteText(this.app, path);
		} catch {
			const skeleton = dailySkeleton(now, this.getConfig().sections);
			const file: TFile = await ensureNote(this.app, path, skeleton);
			created = true;
			text = await this.app.vault.cachedRead(file);
		}

		let plan: WritePlan;
		if (section.type === "paragraph") {
			if (payload.lineValue === undefined || payload.lineValue.trim() === "") {
				return { ok: false, reason: "error", message: "empty value" };
			}
			plan = planParagraph(text.split(/\r?\n/), {
				heading: section.heading,
				headingMissingCreates: true,
				text: this.withTimestamp(section, payload.lineValue, now),
			});
		} else if (section.type === "list") {
			if (payload.lineValue === undefined || payload.lineValue.trim() === "") {
				return { ok: false, reason: "error", message: "empty value" };
			}
			const template = section.lineTemplate ?? "- {{value}}";
			const line = template.replaceAll(
				"{{value}}",
				this.withTimestamp(section, payload.lineValue, now),
			);
			plan = planAppend(text.split(/\r?\n/), {
				heading: section.heading,
				headingMissingCreates: true,
				line,
			});
		} else {
			const fillValues = section.fields
				.filter((f) => payload.values[f.key] !== undefined && payload.values[f.key] !== "")
				.map((f) => ({ key: f.key, value: payload.values[f.key] }));
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

	/** 时间戳单点：开启后 list / paragraph 的写入内容前加 HH:mm（面板解析显示）。 */
	private withTimestamp(section: JournalSection, value: string, now: Date): string {
		if (section.timestamp !== true) return value;
		const hh = String(now.getHours()).padStart(2, "0");
		const mm = String(now.getMinutes()).padStart(2, "0");
		return `${hh}:${mm} ${value}`;
	}

	// ── 速记面板的条目级写回（编辑 / 删除，不跳回日志） ─────────────────────

	/** 编辑一条流条目：line/field 原位改行（保留标记与时间戳），paragraph 整段重写。 */
	async editEntry(section: JournalSection, entry: SectionEntry, content: string): Promise<EntryWriteResult> {
		return this.mutateEntry(section, entry, content);
	}

	/** 删除一条流条目：line 删行，field 清值回空值行，paragraph 清空整段。 */
	async deleteEntry(section: JournalSection, entry: SectionEntry): Promise<EntryWriteResult> {
		return this.mutateEntry(section, entry, null);
	}

	/** 切换任务完成态（面板点击状态符号）。 */
	async toggleTaskEntry(section: JournalSection, entry: SectionEntry): Promise<EntryWriteResult> {
		return this.rewriteRawLine(section, entry, (raw) => {
			const today = dateKey(new Date());
			return toggleTaskLine(raw, today);
		});
	}

	/** 列表 ↔ 任务互转（面板条目按钮）。 */
	async convertEntry(section: JournalSection, entry: SectionEntry): Promise<EntryWriteResult> {
		return this.rewriteRawLine(section, entry, convertListTask);
	}

	private async rewriteRawLine(
		_section: JournalSection,
		entry: SectionEntry,
		build: (raw: string) => string | null,
	): Promise<EntryWriteResult> {
		if (entry.lineIndex === undefined || entry.raw === undefined) {
			return { ok: false, message: "not a line entry" };
		}
		const path = `${this.getConfig().dailyDir.replace(/\/+$/, "")}/${entry.date}.md`;
		let text: string;
		try {
			text = await readNoteText(this.app, path);
		} catch {
			return { ok: false, message: `note not found: ${entry.date}` };
		}
		const lines = text.split(/\r?\n/);
		if (entry.lineIndex >= lines.length || lines[entry.lineIndex] !== entry.raw) {
			return { ok: false, message: "stale-line" };
		}
		const newLine = build(entry.raw);
		if (newLine === null) return { ok: false, message: "unsupported line" };
		await applyPlanToFile(this.app, path, planEditLineAt(entry.lineIndex, newLine));
		return { ok: true };
	}

	/** 段落「重发 = 编辑」：取当天段落现有内容做表单预填（空返回 ""）。 */
	async paragraphContent(dateStr: string, section: JournalSection): Promise<string> {
		const path = `${this.getConfig().dailyDir.replace(/\/+$/, "")}/${dateStr}.md`;
		let text: string;
		try {
			text = await readNoteText(this.app, path);
		} catch {
			return "";
		}
		const entries = collectEntries(
			dateStr,
			text.split(/\r?\n/),
			[section],
		);
		return entries[0]?.content ?? "";
	}

	private async mutateEntry(
		section: JournalSection,
		entry: SectionEntry,
		content: string | null,
	): Promise<EntryWriteResult> {
		const path = `${this.getConfig().dailyDir.replace(/\/+$/, "")}/${entry.date}.md`;
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
