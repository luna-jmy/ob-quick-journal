import { describe, expect, it } from "vitest";
import {
	applyPlan,
	planAppend,
	planDeleteLineAt,
	planEditLineAt,
	planFieldFill,
	planParagraph,
} from "../src/capture/plan";

const NOTE = [
	"# 2026-09-25 日志",
	"### 每日打卡",
	"- [💊medicine::]",
	"- [🧘‍♂️meditation:: ✔️]",
	"### 数据记录",
	"- [weight⚖️:: 62]",
].join("\n");

describe("planFieldFill", () => {
	it("空值行 → 填值（edit）；已有值 → 覆盖标记 previousValue", () => {
		const plan = planFieldFill(NOTE.split("\n"), {
			heading: "### 每日打卡",
			headingMissingCreates: true,
			values: [
				{ key: "💊medicine", value: "✔️" },
				{ key: "🧘‍♂️meditation", value: "❌" },
			],
		});
		expect(plan.status).toBe("ok");
		if (plan.status !== "ok") return;
		expect(plan.edits).toHaveLength(2);
		expect(plan.edits[0].previousValue).toBe("");
		expect(plan.edits[1].previousValue).toBe("✔️");
		expect(plan.creates).toHaveLength(0);

		const out = applyPlan(NOTE, plan);
		expect(out).toContain("- [💊medicine:: ✔️]");
		expect(out).toContain("- [🧘‍♂️meditation:: ❌]");
	});

	it("缺字段行 → 在区段内补建（create），顺序跟在最后一个字段行后", () => {
		const plan = planFieldFill(NOTE.split("\n"), {
			heading: "### 数据记录",
			headingMissingCreates: true,
			values: [
				{ key: "reading🕓", value: "30" },
				{ key: "weight⚖️", value: "63" },
			],
		});
		expect(plan.status).toBe("ok");
		if (plan.status !== "ok") return;
		expect(plan.edits.map((e) => e.key)).toEqual(["weight⚖️"]);
		expect(plan.creates.map((c) => c.line)).toEqual(["- [reading🕓:: 30]"]);

		const out = applyPlan(NOTE, plan).split("\n");
		const readingIdx = out.indexOf("- [reading🕓:: 30]");
		expect(readingIdx).toBe(out.indexOf("- [weight⚖️:: 63]") + 1);
	});

	it("标题缺失 → 创建标题并整段补建", () => {
		const plan = planFieldFill(["# 标题", "", "正文一行"], {
			heading: "## ✍️ 今日小结与回顾",
			headingMissingCreates: true,
			values: [{ key: "今天最满意的事", value: "写完原型" }],
		});
		expect(plan.status).toBe("ok");
		if (plan.status !== "ok") return;
		expect(plan.createHeading?.heading).toBe("## ✍️ 今日小结与回顾");
		const out = applyPlan("# 标题\n\n正文一行", plan);
		expect(out).toContain("## ✍️ 今日小结与回顾");
		expect(out).toContain("- [今天最满意的事:: 写完原型]");
	});

	it("标题缺失且不允许创建 → error", () => {
		const plan = planFieldFill(["# 标题"], {
			heading: "### 不存在",
			headingMissingCreates: false,
			values: [{ key: "k", value: "v" }],
		});
		expect(plan.status).toBe("error");
	});
});

describe("planAppend", () => {
	it("追加到标题区段末（跳过尾部空行）", () => {
		const note = "## 💡 灵感与思考\n\n想法A\n\n## 下一个标题\n";
		const plan = planAppend(note.split("\n"), {
			heading: "## 💡 灵感与思考",
			headingMissingCreates: true,
			line: "- 新灵感",
		});
		expect(plan.status).toBe("ok");
		const out = applyPlan(note, plan as Extract<ReturnType<typeof planAppend>, { status: "ok" }>);
		const lines = out.split("\n");
		expect(lines[lines.indexOf("- 新灵感") - 1]).toBe("想法A");
	});

	it("CRLF 文本也能正确应用", () => {
		const note = "## 💡 灵感与思考\r\n\r\n想法A\r\n";
		const plan = planAppend(note.split(/\r?\n/), {
			heading: "## 💡 灵感与思考",
			headingMissingCreates: true,
			line: "- 新灵感",
		});
		expect(plan.status).toBe("ok");
		if (plan.status !== "ok") return;
		const out = applyPlan(note, plan);
		expect(out).toContain("- 新灵感");
		expect(out).toContain("想法A");
	});
});

