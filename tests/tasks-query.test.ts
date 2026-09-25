import { describe, expect, it } from "vitest";
import {
	parseTasksQuery,
	pathAllowed,
	statusTypeOf,
	taskMatches,
	taskText,
} from "../src/parse/tasks-query";

const USER_QUERY = [
	"path includes 540 Daily",
	"tags include #inbox",
	"not done",
	"status.type is not IN_PROGRESS",
	"status.type is not CANCELLED",
	"filename does not include 2026-09-25",
].join("\n");

describe("tasks 查询原生子集", () => {
	it("解析用户查询：各筛选维度", () => {
		const q = parseTasksQuery(USER_QUERY);
		expect(q.pathIncludes).toEqual(["540 Daily"]);
		expect(q.tags).toEqual(["inbox"]);
		expect(q.done).toBe(false);
		expect(q.statusNot).toEqual(["IN_PROGRESS", "CANCELLED"]);
		expect(q.filenameNotIncludes).toEqual(["2026-09-25"]);
		expect(q.unsupported).toEqual([]);
	});

	it("不认识的行进入 unsupported（整体降级，不静默忽略）", () => {
		const q = parseTasksQuery("not done\nhappens before tomorrow\nlimit 10");
		expect(q.unsupported).toEqual(["happens before tomorrow", "limit 10"]);
	});

	it("pathAllowed 粗过滤 + taskMatches 精匹配", () => {
		const q = parseTasksQuery(USER_QUERY);
		expect(pathAllowed(q, "500 Journal/540 Daily/2026-09-24.md")).toBe(true);
		expect(pathAllowed(q, "500 Journal/540 Daily/2026-09-25.md")).toBe(true); // path 只看路径
		expect(pathAllowed(q, "100 Projects/x.md")).toBe(false);

		const line = "- [ ] 待处理 #inbox";
		expect(taskMatches(q, line, " ", "500 Journal/540 Daily/2026-09-24.md")).toBe(true);
		// 文件名含排除词
		expect(taskMatches(q, line, " ", "500 Journal/540 Daily/2026-09-25.md")).toBe(false);
		// 已完成
		expect(taskMatches(q, "- [x] 已完成 #inbox", "x", "500 Journal/540 Daily/2026-09-24.md")).toBe(false);
		// 进行中（status.type is not IN_PROGRESS）
		expect(taskMatches(q, "- [/] 进行中 #inbox", "/", "500 Journal/540 Daily/2026-09-24.md")).toBe(false);
		// 无 inbox 标签
		expect(taskMatches(q, "- [ ] 其他 #work", " ", "500 Journal/540 Daily/2026-09-24.md")).toBe(false);
	});

	it("statusTypeOf 与 taskText", () => {
		expect(statusTypeOf(" ")).toBe("TODO");
		expect(statusTypeOf("x")).toBe("DONE");
		expect(statusTypeOf("/")).toBe("IN_PROGRESS");
		expect(statusTypeOf("-")).toBe("CANCELLED");
		expect(taskText("- [ ] 任务 📅 2026-09-30")).toBe("任务 📅 2026-09-30");
	});
});
