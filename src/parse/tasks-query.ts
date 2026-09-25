/**
 * tasks 查询的原生子集（纯函数）：解析 ```tasks 查询里的常用筛选行，
 * 并对任务行做匹配。Tasks 插件没有公开的查询执行 API（主分支仅 apiV1），
 * 这里按 native 优先原则实现常用子集；出现不支持的行时整体降级说明，
 * 不静默忽略（避免筛选口径悄悄不一致）。
 */

export type TaskStatusType = "TODO" | "DONE" | "IN_PROGRESS" | "CANCELLED" | "NON_TASK";

export interface TasksQuery {
	pathIncludes: string[];
	pathNotIncludes: string[];
	filenameIncludes: string[];
	filenameNotIncludes: string[];
	tags: string[];
	/** true = 只要已完成；false = 只要未完成；undefined = 不筛 */
	done?: boolean;
	statusIs?: TaskStatusType;
	statusNot: TaskStatusType[];
	/** 不认识的查询行（非空）：任一存在即整体降级 */
	unsupported: string[];
}

const STATUS_TYPES: TaskStatusType[] = ["TODO", "DONE", "IN_PROGRESS", "CANCELLED", "NON_TASK"];

export function parseTasksQuery(code: string): TasksQuery {
	const q: TasksQuery = {
		pathIncludes: [],
		pathNotIncludes: [],
		filenameIncludes: [],
		filenameNotIncludes: [],
		tags: [],
		statusNot: [],
		unsupported: [],
	};
	for (const raw of code.split(/\r?\n/)) {
		const line = raw.trim();
		if (line === "") continue;
		let m = /^path includes (.+)$/i.exec(line);
		if (m) {
			q.pathIncludes.push(m[1].trim());
			continue;
		}
		m = /^path does not include (.+)$/i.exec(line);
		if (m) {
			q.pathNotIncludes.push(m[1].trim());
			continue;
		}
		m = /^filename includes (.+)$/i.exec(line);
		if (m) {
			q.filenameIncludes.push(m[1].trim());
			continue;
		}
		m = /^filename does not include (.+)$/i.exec(line);
		if (m) {
			q.filenameNotIncludes.push(m[1].trim());
			continue;
		}
		m = /^tags include (#?\S+)$/i.exec(line);
		if (m) {
			q.tags.push(m[1].replace(/^#/, "").trim());
			continue;
		}
		if (/^not done$/i.test(line)) {
			q.done = false;
			continue;
		}
		if (/^done$/i.test(line)) {
			q.done = true;
			continue;
		}
		m = /^status\.type is not ([A-Z_]+)$/i.exec(line);
		if (m) {
			const t = m[1].toUpperCase() as TaskStatusType;
			if (STATUS_TYPES.includes(t)) {
				q.statusNot.push(t);
				continue;
			}
		}
		m = /^status\.type is ([A-Z_]+)$/i.exec(line);
		if (m) {
			const t = m[1].toUpperCase() as TaskStatusType;
			if (STATUS_TYPES.includes(t)) {
				q.statusIs = t;
				continue;
			}
		}
		q.unsupported.push(line);
	}
	return q;
}

/** 勾选框字符 → Tasks 的 status.type 口径。 */
export function statusTypeOf(status: string): TaskStatusType {
	if (status === " ") return "TODO";
	if (status === "x" || status === "X") return "DONE";
	if (status === "/") return "IN_PROGRESS";
	if (status === "-") return "CANCELLED";
	return "NON_TASK";
}

const PATH_RE = /^\s*[-*]\s+\[(.)\]/;
const TAGS_RE = /(?:^|\s)#([^\s#]+)/g;

/** 文件路径是否可能命中（按 path 筛选行先粗过滤，免读文件）。 */
export function pathAllowed(q: TasksQuery, path: string): boolean {
	const lower = path.toLowerCase();
	for (const needle of q.pathIncludes) {
		if (!lower.includes(needle.toLowerCase())) return false;
	}
	for (const needle of q.pathNotIncludes) {
		if (lower.includes(needle.toLowerCase())) return false;
	}
	return true;
}

/** 任务行（含勾选框字符）是否命中查询。 */
export function taskMatches(q: TasksQuery, line: string, status: string, path: string): boolean {
	const st = statusTypeOf(status);
	if (q.done === true && st !== "DONE") return false;
	if (q.done === false && st === "DONE") return false;
	if (q.statusIs !== undefined && st !== q.statusIs) return false;
	if (q.statusNot.includes(st)) return false;

	const filename = (path.split("/").pop() ?? "").toLowerCase();
	for (const needle of q.filenameIncludes) {
		if (!filename.includes(needle.toLowerCase())) return false;
	}
	for (const needle of q.filenameNotIncludes) {
		if (filename.includes(needle.toLowerCase())) return false;
	}
	if (q.tags.length > 0) {
		const tags = new Set<string>();
		for (const m of line.matchAll(TAGS_RE)) tags.add(m[1].toLowerCase());
		for (const tag of q.tags) {
			if (!tags.has(tag.toLowerCase())) return false;
		}
	}
	return true;
}

/** 提取任务行展示文本（去掉标记前缀）。 */
export function taskText(line: string): string {
	const m = /^\s*[-*]\s+\[.\]\s*(.*)$/.exec(line);
	return m ? m[1].trim() : line.trim();
}
