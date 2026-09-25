import { describe, expect, it } from "vitest";
import { convertListTask, taskStateOf, toggleTaskLine } from "../src/parse/line-ops";
import { dedupeQueries, findQueryBlocks } from "../src/parse/query-blocks";
import { monthGrid } from "../src/periods/month-grid";
import { doneByDay } from "../src/metrics/aggregate";
import type { DayRecord } from "../src/metrics/day-record";

describe("行级操作", () => {
	it("切换完成：[ ]→[x] 加 ✅ 日期；[x]→[ ] 移除 ✅ 日期", () => {
		const done = toggleTaskLine("- [ ] 09:30 要做的任务", "2026-09-26");
		expect(done).toBe("- [x] 09:30 要做的任务 ✅ 2026-09-26");

		const undone = toggleTaskLine("- [x] 09:30 要做的任务 ✅ 2026-09-26", "2026-09-27");
		expect(undone).toBe("- [ ] 09:30 要做的任务");

		expect(taskStateOf(done!)).toEqual({ isTask: true, done: true });
		expect(taskStateOf(undone!)).toEqual({ isTask: true, done: false });
		expect(taskStateOf("- 09:30 普通条目")).toEqual({ isTask: false, done: false });
	});

	it("任务/列表互转：保留时间戳与正文；完成任务转列表剥掉 ✅", () => {
		expect(convertListTask("- 08:44 早上想到的")).toBe("- [ ] 08:44 早上想到的");
		expect(convertListTask("- [ ] 08:44 早上想到的")).toBe("- 08:44 早上想到的");
		expect(convertListTask("- [x] 已完成 ✅ 2026-09-25")).toBe("- 已完成");
		expect(convertListTask("普通文字")).toBeNull();
	});
});

describe("查询块定位", () => {
	const NOTE = [
		"# 日志",
		"```dataview",
		"TABLE file.day",
		"```",
		"```tasks",
		"not done",
		"```",
		"```javascript",
		"普通代码块不算",
		"```",
	].join("\n");

	it("识别 dataview / dataviewjs / tasks，普通代码块忽略；去重限数", () => {
		const blocks = findQueryBlocks(NOTE, "500 Journal/540 Daily/2026-09-25.md");
		expect(blocks.map((b) => b.kind)).toEqual(["dataview", "tasks"]);
		expect(blocks[0].code).toBe("TABLE file.day");

		const two = findQueryBlocks(`${NOTE}\n${NOTE}`, "b.md");
		expect(dedupeQueries(two)).toHaveLength(2);
		expect(dedupeQueries(two, 1)).toHaveLength(1);
	});
});

describe("月历网格", () => {
	it("2026-09：周一开头，8-31 补位，含 09-01 与 09-30", () => {
		const weeks = monthGrid(2026, 8);
		expect(weeks.length).toBeGreaterThanOrEqual(5);
		const keys = weeks.flat().map((c) => c.key);
		expect(keys).toContain("2026-09-01");
		expect(keys).toContain("2026-09-30");
		expect(weeks[0][0].key).toBe("2026-08-31"); // 周一
		for (const week of weeks) {
			for (const cell of week) {
				expect(cell.inMonth).toBe(cell.date.getMonth() === 8);
			}
		}
	});
});

describe("按日完成任务数", () => {
	it("✅ 日期优先归属；无 ✅ 的已完成按笔记日归属", () => {
		const days = ["2026-09-24", "2026-09-25", "2026-09-26"];
		const records = new Map<string, DayRecord>([
			[
				"2026-09-25",
				{
					date: "2026-09-25",
					fieldValues: {},
					taskLines: ["- [x] A ✅ 2026-09-26", "- [x] B ✅ 2026-09-24", "- [x] C（无日期）"],
				},
			],
		]);
		const done = doneByDay(days, records);
		expect(done.get("2026-09-26")).toBe(1); // A 按 ✅
		expect(done.get("2026-09-24")).toBe(1); // B 按 ✅
		expect(done.get("2026-09-25")).toBe(1); // C 按笔记日
	});
});
