/**
 * 写入计划（纯函数）：定位 → 计划 → 应用三段式。
 * planFieldFill / planAppend 只算「改哪几行」，applyPlan 把计划作用到文本上——
 * 实际落盘由 services/file-writer 在 Vault.process 的原子回调里调用 applyPlan。
 */

import { findHeadingIndex, renderFieldLine, sectionRange } from "../parse/field-lines";

export interface FillEdit {
	lineIndex: number;
	key: string;
	newLine: string;
	/** 该行原有的值（非空表示这是一次覆盖写） */
	previousValue: string;
}

export interface FillCreate {
	afterLineIndex: number;
	line: string;
}

export type WritePlan =
	| {
			status: "ok";
			/** 需要先创建的标题（heading 缺失时的兜底），afterLineIndex = 插入位置 */
			createHeading?: { heading: string; afterLineIndex: number };
			edits: FillEdit[];
			creates: FillCreate[];
			/** [start, end) 的旧行整体删除（段落覆盖用；与 edits 不同时出现） */
			removeLines?: { start: number; end: number };
			/** 段落覆盖时的已有内容预览（非空则调用方需走覆盖确认） */
			existingContent?: string;
	  }
	| { status: "error"; reason: "heading-not-found"; heading: string };

export interface FillValue {
	key: string;
	value: string;
}

