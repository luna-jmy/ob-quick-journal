/**
 * 笔记骨架生成（纯函数）：目标笔记不存在时，按类型与标题区配置生成含空值字段行的骨架。
 * 与现行 TPL-* 同构（frontmatter 字段、标题、字段行形态），不带查询块与按钮。
 */

import type { JournalSection, PeriodType } from "../types";
import { renderFieldLine } from "../parse/field-lines";
import { dateKey, isoWeekOf, mondayOfIsoWeek } from "../periods/period";

function pad2(n: number): string {
	return String(n).padStart(2, "0");
}

/** 各类型的目标笔记文件名：daily=YYYY-MM-DD，weekly=YYYY-Www，monthly=YYYY-MM，annual=YYYY。 */
export function noteKeyFor(type: PeriodType, now: Date): string {
	if (type === "weekly") {
		const { year, week } = isoWeekOf(now);
		return `${year}-W${pad2(week)}`;
	}
	if (type === "monthly") return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
	if (type === "annual") return String(now.getFullYear());
	return dateKey(now);
}

export function skeletonFor(type: PeriodType, now: Date, sections: JournalSection[]): string {
	const day = dateKey(now);
	let frontmatter: string[];
	let title: string;
	if (type === "weekly") {
		const { year, week } = isoWeekOf(now);
		const key = `${year}-W${pad2(week)}`;
		frontmatter = [
			"---",
			"journal: Weekly",
			`journal-date: ${dateKey(mondayOfIsoWeek(year, week))}`,
			"type: weekly_review",
			`year: ${year}`,
			`month: ${pad2(now.getMonth() + 1)}`,
			`week: W${pad2(week)}`,
			`created: ${day}`,
			"tags:",
			"  - journal/weekly",
			"---",
		];
		title = `# ${key} 周日志`;
	} else if (type === "monthly") {
		const key = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
		frontmatter = [
			"---",
			"journal: Monthly",
			`journal-date: ${dateKey(new Date(now.getFullYear(), now.getMonth(), 1))}`,
			"type: monthly_review",
			`year: ${now.getFullYear()}`,
			`month: ${pad2(now.getMonth() + 1)}`,
			`created: ${day}`,
			"tags:",
			"  - journal/monthly",
			"---",
		];
		title = `# ${key} 月度日志`;
	} else if (type === "annual") {
		frontmatter = [
			"---",
			"journal: Annual",
			`journal-date: ${now.getFullYear()}-01-01`,
			"type: annual_review",
			`year: ${now.getFullYear()}`,
			`created: ${day}`,
			"tags:",
			"  - journal/annual",
			"---",
		];
		title = `# ${now.getFullYear()} 年度日志`;
	} else {
		frontmatter = [
			"---",
			"journal: Daily",
			`journal-date: ${day}`,
			"type: daily_log",
			`created: ${day}`,
			"tags:",
			"  - journal/daily",
			"---",
		];
		title = `# ${day} 日志`;
	}

	const lines = [...frontmatter, "", title, ""];
	for (const section of sections) {
		lines.push(section.heading, "");
		for (const field of section.fields) lines.push(renderFieldLine(field.key, ""));
		lines.push("");
	}
	return lines.join("\n");
}
