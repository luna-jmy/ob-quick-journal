/**
 * 任务滚动的目标解析回归 + 最近 X 天窗口收集：
 * - 今天笔记在子目录时必须写进已有笔记，不得在目录根另建平行文件
 *   （2026-09-30「滚动后任务从日志消失、面板还在、跳转找不到」事故——
 *   根因是按目录根拼路径误判笔记缺失）。
 * - 窗口语义：只收集最近 rolloverDays 天（默认 7，不含今天）的所有日日志，
 *   不去重、忠实搬运；窗口内没有就返回 null，不再无限回溯找更早的日志。
 */

import { describe, expect, it } from "vitest";
import { TFile, type App } from "obsidian";
import { RolloverService } from "../src/services/rollover-service";
import { mergeConfig, type QJConfig } from "../src/types";

function makeFile(path: string): TFile {
	return new (TFile as unknown as new (path: string) => TFile)(path);
}

function fakeVault(files: { path: string; content: string }[]) {
	const store = new Map(
		files.map((f) => [f.path, { file: makeFile(f.path), content: f.content }]),
	);
	const created: string[] = [];
	const app = {
		vault: {
			getMarkdownFiles: () => [...store.values()].map((v) => v.file),
			getAbstractFileByPath: (path: string) => store.get(path)?.file ?? null,
			cachedRead: async (file: TFile) => store.get(file.path)?.content ?? "",
			create: async (path: string, content: string) => {
				created.push(path);
				const file = makeFile(path);
				store.set(path, { file, content });
				return file;
			},
			createFolder: async () => {},
			process: async (file: TFile, cb: (text: string) => string) => {
				const next = cb(store.get(file.path)?.content ?? "");
				store.set(file.path, { file, content: next });
				return next;
			},
		},
		metadataCache: { getFileCache: () => null },
		fileManager: { trashFile: async () => {} },
	} as unknown as App;
	return { app, store, created };
}

function makeConfig(rolloverDays?: number): QJConfig {
	return {
		tasks: { markers: { open: [">"] }, ...(rolloverDays ? { rolloverDays } : {}) },
		journals: {
			daily: {
				dir: "540 Daily",
				sections: [
					{
						id: "gtd",
						heading: "## GTD任务看板",
						type: "list",
						lineTemplate: "- [ ] {{value}}",
						fields: [],
						panel: true,
					},
				],
			},
		},
	} as unknown as QJConfig;
}

const CONFIG = makeConfig();

const NOW = new Date(2026, 8, 30); // 2026-09-30

describe("RolloverService.perform", () => {
	it("今天笔记已在子目录：写进该笔记，不另建根路径平行文件", async () => {
		const { app, store, created } = fakeVault([
			{
				path: "540 Daily/2026-09/2026-09-28.md",
				content: [
					"# 2026-09-28",
					"## GTD任务看板",
					"- [ ] 旧任务一",
					"- [ ] 旧任务二",
					"",
					"## 小结",
					"- 已完成的事，不动",
				].join("\n"),
			},
			{
				path: "540 Daily/2026-09/2026-09-30.md",
				content: ["# 2026-09-30", "## GTD任务看板", ""].join("\n"),
			},
		]);
		const service = new RolloverService(app, () => CONFIG);

		const preview = await service.preview(NOW);
		expect(preview).not.toBeNull();
		expect(preview!.sources.length).toBe(1);
		expect(preview!.sources[0].blocks.length).toBe(2);
		expect(preview!.total).toBe(2);

		const result = await service.perform(preview!, NOW);
		expect(result.ok).toBe(true);
		// 关键断言：没有在目录根新建任何笔记
		expect(created).toEqual([]);

		const today = store.get("540 Daily/2026-09/2026-09-30.md")!.content;
		expect(today).toContain("- [ ] 旧任务一");
		expect(today).toContain("- [ ] 旧任务二");

		const source = store.get("540 Daily/2026-09/2026-09-28.md")!.content;
		expect(source).not.toContain("旧任务一");
		expect(source).toContain("已完成的事，不动");
	});

	it("今天笔记不存在：在目录根建骨架并写入", async () => {
		const { app, store, created } = fakeVault([
			{
				path: "540 Daily/2026-09-28.md",
				content: ["# 2026-09-28", "## GTD任务看板", "- [ ] 待滚动任务"].join("\n"),
			},
		]);
		const service = new RolloverService(app, () => CONFIG);

		const preview = await service.preview(NOW);
		expect(preview).not.toBeNull();
		const result = await service.perform(preview!, NOW);
		expect(result.ok).toBe(true);
		expect(created).toEqual(["540 Daily/2026-09-30.md"]);
		expect(store.get("540 Daily/2026-09-30.md")!.content).toContain("待滚动任务");
	});
});

