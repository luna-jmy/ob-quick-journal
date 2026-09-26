import { describe, expect, it } from "vitest";
import { boolStats, numberStats, taskStats } from "../src/metrics/aggregate";
import type { DayRecord } from "../src/metrics/day-record";
import { DEFAULT_JOURNALS, BOOL_YES, BOOL_NO, mergeConfig } from "../src/types";
import { skeletonFor, noteKeyFor } from "../src/capture/skeleton";
import { formatTokens } from "../src/periods/period";
import { parseFieldLines } from "../src/parse/field-lines";

function rec(date: string, fieldValues: Record<string, string>, taskLines: string[] = []): DayRecord {
	return { date, fieldValues, taskLines };
}

const SECTIONS = DEFAULT_JOURNALS.daily.sections;
const CHECKIN = SECTIONS.find((s) => s.id === "checkin")!;
const DATA = SECTIONS.find((s) => s.id === "data")!;
const DAYS = ["2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27"];

describe("指标聚合", () => {
	it("打卡率：yes/no/missing 分开计，缺记不进分母", () => {
		const records = new Map<string, DayRecord>([
			["2026-09-21", rec("2026-09-21", { "💊medicine": BOOL_YES })],
			["2026-09-22", rec("2026-09-22", { "💊medicine": BOOL_YES })],
			["2026-09-23", rec("2026-09-23", { "💊medicine": BOOL_NO })],
			["2026-09-24", rec("2026-09-24", { "💊medicine": "" })], // 预建未填 = 缺
		]);
		const s = boolStats(CHECKIN.fields, DAYS, records).find((x) => x.key === "💊medicine")!;
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
		const s = numberStats(DATA.fields, DAYS, records).find((x) => x.key === "weight⚖️")!;
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
		const s = taskStats(DAYS, records);
		expect(s.total).toBe(4);
		expect(s.done).toBe(3);
		expect(s.doneInPeriod).toBe(2); // A 与 D（无 ✅ 按笔记日计）
		expect(s.createdInPeriod).toBe(1);
	});
});

describe("骨架生成（round-trip）与类型键", () => {
	it("日骨架包含全部标题区与字段空值行，解析后键一致", () => {
		const text = skeletonFor("daily", new Date(2026, 8, 25), SECTIONS);
		const parsedKeys = parseFieldLines(text.split("\n")).map((p) => p.key);
		for (const section of SECTIONS) {
			expect(text).toContain(section.heading);
			for (const field of section.fields) {
				expect(parsedKeys).toContain(field.key);
			}
		}
		expect(text).toContain("- [💊medicine::]");
		expect(text).toContain("journal-date: 2026-09-25");
	});

	it("周/月/年骨架与目标键", () => {
		const now = new Date(2026, 8, 25); // 2026-W39 周五
		expect(noteKeyFor("daily", now)).toBe("2026-09-25");
		expect(noteKeyFor("weekly", now)).toBe("2026-W39");
		expect(noteKeyFor("monthly", now)).toBe("2026-09");
		expect(noteKeyFor("annual", now)).toBe("2026");

		const weekly = skeletonFor("weekly", now, DEFAULT_JOURNALS.weekly.sections);
		expect(weekly).toContain("# 2026-W39 周日志");
		expect(weekly).toContain("journal-date: 2026-09-21"); // 周一
		expect(weekly).toContain("- [本周成就/亮点::]");

		const monthly = skeletonFor("monthly", now, DEFAULT_JOURNALS.monthly.sections);
		expect(monthly).toContain("# 2026-09 月度日志");
		expect(monthly).toContain("type: monthly_review");
	});

	it("v0.5 扁平配置迁移到按类型组织", () => {
		const migrated = mergeConfig({
			dailyDir: "999 Custom",
			templateNote: "999/TPL.md",
			sections: [
				{ id: "x", heading: "## X", type: "list", fields: [] },
			],
			language: "en",
		});
		expect(migrated.journals.daily.dir).toBe("999 Custom");
		expect(migrated.journals.daily.templateNote).toBe("999/TPL.md");
		expect(migrated.journals.daily.sections[0].id).toBe("x");
		expect(migrated.journals.weekly.dir).toBe(DEFAULT_JOURNALS.weekly.dir);
		expect(migrated.language).toBe("en");
	});
});

describe("文件名格式（moment 语法子集）", () => {
	const now = new Date(2026, 8, 25); // 2026-09-25，周 39

	it("默认格式：日/周/月/年", () => {
		expect(noteKeyFor("daily", now)).toBe("2026-09-25");
		expect(noteKeyFor("weekly", now)).toBe("2026-W39");
		expect(noteKeyFor("monthly", now)).toBe("2026-09");
		expect(noteKeyFor("annual", now)).toBe("2026");
	});

	it("自定义格式与字面量", () => {
		expect(formatTokens(now, "日志-YYYYMMDD")).toBe("日志-20260925");
		expect(formatTokens(now, "YYYY 第 ww 周")).toBe("2026 第 39 周");
		expect(formatTokens(now, "YYYY-[W]ww")).toBe("2026-W39");
		// 2026-01-01 是周四 → W01 为 12-29~01-04，01-05（周一）已是 W02
		expect(formatTokens(new Date(2026, 0, 5), "YYYY-[W]ww")).toBe("2026-W02");
	});

	it("骨架标题跟随自定义格式", () => {
		const text = skeletonFor("daily", now, [], "日志-YYYYMMDD");
		expect(text).toContain("# 日志-20260925 日志");
	});
});
