/**
 * 标题区内容条目抽取（纯函数）：把某天笔记里「开启汇总面板」的标题区内容
 * 拆成速记面板的流条目——
 * - list 标题区：区段内的列表行（含任务行，带状态符号）逐条成流；
 * - text 标题区：区段内有值的内联字段逐条成流（label: 值）。
 * 代码块、注释行不参与。
 */

import type { JournalSection } from "../types";
import { findHeadingIndex, sectionRange } from "./field-lines";

export interface SectionEntry {
	/** 所属日志日（YYYY-MM-DD） */
	date: string;
	sectionId: string;
	kind: "line" | "field" | "paragraph";
	/** field 条目的展示名 */
	label?: string;
	/** 记录时间（内容前缀的 HH:mm，开启自动时间戳时有） */
	time?: string;
	/** 正文（任务行已带状态符号前缀；段落为整段） */
	text: string;
	/** 可编辑内容（line：去掉列表标记与时间戳；field/paragraph：同 text） */
	content?: string;
	/** 源行号（line/field 有；paragraph 无） */
	lineIndex?: number;
	/** 源行原文（写回前的过期校验用） */
	raw?: string;
	/** line：列表标记前缀（`- ` / `- [ ] ` 等，重建行时拼回） */
	prefix?: string;
	/** field：字段键 */
	key?: string;
}

const BRACKET_FIELD_RE = /^\s*[-*]\s*\[([^\][]+?)::\s*(.*?)\]\s*$/;
const LIST_ITEM_RE = /^\s*[-*]\s+(.*)$/;
const TASK_ITEM_RE = /^\s*[-*]\s+\[([ xX/-])\]\s*(.*)$/;
const TIMESTAMP_RE = /^(\d{1,2}:\d{2})(?::\d{2})?\s+/;

/** 剥离内容前的 HH:mm 时间戳（开启自动时间戳的写入带它）。 */
function splitTimestamp(text: string): { time?: string; text: string } {
	const m = TIMESTAMP_RE.exec(text);
	if (!m) return { text };
	return { time: m[1], text: text.slice(m[0].length) };
}

function taskPrefix(status: string): string {
	if (status === " ") return "☐";
	if (status === "x" || status === "X") return "☑";
	if (status === "-") return "✕";
	return "◐"; // 进行中（/ 等自定义符号）
}

/** 单日笔记 → 流条目（只处理传入的 sections；heading 缺失的区段自然无条目）。 */
export function collectEntries(
	date: string,
	lines: string[],
	sections: JournalSection[],
): SectionEntry[] {
	const out: SectionEntry[] = [];
	for (const section of sections) {
		const headingIndex = findHeadingIndex(lines, section.heading);
		if (headingIndex < 0) continue;
		const { start, end } = sectionRange(lines, headingIndex);
		let inFence = false;

		if (section.type === "paragraph") {
			// 一天一条：区段内的非空正文行合成一个条目（跳过代码块与注释）
			const content: string[] = [];
			for (let i = start; i < end; i++) {
				const line = lines[i];
				if (line.trimStart().startsWith("```")) {
					inFence = !inFence;
					continue;
				}
				if (inFence) continue;
				if (line.trimStart().startsWith("%%")) continue;
				if (line.trim() !== "") content.push(line.trim());
			}
			if (content.length === 0) continue;
			const joined = content.join("\n");
			const ts = splitTimestamp(joined);
			out.push({ date, sectionId: section.id, kind: "paragraph", ...ts });
			continue;
		}

		for (let i = start; i < end; i++) {
			const line = lines[i];
			if (line.trimStart().startsWith("```")) {
				inFence = !inFence;
				continue;
			}
			if (inFence) continue;
			if (line.trimStart().startsWith("%%")) continue;

			const field = BRACKET_FIELD_RE.exec(line);
			if (field) {
				if (section.type !== "text") continue;
				const value = field[2].trim();
				if (value === "") continue;
				const def = section.fields.find((f) => f.key === field[1].trim());
				out.push({
					date,
					sectionId: section.id,
					kind: "field",
					label: def?.label ?? field[1].trim(),
					text: value,
					content: value,
					key: field[1].trim(),
					lineIndex: i,
					raw: line,
				});
				continue;
			}
			if (section.type !== "list") continue;
			const task = TASK_ITEM_RE.exec(line);
			if (task) {
				if (task[2].trim() === "") continue;
				const ts = splitTimestamp(task[2].trim());
				out.push({
					date,
					sectionId: section.id,
					kind: "line",
					...ts,
					text: `${taskPrefix(task[1])} ${ts.text}`,
					content: ts.text,
					prefix: line.slice(0, line.length - task[2].length),
					lineIndex: i,
					raw: line,
				});
				continue;
			}
			const item = LIST_ITEM_RE.exec(line);
			if (item && item[1].trim() !== "") {
				const ts = splitTimestamp(item[1].trim());
				out.push({
					date,
					sectionId: section.id,
					kind: "line",
					...ts,
					content: ts.text,
					text: ts.text,
					prefix: line.slice(0, line.length - item[1].length),
					lineIndex: i,
					raw: line,
				});
			}
		}
	}
	return out;
}