describe("planParagraph（一天一条整段文字）", () => {
	it("空区段 → 标题下插入整段，existingContent 为空", () => {
		const note = "# 日志\n## 今日随笔\n\n## 下一个标题\n";
		const plan = planParagraph(note.split("\n"), {
			heading: "## 今日随笔",
			headingMissingCreates: true,
			text: "第一行\n第二行",
		});
		expect(plan.status).toBe("ok");
		if (plan.status !== "ok") return;
		expect(plan.existingContent).toBe("");
		expect(plan.creates.map((c) => c.line)).toEqual(["第一行", "第二行"]);
		const out = applyPlan(note, plan).split("\n");
		expect(out.indexOf("第一行")).toBe(2);
		expect(out.indexOf("第二行")).toBe(3);
	});

	it("已有内容 → 整段删除重建，落位紧贴标题且不打散到下一个标题后（回归）", () => {
		const note = "# 日志\n## 今日随笔\n旧的一\n旧二\n旧三\n\n## 下一个标题\n";
		const plan = planParagraph(note.split("\n"), {
			heading: "## 今日随笔",
			headingMissingCreates: true,
			text: "新一\n新二",
		});
		expect(plan.status).toBe("ok");
		if (plan.status !== "ok") return;
		expect(plan.existingContent).toBe("旧的一");
		expect(plan.removeLines).toEqual({ start: 2, end: 6 });
		expect(applyPlan(note, plan)).toBe(
			"# 日志\n## 今日随笔\n新一\n新二\n\n## 下一个标题\n",
		);
	});

	it("标题缺失 → 创建标题并写入", () => {
		const plan = planParagraph(["# 日志"], {
			heading: "## 今日随笔",
			headingMissingCreates: true,
			text: "一段",
		});
		expect(plan.status).toBe("ok");
		if (plan.status !== "ok") return;
		expect(plan.createHeading?.heading).toBe("## 今日随笔");
		expect(applyPlan("# 日志", plan)).toContain("## 今日随笔\n一段");
	});

	it("空文本（清空）→ 只删不写", () => {
		const note = "# 日志\n## 今日随笔\n旧内容\n\n## 下一个\n";
		const plan = planParagraph(note.split("\n"), {
			heading: "## 今日随笔",
			headingMissingCreates: false,
			text: "",
		});
		expect(plan.status).toBe("ok");
		if (plan.status !== "ok") return;
		expect(applyPlan(note, plan)).not.toContain("旧内容");
	});
});

describe("planEditLineAt / planDeleteLineAt（条目级写回）", () => {
	it("原位替换单行", () => {
		const note = "# 日志\n## 灵感\n- 08:44 旧的\n- 其他";
		const plan = planEditLineAt(2, "- 08:44 新的");
		expect(plan.status).toBe("ok");
		if (plan.status !== "ok") return;
		expect(applyPlan(note, plan)).toBe("# 日志\n## 灵感\n- 08:44 新的\n- 其他");
	});

	it("删除单行", () => {
		const note = "# 日志\n## 灵感\n- 08:44 要删的\n- 留下";
		const plan = planDeleteLineAt(2);
		expect(plan.status).toBe("ok");
		if (plan.status !== "ok") return;
		expect(applyPlan(note, plan)).toBe("# 日志\n## 灵感\n- 留下");
	});
});

describe("applyPlan 多行插入顺序", () => {
	it("文档中部的多个锚点：最终顺序与计划一致（回归：高位锚点先插不推挤低位）", () => {
		const note = "A\nB\nC\nD";
		const plan = {
			status: "ok" as const,
			edits: [],
			creates: [
				{ afterLineIndex: 1, line: "B1" },
				{ afterLineIndex: 2, line: "C1" },
			],
		};
		expect(applyPlan(note, plan)).toBe("A\nB\nB1\nC\nC1\nD");
	});
});
