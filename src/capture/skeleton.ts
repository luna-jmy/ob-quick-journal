/**
 * 日志骨架生成（纯函数）：目标笔记不存在时，按标题区配置生成含空值字段行的骨架。
 * 与现行 TPL-Daily 同构（frontmatter 字段、标题、字段行形态），不带查询块与按钮
 * ——那些归用户模板/Templater；骨架只保证「捕获与统计开箱即用」。
 */

import type { JournalSection } from "../types";
import { renderFieldLine } from "../parse/field-lines";
import { dateKey } from "../periods/period";

export function dailySkeleton(date: Date, sections: JournalSection[]): string {
	const day = dateKey(date);
	const lines: string[] = [
		"---",
		"journal: Daily",
		`journal-date: ${day}`,
		"type: daily_log",
		`created: ${day}`,
		"tags:",
		"  - journal/daily",
		"---",
		"",
		`# ${day} 日志`,
		"",
	];
	for (const section of sections) {
		lines.push(section.heading, "");
		for (const field of section.fields) lines.push(renderFieldLine(field.key, ""));
		lines.push("");
	}
	return lines.join("\n");
}
