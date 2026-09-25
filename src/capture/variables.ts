/**
 * 目标路径变量替换（纯函数）：{{date}}、{{date:FORMAT}}、{{week}}、{{month}}、{{year}}。
 */

import { dateKey, isoWeekOf, weekKey, monthKey, yearKey } from "../periods/period";

/** FORMAT 仅支持 YYYY / YY / MM / DD 的简单组合（原型够用，不引 moment）。 */
function formatDate(d: Date, format: string): string {
	return format
		.replaceAll("YYYY", String(d.getFullYear()))
		.replaceAll("YY", String(d.getFullYear()).slice(2))
		.replaceAll("MM", String(d.getMonth() + 1).padStart(2, "0"))
		.replaceAll("DD", String(d.getDate()).padStart(2, "0"));
}

export function renderTemplate(template: string, now: Date): string {
	const { year, week } = isoWeekOf(now);
	return template
		.replaceAll("{{date:YYYY-MM-DD}}", dateKey(now))
		.replaceAll("{{week}}", `${year}-W${String(week).padStart(2, "0")}`)
		.replaceAll("{{month}}", monthKey(now))
		.replaceAll("{{year}}", yearKey(now))
		.replaceAll("{{weekKey}}", weekKey(now))
		.replace(/\{\{date:([^}]+)\}\}/g, (_all: string, fmt: string) => formatDate(now, fmt))
		.replaceAll("{{date}}", dateKey(now));
}

/** 目标笔记完整路径（目录 + 文件名，规范化由调用方 normalizePath）。 */
export function targetNotePath(dir: string, fileTemplate: string, now: Date): string {
	const name = renderTemplate(fileTemplate, now);
	return `${dir.replace(/\/+$/, "")}/${name}.md`;
}
