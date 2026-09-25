import { describe, expect, it } from "vitest";
import {
	defaultLabel,
	detectSections,
	detectedToSections,
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
});
