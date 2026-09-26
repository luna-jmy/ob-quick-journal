import { describe, expect, it } from "vitest";
import {
	extractUnfinishedBlocks,
	openTaskMatcher,
	removeBlocks,
} from "../src/capture/rollover";
import { applyPlan, planInsertLines } from "../src/capture/plan";

const NOTE = [
	"# 2026-09-24 日志",
	"## 👀 GTD任务看板",
	"- [ ] 任务一",
	"- [>] 任务二（重排）",
	"- [x] 已完成，不动",
	"- [/] 进行中，默认不动",
	"- [ ] 任务三",
	"  子步骤 a",
	"  子步骤 b",
	"- 独立列表行，不动",
	"普通文字",
].join("\n");

describe("未完成任务滚动（纯函数）", () => {
	it("默认标记（空格 + >）提取任务块，子步骤并入块；完成/进行中不动", () => {
		const blocks = extractUnfinishedBlocks(NOTE.split("\n"), [" ", ">"]);
		expect(blocks).toHaveLength(3);
		expect(blocks[0].lines).toEqual(["- [ ] 任务一"]);
		expect(blocks[1].lines).toEqual(["- [>] 任务二（重排）"]);
		expect(blocks[2].lines).toEqual(["- [ ] 任务三", "  子步骤 a", "  子步骤 b"]);
		// 行号区间
		expect(blocks[2].start).toBe(6);
		expect(blocks[2].end).toBe(9);
	});

	it("自定义标记集：把 / 也算未完成", () => {
		const match = openTaskMatcher([" ", ">", "/"]);
		expect(match("- [/] 进行中")).toBe(true);
		expect(match("- [x] 完成")).toBe(false);
		const blocks = extractUnfinishedBlocks(NOTE.split("\n"), [" ", ">", "/"]);
		expect(blocks).toHaveLength(4);
	});

	it("removeBlocks 删除并折叠空行", () => {
		const note = "# t\n## GTD\n- [ ] A\n\n- [ ] B\n\n文字\n\n\n尾";
		const blocks = extractUnfinishedBlocks(note.split("\n"), [" ", ">"]);
		const out = removeBlocks(note, blocks);
		expect(out).not.toContain("- [ ] A");
		expect(out).not.toContain("- [ ] B");
		expect(out).toContain("## GTD");
		expect(out).toContain("文字");
		expect(out).not.toMatch(/\n{3,}/);
	});
});

describe("planInsertLines（多行同锚点连排）", () => {
	it("追加到区段末，多行顺序保持", () => {
		const note = "## GTD\n已有\n";
		const plan = planInsertLines(note.split("\n"), {
			heading: "## GTD",
			headingMissingCreates: true,
			newLines: ["- [ ] A", "  子步骤", "- [ ] B"],
		});
		expect(plan.status).toBe("ok");
		if (plan.status !== "ok") return;
		expect(applyPlan(note, plan)).toBe("## GTD\n已有\n- [ ] A\n  子步骤\n- [ ] B\n");
	});
});
