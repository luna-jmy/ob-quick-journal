/**
 * 对比雷达图的取数与几何（纯函数，零 DOM、不 import obsidian）。
 * 取数：对比区两个系列 × 维度基础键 → 数值向量（缺失 / 非数值 = null）。
 * 几何：N 维辐条 + 网格环 + 各系列多边形顶点，刻度上限 = max(10, 实测最大)
 *（0-10 评分场景天然满刻度，更大数值自适应）。
 */

import type { JournalSection } from "../types";

export interface CompareVector {
	marker: string;
	label: string;
	/** 与维度等长；缺失 / 非数值为 null */
	values: (number | null)[];
}

/** 从笔记字段值（全键 → 原文）取两个系列的数值向量；键 = 基础键 + 系列标记。 */
export function compareVectors(
	section: JournalSection,
	fieldValues: Record<string, string>,
): CompareVector[] {
	const series = section.compare?.series;
	if (!series) return [];
	return series.map((s) => ({
		marker: s.marker,
		label: s.label,
		values: section.fields.map((f) => {
			const raw = fieldValues[`${f.key}${s.marker}`];
			if (raw === undefined || raw.trim() === "") return null;
			const n = Number(raw);
			return Number.isFinite(n) ? n : null;
		}),
	}));
}

export interface RadarPoint {
	x: number;
	y: number;
	/** 该顶点的数值（只含有值的维度） */
	v: number;
	/** 维度展示名（顶点提示用） */
	dim: string;
}

export interface RadarSeriesGeom {
	marker: string;
	label: string;
	points: RadarPoint[];
}

export interface RadarGeometry {
	size: number;
	/** 刻度上限（max(10, 实测最大)） */
	scaleMax: number;
	dims: string[];
	/** 网格环多边形点串（内 → 外） */
	rings: string[];
	spokes: { x1: number; y1: number; x2: number; y2: number }[];
	labels: { text: string; x: string; y: string; anchor: "start" | "middle" | "end" }[];
	series: RadarSeriesGeom[];
}

const LABEL_MAX = 10;

function truncate(text: string): string {
	return text.length > LABEL_MAX ? `${text.slice(0, LABEL_MAX)}…` : text;
}

/** 雷达几何：维度数 N ≥ 3 才成图（< 3 维由调用方自行降级提示）。 */
export function radarGeometry(
	dims: string[],
	vectors: CompareVector[],
	size = 220,
): RadarGeometry {
	const cx = size / 2;
	const cy = size / 2;
	const radius = size * 0.355; // 半径留出标签空间（size 220 → 78）
	const labelRadius = size * 0.435;
	const n = dims.length;
	const angleOf = (i: number): number => -Math.PI / 2 + (2 * Math.PI * i) / n;
	const pointAt = (i: number, r: number): { x: number; y: number } => ({
		x: cx + r * Math.cos(angleOf(i)),
		y: cy + r * Math.sin(angleOf(i)),
	});

	const flat = vectors.flatMap((v) => v.values.filter((x): x is number => x !== null));
	const scaleMax = Math.max(10, ...flat);

	const ringPolygon = (ratio: number): string =>
		Array.from({ length: n }, (_, i) => {
			const p = pointAt(i, radius * ratio);
			return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
		}).join(" ");

	const spokes = Array.from({ length: n }, (_, i) => {
		const p = pointAt(i, radius);
		return { x1: cx, y1: cy, x2: p.x, y2: p.y };
	});

	const labels = dims.map((dim, i) => {
		const a = angleOf(i);
		const x = cx + labelRadius * Math.cos(a);
		const y = cy + labelRadius * Math.sin(a);
		const cos = Math.cos(a);
		const sin = Math.sin(a);
		const anchor: "start" | "middle" | "end" =
			Math.abs(cos) < 0.35 ? "middle" : cos > 0 ? "start" : "end";
		return {
			text: truncate(dim),
			x: x.toFixed(1),
			y: (y + (sin > 0.5 ? 4 : sin < -0.5 ? -2 : 1)).toFixed(1),
			anchor,
		};
	});

	const series: RadarSeriesGeom[] = vectors.map((v) => ({
		marker: v.marker,
		label: v.label,
		points: v.values
			.map((value, i) => ({ value, i }))
			.filter((x): x is { value: number; i: number } => x.value !== null)
			.map(({ value, i }) => {
				const p = pointAt(i, (radius * value) / scaleMax);
				return { x: Number(p.x.toFixed(1)), y: Number(p.y.toFixed(1)), v: value, dim: dims[i] ?? "" };
			}),
	}));

	return { size, scaleMax, dims, rings: [ringPolygon(0.5), ringPolygon(1)], spokes, labels, series };
}

/** 维度数 ≥ 3 且至少一个系列有值才画图（调用方判定降级文案）。 */
export function radarRenderable(vectors: CompareVector[], dims: string[]): boolean {
	if (dims.length < 3) return false;
	return vectors.some((v) => v.values.some((x) => x !== null));
}
