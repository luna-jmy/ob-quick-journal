/**
 * 从笔记内容自动识别标题区（纯函数）：每个标题 → 区段内的内联字段键。
 * 用于设置里的「从模板识别」：有字段的区段按启发式给类型，没字段的区段做列表。
 * 代码块、frontmatter、注释内的内容不参与识别。
 */

import type { JournalSection, SectionType } from "../types";

export interface DetectedSection {
	heading: string;
	fieldKeys: string[];
}

const HEADING_RE = /^#{1,6}\s/;
const FIELD_RE = /^\s*[-*]\s*\[([^\][]+?)::\s*(.*?)\]\s*$/;

export function detectSections(text: string): DetectedSection[] {
	const lines = text.split(/\r?\n/);
	const out: DetectedSection[] = [];
	let inFence = false;
	let inFrontmatter = false;
	let current: DetectedSection | null = null;

	lines.forEach((line) => {
		if (line.trim() === "---" && !inFence && (out.length === 0 && !current || inFrontmatter)) {
			// frontmatter 起止（只在文件头）
			if (!inFrontmatter && lines.indexOf(line) === 0) {
				inFrontmatter = true;
			} else if (inFrontmatter) {
				inFrontmatter = false;
			}
			return;
		}
		if (line.trimStart().startsWith("```")) {
			inFence = !inFence;
			return;
		}
		if (inFence || inFrontmatter) return;

		if (HEADING_RE.test(line)) {
			current = { heading: line.trim(), fieldKeys: [] };
			out.push(current);
			return;
		}
		if (!current) return;
		const m = FIELD_RE.exec(line);
		if (m) {
			const key = m[1].trim();
			if (key !== "" && !current.fieldKeys.includes(key)) current.fieldKeys.push(key);
		}
	});
	return out;
}

/** 类型启发式：标题文案 + 有无字段。 */
export function suggestType(heading: string, fieldCount: number): SectionType {
	if (fieldCount === 0) return "list";
	if (/打卡/.test(heading)) return "checkin";
	if (/数据|记录/.test(heading)) return "data";
	return "text";
}

// 注意：变体选择符（FE0F）与零宽连接符（200D）是组合字符，进字符类会被
// no-misleading-character-class 拒绝——单独逐个替换/比较。
const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/gu;
// 单码点判断用非全局副本（/g 的 .test 带 lastIndex 状态，复用会漏判）
const EMOJI_CHAR_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;

/** 自动识别的默认展示名：去掉 emoji（含 ZWJ 组合）与空白后的键；全空则回退原键。 */
export function defaultLabel(key: string): string {
	const cleaned = key
		.replace(EMOJI_RE, "")
		.replace(/‍/g, "")
		.replace(/️/g, "")
		.trim();
	return cleaned !== "" ? cleaned : key;
}

/**
 * 拆出键尾部的 emoji 后缀（对比系列的标记）：`PersonalGrowth🎯` → base + marker。
 * 尾部没有 emoji、或整个键都是 emoji → null（FE0F/ZWJ 用相等比较，不进字符类）。
 */
export function splitTrailingEmoji(key: string): { base: string; marker: string } | null {
	const isEmojiCp = (cp: string): boolean =>
		EMOJI_CHAR_RE.test(cp) || cp === "\u{FE0F}" || cp === "\u{200D}";
	const cps = Array.from(key);
	let i = cps.length;
	while (i > 0 && isEmojiCp(cps[i - 1] ?? "")) i--;
	if (i === 0 || i === cps.length) return null;
	const base = cps.slice(0, i).join("").trim();
	if (base === "") return null;
	return { base, marker: cps.slice(i).join("") };
}

/**
 * 对比区配对判定：全部字段键都拆成「基础键 + 后缀」，每个基础键恰好两个后缀、
 * 且所有基础键的后缀组合一致（同样的两个，按首现序）→ 对比区；否则 null。
 */
export function compareFromKeys(
	keys: string[],
): { bases: string[]; markers: [string, string] } | null {
	if (keys.length < 4) return null;
	const splits = keys.map(splitTrailingEmoji);
	if (splits.some((s) => s === null)) return null;

	const markerOrder: string[] = [];
	const byBase = new Map<string, string[]>();
	for (const s of splits) {
		if (s === null) return null;
		const markers = byBase.get(s.base) ?? [];
		if (!markers.includes(s.marker)) markers.push(s.marker);
		byBase.set(s.base, markers);
		if (!markerOrder.includes(s.marker)) markerOrder.push(s.marker);
	}
	if (markerOrder.length !== 2) return null;
	for (const markers of byBase.values()) {
		if (markers.length !== 2 || markers.some((m) => !markerOrder.includes(m))) return null;
	}
	return { bases: [...byBase.keys()], markers: [markerOrder[0], markerOrder[1]] };
}

/** 识别结果 → 标题区配置（id 用序号生成，稳定存进 config 后不再变）。 */
export function detectedToSections(detected: DetectedSection[]): JournalSection[] {
	return detected.map((d, i) => {
		// 配对成功（每个基础键恰好同两个 emoji 后缀）→ 对比区；否则按标题启发式
		const paired = compareFromKeys(d.fieldKeys);
		if (paired !== null) {
			return {
				id: `sec-${i + 1}`,
				heading: d.heading,
				type: "compare",
				fields: paired.bases.map((base) => ({ key: base, label: defaultLabel(base) })),
				compare: {
					series: [
						{ marker: paired.markers[0], label: paired.markers[0] },
						{ marker: paired.markers[1], label: paired.markers[1] },
					],
				},
			};
		}
		const type = suggestType(d.heading, d.fieldKeys.length);
		return {
			id: `sec-${i + 1}`,
			heading: d.heading,
			type,
			fields: d.fieldKeys.map((key) => ({ key, label: defaultLabel(key) })),
			...(type === "list" ? { lineTemplate: "- {{value}}" } : {}),
		};
	});
}
