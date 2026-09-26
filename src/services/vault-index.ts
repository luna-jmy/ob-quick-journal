/**
 * vault-index（采集层）：只采集、不做判断。
 * 日志笔记归属日期的优先级（SPEC §2.3）：frontmatter journal-date → 文件名 → mtime（兜底计数）。
 */

import { TFile, type App } from "obsidian";
import { parseFieldLines } from "../parse/field-lines";
import { collectTaskLines } from "../parse/task-lines";
import { collectEntries, type SectionEntry } from "../parse/section-entries";
import { parseNoteDateKind, periodFromKey } from "../periods/period";
import { dateKey } from "../periods/period";
import type { DayRecord } from "../metrics/day-record";
import type { JournalSection } from "../types";

export interface CollectResult {
	records: Map<string, DayRecord>;
	/** 用 mtime 兜底定日期的笔记数（口径提示用） */
	mtimeFallback: number;
}

export class VaultIndex {
	constructor(
		private app: App,
		private dailyDir: string,
		/** 非 daily 日志目录（周/月/年）：开着「非daily任务计数」时其任务行并入统计 */
		private extraTaskDirs: string[] = [],
	) {}

	private filesUnder(dir: string): TFile[] {
		const prefix = dir.replace(/\/+$/, "") + "/";
		return this.app.vault.getMarkdownFiles().filter((f) => f.path.startsWith(prefix));
	}

	/** 采集期间内逐日的记录（只读，走 cachedRead）。 */
	async collectDayRecords(days: Date[]): Promise<CollectResult> {
		const records = new Map<string, DayRecord>();
		let mtimeFallback = 0;
		const daySet = new Set(days.map(dateKey));
		const byDate = new Map<string, TFile>();

		for (const file of this.filesUnder(this.dailyDir)) {
			const date = this.resolveDate(file);
			if (date) byDate.set(date, file);
		}

		for (const day of days) {
			const key = dateKey(day);
			const file = byDate.get(key);
			if (!file || !daySet.has(key)) continue;
			const text = await this.app.vault.cachedRead(file);
			const fields: Record<string, string> = {};
			for (const fl of parseFieldLines(text.split(/\r?\n/))) {
				if (!(fl.key in fields)) fields[fl.key] = fl.value;
			}
			const taskLines = collectTaskLines(text.split(/\r?\n/));
			records.set(key, { date: key, fieldValues: fields, taskLines });
		}
		await this.appendNonDailyTasks(records, daySet);
		return { records, mtimeFallback };
	}

	/**
	 * 非 daily 日志（周/月/年）的任务行并入统计：✅ 日期优先归属，无日期按期间起始日
	 * （周=周一、月/年=首日）。只在 daySet 覆盖的日期上生效，期间外自动忽略。
	 */
	private async appendNonDailyTasks(
		records: Map<string, DayRecord>,
		daySet: Set<string>,
	): Promise<void> {
		if (this.extraTaskDirs.length === 0) return;
		for (const dir of this.extraTaskDirs) {
			for (const file of this.filesUnder(dir)) {
				const period = parseNoteDateKind(file.name);
				if (period === null || period.kind === "day") continue;
				const text = await this.app.vault.cachedRead(file);
				for (const line of collectTaskLines(text.split(/\r?\n/))) {
					const done = /✅\s*(\d{4}-\d{2}-\d{2})/.exec(line);
					const fallback = periodFromKey(period.key);
					const target =
						done !== null && daySet.has(done[1])
							? done[1]
							: fallback !== null && daySet.has(dateKey(fallback.start))
								? dateKey(fallback.start)
								: null;
					if (target === null) continue;
					const record = records.get(target);
					if (record) record.taskLines.push(line);
					else records.set(target, { date: target, fieldValues: {}, taskLines: [line] });
				}
			}
		}
	}

	/** 速记面板用：期间逐日的标题区内容条目（只采集，不做判断）。 */
	async collectEntries(days: Date[], sections: JournalSection[]): Promise<SectionEntry[]> {
		const byDate = new Map<string, TFile>();
		for (const file of this.filesUnder(this.dailyDir)) {
			const date = this.resolveDate(file);
			if (date) byDate.set(date, file);
		}
		const entries: SectionEntry[] = [];
		for (const day of days) {
			const file = byDate.get(dateKey(day));
			if (!file) continue;
			const text = await this.app.vault.cachedRead(file);
			entries.push(...collectEntries(dateKey(day), text.split(/\r?\n/), sections));
		}
		return entries;
	}

	/** 按日期键找日志笔记（递归子目录；frontmatter journal-date 或文件名匹配）。 */
	dailyFile(dateStr: string): TFile | null {
		for (const file of this.filesUnder(this.dailyDir)) {
			if (this.resolveDate(file) === dateStr) return file;
		}
		return null;
	}

	/** 按期间键找对应类型笔记（递归子目录；文件名匹配 key）。周/月/年用。 */
	fileByKey(key: string): TFile | null {
		const wanted = `${key}.md`;
		for (const file of this.filesUnder(this.dailyDir)) {
			if (file.name.toLowerCase() === wanted.toLowerCase()) return file;
		}
		return null;
	}

	/** 目录下全部日志笔记（递归），带归属日期（daily 优先级同 resolveDate）。 */
	dailyEntries(): { date: string; file: TFile }[] {
		const out: { date: string; file: TFile }[] = [];
		for (const file of this.filesUnder(this.dailyDir)) {
			const date = this.resolveDate(file);
			if (date) out.push({ date, file });
		}
		return out.sort((a, b) => (a.date < b.date ? 1 : -1));
	}

	private resolveDate(file: TFile): string | null {
		const cache = this.app.metadataCache.getFileCache(file);
		const fmDate: unknown = cache?.frontmatter?.["journal-date"];
		// 1. 标准文件名 YYYY-MM-DD.md：直接认（frontmatter journal-date 优先覆盖）
		const name = parseNoteDateKind(file.name);
		if (name?.kind === "day") {
			return typeof fmDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fmDate)
				? fmDate
				: name.key;
		}
		// 2. 非标准文件名：必须同时满足「daily 身份标记 + journal-date」才计入——
		// 防止误放进日志目录的周记草稿等（只带 journal-date）混进统计
		const journal: unknown = cache?.frontmatter?.["journal"];
		const type: unknown = cache?.frontmatter?.["type"];
		const isDailyNote = journal === "Daily" || type === "daily_log";
		if (isDailyNote && typeof fmDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fmDate)) {
			return fmDate;
		}
		// 3. 兜底：无法定位到某一天的笔记不计入期间（口径：宁缺勿错）
		return null;
	}
}
