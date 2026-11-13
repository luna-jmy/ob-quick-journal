/**
 * ensureNote 的防冲突兜底：路径解析失配（索引未就绪 / 大小写差异）时，
 * vault.create 会落到 YYYY-MM-DD(1).md 平行副本（2026-09-30 报的重复文件事故）——
 * 副本要被清进回收站，写回必须复用原笔记。
 */

import { describe, expect, it, vi } from "vitest";

import { TFile, type App } from "obsidian";
import { applyFieldEdits, ensureNote, type FieldLineEdits } from "../src/services/file-writer";

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

/** applyFieldEdits 用：vault.process 落到内存文本上，模拟真实原子回调 */
interface ProcessApp {
	vault: {
		getAbstractFileByPath: ReturnType<typeof vi.fn>;
		process: ReturnType<typeof vi.fn>;
	};
}

function processApp(initial: string): {
	app: ProcessApp;
	store: { text: string };
	file: TFile;
} {
	const file = makeFile("day/2026-11-13.md");
	const store = { text: initial };
	const app = {
		vault: {
			getAbstractFileByPath: vi.fn((p: string) => (p === file.path ? file : null)),
			process: vi.fn(async (_f: TFile, fn: (text: string) => string) => {
				store.text = fn(store.text);
				return store.text;
			}),
		},
	};
	return { app, store, file };
}

describe("applyFieldEdits", () => {
	const edits = (text: string): FieldLineEdits[] => [
		{ lineIndex: 1, raw: text.split("\n")[1], changes: [{ matchIndex: 0, value: "✔️" }] },
	];

	it("整批一致：逐行替换并返回 ok", async () => {
		const initial = "# 日志\n- [💊medicine::]";
		const { app, store, file } = processApp(initial);
		const result = await applyFieldEdits(app as unknown as App, file.path, edits(initial));
		expect(result).toBe("ok");
		expect(store.text).toBe("# 日志\n- [💊medicine:: ✔️]");
	});

	it("任一行已变：整批拒写（原文不动），返回 stale", async () => {
		const initial = "# 日志\n- [💊medicine::]";
		const { app, store, file } = processApp(initial);
		// 表单开着的时候别的插件改了第 0 行——raw 对不上就整批不写
		const stale = [{ lineIndex: 0, raw: "# 旧标题", changes: [{ matchIndex: 0, value: "x" }] }];
		const result = await applyFieldEdits(app as unknown as App, file.path, stale);
		expect(result).toBe("stale");
		expect(store.text).toBe(initial);
	});

	it("文件不存在返回 error", async () => {
		const { app } = processApp("");
		const result = await applyFieldEdits(app as unknown as App, "other/note.md", []);
		expect(result).toBe("error");
	});
});
