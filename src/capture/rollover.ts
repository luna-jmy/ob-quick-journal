/**
 * 未完成任务滚动（纯函数）：提取日志里的未完成任务块并从源文本移除。
 * 语义对齐 journal_tasks_rolling.js（ref-ob-templates）：
 * - 未完成标记可配置（默认空格 + `>`，与脚本一致），支持任意多个勾选框字符；
 * - 任务块 = 任务行 + 其后紧随的缩进行/空行（子清单一起走），遇标题或非缩进行停；
 * - 删除后折叠连续空行。
 * 与脚本的差异：不整段搬「只含任务的标题区」，只搬独立任务块（不动标题，避免碰
 * 插件管理的标题区）。
 */

export interface TaskBlock {
	/** [start, end) 源文件行号区间 */
	start: number;
	end: number;
	lines: string[];
}

/** 由标记集构建行首匹配函数（标记按字面转义进字符类）。 */
export function openTaskMatcher(markers: string[]): (line: string) => boolean {
	const escaped = markers
		.map((m) => m.replace(/[\\\]^-]/g, "\\$&"))
		.join("");
	const re = new RegExp(`^\\s*-\\s\\[[${escaped}]\\]\\s`);
	return (line: string) => re.test(line);
}

/** 提取全部未完成任务块（保持出现顺序）。 */
export function extractUnfinishedBlocks(lines: string[], markers: string[]): TaskBlock[] {
	const isOpenTask = openTaskMatcher(markers);
	const blocks: TaskBlock[] = [];
	let i = 0;
	while (i < lines.length) {
		if (!isOpenTask(lines[i])) {
			i++;
			continue;
		}
		const start = i;
		const blockLines = [lines[i]];
		let j = i + 1;
		while (j < lines.length) {
			const next = lines[j];
			if (next.trim() === "") {
				// 空行：只有后面还有缩进行时才并入块（避免吞掉区段尾部空行）
				const look = j + 1;
				if (look < lines.length && /^\s+\S/.test(lines[look])) {
					blockLines.push(next, lines[look]);
					j = look + 1;
					continue;
				}
				break;
			}
			if (/^\s+\S/.test(next)) {
				blockLines.push(next);
				j++;
				continue;
			}
			break;
		}
		blocks.push({ start, end: j, lines: [...blockLines] });
		i = j;
	}
	return blocks;
}

/** 从文本中删除这些块（倒序 splice），并折叠 3+ 连续空行。 */
export function removeBlocks(text: string, blocks: TaskBlock[]): string {
	const lines = text.split(/\r?\n/);
	const sorted = [...blocks].sort((a, b) => b.start - a.start);
	for (const block of sorted) {
		lines.splice(block.start, block.end - block.start);
	}
	return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

/** 块渲染成目标笔记里的行（块间不留空行，与脚本一致）。 */
export function blocksToLines(blocks: TaskBlock[]): string[] {
	return blocks.flatMap((b) => b.lines);
}