describe("RolloverService.preview 窗口收集", () => {
	function windowVault(): ReturnType<typeof fakeVault> {
		return fakeVault([
			{
				path: "540 Daily/2026-09-29.md",
				content: ["# 2026-09-29", "## GTD任务看板", "- [ ] 昨天的任务"].join("\n"),
			},
			{
				path: "540 Daily/2026-09-27.md",
				content: [
					"# 2026-09-27",
					"## GTD任务看板",
					"- [ ] 前天的任务",
					"- [ ] 更早一点的还有一个",
				].join("\n"),
			},
			{
				path: "540 Daily/2026-09-20.md",
				content: ["# 2026-09-20", "## GTD任务看板", "- [ ] 窗口外的任务"].join("\n"),
			},
			{
				path: "540 Daily/2026-09-30.md",
				content: ["# 2026-09-30", "## GTD任务看板", ""].join("\n"),
			},
		]);
	}

	it("默认 7 天窗口：收集窗口内所有日志，旧→新排序，窗口外不碰", async () => {
		const { app } = windowVault();
		const service = new RolloverService(app, () => CONFIG);

		const preview = await service.preview(NOW);
		expect(preview).not.toBeNull();
		expect(preview!.sources.map((s) => s.date)).toEqual(["2026-09-27", "2026-09-29"]);
		expect(preview!.total).toBe(3);
	});

	it("rolloverDays 配置生效：窗口收窄到 2 天只含昨天前两天", async () => {
		const { app } = windowVault();
		const service = new RolloverService(app, () => makeConfig(2));

		const preview = await service.preview(NOW);
		expect(preview).not.toBeNull();
		// 窗口 = 2026-09-28 ~ 2026-09-29，只有 09-29 在内
		expect(preview!.sources.map((s) => s.date)).toEqual(["2026-09-29"]);
	});

	it("窗口内没有未完成任务时返回 null，不回溯窗口外", async () => {
		const { app } = fakeVault([
			{
				path: "540 Daily/2026-09-20.md",
				content: ["# 2026-09-20", "## GTD任务看板", "- [ ] 很久以前的任务"].join("\n"),
			},
		]);
		const service = new RolloverService(app, () => CONFIG);

		expect(await service.preview(NOW)).toBeNull();
	});

	it("同文本任务不去重：两天的同一条都收", async () => {
		const { app } = fakeVault([
			{
				path: "540 Daily/2026-09-29.md",
				content: ["# 2026-09-29", "## GTD任务看板", "- [ ] 同一件事"].join("\n"),
			},
			{
				path: "540 Daily/2026-09-27.md",
				content: ["# 2026-09-27", "## GTD任务看板", "- [ ] 同一件事"].join("\n"),
			},
		]);
		const service = new RolloverService(app, () => CONFIG);

		const preview = await service.preview(NOW);
		expect(preview).not.toBeNull();
		expect(preview!.total).toBe(2);
	});
});

describe("RolloverService.perform 多源迁移", () => {
	it("按旧→新写入今天，逐源原子清理，窗口外源不动", async () => {
		const { app, store } = fakeVault([
			{
				path: "540 Daily/2026-09-29.md",
				content: ["# 2026-09-29", "## GTD任务看板", "- [ ] 新一点的任务"].join("\n"),
			},
			{
				path: "540 Daily/2026-09-27.md",
				content: [
					"# 2026-09-27",
					"## GTD任务看板",
					"- [ ] 旧一点的任务",
					"",
					"## 小结",
					"- 09-27 已完成的事，不动",
				].join("\n"),
			},
			{
				path: "540 Daily/2026-09-20.md",
				content: ["# 2026-09-20", "## GTD任务看板", "- [ ] 窗口外的任务"].join("\n"),
			},
			{
				path: "540 Daily/2026-09-30.md",
				content: ["# 2026-09-30", "## GTD任务看板", ""].join("\n"),
			},
		]);
		const service = new RolloverService(app, () => CONFIG);

		const preview = await service.preview(NOW);
		expect(preview).not.toBeNull();
		const result = await service.perform(preview!, NOW);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.moved).toBe(2);
		expect(result.dates).toEqual(["2026-09-27", "2026-09-29"]);

		const today = store.get("540 Daily/2026-09-30.md")!.content;
		// 旧→新顺序写入
		expect(today.indexOf("旧一点的任务")).toBeLessThan(today.indexOf("新一点的任务"));

		expect(store.get("540 Daily/2026-09-27.md")!.content).not.toContain("旧一点的任务");
		expect(store.get("540 Daily/2026-09-27.md")!.content).toContain("09-27 已完成的事");
		expect(store.get("540 Daily/2026-09-29.md")!.content).not.toContain("新一点的任务");
		// 窗口外原样保留
		expect(store.get("540 Daily/2026-09-20.md")!.content).toContain("窗口外的任务");
	});
});

describe("mergeConfig rolloverDays", () => {
	it("缺省时默认 7 天", () => {
		expect(mergeConfig({}).tasks.rolloverDays).toBe(7);
	});

	it("合法保存值保留", () => {
		expect(mergeConfig({ tasks: { rolloverDays: 3 } }).tasks.rolloverDays).toBe(3);
	});

	it("非法值（0 / 负数 / 非数字）回退默认", () => {
		expect(mergeConfig({ tasks: { rolloverDays: 0 } }).tasks.rolloverDays).toBe(7);
		expect(mergeConfig({ tasks: { rolloverDays: -5 } }).tasks.rolloverDays).toBe(7);
		expect(mergeConfig({ tasks: { rolloverDays: "abc" } }).tasks.rolloverDays).toBe(7);
	});

	it("超过 365 钳到 365", () => {
		expect(mergeConfig({ tasks: { rolloverDays: 999 } }).tasks.rolloverDays).toBe(365);
	});
});
