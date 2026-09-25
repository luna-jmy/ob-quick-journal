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

const TASK_RE = /^\s*[-*]\s+\[([ xX/-])\]\s*(.*)$/;

function extractDate(mark: string, body: string): string | undefined {
	const re = new RegExp(`${mark}\\s*(\\d{4}-\\d{2}-\\d{2})`);
	const m = re.exec(body);
	return m ? m[1] : undefined;
}

export function parseTaskLine(line: string): ParsedTaskLine | null {
	const m = TASK_RE.exec(line);
	if (!m) return null;
	const status = m[1];
	const body = m[2];
	return {
		line,
		done: status === "x" || status === "X",
		doneDate: extractDate("✅", body),
		createdDate: extractDate("➕", body),
	};
}

export function parseTaskLines(lines: string[]): ParsedTaskLine[] {
	return lines
		.map((l) => parseTaskLine(l))
		.filter((t): t is ParsedTaskLine => t !== null);
}
