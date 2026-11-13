/**
 * note-fields 纯函数层：任意位置方括号字段扫描、标题区类型映射、
 * 行内多处替换（matchIndex 拼接）与控件启发式。
 */

import { describe, expect, it } from "vitest";

import {
	applyFieldOccurrences,
	fieldControlKind,
	scanNoteFields,
	sectionTypeForHeading,
} from "../src/parse/note-fields";
import { BOOL_NO, BOOL_YES, mergeConfig, type QJConfig } from "../src/types";

describe("scanNoteFields", () => {
	it("嵌在句中的字段也识别（不限于独立成行）", () => {
		const scan = scanNoteFields(["- 08:12 出门跑步 [archive:: true]"]);
		expect(scan.count).toBe(1);
		expect(scan.sections[0]?.headingText).toBeNull();
		expect(scan.sections[0]?.fields[0]).toMatchObject({
			key: "archive",
			value: "true",
			matchIndex: 0,
		});
	});

	it("一行多个字段各自成条，matchIndex 递增", () => {
		const scan = scanNoteFields(["- [a:: 1] 中间文字 [b:: 2]"]);
		const fields = scan.sections[0]?.fields ?? [];
		expect(fields).toHaveLength(2);
		expect(fields[0]).toMatchObject({ key: "a", value: "1", matchIndex: 0 });
		expect(fields[1]).toMatchObject({ key: "b", value: "2", matchIndex: 1 });
	});

	it("key 与 value 去首尾空白", () => {
		const scan = scanNoteFields(["- [ weight⚖️ :: 62 ]"]);
		expect(scan.sections[0]?.fields[0]).toMatchObject({ key: "weight⚖️", value: "62" });
	});

	it("frontmatter、代码块、%% 注释跳过", () => {
		const scan = scanNoteFields([
			"---",
			"title: x",
			"[fm:: 1]",
			"---",
			"[body:: 2]",
			"```",
			"[code:: 3]",
			"```",
			"%% [comment:: 4] %%",
		]);
		const keys = scan.sections[0]?.fields.map((f) => f.key) ?? [];
		expect(keys).toEqual(["body"]);
	});

	it("[[wikilink:: x]] 不误报（负向后行断言挡内层）", () => {
		const scan = scanNoteFields(["看这篇 [[Note:: x]] 和 [[普通笔记]]"]);
		expect(scan.count).toBe(0);
	});

	it("按标题分节，前言区 headingText 为 null；空小节不出现", () => {
		const scan = scanNoteFields([
			"[pre:: 0]",
			"## 没有字段的标题",
			"### 每日打卡",
			"- [💊medicine:: ✔️]",
			"### 数据记录",
			"- [weight⚖️:: 62]",
		]);
		expect(scan.sections.map((s) => s.headingText)).toEqual([null, "每日打卡", "数据记录"]);
		expect(scan.count).toBe(3);
	});
});

describe("sectionTypeForHeading", () => {
	const config: QJConfig = mergeConfig(undefined);

	it("默认配置的「每日打卡」命中 checkin", () => {
		expect(sectionTypeForHeading("每日打卡", config)?.type).toBe("checkin");
	});

	it("未配置的标题返回 null", () => {
		expect(sectionTypeForHeading("随便什么标题", config)).toBeNull();
	});
});

describe("fieldControlKind", () => {
	it("配置命中优先：checkin / data / compare", () => {
		expect(fieldControlKind("checkin", BOOL_YES)).toBe("checkin");
		expect(fieldControlKind("checkin", "")).toBe("checkin");
		expect(fieldControlKind("data", "62")).toBe("number");
		expect(fieldControlKind("compare", "")).toBe("number");
	});

	it("现值塞不进控件时退文本框", () => {
		expect(fieldControlKind("checkin", "true")).toBe("text");
		expect(fieldControlKind("data", "abc")).toBe("text");
	});

	it("未配置按值启发：✔️/❌ 三段、纯数字数字框、其余文本框", () => {
		expect(fieldControlKind(null, BOOL_NO)).toBe("checkin");
		expect(fieldControlKind(null, "3.5")).toBe("number");
		expect(fieldControlKind(null, "")).toBe("text");
		expect(fieldControlKind(null, "一句话")).toBe("text");
	});
});

describe("applyFieldOccurrences", () => {
	it("替换保留行内其余文字与缩进", () => {
		const raw = "- 08:12 出门 [archive:: true] 结束";
		expect(applyFieldOccurrences(raw, [{ matchIndex: 0, value: "false" }])).toBe(
			"- 08:12 出门 [archive:: false] 结束",
		);
	});

	it("一行多处按 matchIndex 各自替换，互不漂移", () => {
		const raw = "- [a:: 1] 中间 [b:: 2]";
		expect(
			applyFieldOccurrences(raw, [
				{ matchIndex: 0, value: "9" },
				{ matchIndex: 1, value: "8" },
			]),
		).toBe("- [a:: 9] 中间 [b:: 8]");
	});

	it("空值写 [key::]（与 renderFieldLine 空值形态一致）", () => {
		expect(applyFieldOccurrences("- [a:: 1]", [{ matchIndex: 0, value: "" }])).toBe("- [a::]");
	});

	it("matchIndex 越界（行已变）返回 null", () => {
		expect(applyFieldOccurrences("- [a:: 1]", [{ matchIndex: 2, value: "x" }])).toBeNull();
	});

	it("无编辑原样返回", () => {
		expect(applyFieldOccurrences("- [a:: 1]", [])).toBe("- [a:: 1]");
	});
});
