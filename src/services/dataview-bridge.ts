/**
 * 查询块委托桥（内部 API 收口：app.plugins 只出现在本文件）。
 * 探测 + 降级：Dataview 用 tryQueryMarkdown / executeJs（官方暴露的执行入口），
 * Tasks 探测其 api，探测不到或调用失败一律返回 false，由组件显示降级说明。
 * 返回值 / 异常不做业务判断，只表达「渲染成功与否」。
 */

import { MarkdownRenderer, type App, type Component } from "obsidian";

export class QueryBridge {
	constructor(private app: App) {}

	private plugin(id: string): any | null {
		const plugins = (this.app as any)["plugins"] as Record<string, any> | undefined;
		return plugins?.[id] ?? null;
	}

	get dataviewAvailable(): boolean {
		return this.plugin("dataview")?.api != null;
	}

	get tasksAvailable(): boolean {
		const api = this.plugin("obsidian-tasks")?.api;
		return typeof api?.executeTasksQuery === "function" || typeof api?.executeQuery === "function";
	}

	/** ```dataview 块：tryQueryMarkdown 拿 markdown，再用官方 MarkdownRenderer 渲染。 */
	async renderDvQuery(
		query: string,
		sourcePath: string,
		container: HTMLElement,
		component: Component,
	): Promise<boolean> {
		try {
			const api = this.plugin("dataview")?.api;
			if (typeof api?.tryQueryMarkdown !== "function") return false;
			const md = await api.tryQueryMarkdown(query, sourcePath);
			await MarkdownRenderer.render(this.app, md, container, sourcePath, component);
			return true;
		} catch {
			return false;
		}
	}

	/** ```dataviewjs 块：官方 executeJs 入口（CW 同款口径），不自己 eval。 */
	renderDvJs(
		code: string,
		container: HTMLElement,
		component: Component,
		sourcePath: string,
	): boolean {
		try {
			const api = this.plugin("dataview")?.api;
			if (typeof api?.executeJs !== "function") return false;
			api.executeJs(code, container, component, sourcePath);
			return true;
		} catch {
			return false;
		}
	}

	/** ```tasks 块：探测 Tasks 的 api 入口（M3 口径：不凭记忆，探测不到就降级）。 */
	async renderTasksQuery(
		query: string,
		sourcePath: string,
		container: HTMLElement,
		component: Component,
	): Promise<boolean> {
		try {
			const api = this.plugin("obsidian-tasks")?.api;
			const run = api?.executeTasksQuery ?? api?.executeQuery;
			if (typeof run !== "function") return false;
			const result = await run.call(api, query, sourcePath, component, container);
			if (typeof result === "string") {
				await MarkdownRenderer.render(this.app, result, container, sourcePath, component);
			}
			return true;
		} catch {
			return false;
		}
	}
}
