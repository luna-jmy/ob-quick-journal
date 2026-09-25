/**
 * vault-index（采集层）：只采集、不做判断。
 * 日志笔记归属日期的优先级（SPEC §2.3）：frontmatter journal-date → 文件名 → mtime（兜底计数）。
 */

import { TFile, type App } from "obsidian";
import { parseFieldLines } from "../parse/field-lines";
import { collectEntries, type SectionEntry } from "../parse/section-entries";
import { parseNoteDateKind } from "../periods/period";
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
			const taskLines = text
				.split(/\r?\n/)
				.filter((l) => /^\s*[-*]\s+\[([ xX/-])\]/.test(l));
			records.set(key, { date: key, fieldValues: fields, taskLines });
		}
		return { records, mtimeFallback };
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

	/** 按日期键打开日志笔记。 */
	dailyFile(dateStr: string): TFile | null {
		const file = this.app.vault.getAbstractFileByPath(
			`${this.dailyDir.replace(/\/+$/, "")}/${dateStr}.md`,
		);
		return file instanceof TFile ? file : null;
	}

	private resolveDate(file: TFile): string | null {
		// 1. frontmatter journal-date
		const cache = this.app.metadataCache.getFileCache(file);
		const fmDate: unknown = cache?.frontmatter?.["journal-date"];
		if (typeof fmDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fmDate)) return fmDate;
		// 2. 文件名
		const name = parseNoteDateKind(file.name);
		if (name?.kind === "day") return name.key;
		// 3. 兜底：无法定位到某一天的笔记不计入期间（口径：宁缺勿错）
		return null;
	}
}
