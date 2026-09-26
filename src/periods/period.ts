/**
 * 期间模型（纯函数）：周（ISO 周，周一起始）/ 月 / 年。
 * 期间键与现行体系一致：2026-W39 / 2026-09 / 2026。
 * 全部使用本地日期（与 vault 文件名口径一致），ISO 周算法内部用 UTC 技巧但不影响输入口径。
 */

export type PeriodKind = "week" | "month" | "year";

export interface Period {
	kind: PeriodKind;
	key: string;
	/** 期间首日（周一 / 1 号 / 1 月 1 日） */
	start: Date;
	/** 期间逐日列表（本地日期） */
	days: Date[];
}

export function dateKey(d: Date): string {
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${d.getFullYear()}-${m}-${day}`;
}

/** ISO 周（周四算法）：返回该日期所属 ISO 年与周号。 */
export function isoWeekOf(d: Date): { year: number; week: number } {
	const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
	const dayNum = date.getUTCDay() || 7; // 周一=1 … 周日=7
	date.setUTCDate(date.getUTCDate() + 4 - dayNum); // 本周的周四
	const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
	const week = Math.ceil(((date.getTime() - yearStart) / 86400000 + 1) / 7);
	return { year: date.getUTCFullYear(), week };
}

/** 某 ISO 年某周的周一。 */
export function mondayOfIsoWeek(year: number, week: number): Date {
	const jan4 = new Date(year, 0, 4);
	const jan4Day = (jan4.getDay() + 6) % 7; // 周一=0
	const week1Monday = new Date(year, 0, 4 - jan4Day);
	const monday = new Date(week1Monday);
	monday.setDate(monday.getDate() + (week - 1) * 7);
	return monday;
}

function addDays(d: Date, n: number): Date {
	const out = new Date(d);
	out.setDate(out.getDate() + n);
	return out;
}

function daysInMonth(year: number, month1: number): number {
	return new Date(year, month1 + 1, 0).getDate();
}

export function weekKey(d: Date): string {
	const { year, week } = isoWeekOf(d);
	return `${year}-W${String(week).padStart(2, "0")}`;
}

export function monthKey(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function yearKey(d: Date): string {
	return String(d.getFullYear());
}

export function periodOf(kind: PeriodKind, d: Date): Period {
	if (kind === "week") {
		const { year, week } = isoWeekOf(d);
		const start = mondayOfIsoWeek(year, week);
		const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
		return { kind, key: `${year}-W${String(week).padStart(2, "0")}`, start, days };
	}
	if (kind === "month") {
		const start = new Date(d.getFullYear(), d.getMonth(), 1);
		const n = daysInMonth(d.getFullYear(), d.getMonth());
		const days = Array.from({ length: n }, (_, i) => addDays(start, i));
		return { kind, key: monthKey(d), start, days };
	}
	const start = new Date(d.getFullYear(), 0, 1);
	const end = new Date(d.getFullYear(), 11, 31);
	const days: Date[] = [];
	for (let cur = start; cur <= end; cur = addDays(cur, 1)) days.push(new Date(cur));
	return { kind, key: yearKey(d), start, days };
}

/** 期间键 → 期间（"2026-W39" / "2026-09" / "2026"）。解析失败返回 null。 */
export function periodFromKey(key: string): Period | null {
	const w = /^(\d{4})-W(\d{2})$/.exec(key);
	if (w) {
		const year = Number(w[1]);
		const week = Number(w[2]);
		if (week < 1 || week > 53) return null;
		const start = mondayOfIsoWeek(year, week);
		return periodOf("week", start);
	}
	const m = /^(\d{4})-(\d{2})$/.exec(key);
	if (m) return periodOf("month", new Date(Number(m[1]), Number(m[2]) - 1, 1));
	const y = /^(\d{4})$/.exec(key);
	if (y) return periodOf("year", new Date(Number(y[1]), 0, 1));
	return null;
}

/** 上一期 / 下一期（同类型）。 */
export function shiftPeriod(period: Period, step: number): Period {
	if (period.kind === "week") {
		return periodOf("week", addDays(period.start, step * 7));
	}
	if (period.kind === "month") {
		const d = new Date(period.start.getFullYear(), period.start.getMonth() + step, 1);
		return periodOf("month", d);
	}
	return periodOf("year", new Date(period.start.getFullYear() + step, 0, 1));
}

/** 从笔记文件名解析期间归属：daily(YYYY-MM-DD) / weekly(YYYY-Www) / monthly(YYYY-MM) / annual(YYYY)。 */
export function parseNoteDateKind(name: string): { kind: PeriodKind | "day"; key: string } | null {
	const base = name.replace(/\.md$/i, "");
	if (/^\d{4}-\d{2}-\d{2}$/.test(base)) return { kind: "day", key: base };
	if (/^\d{4}-W\d{2}$/.test(base)) return { kind: "week", key: base };
	if (/^\d{4}-\d{2}$/.test(base)) return { kind: "month", key: base };
	if (/^\d{4}$/.test(base)) return { kind: "year", key: base };
	return null;
}

/**
 * moment 风格的文件名格式（纯函数，语法子集与 moment 一致）：
 * 支持 YYYY YY MM M DD D ww w（ww = ISO 周）与 [字面量]；其余字符原样输出。
 * 文档：https://momentjs.com/docs/#/displaying/format/
 */
export function formatTokens(d: Date, fmt: string): string {
	const { week } = isoWeekOf(d);
	const pad2 = (n: number) => String(n).padStart(2, "0");
	let out = "";
	let i = 0;
	while (i < fmt.length) {
		if (fmt[i] === "[") {
			const end = fmt.indexOf("]", i);
			if (end === -1) {
				out += fmt.slice(i + 1);
				break;
			}
			out += fmt.slice(i + 1, end);
			i = end + 1;
			continue;
		}
		if (fmt.startsWith("YYYY", i)) {
			out += String(d.getFullYear());
			i += 4;
			continue;
		}
		if (fmt.startsWith("YY", i)) {
			out += String(d.getFullYear()).slice(2);
			i += 2;
			continue;
		}
		if (fmt.startsWith("MM", i)) {
			out += pad2(d.getMonth() + 1);
			i += 2;
			continue;
		}
		if (fmt.startsWith("DD", i)) {
			out += pad2(d.getDate());
			i += 2;
			continue;
		}
		if (fmt.startsWith("ww", i)) {
			out += pad2(week);
			i += 2;
			continue;
		}
		if (fmt[i] === "M") {
			out += String(d.getMonth() + 1);
			i++;
			continue;
		}
		if (fmt[i] === "D") {
			out += String(d.getDate());
			i++;
			continue;
		}
		if (fmt[i] === "w") {
			out += String(week);
			i++;
			continue;
		}
		out += fmt[i];
		i++;
	}
	return out;
}