/** 找到（或计划创建）标题，然后：已有行 → edits；缺行 → creates（补建空值行的兜底）。 */
export function planFieldFill(
	lines: string[],
	opts: {
		heading: string;
		headingMissingCreates: boolean;
		values: FillValue[];
	},
): WritePlan {
	const headingIndex = findHeadingIndex(lines, opts.heading);
	if (headingIndex < 0) {
		if (!opts.headingMissingCreates) {
			return { status: "error", reason: "heading-not-found", heading: opts.heading };
		}
		// 标题缺失：在最后一个非空行后创建标题，字段行依次排在标题后
		let anchor = lines.length - 1;
		while (anchor >= 0 && lines[anchor].trim() === "") anchor--;
		const creates: FillCreate[] = [];
		let after = anchor; // 标题将插在 anchor 之后（行号 anchor+1），字段行跟在标题后
		for (const v of opts.values) {
			creates.push({ afterLineIndex: after, line: renderFieldLine(v.key, v.value) });
			after++;
		}
		return {
			status: "ok",
			createHeading: { heading: opts.heading, afterLineIndex: anchor },
			edits: [],
			creates,
		};
	}

	const range = sectionRange(lines, headingIndex);
	const sectionLines = lines.slice(range.start, range.end);
	const byKey = new Map<string, { relIndex: number; value: string }>();
	for (let i = 0; i < sectionLines.length; i++) {
		const m = /^\s*[-*]\s*\[([^\][]+?)::\s*(.*?)\]\s*$/.exec(sectionLines[i]);
		if (m && !byKey.has(m[1].trim())) {
			byKey.set(m[1].trim(), { relIndex: i, value: m[2].trim() });
		}
	}

	const edits: FillEdit[] = [];
	const creates: FillCreate[] = [];
	// 补建行的插入点：区段内最后一个字段行之后；区段还没有字段行则紧跟标题
	let lastFieldAbs = range.start - 1;
	for (let i = range.start; i < range.end; i++) {
		if (/^\s*[-*]\s*\[[^\][]+?::/.test(lines[i])) lastFieldAbs = i;
	}

	for (const v of opts.values) {
		const existing = byKey.get(v.key);
		if (existing) {
			const abs = range.start + existing.relIndex;
			edits.push({
				lineIndex: abs,
				key: v.key,
				newLine: renderFieldLine(v.key, v.value),
				previousValue: existing.value,
			});
		} else {
			creates.push({ afterLineIndex: lastFieldAbs, line: renderFieldLine(v.key, v.value) });
			lastFieldAbs++;
		}
	}
	return { status: "ok", edits, creates };
}

/** 追加一行到标题区段末（跳过区段尾部的空行）；标题缺失时可创建。 */
export function planAppend(
	lines: string[],
	opts: { heading: string; headingMissingCreates: boolean; line: string },
): WritePlan {
	const headingIndex = findHeadingIndex(lines, opts.heading);
	if (headingIndex < 0) {
		if (!opts.headingMissingCreates) {
			return { status: "error", reason: "heading-not-found", heading: opts.heading };
		}
		let anchor = lines.length - 1;
		while (anchor >= 0 && lines[anchor].trim() === "") anchor--;
		return {
			status: "ok",
			createHeading: { heading: opts.heading, afterLineIndex: anchor },
			edits: [],
			creates: [{ afterLineIndex: anchor + 1, line: opts.line }],
		};
	}
	const range = sectionRange(lines, headingIndex);
	let insertAfter = headingIndex;
	for (let i = range.end - 1; i >= range.start; i--) {
		if (lines[i].trim() !== "") {
			insertAfter = i;
			break;
		}
	}
	return { status: "ok", edits: [], creates: [{ afterLineIndex: insertAfter, line: opts.line }] };
}

/** 段落区写入：一天一条、整段自由文字；已有内容 → 删除重建（existingContent 供覆盖确认）。 */
export function planParagraph(
	lines: string[],
	opts: { heading: string; headingMissingCreates: boolean; text: string },
): WritePlan {
	const headingIndex = findHeadingIndex(lines, opts.heading);
	const textLines = opts.text.trim() === "" ? [] : opts.text.split(/\r?\n/);
	if (headingIndex < 0) {
		if (!opts.headingMissingCreates || textLines.length === 0) {
			if (!opts.headingMissingCreates) {
				return { status: "error", reason: "heading-not-found", heading: opts.heading };
			}
			return { status: "ok", edits: [], creates: [], existingContent: "" };
		}
		let anchor = lines.length - 1;
		while (anchor >= 0 && lines[anchor].trim() === "") anchor--;
		const creates = textLines.map((line, i) => ({ afterLineIndex: anchor + i, line }));
		return {
			status: "ok",
			createHeading: { heading: opts.heading, afterLineIndex: anchor },
			edits: [],
			creates,
			existingContent: "",
		};
	}
	const range = sectionRange(lines, headingIndex);
	const contentLines: string[] = [];
	for (let i = range.start; i < range.end; i++) {
		if (lines[i].trim() !== "") contentLines.push(lines[i]);
	}
	if (contentLines.length === 0) {
		if (textLines.length === 0) return { status: "ok", edits: [], creates: [], existingContent: "" };
		// 同锚点连排：整段文字紧贴标题（applyPlan 同锚点按序号逆插，顺序保持）
		const creates = textLines.map((line) => ({ afterLineIndex: headingIndex, line }));
		return { status: "ok", edits: [], creates, existingContent: "" };
	}
	// 已有内容：删除重建；空文本（清空）只留一个空行保持间距
	const creates =
		textLines.length === 0
			? [{ afterLineIndex: headingIndex, line: "" }]
			: [...textLines, ""].map((line, i) => ({ afterLineIndex: headingIndex + i, line }));
	return {
		status: "ok",
		edits: [],
		creates,
		removeLines: { start: range.start, end: range.end },
		existingContent: contentLines[0].trim(),
	};
}

/** 单行原位替换（速记面板条目编辑用；行内容过期由调用方先行校验）。 */
export function planEditLineAt(lineIndex: number, newLine: string): WritePlan {
	return {
		status: "ok",
		edits: [{ lineIndex, key: "line", newLine, previousValue: "" }],
		creates: [],
	};
}

/** 单行删除。 */
export function planDeleteLineAt(lineIndex: number): WritePlan {
	return {
		status: "ok",
		edits: [],
		creates: [],
		removeLines: { start: lineIndex, end: lineIndex + 1 },
	};
}

/** 把计划作用到文本（原子：调用方在 Vault.process 回调里用）。 */
export function applyPlan(text: string, plan: Extract<WritePlan, { status: "ok" }>): string {
	const lines = text.split(/\r?\n/);
	if (plan.removeLines) {
		lines.splice(plan.removeLines.start, plan.removeLines.end - plan.removeLines.start);
	}
	for (const e of plan.edits) {
		if (e.lineIndex < lines.length) lines[e.lineIndex] = e.newLine;
	}
	// 插入按锚点降序处理（高位先插，不影响低位锚点）；同锚点按原数组顺序逆序插入，
	// 使最终顺序与计划一致
	const inserts: { afterLineIndex: number; line: string; seq: number }[] = plan.creates.map(
		(item, seq) => ({ ...item, seq }),
	);
	if (plan.createHeading) {
		inserts.push({
			afterLineIndex: plan.createHeading.afterLineIndex,
			line: plan.createHeading.heading,
			seq: -1,
		});
	}
	inserts.sort((a, b) => b.afterLineIndex - a.afterLineIndex || b.seq - a.seq);
	for (const item of inserts) {
		lines.splice(item.afterLineIndex + 1, 0, item.line);
	}
	return lines.join("\n");
}
