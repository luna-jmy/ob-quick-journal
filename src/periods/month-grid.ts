/**
 * 月历网格（纯函数）：某年某月的周网格（周一起始），前置/后置补 null。
 */

export interface MonthCell {
	date: Date;
	key: string; // YYYY-MM-DD
	inMonth: boolean;
}

function dateKey(d: Date): string {
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${d.getFullYear()}-${m}-${day}`;
}

export function monthGrid(year: number, month0: number): MonthCell[][] {
	const first = new Date(year, month0, 1);
	// 周一起始：把首日回退到本周一
	const offset = (first.getDay() + 6) % 7;
	const start = new Date(year, month0, 1 - offset);
	const weeks: MonthCell[][] = [];
	const cursor = new Date(start);
	while (true) {
		const week: MonthCell[] = [];
		for (let i = 0; i < 7; i++) {
			week.push({
				date: new Date(cursor),
				key: dateKey(cursor),
				inMonth: cursor.getMonth() === month0,
			});
			cursor.setDate(cursor.getDate() + 1);
		}
		weeks.push(week);
		if (cursor.getMonth() !== month0 && cursor.getDay() === 1) break;
		if (weeks.length >= 6) break; // 一个月最多跨 6 周
	}
	return weeks;
}
