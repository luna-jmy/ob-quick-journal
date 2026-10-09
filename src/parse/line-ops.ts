/**
 * 行级操作（纯函数）：面板条目的任务完成切换、任务/列表互转。
 * 输入是流的 raw 原文行，输出改写后的行；调用方负责行号与原文校验。
 */

import { DEFAULT_DONE_MARKERS, type TaskState } from "./task-lines";

// 单字符勾选框（不限定 x/- 等）：状态判定交给任务标识集（见 task-lines）
const TASK_LINE_RE = /^(\s*[-*]\s+\[)([^\][])(\]\s*)(.*)$/;
const LIST_LINE_RE = /^(\s*[-*]\s+)(\S.*)$/;
const DONE_DATE_RE = /\s*✅\s*\d{4}-\d{2}-\d{2}\s*$/;

/**
 * 切换任务完成态：非完成（待办/已取消/进行中）→ done 首个标记 + 行尾加 ✅ 日期；
 * 已完成 → 移除 ✅ 日期回到 [ ]。doneMarkers 自定义时按它判与写。
 */
export function toggleTaskLine(
	raw: string,
	today: string,
	doneMarkers: string[] = DEFAULT_DONE_MARKERS,
): string | null {
	const m = TASK_LINE_RE.exec(raw);
	if (!m) return null;
	const [, head, status, tail, body] = m;
	if (doneMarkers.includes(status)) {
		const undone = body.replace(DONE_DATE_RE, "");
		return `${head} ${tail}${undone.trimEnd()}`;
	}
	const cleaned = body.replace(DONE_DATE_RE, "").trimEnd();
	return `${head}${doneMarkers[0] ?? "x"}${tail}${cleaned} ✅ ${today}`;
}

/** 列表 ↔ 任务互转：`- 内容` → `- [ ] 内容`；`- [ ] 任务` → `- 任务`（保留完成态转任务时的正文）。 */
export function convertListTask(raw: string): string | null {
	const task = TASK_LINE_RE.exec(raw);
	if (task) {
		const [, head, status, , body] = task;
		// 已完成任务转列表时剥掉 ✅ 日期（它只对任务行有意义）
		const cleaned = (
			DEFAULT_DONE_MARKERS.includes(status) ? body.replace(DONE_DATE_RE, "") : body
		).trim();
		return `${head.replace(/\[\s*$/, "")}${cleaned}`;
	}
	const list = LIST_LINE_RE.exec(raw);
	if (list) {
		return `${list[1]}[ ] ${list[2]}`;
	}
	return null;
}

/** 该行是否任务行、是否已完成（默认口径；自定义 done 标记用 classifyTaskStatus）。 */
export function taskStateOf(raw: string): { isTask: boolean; done: boolean } {
	const m = TASK_LINE_RE.exec(raw);
	if (!m) return { isTask: false, done: false };
	return { isTask: true, done: DEFAULT_DONE_MARKERS.includes(m[2]) };
}

/**
 * 任务状态 → 展示符号（无交互按钮的渲染处用，如汇总的最近速记）：
 * 已完成 ☑ / 已取消 ✕ / 待办 ☐ / open 标识（进行中）◐。
 */
export function taskSymbol(state: TaskState, status: string): string {
	if (state === "done") return "☑";
	if (state === "cancelled") return "✕";
	return status === " " ? "☐" : "◐";
}
