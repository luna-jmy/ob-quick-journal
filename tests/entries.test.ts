import { describe, expect, it } from "vitest";
import { collectEntries } from "../src/parse/section-entries";
import type { JournalSection } from "../src/types";

const NOTE = [
	"# 2026-09-25 日志",
	"## 💡 灵感与思考",
	"- 灵感A",
	"-",
	"%%（备注不进流）%%",
	"## ✍️ 今日小结与回顾",
	"- [今天最满意的事:: 写完面板]",
	"- [明天想改进的事::]",
	"- [未注册字段:: 也有值]",
	"## 👀 GTD任务看板",
	"- [ ] 任务一",
	"- [x] 任务二 ✅ 2026-09-25",
	"- [-] 任务三",
	"- [/] 任务四",
	"- [weight⚖️:: 62]", // 列表区里的字段行不算列表条目
	"```tasks",
	"- [ ] 代码块里的任务",
	"```",
	"## 📈 习惯记录",
	"- [💊medicine:: ✔️]",
].join("\n");

const SECTIONS: JournalSection[] = [
	{ id: "ideas", heading: "## 💡 灵感与思考", type: "list", fields: [] },
	{
		id: "daily-review",
		heading: "## ✍️ 今日小结与回顾",
		type: "text",
		fields: [{ key: "今天最满意的事", label: "最满意" }],
	},
	{ id: "gtd", heading: "## 👀 GTD任务看板", type: "list", fields: [] },
	{ id: "habits", heading: "### 每日打卡", type: "checkin", fields: [{ key: "💊medicine", label: "吃药" }] },
];

describe("标题区内容条目抽取", () => {
	it("列表区：逐条成流，正文不带状态符号（符号只在面板按钮上）；空行/注释/字段行/代码块不进流", () => {
		const entries = collectEntries("2026-09-25", NOTE.split("\n"), SECTIONS);
		const gtd = entries.filter((e) => e.sectionId === "gtd");
		expect(gtd.map((e) => e.text)).toEqual([
			"任务一",
			"任务二 ✅ 2026-09-25",
			"任务三",
			"任务四",
		]);
		expect(gtd.map((e) => e.taskStatus)).toEqual([" ", "x", "-", "/"]);
		const ideas = entries.filter((e) => e.sectionId === "ideas");
		expect(ideas.map((e) => e.text)).toEqual(["灵感A"]);
	});

	it("文本区：有值字段成流（带展示名），空值跳过，未注册字段回退键名", () => {
		const entries = collectEntries("2026-09-25", NOTE.split("\n"), SECTIONS);
		const review = entries.filter((e) => e.sectionId === "daily-review");
		expect(review).toHaveLength(2);
		expect(review[0]).toMatchObject({ label: "最满意", text: "写完面板", kind: "field" });
		expect(review[1].label).toBe("未注册字段");
	});

	it("打卡区不进流；heading 缺失的区段无条目", () => {
		const entries = collectEntries("2026-09-25", NOTE.split("\n"), SECTIONS);
		expect(entries.some((e) => e.sectionId === "habits")).toBe(false);

		const missing = collectEntries("2026-09-25", NOTE.split("\n"), [
			{ id: "x", heading: "## 不存在", type: "list", fields: [] },
		]);
		expect(missing).toEqual([]);
	});
});

describe("时间戳与段落", () => {
	const NOTE = [
		"# 2026-09-25 日志",
		"## 💡 灵感与思考",
		"- 08:44 早上想到的",
		"- [ ] 09:30 要做的任务",
		"## 今日随笔",
		"21:05 今天写了一整段，",
		"第二行继续。",
	].join("\n");
	const SECTIONS: JournalSection[] = [
		{ id: "ideas", heading: "## 💡 灵感与思考", type: "list", fields: [] },
		{ id: "diary", heading: "## 今日随笔", type: "paragraph", fields: [] },
	];

	it("列表条目解析 HH:mm 时间戳（普通行与任务行），并携带行定位信息", () => {
		const entries = collectEntries("2026-09-25", NOTE.split("\n"), SECTIONS);
		const ideas = entries.filter((e) => e.sectionId === "ideas");
		expect(ideas[0]).toMatchObject({ time: "08:44", text: "早上想到的" });
		expect(ideas[1]).toMatchObject({ time: "09:30", text: "要做的任务" });
		// 编辑写回需要：行号、原文、前缀（重建 `- ` / `- [ ] ` + 时间戳）、可编辑内容
		expect(ideas[0]).toMatchObject({
			lineIndex: 2,
			raw: "- 08:44 早上想到的",
			prefix: "- ",
			content: "早上想到的",
		});
		expect(ideas[1].prefix).toBe("- [ ] ");
		expect(ideas[1].content).toBe("要做的任务");
	});

	it("段落一天一条：整段合成一个条目，前缀时间戳被剥离；段内空行与结构原样保留（编辑写回不改结构）", () => {
		const entries = collectEntries("2026-09-25", NOTE.split("\n"), SECTIONS);
		const diary = entries.filter((e) => e.sectionId === "diary");
		expect(diary).toHaveLength(1);
		expect(diary[0]).toMatchObject({
			kind: "paragraph",
			time: "21:05",
			text: "今天写了一整段，\n第二行继续。",
		});

		const withBlank = collectEntries(
			"2026-09-26",
			["# 日志", "## 今日随笔", "第一段。", "", "第二段。"].join("\n").split("\n"),
			SECTIONS,
		);
		expect(withBlank[0].text).toBe("第一段。\n\n第二段。");
	});
});
