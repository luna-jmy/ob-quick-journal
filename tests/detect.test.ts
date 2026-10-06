import { describe, expect, it } from "vitest";
import {
	compareFromKeys,
	defaultLabel,
	detectSections,
	detectedToSections,
	splitTrailingEmoji,
	suggestType,
} from "../src/parse/detect-sections";

const TPL_SNIPPET = [
	"---",
	"journal: Daily",
	"journal-date: 2026-09-25",
	"---",
	"# 2026-09-25 日志",
	"## ✨ 今日关注",
	"$={const p=dv.pages();}",
	"### 每日打卡",
	"- [💊medicine::]",
	"- [🧠flashcard::]",
	"### 数据记录",
	"- [weight⚖️::]",
	"- [reading🕓::]",
	"```tasks",
	"not done",
	"path includes 540 Daily",
	"```",
	"## ✍️ 今日小结与回顾",
	"- [今天最满意的事::]",
	"## 💡 灵感与思考",
].join("\n");

describe("模板识别", () => {
	it("按标题切段，提取内联字段；frontmatter 与代码块不参与", () => {
		const sections = detectSections(TPL_SNIPPET);
		const byHeading = new Map(sections.map((s) => [s.heading, s.fieldKeys]));

		expect(byHeading.get("### 每日打卡")).toEqual(["💊medicine", "🧠flashcard"]);
		expect(byHeading.get("### 数据记录")).toEqual(["weight⚖️", "reading🕓"]);
		// 代码块里的 "path includes 540 Daily" 不应变成字段
		expect(byHeading.get("### 数据记录")).toHaveLength(2);
		expect(byHeading.get("## ✍️ 今日小结与回顾")).toEqual(["今天最满意的事"]);
		expect(byHeading.get("## 💡 灵感与思考")).toEqual([]);
		expect(byHeading.has("# 2026-09-25 日志")).toBe(true);
		// frontmatter 的 journal-date 不在结果里
		expect(sections.some((s) => s.fieldKeys.includes("journal-date"))).toBe(false);
	});

	it("类型启发式：打卡/数据/文本/无字段列表", () => {
		expect(suggestType("### 每日打卡", 2)).toBe("checkin");
		expect(suggestType("### 数据记录", 2)).toBe("data");
		expect(suggestType("## ✍️ 今日小结与回顾", 1)).toBe("text");
		expect(suggestType("## 💡 灵感与思考", 0)).toBe("list");
	});

	it("默认展示名去掉 emoji（含 ZWJ 组合）", () => {
		expect(defaultLabel("weight⚖️")).toBe("weight");
		expect(defaultLabel("💊medicine")).toBe("medicine");
		expect(defaultLabel("🧘‍♂️meditation")).toBe("meditation");
		expect(defaultLabel("今天最满意的事")).toBe("今天最满意的事");
	});

	it("识别结果转标题区：list 带行模板，字段带默认展示名", () => {
		const sections = detectedToSections(detectSections(TPL_SNIPPET));
		const checkin = sections.find((s) => s.heading === "### 每日打卡")!;
		expect(checkin.type).toBe("checkin");
		expect(checkin.fields[0]).toEqual({ key: "💊medicine", label: "medicine" });

		const ideas = sections.find((s) => s.heading === "## 💡 灵感与思考")!;
		expect(ideas.type).toBe("list");
		expect(ideas.lineTemplate).toBe("- {{value}}");
		expect(ideas.fields).toEqual([]);
	});

	it("常规数据区不成对：不同字段各异的后缀 → 仍是 data", () => {
		const sections = detectedToSections(detectSections(TPL_SNIPPET));
		const data = sections.find((s) => s.heading === "### 数据记录")!;
		expect(data.type).toBe("data");
		expect(data.compare).toBeUndefined();
	});
});

const WHEEL_TEMPLATE = [
	"# 2026 年度日志",
	"### 🎯 年度评分",
	"- [PersonalGrowth🎯:: 0]",
	"- [HealthFitness🎯:: 0]",
	"- [LoveRelationships🎯:: 0]",
	"- [CareerWork🎯:: 0]",
	"- [FunRecreation🎯:: 0]",
	"- [Social🎯:: 0]",
	"- [Finance🎯:: 0]",
	"- [Spiritual🎯:: 0]",
	"- [PersonalGrowth🏆:: 0]",
	"- [HealthFitness🏆:: 0]",
	"- [LoveRelationships🏆:: 0]",
	"- [CareerWork🏆:: 0]",
	"- [FunRecreation🏆:: 0]",
	"- [Social🏆:: 0]",
	"- [Finance🏆:: 0]",
	"- [Spiritual🏆:: 0]",
].join("\n");

describe("对比区识别（键尾系列标记配对）", () => {
	it("splitTrailingEmoji：尾部 emoji 拆出 base+marker；前缀 emoji / 无 emoji / 全 emoji → null", () => {
		expect(splitTrailingEmoji("PersonalGrowth🎯")).toEqual({ base: "PersonalGrowth", marker: "🎯" });
		expect(splitTrailingEmoji("💊medicine")).toBeNull();
		expect(splitTrailingEmoji("今天最满意的事")).toBeNull();
		expect(splitTrailingEmoji("🎯")).toBeNull();
	});

	it("全部基础键恰好配成同两个标记 → compareFromKeys 命中", () => {
		const keys = [
			"PersonalGrowth🎯",
			"HealthFitness🎯",
			"PersonalGrowth🏆",
			"HealthFitness🏆",
		];
		expect(compareFromKeys(keys)).toEqual({
			bases: ["PersonalGrowth", "HealthFitness"],
			markers: ["🎯", "🏆"],
		});
		// 某基础键缺一个标记 → 不成对
		expect(compareFromKeys([...keys.slice(0, 2), "PersonalGrowth🏆"])).toBeNull();
		// 三个不同标记 → 不成对
		expect(
			compareFromKeys(["A🎯", "B🎯", "A🏆", "B🏆", "A⭐", "B⭐"]),
		).toBeNull();
		// 无 emoji 后缀 → 不成对
		expect(compareFromKeys(["A", "B", "C", "D"])).toBeNull();
	});

	it("生命之轮模板识别为 compare：fields = 8 个基础键，系列 = 🎯/🏆", () => {
		const sections = detectedToSections(detectSections(WHEEL_TEMPLATE));
		const wheel = sections.find((s) => s.heading === "### 🎯 年度评分")!;
		expect(wheel.type).toBe("compare");
		expect(wheel.fields).toHaveLength(8);
		expect(wheel.fields[0]).toEqual({ key: "PersonalGrowth", label: "PersonalGrowth" });
		expect(wheel.compare?.series).toEqual([
			{ marker: "🎯", label: "🎯" },
			{ marker: "🏆", label: "🏆" },
		]);
	});
});
