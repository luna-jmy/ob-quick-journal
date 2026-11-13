/**
 * 当前笔记内联字段扫描（纯函数）。
 *
 * 与 field-lines.ts 的 parseFieldLines 是**不同口径**：这里非锚定逐个匹配，行内
 * 任意位置的方括号字段都算——嵌在句中的（速记条目上的 `[archive:: true]`）也要
 * 能批量改，一行多个字段各自成条。裸形态（`key:: value`）不在本扫描范围：
 * 散文里 `::` 的误报面太大，方括号形态才是「可批量录入的字段」。
 * 代码块、frontmatter、`%%…%%` 注释跳过（与 parseFieldLines 同口径）。
 */

import type { JournalSection, QJConfig, SectionType } from "../types";
import { BOOL_NO, BOOL_YES } from "../types";

export interface FieldOccurrence {
	lineIndex: number;
	/** 该行第几个方括号匹配（0 起）——写回定位用；与 key 无关 */
	matchIndex: number;
	key: string;
	value: string;
	/** 扫描时的整行原文；写回前整行比对，行变了就整批拒写 */
	raw: string;
}

export interface NoteFieldSection {
	/** null = 首个标题之前的前言区 */
	headingText: string | null;
	level: number;
	fields: FieldOccurrence[];
}

export interface NoteFieldScan {
	/** 只含有字段的小节（空小节不进列表） */
	sections: NoteFieldSection[];
	count: number;
}

/*
 * 负向后行断言挡掉 `[[wikilink:: x]]` 的内层误报（第二个 `[` 前面正是 `[`）。
 * key 不含 `[ ] :`；value 不含方括号——`[a:: [b:: 1]]` 这类畸形不猜，留给手改。
 */
const INLINE_FIELD_RE = /(?<!\[)\[([^[\]:]+)::\s*([^[\]]*?)\]/gu;
const HEADING_RE = /^(#{1,6})\s+(.+)$/;

export function scanNoteFields(lines: string[]): NoteFieldScan {
	const sections: NoteFieldSection[] = [];
	let current: NoteFieldSection = { headingText: null, level: 0, fields: [] };
	let inFence = false;
	let inFrontmatter = false;

	lines.forEach((line, i) => {
		if (i === 0 && line.trim() === "---") {
			inFrontmatter = true;
			return;
		}
		if (inFrontmatter) {
			if (line.trim() === "---") inFrontmatter = false;
			return;
		}
		if (line.trimStart().startsWith("```")) {
			inFence = !inFence;
			return;
		}
		if (inFence) return;
		if (line.trimStart().startsWith("%%")) return;

		const heading = HEADING_RE.exec(line);
		if (heading !== null) {
			if (current.fields.length > 0) sections.push(current);
			current = { headingText: heading[2].trim(), level: heading[1].length, fields: [] };
			return;
		}

		let matchIndex = 0;
		for (const m of line.matchAll(INLINE_FIELD_RE)) {
			current.fields.push({
				lineIndex: i,
				matchIndex,
				key: m[1].trim(),
				value: m[2].trim(),
				raw: line,
			});
			matchIndex += 1;
		}
	});
	if (current.fields.length > 0) sections.push(current);

	return { sections, count: sections.reduce((n, s) => n + s.fields.length, 0) };
}

/**
 * 标题文本（去 `#` 后）匹配某配置标题区 → 该区。跨全部日志类型找（日/周/月…
 * 的标题不重名时无所谓先后）；匹配口径与 findHeadingIndex 同款全等。
 */
export function sectionTypeForHeading(
	headingText: string,
	config: QJConfig,
): { type: SectionType; section: JournalSection } | null {
	for (const journal of Object.values(config.journals)) {
		for (const section of journal.sections) {
			if (section.heading.replace(/^#+\s*/, "").trim() === headingText) {
				return { type: section.type, section };
			}
		}
	}
	return null;
}

export type FieldControlKind = "checkin" | "number" | "text";

/**
 * 控件类型：配置命中优先（打卡 → 三段；数据/对比 → 数字框）；现值塞不进控件
 * （打卡区里的非 ✔️/❌ 值、数据区里的非数字）就退文本框，别让控件吞掉现值。
 * 未配置的标题区按当前值启发：✔️/❌ → 三段、纯数字 → 数字框、其余 → 文本框。
 */
export function fieldControlKind(sectionType: SectionType | null, value: string): FieldControlKind {
	if (sectionType === "data" || sectionType === "compare") {
		return value === "" || !Number.isNaN(Number(value)) ? "number" : "text";
	}
	if (sectionType === "checkin") {
		return value === "" || value === BOOL_YES || value === BOOL_NO ? "checkin" : "text";
	}
	if (value === BOOL_YES || value === BOOL_NO) return "checkin";
	if (value !== "" && !Number.isNaN(Number(value))) return "number";
	return "text";
}

export interface OccurrenceEdit {
	matchIndex: number;
	value: string;
}

/**
 * 替换一行里的若干处字段值：按 matchIndex 拼接（不重扫整行重建——行内其余
 * 文字、缩进原样保留）。空值写 `[key::]`，与 renderFieldLine 的空值形态一致。
 * matchIndex 超出该行现有匹配数（行已被改）→ null，由调用方整批拒写。
 */
export function applyFieldOccurrences(raw: string, edits: OccurrenceEdit[]): string | null {
	if (edits.length === 0) return raw;
	const matches = [...raw.matchAll(INLINE_FIELD_RE)];
	const wanted = new Map(edits.map((edit) => [edit.matchIndex, edit.value]));
	for (const index of wanted.keys()) {
		if (index < 0 || index >= matches.length) return null;
	}

	let out = "";
	let cursor = 0;
	for (let i = 0; i < matches.length; i += 1) {
		if (!wanted.has(i)) continue;
		const m = matches[i];
		const start = m.index ?? 0;
		const key = m[1].trim();
		const value = wanted.get(i) ?? "";
		const piece = value === "" ? `[${key}::]` : `[${key}:: ${value}]`;
		out += raw.slice(cursor, start) + piece;
		cursor = start + m[0].length;
	}
	return out + raw.slice(cursor);
}
