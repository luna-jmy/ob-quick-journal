/**
 * 查询块定位（纯函数）：找出笔记里的 dataview / dataviewjs / tasks 代码块。
 * 只定位（类型 + 查询原文），内容解释权归 services 的 bridge（探测 + 降级）。
 */

export type QueryKind = "dataview" | "dataviewjs" | "tasks";

export interface QueryBlock {
	kind: QueryKind;
	code: string;
	source: string; // 所在笔记路径（渲染上下文用）
}

const FENCE_RE = /^```\s*(dataviewjs|dataview|tasks)\s*$/i;

export function findQueryBlocks(text: string, source: string): QueryBlock[] {
	const out: QueryBlock[] = [];
	const lines = text.split(/\r?\n/);
	let kind: QueryKind | null = null;
	let code: string[] = [];
	for (const line of lines) {
		if (kind === null) {
			const m = FENCE_RE.exec(line.trim());
			if (m) {
				kind = m[1].toLowerCase() as QueryKind;
				code = [];
			}
			continue;
		}
		if (line.trim().startsWith("```")) {
			out.push({ kind, code: code.join("\n"), source });
			kind = null;
			continue;
		}
		code.push(line);
	}
	return out;
}

/** 按查询原文去重（多天日志里重复的查询只渲染一次）。 */
export function dedupeQueries(blocks: QueryBlock[], limit = 5): QueryBlock[] {
	const seen = new Set<string>();
	const out: QueryBlock[] = [];
	for (const block of blocks) {
		const key = `${block.kind}::${block.code}`;
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(block);
		if (out.length >= limit) break;
	}
	return out;
}
