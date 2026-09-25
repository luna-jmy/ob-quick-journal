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

/** 把计划作用到文本（原子：调用方在 Vault.process 回调里用）。 */
export function applyPlan(text: string, plan: Extract<WritePlan, { status: "ok" }>): string {
	const lines = text.split(/\r?\n/);
	for (const e of plan.edits) {
		if (e.lineIndex < lines.length) lines[e.lineIndex] = e.newLine;
	}
	// 先标题后插入行；同行号多个插入按数组顺序稳定处理（倒序 splice）
	const inserts: FillCreate[] = [...plan.creates];
	if (plan.createHeading) {
		inserts.unshift({ afterLineIndex: plan.createHeading.afterLineIndex, line: plan.createHeading.heading });
	}
	inserts.sort((a, b) => b.afterLineIndex - a.afterLineIndex);
	let lastAnchor = -1;
	let pending: FillCreate[] = [];
	const flush = () => {
		for (let i = pending.length - 1; i >= 0; i--) {
			lines.splice(pending[i].afterLineIndex + 1, 0, pending[i].line);
		}
		pending = [];
	};
	for (const item of inserts) {
		if (item.afterLineIndex !== lastAnchor && pending.length > 0) flush();
		lastAnchor = item.afterLineIndex;
		pending.push(item);
	}
	flush();
	return lines.join("\n");
}
