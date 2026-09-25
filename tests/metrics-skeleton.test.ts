import { describe, expect, it } from "vitest";
import { boolStats, numberStats, taskStats } from "../src/metrics/aggregate";
import type { DayRecord } from "../src/metrics/day-record";
import { DEFAULT_REGISTRY, BOOL_YES, BOOL_NO } from "../src/types";
import { dailySkeleton, weeklySkeleton } from "../src/capture/skeleton";
import { parseFieldLines } from "../src/parse/field-lines";

function rec(date: string, fieldValues: Record<string, string>, taskLines: string[] = []): DayRecord {
	return { date, fieldValues, taskLines };
}

describe("指标聚合", () => {
	const checkin = DEFAULT_REGISTRY.daily[0];
	const data = DEFAULT_REGISTRY.daily[1];
	const days = ["2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27"];

	it("打卡率：yes/no/missing 分开计，缺记不进分母", () => {
		const records = new Map<string, DayRecord>([
			["2026-09-21", rec("2026-09-21", { "💊medicine": BOOL_YES })],
			["2026-09-22", rec("2026-09-22", { "💊medicine": BOOL_YES })],
			["2026-09-23", rec("2026-09-23", { "💊medicine": BOOL_NO })],
			["2026-09-24", rec("2026-09-24", { "💊medicine": "" })], // 预建未填 = 缺
		]);
		const s = boolStats(checkin, days, records).find((x) => x.key === "💊medicine")!;
		expect(s.yes).toBe(2);
		expect(s.no).toBe(1);
		expect(s.missingDays).toBe(4); // 3 天没记录 + 1 天空值
	});

	it("数值统计：min/max/mean/sum，忽略非数值", () => {
		const records = new Map<string, DayRecord>([
			["2026-09-21", rec("2026-09-21", { "weight⚖️": "62" })],
			["2026-09-22", rec("2026-09-22", { "weight⚖️": "63" })],
			["2026-09-23", rec("2026-09-23", { "weight⚖️": "abc" })],
		]);
		const s = numberStats(data, days, records).find((x) => x.key === "weight⚖️")!;
		expect(s.count).toBe(2);
		expect(s.min).toBe(62);
		expect(s.max).toBe(63);
		expect(s.mean).toBe(62.5);
		expect(s.sum).toBe(125);
	});

	it("任务统计：期间内完成 / 新建 / 勾选总数", () => {
		const records = new Map<string, DayRecord>([
			[
				"2026-09-21",
				rec("2026-09-21", {}, [
					"- [x] A ✅ 2026-09-21",
					"- [x] B ✅ 2026-09-01", // 完成日在期间外
					"- [ ] C ➕ 2026-09-22",
					"- [x] D",
				]),
			],
		]);
		const s = taskStats(days, records);
		expect(s.total).toBe(4);
		expect(s.done).toBe(3);
		expect(s.doneInPeriod).toBe(2); // A 与 D（无 ✅ 按笔记日计）
		expect(s.createdInPeriod).toBe(1);
	});
});

describe("骨架生成（round-trip）", () => {
	it("日骨架包含全部注册表字段空值行，解析后键一致", () => {
		const text = dailySkeleton(new Date(2026, 8, 25), DEFAULT_REGISTRY);
		const parsed = parseFieldLines(text.split("\n"));
		for (const section of DEFAULT_REGISTRY.daily) {
			const skeletonKeys = section.fields.map((f) => f.key);
			const parsedKeys = parsed.map((p) => p.key);
			for (const key of skeletonKeys) {
				expect(parsedKeys).toContain(key);
			}
		}
		expect(text).toContain("### 每日打卡");
		expect(text).toContain("- [💊medicine::]");
	});

	it("周骨架：期间键标题 + 复盘字段", () => {
		const text = weeklySkeleton(new Date(2026, 8, 25), DEFAULT_REGISTRY);
		expect(text).toContain("# 2026-W39 周日志");
		expect(text).toContain("- [本周成就/亮点::]");
		expect(text).toContain("journal-date: 2026-09-21"); // 周一
	});
});
