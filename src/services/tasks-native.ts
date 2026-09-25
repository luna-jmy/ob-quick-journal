/**
 * 原生 tasks 查询执行（采集层）：按查询的 path 筛选行粗过滤文件，
 * 逐文件解析任务行并匹配。只采集、不做判断；大库请查询里带 path 筛选。
 */

import type { App } from "obsidian";
import { pathAllowed, taskMatches, type TasksQuery } from "../parse/tasks-query";

export interface TaskRow {
	path: string;
	lineIndex: number;
	line: string;
	status: string;
}

export class NativeTasks {
	constructor(private app: App) {}

	async run(q: TasksQuery): Promise<TaskRow[]> {
		const rows: TaskRow[] = [];
		for (const file of this.app.vault.getMarkdownFiles()) {
			if (!pathAllowed(q, file.path)) continue;
			const text = await this.app.vault.cachedRead(file);
			const lines = text.split(/\r?\n/);
			for (let i = 0; i < lines.length; i++) {
				const m = /^\s*[-*]\s+\[(.)\]/.exec(lines[i]);
				if (!m) continue;
				if (taskMatches(q, lines[i], m[1], file.path)) {
					rows.push({ path: file.path, lineIndex: i, line: lines[i], status: m[1] });
				}
			}
		}
		return rows;
	}
}
