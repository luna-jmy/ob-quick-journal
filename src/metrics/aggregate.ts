/**
 * 指标聚合（纯函数）：打卡率、数值统计、任务统计。
 * 输入是 vault-index 采集好的 DayRecord，这里不做任何 IO。
 */

import type { SectionField } from "../types";
import { BOOL_YES, BOOL_NO } from "../types";
import { DEFAULT_DONE_MARKERS, parseTaskLines } from "../parse/task-lines";
import type { DayRecord } from "./day-record";

export interface BoolStat {
	key: string;
	label: string;
	yes: number;
	no: number;
	/** 期间内没有任何该字段记录的天数 */
	missingDays: number;
}

export interface NumberStat {
	key: string;
	label: string;
	unit?: string;
	count: number;
	min: number;
	max: number;
	mean: number;
	sum: number;
	latest?: number;
	latestDate?: string;
}

export interface TaskStat {
	total: number;
	done: number;
	/** 期间内完成（✅ 日期在期间内，或无 ✅ 但笔记在期间内且已勾选） */
	doneInPeriod: number;
	/** 期间内新建（➕ 日期在期间内） */
	createdInPeriod: number;
}

export function boolStats(
	fields: SectionField[],
	days: string[],
	records: Map<string, DayRecord>,
): BoolStat[] {
	return fields.map((f) => {
		let yes = 0;
		let no = 0;
		let missingDays = 0;
		for (const day of days) {
			const rec = records.get(day);
			const value = rec?.fieldValues[f.key];
			if (value === undefined || value === "") {
				missingDays++;
			} else if (value === BOOL_YES) {
				yes++;
			} else if (value === BOOL_NO) {
				no++;
			} else {
				// 非 bool 符号的值按「有记录」计，不正负
				missingDays++;
			}
		}
		return { key: f.key, label: f.label, yes, no, missingDays };
	});
}

export function numberStats(
	fields: SectionField[],
	days: string[],
	records: Map<string, DayRecord>,
): NumberStat[] {
	return fields.map((f) => {
		const samples: { date: string; value: number }[] = [];
		for (const day of days) {
			const raw = records.get(day)?.fieldValues[f.key];
			if (raw === undefined || raw === "") continue;
			const n = Number(raw);
			if (Number.isFinite(n)) samples.push({ date: day, value: n });
		}
		if (samples.length === 0) {
			return { key: f.key, label: f.label, unit: f.unit, count: 0, min: 0, max: 0, mean: 0, sum: 0 };
		}
		const values = samples.map((s) => s.value);
		const sum = values.reduce((a, b) => a + b, 0);
		const latest = samples[samples.length - 1];
		return {
			key: f.key,
			label: f.label,
			unit: f.unit,
			count: samples.length,
			min: Math.min(...values),
			max: Math.max(...values),
			mean: sum / samples.length,
			sum,
			latest: latest.value,
			latestDate: latest.date,
		};
	});
}

export function taskStats(
	days: string[],
	records: Map<string, DayRecord>,
	doneMarkers: string[] = DEFAULT_DONE_MARKERS,
): TaskStat {
	const daySet = new Set(days);
	let total = 0;
	let done = 0;
	let doneInPeriod = 0;
	let createdInPeriod = 0;
	for (const rec of records.values()) {
		for (const task of parseTaskLines(rec.taskLines, doneMarkers)) {
			total++;
			if (task.done) {
				done++;
				if (!task.doneDate || daySet.has(task.doneDate)) doneInPeriod++;
			}
			if (task.createdDate && daySet.has(task.createdDate)) createdInPeriod++;
		}
	}
	return { total, done, doneInPeriod, createdInPeriod };
}

/**
 * 按日完成任务数（热力图 / 柱状图用）：✅ 日期优先，无 ✅ 的已完成按笔记日记入。
 * 键为 YYYY-MM-DD，覆盖 days 里出现的每一天（无数据的也为 0）。
 */
export function doneByDay(
	days: string[],
	records: Map<string, DayRecord>,
	doneMarkers: string[] = DEFAULT_DONE_MARKERS,
): Map<string, number> {
	const out = new Map<string, number>();
	for (const day of days) out.set(day, 0);
	for (const rec of records.values()) {
		for (const task of parseTaskLines(rec.taskLines, doneMarkers)) {
			if (!task.done) continue;
			const key = task.doneDate ?? rec.date;
			if (out.has(key)) out.set(key, (out.get(key) ?? 0) + 1);
		}
	}
	return out;
}
