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
	kind: "line" | "field";
	/** field 条目的展示名 */
	label?: string;
	/** 正文（任务行已带状态符号前缀） */
	text: string;
}

const BRACKET_FIELD_RE = /^\s*[-*]\s*\[([^\][]+?)::\s*(.*?)\]\s*$/;
const LIST_ITEM_RE = /^\s*[-*]\s+(.*)$/;
const TASK_ITEM_RE = /^\s*[-*]\s+\[([ xX/-])\]\s*(.*)$/;

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
				});
				continue;
			}
			if (section.type !== "list") continue;
			const task = TASK_ITEM_RE.exec(line);
			if (task) {
				if (task[2].trim() === "") continue;
				out.push({
					date,
					sectionId: section.id,
					kind: "line",
					text: `${taskPrefix(task[1])} ${task[2].trim()}`,
				});
				continue;
			}
			const item = LIST_ITEM_RE.exec(line);
			if (item && item[1].trim() !== "") {
				out.push({ date, sectionId: section.id, kind: "line", text: item[1].trim() });
			}
		}
	}
	return out;
}
