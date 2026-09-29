/**
 * 任务滚动的目标解析回归：今天笔记在子目录时必须写进已有笔记，
 * 不得在目录根另建平行文件（2026-09-30「滚动后任务从日志消失、面板还在、
 * 跳转找不到」事故——根因是按目录根拼路径误判笔记缺失）。
 */

import { describe, expect, it } from "vitest";
import { TFile, type App } from "obsidian";
import { RolloverService } from "../src/services/rollover-service";
import type { QJConfig } from "../src/types";

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

const CONFIG = {
	tasks: { markers: { open: [">"] } },
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
		expect(preview!.blocks.length).toBe(2);

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
