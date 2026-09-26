/**
 * 任务行最小解析（纯函数）——只取统计需要的三件事：是否完成、✅ 完成日、➕ 创建日。
 * 完整任务语法（日期推算、优先级、依赖）以 obsidian-task-matrix 的 parser 为参照实现，
 * 后续按需扩充；原型阶段统计口径只依赖本文件。
 */

export interface ParsedTaskLine {
	line: string;
	done: boolean;
	/** ✅ YYYY-MM-DD（有则返回） */
	doneDate?: string;
	/** ➕ YYYY-MM-DD（有则返回） */
	createdDate?: string;
}

const TASK_RE = /^\s*[-*]\s+\[([^\]])\]\s*(.*)$/;
export const DEFAULT_DONE_MARKERS = ["x", "X"];

function extractDate(mark: string, body: string): string | undefined {
	const re = new RegExp(`${mark}\\s*(\\d{4}-\\d{2}-\\d{2})`);
	const m = re.exec(body);
	return m ? m[1] : undefined;
}

/** 勾选框字符（`- [x]` 的 x）；非任务行返回 null。 */
export function statusCharOf(line: string): string | null {
	const m = TASK_RE.exec(line);
	return m ? m[1] : null;
}

export function parseTaskLine(line: string, doneMarkers: string[] = DEFAULT_DONE_MARKERS): ParsedTaskLine | null {
	const m = TASK_RE.exec(line);
	if (!m) return null;
	const status = m[1];
	const body = m[2];
	return {
		line,
		done: doneMarkers.includes(status),
		doneDate: extractDate("✅", body),
		createdDate: extractDate("➕", body),
	};
}

export function parseTaskLines(lines: string[], doneMarkers: string[] = DEFAULT_DONE_MARKERS): ParsedTaskLine[] {
	return lines
		.map((l) => parseTaskLine(l, doneMarkers))
		.filter((t): t is ParsedTaskLine => t !== null);
}

export interface TaskMarkerSpec {
	open: string[];
	done: string[];
	cancel: string[];
	nonTask: string[];
}

/**
 * 采集任务行原文（统计用）：跳过 ``` 围栏；传入标识集时只保留
 * open（含隐含空格）与 done 的行——cancel / nonTask / 未识别字符一律不采集（不计数）。
 */
export function collectTaskLines(lines: string[], spec?: TaskMarkerSpec): string[] {
	const allowed = spec ? new Set([" ", ...spec.open, ...spec.done]) : null;
	const out: string[] = [];
	let inFence = false;
	for (const line of lines) {
		if (line.trimStart().startsWith("```")) {
			inFence = !inFence;
			continue;
		}
		if (inFence) continue;
		const status = statusCharOf(line);
		if (status === null) continue;
		if (allowed !== null && !allowed.has(status)) continue;
		out.push(line);
	}
	return out;
}
