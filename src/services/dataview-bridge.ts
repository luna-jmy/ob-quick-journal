/**
 * Dataview 委托桥（内部 API 收口：app.plugins 只出现在本文件）。
 * 做法与 ob-workspace 的 PluginBridge 相同：探测 `dataview.api.executeJs`
 * （官方暴露的执行入口）——
 * - dataviewjs：`executeJs(code, container, component, filePath)`
 * - dataview：`tryQueryMarkdown(code, sourcePath)` 拿 markdown 字符串，
 *   再用官方 MarkdownRenderer 渲染（普通 markdown，无需处理器）
 * 探测不到返回 false，由组件显示降级说明。
 */

import { MarkdownRenderer, type App, type Component } from "obsidian";

interface DataviewApi {
	executeJs(code: string, container: HTMLElement, component: Component, filePath: string): Promise<void>;
	tryQueryMarkdown?: (query: string, sourcePath: string) => Promise<string>;
}

export class QueryBridge {
	constructor(private app: App) {}

	private dataview(): DataviewApi | undefined {
		const plugins = (this.app as unknown as { plugins?: { plugins?: Record<string, unknown> } })
			.plugins;
		const api = (plugins?.plugins?.dataview as { api?: DataviewApi } | undefined)?.api;
		return typeof api?.executeJs === "function" ? api : undefined;
	}

	get dataviewAvailable(): boolean {
		return this.dataview() !== undefined;
	}

	/** ```dataview 查询：tryQueryMarkdown + MarkdownRenderer。 */
	async renderDvQuery(
		code: string,
		sourcePath: string,
		container: HTMLElement,
		component: Component,
	): Promise<boolean> {
		try {
			const api = this.dataview();
			if (!api || typeof api.tryQueryMarkdown !== "function") return false;
			const md = await api.tryQueryMarkdown(code, sourcePath);
			container.empty();
			await MarkdownRenderer.render(this.app, md, container, sourcePath, component);
			return true;
		} catch {
			return false;
		}
	}

	/** ```dataviewjs：官方 executeJs 入口（CW 同款），不自己 eval。 */
	async renderDvJs(
		code: string,
		sourcePath: string,
		container: HTMLElement,
		component: Component,
	): Promise<boolean> {
		try {
			const api = this.dataview();
			if (!api) return false;
			container.empty();
			await api.executeJs(code, container, component, sourcePath);
			return true;
		} catch {
			return false;
		}
	}
}
