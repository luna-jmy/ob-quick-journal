/**
 * 行级操作（纯函数）：面板条目的任务完成切换、任务/列表互转。
 * 输入是流的 raw 原文行，输出改写后的行；调用方负责行号与原文校验。
 */

const TASK_LINE_RE = /^(\s*[-*]\s+\[)([ xX/-])(\]\s*)(.*)$/;
const LIST_LINE_RE = /^(\s*[-*]\s+)(\S.*)$/;
const DONE_DATE_RE = /\s*✅\s*\d{4}-\d{2}-\d{2}\s*$/;

/** 切换任务完成态：完成 = [x] + 行尾加 ✅ 日期；取消完成 = 移除 ✅ 日期回到 [ ]。 */
export function toggleTaskLine(raw: string, today: string): string | null {
	const m = TASK_LINE_RE.exec(raw);
	if (!m) return null;
	const [, head, status, tail, body] = m;
	if (status === "x" || status === "X") {
		const undone = body.replace(DONE_DATE_RE, "");
		return `${head} ${tail}${undone.trimEnd()}`;
	}
	const cleaned = body.replace(DONE_DATE_RE, "").trimEnd();
	return `${head}x${tail}${cleaned} ✅ ${today}`;
}

/** 列表 ↔ 任务互转：`- 内容` → `- [ ] 内容`；`- [ ] 任务` → `- 任务`（保留完成态转任务时的正文）。 */
export function convertListTask(raw: string): string | null {
	const task = TASK_LINE_RE.exec(raw);
	if (task) {
		const [, head, status, , body] = task;
		// 已完成任务转列表时剥掉 ✅ 日期（它只对任务行有意义）
		const cleaned = (status === "x" || status === "X" ? body.replace(DONE_DATE_RE, "") : body).trim();
		return `${head.replace(/\[\s*$/, "")}${cleaned}`;
	}
	const list = LIST_LINE_RE.exec(raw);
	if (list) {
		return `${list[1]}[ ] ${list[2]}`;
	}
	return null;
}

/** 该行是否任务行、是否已完成（面板渲染与过滤用）。 */
export function taskStateOf(raw: string): { isTask: boolean; done: boolean } {
	const m = TASK_LINE_RE.exec(raw);
	if (!m) return { isTask: false, done: false };
	return { isTask: true, done: m[2] === "x" || m[2] === "X" };
}
