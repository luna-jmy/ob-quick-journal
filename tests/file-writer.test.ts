/**
 * ensureNote 的防冲突兜底：路径解析失配（索引未就绪 / 大小写差异）时，
 * vault.create 会落到 YYYY-MM-DD(1).md 平行副本（2026-09-30 报的重复文件事故）——
 * 副本要被清进回收站，写回必须复用原笔记。
 */

import { describe, expect, it, vi } from "vitest";

import { TFile, type App } from "obsidian";
import { ensureNote } from "../src/services/file-writer";

/** d.ts 里 TFile 无公开构造签名（运行时 mock 的是带 path 的简单类），类型层面绕开 */
function makeFile(path: string): TFile {
	return new (TFile as unknown as new (path: string) => TFile)(path);
}

interface FakeApp {
	vault: {
		getAbstractFileByPath: ReturnType<typeof vi.fn>;
		createFolder: ReturnType<typeof vi.fn>;
		create: ReturnType<typeof vi.fn>;
	};
	fileManager: { trashFile: ReturnType<typeof vi.fn> };
}

function fakeApp(pathLookup: (path: string) => unknown, created?: TFile): FakeApp {
	return {
		vault: {
			getAbstractFileByPath: vi.fn(pathLookup),
			createFolder: vi.fn(async () => {}),
			create: vi.fn(async (path: string) => created ?? makeFile(path)),
		},
		fileManager: {
			trashFile: vi.fn(async () => {}),
		},
	};
}

describe("ensureNote", () => {
	it("目标已存在：直接复用，不创建", async () => {
		const existing = makeFile("dir/2026-09-30.md");
		const app = fakeApp((p) => (p === "dir/2026-09-30.md" ? existing : {}));
		const file = await ensureNote(app as unknown as App, "dir/2026-09-30.md", "skeleton");
		expect(file).toBe(existing);
		expect(app.vault.create).not.toHaveBeenCalled();
	});

	it("目标不存在：建骨架文件并原样返回", async () => {
		const created = makeFile("dir/2026-09-30.md");
		const app = fakeApp(() => ({}), created);
		const file = await ensureNote(app as unknown as App, "dir/2026-09-30.md", "skeleton");
		expect(file).toBe(created);
		expect(app.fileManager.trashFile).not.toHaveBeenCalled();
	});

	it("create 落到 (1) 平行副本：清掉副本并复用原笔记", async () => {
		const original = makeFile("dir/2026-09-30.md");
		const stray = makeFile("dir/2026-09-30(1).md");
		// 预检查时原笔记不可见（解析失配），create 撞名后才可见
		const lookups: unknown[] = [null, original];
		const app = fakeApp(
			(p) => (p === "dir/2026-09-30.md" ? lookups.shift() : {}),
			stray,
		);
		const file = await ensureNote(app as unknown as App, "dir/2026-09-30.md", "skeleton");
		expect(file).toBe(original);
		expect(app.fileManager.trashFile).toHaveBeenCalledWith(stray);
	});

	it("副本清理失败不阻塞：仍复用原笔记", async () => {
		const original = makeFile("dir/2026-09-30.md");
		const stray = makeFile("dir/2026-09-30(1).md");
		const lookups: unknown[] = [null, original];
		const app = fakeApp(
			(p) => (p === "dir/2026-09-30.md" ? lookups.shift() : {}),
			stray,
		);
		app.fileManager.trashFile.mockRejectedValue(new Error("locked"));
		const file = await ensureNote(app as unknown as App, "dir/2026-09-30.md", "skeleton");
		expect(file).toBe(original);
	});
});
