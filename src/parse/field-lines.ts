/**
 * 字段行解析（纯函数）。
 * 支持两种形态（现行模板用的是方括号形态）：
 *   - 任务形态：- [key:: value]（value 可空）
 *   - 裸形态：key:: value
 * 键可含 emoji（前缀 💊medicine / 后缀 weight⚖️ 均可）。
 * 代码块、frontmatter、`%%…%%` 注释内的内容不解析。
 */

export interface ParsedFieldLine {
	lineIndex: number;
	key: string;
	value: string;
	/** 原始整行文本 */
	raw: string;
}

const BRACKET_RE = /^\s*[-*]\s*\[([^\][]+?)::\s*(.*?)\]\s*$/;
const BARE_RE = /^\s*(?:[-*]\s+)?([^\s:#[^]][^:\n]*?)::\s*(.*)$/;

/** 解析一行序列，返回命中的字段行（保持行序）。 */
export function parseFieldLines(lines: string[]): ParsedFieldLine[] {
	const out: ParsedFieldLine[] = [];
	let inFence = false;
	let inFrontmatter = false;
	let frontmatterDone = false;

	lines.forEach((line, i) => {
		if (i === 0 && line.trim() === "---") {
			inFrontmatter = true;
			return;
		}
		if (inFrontmatter) {
			if (line.trim() === "---") {
				inFrontmatter = false;
				frontmatterDone = true;
			}
			return;
		}
		if (line.trimStart().startsWith("```")) {
			inFence = !inFence;
			return;
		}
		if (inFence) return;
		if (line.trimStart().startsWith("%%")) return; // 注释行

		const m = BRACKET_RE.exec(line);
		if (m) {
			out.push({ lineIndex: i, key: m[1].trim(), value: m[2].trim(), raw: line });
			return;
		}
		const b = BARE_RE.exec(line);
		if (b) {
			const key = b[1].trim();
			if (key.length > 0) {
				out.push({ lineIndex: i, key, value: b[2].trim(), raw: line });
			}
		}
	});
	void frontmatterDone;
	return out;
}

/** 渲染一个字段行（任务形态，与模板一致；空值输出 `- [key::]`）。 */
export function renderFieldLine(key: string, value: string): string {
	return value === "" ? `- [${key}::]` : `- [${key}:: ${value}]`;
}

/** 找标题行（去首尾空白后全等匹配）。返回行号，未找到返回 -1。 */
export function findHeadingIndex(lines: string[], heading: string): number {
	const target = heading.trim();
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].trim() === target) return i;
	}
	return -1;
}

/** 标题区段范围（headingIndex 之后到下一个标题行之前，不含标题行）。 */
export function sectionRange(lines: string[], headingIndex: number): { start: number; end: number } {
	let end = lines.length;
	for (let i = headingIndex + 1; i < lines.length; i++) {
		if (/^#{1,6}\s/.test(lines[i])) {
			end = i;
			break;
		}
	}
	return { start: headingIndex + 1, end };
}
