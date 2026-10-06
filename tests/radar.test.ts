import { describe, expect, it } from "vitest";
import type { JournalSection } from "../src/types";
import { mergeConfig, sectionFieldKeys } from "../src/types";
import { compareVectors, radarGeometry, radarRenderable } from "../src/metrics/radar";

/** 用户的生命之轮形态：单标题区，字段 = 维度基础键，系列 🎯 / 🏆 拼在键尾。 */
const WHEEL: JournalSection = {
	id: "wheel",
	heading: "### 🎯 生命之轮年度评分",
	type: "compare",
	fields: [
		{ key: "PersonalGrowth", label: "个人成长" },
		{ key: "HealthFitness", label: "健康健身" },
		{ key: "LoveRelationships", label: "爱与关系" },
		{ key: "CareerWork", label: "事业工作" },
	],
	compare: {
		series: [
			{ marker: "🎯", label: "年初目标" },
			{ marker: "🏆", label: "年底复盘" },
		],
	},
};

describe("sectionFieldKeys（compare 键展开）", () => {
	it("compare 展开为 基础键+系列标记（两系列）；其余类型即字段键", () => {
		expect(sectionFieldKeys(WHEEL)).toEqual([
			"PersonalGrowth🎯",
			"HealthFitness🎯",
			"LoveRelationships🎯",
			"CareerWork🎯",
			"PersonalGrowth🏆",
			"HealthFitness🏆",
			"LoveRelationships🏆",
			"CareerWork🏆",
		]);
		expect(
			sectionFieldKeys({ ...WHEEL, type: "data", compare: undefined }),
		).toEqual(WHEEL.fields.map((f) => f.key));
	});

	it("compare 缺系列配置时回落基础键（手改 data.json 的兜底）", () => {
		expect(sectionFieldKeys({ ...WHEEL, compare: undefined })).toEqual(
			WHEEL.fields.map((f) => f.key),
		);
	});
});

describe("compareVectors（笔记字段值 → 数值向量）", () => {
	it("键 = 基础键+标记；缺失 / 空串 / 非数值 → null", () => {
		const vectors = compareVectors(WHEEL, {
			"PersonalGrowth🎯": "7",
			"HealthFitness🎯": "6",
			"LoveRelationships🎯": "", // 预建未填
			"CareerWork🎯": "abc", // 非数值
			"PersonalGrowth🏆": "8",
			"CareerWork🏆": "9",
		});
		expect(vectors).toHaveLength(2);
		expect(vectors[0]).toMatchObject({ marker: "🎯", label: "年初目标" });
		expect(vectors[0].values).toEqual([7, 6, null, null]);
		expect(vectors[1].values).toEqual([8, null, null, 9]);
	});

	it("无系列配置 → 空向量", () => {
		expect(compareVectors({ ...WHEEL, compare: undefined }, {})).toEqual([]);
	});
});

describe("radarGeometry（几何计算）", () => {
	it("刻度上限 = max(10, 实测最大)；环 / 辐条 / 标签数 = 维度数", () => {
		const dims = ["A", "B", "C", "D"];
		const geo = radarGeometry(dims, [
			{ marker: "🎯", label: "一", values: [7, 6, 8, 5] },
			{ marker: "🏆", label: "二", values: [8, null, 9, null] },
		]);
		expect(geo.scaleMax).toBe(10);
		expect(geo.rings).toHaveLength(2);
		expect(geo.spokes).toHaveLength(4);
		expect(geo.labels.map((l) => l.text)).toEqual(dims);
		// 缺失维度不进多边形：系列一 4 点、系列二 2 点
		expect(geo.series[0].points).toHaveLength(4);
		expect(geo.series[1].points).toHaveLength(2);

		const over = radarGeometry(dims, [
			{ marker: "🎯", label: "一", values: [12, 6, 8, 5] },
			{ marker: "🏆", label: "二", values: [null, null, null, null] },
		]);
		expect(over.scaleMax).toBe(12);
	});

	it("顶点落在辐条方向上：首维在正上方，满刻度值到外环", () => {
		const geo = radarGeometry(["A", "B", "C"], [
			{ marker: "🎯", label: "一", values: [10, 0, 5] },
			{ marker: "🏆", label: "二", values: [null, null, null] },
		]);
		const cx = geo.size / 2;
		const cy = geo.size / 2;
		const outer = geo.rings[1].split(" ").map((p) => p.split(",").map(Number));
		// 首维顶点 = 外环第一个点（正上方，x = cx，y < cy）
		expect(geo.series[0].points[0].x).toBeCloseTo(outer[0][0], 0);
		expect(geo.series[0].points[0].y).toBeCloseTo(outer[0][1], 0);
		expect(geo.series[0].points[0].x).toBeCloseTo(cx, 0);
		expect(geo.series[0].points[0].y).toBeLessThan(cy);
		// 0 值顶点收缩到圆心
		expect(geo.series[0].points[1].x).toBeCloseTo(cx, 0);
		expect(geo.series[0].points[1].y).toBeCloseTo(cy, 0);
		// 0 值也带点（有值就画）
		expect(geo.series[0].points).toHaveLength(3);
	});
});

describe("radarRenderable（降级判定）", () => {
	it("维度 < 3 或全部无值 → 不画", () => {
		expect(radarRenderable([{ marker: "🎯", label: "一", values: [1, 2] }], ["A", "B"])).toBe(
			false,
		);
		expect(
			radarRenderable(
				[
					{ marker: "🎯", label: "一", values: [null, null, null] },
					{ marker: "🏆", label: "二", values: [null, null, null] },
				],
				["A", "B", "C"],
			),
		).toBe(false);
	});

	it("任一系列有值即可画（年初只填 🎯 的场景）", () => {
		expect(
			radarRenderable(
				[
					{ marker: "🎯", label: "一", values: [1, 2, 3] },
					{ marker: "🏆", label: "二", values: [null, null, null] },
				],
				["A", "B", "C"],
			),
		).toBe(true);
	});
});

describe("config 清洗（compare 系列）", () => {
	it("合法系列保留：marker 去空白、label 空回退 marker", () => {
		const merged = mergeConfig({
			journals: {
				annual: {
					dir: "500 Journal/510 Annual",
					filenameFormat: "YYYY",
					sections: [
						{
							id: "wheel",
							heading: "### 生命之轮",
							type: "compare",
							fields: [{ key: "Growth", label: "成长" }],
							compare: {
								series: [
									{ marker: " 🎯 ", label: "" },
									{ marker: "🏆", label: "复盘" },
								],
							},
						},
					],
				},
			},
		});
		const section = merged.journals.annual.sections.find((s) => s.id === "wheel")!;
		expect(section.compare?.series).toEqual([
			{ marker: "🎯", label: "🎯" },
			{ marker: "🏆", label: "复盘" },
		]);
	});

	it("系列数量不是两条 → 丢弃配置（sectionFieldKeys 回落基础键）", () => {
		const merged = mergeConfig({
			journals: {
				annual: {
					sections: [
						{
							id: "wheel",
							heading: "### 生命之轮",
							type: "compare",
							fields: [{ key: "Growth", label: "成长" }],
							compare: { series: [{ marker: "🎯", label: "一" }] },
						},
					],
				},
			},
		});
		const section = merged.journals.annual.sections.find((s) => s.id === "wheel")!;
		expect(section.compare).toBeUndefined();
		expect(sectionFieldKeys(section)).toEqual(["Growth"]);
	});

	it("默认布局包含雷达图，存量布局自动补齐", () => {
		const merged = mergeConfig({ summaryLayout: ["task-chart"] });
		expect(merged.summaryLayout).toContain("radar");
	});
});
