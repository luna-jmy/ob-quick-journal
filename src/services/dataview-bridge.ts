/**
 * 查询块委托桥（内部 API 收口：app.plugins 只出现在本文件）。
 * 思路（2026-09-25 v2）：不再探测 Dataview / Tasks 的具体 API 形状——把查询包回
 * ` ```dataview / dataviewjs / tasks ` 围栏，交给 Obsidian 官方 MarkdownRenderer，
 * 由对应插件自己注册的代码块处理器渲染。插件未启用时返回 false，组件显示降级说明。
 */

import { MarkdownRenderer, type App, type Component } from "obsidian";

export type QueryKind = "dataview" | "dataviewjs" | "tasks";

export class QueryBridge {
	constructor(private app: App) {}

	private enabled(pluginId: string): boolean {
		const plugins = (this.app as unknown as { plugins?: { plugins?: Record<string, unknown> } })
			.plugins;
		return plugins?.plugins?.[pluginId] != null;
	}

	get dataviewAvailable(): boolean {
		return this.enabled("dataview");
	}

	get tasksAvailable(): boolean {
		return this.enabled("obsidian-tasks");
	}

	/** 委托渲染：官方处理器管线（MarkdownRenderer → 各插件的代码块处理器）。 */
	async renderQuery(
		kind: QueryKind,
		code: string,
		sourcePath: string,
		container: HTMLElement,
		component: Component,
	): Promise<boolean> {
		try {
			if (kind === "tasks" && !this.tasksAvailable) return false;
			if (kind !== "tasks" && !this.dataviewAvailable) return false;
			const fenced = `\`\`\`${kind}\n${code.replace(/\s+$/, "")}\n\`\`\`\n`;
			container.empty();
			await MarkdownRenderer.render(this.app, fenced, container, sourcePath, component);
			return true;
		} catch {
			return false;
		}
	}
}
