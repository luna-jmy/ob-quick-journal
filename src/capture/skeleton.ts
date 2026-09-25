/**
 * 笔记骨架生成（纯函数）：目标笔记不存在时，按注册表生成含空值字段行的骨架。
 * 与现行 TPL-* 模板同构（frontmatter 字段、标题层级、字段行形态），但不带查询块与按钮
 * ——那些归用户模板/Templater；骨架只保证「捕获与统计开箱即用」。
 */

import type { FieldRegistry, FieldSection } from "../types";
import { renderFieldLine } from "../parse/field-lines";
import { dateKey, isoWeekOf } from "../periods/period";

function sectionBlock(section: FieldSection): string[] {
	const lines = [section.heading, ""];
	for (const f of section.fields) lines.push(renderFieldLine(f.key, ""));
	lines.push("");
	return lines;
}

/** 日日志骨架（YYYY-MM-DD）。 */
export function dailySkeleton(date: Date, registry: FieldRegistry): string {
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
	for (const s of registry.daily) lines.push(...sectionBlock(s));
	lines.push("## 💡 灵感与思考", "");
	return lines.join("\n");
}

/** 周复盘骨架（YYYY-Www）。 */
export function weeklySkeleton(date: Date, registry: FieldRegistry): string {
	const { year, week } = isoWeekOf(date);
	const key = `${year}-W${String(week).padStart(2, "0")}`;
	const monday = dateKey(mondayOfIso(year, week));
	const lines: string[] = [
		"---",
		"journal: Weekly",
		`journal-date: ${monday}`,
		"type: weekly_review",
		`year: ${year}`,
		`month: ${String(date.getMonth() + 1).padStart(2, "0")}`,
		`week: W${String(week).padStart(2, "0")}`,
		`created: ${dateKey(date)}`,
		"tags:",
		"  - journal/weekly",
		"---",
		"",
		`# ${key} 周日志`,
		"",
	];
	for (const s of registry.weekly) lines.push(...sectionBlock(s));
	return lines.join("\n");
}

function mondayOfIso(year: number, week: number): Date {
	const jan4 = new Date(year, 0, 4);
	const jan4Day = (jan4.getDay() + 6) % 7;
	const monday = new Date(year, 0, 4 - jan4Day);
	monday.setDate(monday.getDate() + (week - 1) * 7);
	return monday;
}
