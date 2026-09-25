import { describe, expect, it } from "vitest";
import { parseFieldLines, renderFieldLine, findHeadingIndex, sectionRange } from "../src/parse/field-lines";
import { parseTaskLine } from "../src/parse/task-lines";

const DAILY_SNIPPET = [
	"---",
	"journal: Daily",
	"journal-date: 2026-09-25",
	"---",
	"# 2026-09-25 日志",
	"### 每日打卡",
	"- [💊medicine::]",
	"- [🧘‍♂️meditation:: ✔️]",
	"### 数据记录",
	"- [weight⚖️:: 62]",
	"- [spent💰::]",
	"```dataview",
	"- [fake:: nope]",
	"```",
	"$={const p=dv.pages();p?1:0}",
	"- [x] 已完成任务 ✅ 2026-09-25",
	"- [ ] 未完成任务 🛫 2026-09-20 📅 2026-09-30 ➕ 2026-09-18",
].join("\n");

describe("字段行解析", () => {
	it("解析方括号形态（emoji 前缀/后缀键、空值）", () => {
		const parsed = parseFieldLines(DAILY_SNIPPET.split("\n"));
		const keys = parsed.map((p) => p.key);
		expect(keys).toContain("💊medicine");
		expect(keys).toContain("🧘‍♂️meditation");
		expect(keys).toContain("weight⚖️");
		expect(keys).toContain("spent💰");
		expect(parsed.find((p) => p.key === "💊medicine")?.value).toBe("");
		expect(parsed.find((p) => p.key === "weight⚖️")?.value).toBe("62");
	});

	it("代码块与 frontmatter 内不解析", () => {
		const parsed = parseFieldLines(DAILY_SNIPPET.split("\n"));
		expect(parsed.find((p) => p.key === "fake")).toBeUndefined();
		expect(parsed.find((p) => p.key === "journal-date")).toBeUndefined();
	});

	it("渲染与模板形态一致", () => {
		expect(renderFieldLine("weight⚖️", "62")).toBe("- [weight⚖️:: 62]");
		expect(renderFieldLine("💊medicine", "")).toBe("- [💊medicine::]");
	});

	it("标题定位与区段范围", () => {
		const lines = DAILY_SNIPPET.split("\n");
		const h = findHeadingIndex(lines, "### 数据记录");
		expect(h).toBeGreaterThan(0);
		const range = sectionRange(lines, h);
		const section = lines.slice(range.start, range.end);
		expect(section.some((l) => l.includes("weight⚖️"))).toBe(true);
		expect(section.some((l) => l.includes("medicine"))).toBe(false);
	});
});

describe("任务行解析", () => {
	it("完成态与 emoji 日期", () => {
		const done = parseTaskLine("- [x] 已完成任务 ✅ 2026-09-25");
		expect(done?.done).toBe(true);
		expect(done?.doneDate).toBe("2026-09-25");

		const open = parseTaskLine("- [ ] 未完成任务 🛫 2026-09-20 📅 2026-09-30 ➕ 2026-09-18");
		expect(open?.done).toBe(false);
		expect(open?.createdDate).toBe("2026-09-18");
		expect(open?.doneDate).toBeUndefined();
	});

	it("非任务行不误判（字段行、行内 JS）", () => {
		expect(parseTaskLine("- [weight⚖️:: 62]")).toBeNull();
		expect(parseTaskLine("$={const p=dv.pages();}")).toBeNull();
	});
});
