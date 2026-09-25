import { describe, expect, it } from "vitest";
import {
	dateKey,
	isoWeekOf,
	mondayOfIsoWeek,
	periodFromKey,
	periodOf,
	shiftPeriod,
	weekKey,
} from "../src/periods/period";

describe("ISO 周", () => {
	it("已知日期的周键（2026-01-01 周四 → W01；2026-12-28 → W53）", () => {
		expect(weekKey(new Date(2026, 0, 1))).toBe("2026-W01");
		expect(weekKey(new Date(2026, 11, 28))).toBe("2026-W53");
		// 2025-12-29 周一属于 2026-W01（ISO 年界）
		expect(weekKey(new Date(2025, 11, 29))).toBe("2026-W01");
	});

	it("mondayOfIsoWeek 与 isoWeekOf 互逆", () => {
		for (const d of [new Date(2026, 0, 1), new Date(2026, 8, 25), new Date(2025, 11, 29)]) {
			const { year, week } = isoWeekOf(d);
			const monday = mondayOfIsoWeek(year, week);
			expect(monday.getDay()).toBe(1); // 周一
			expect(dateKey(monday) <= dateKey(d)).toBe(true);
			expect(weekKey(monday)).toBe(weekKey(d));
		}
	});
});

describe("期间模型", () => {
	it("周期间 = 周一起 7 天", () => {
		const p = periodOf("week", new Date(2026, 8, 25)); // 2026-09-25 周五
		expect(p.key).toBe("2026-W39");
		expect(p.days).toHaveLength(7);
		expect(p.days[0].getDay()).toBe(1);
		expect(dateKey(p.days[0])).toBe("2026-09-21");
	});

	it("月 / 年期间", () => {
		const m = periodOf("month", new Date(2026, 1, 10));
		expect(m.key).toBe("2026-02");
		expect(m.days).toHaveLength(28);
		const y = periodOf("year", new Date(2026, 5, 1));
		expect(y.key).toBe("2026");
		expect(y.days).toHaveLength(365);
	});

	it("periodFromKey 与 shiftPeriod", () => {
		const p = periodFromKey("2026-W39");
		expect(p?.key).toBe("2026-W39");
		expect(periodFromKey("2026-09")?.days[0].getMonth()).toBe(8);
		expect(periodFromKey("2026")?.days[0].getMonth()).toBe(0);
		expect(periodFromKey("bad")).toBeNull();

		const next = shiftPeriod(p!, 1);
		expect(next.key).toBe("2026-W40");
		const prev = shiftPeriod(p!, -1);
		expect(prev.key).toBe("2026-W38");
		// 跨年周
		const w53 = periodOf("week", new Date(2026, 11, 28));
		expect(shiftPeriod(w53, 1).key).toBe("2027-W01");
	});
});
