/**
 * file-writer：唯一落盘出口。
 * - 目标笔记不存在 → vault.create（骨架由调用方生成）
 * - 修改一律走 vault.process 原子回调（applyPlan 纯函数）
 * 失败抛异常，由调用方 Notice 提示；任何失败都不会留下半行。
 */

import { TFile, type App } from "obsidian";
import { applyPlan, type WritePlan } from "../capture/plan";

export async function ensureNote(app: App, path: string, skeleton: string): Promise<TFile> {
	const existing = app.vault.getAbstractFileByPath(path);
	if (existing instanceof TFile) return existing;
	const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
	if (dir && !app.vault.getAbstractFileByPath(dir)) {
		try {
			await app.vault.createFolder(dir);
		} catch {
			// 已存在（并发）——继续
		}
	}
	const file = await app.vault.create(path, skeleton);
	if (file.path === path) return file;
	// 路径解析失配（大小写差异、索引未就绪等）会让 create 落到 YYYY-MM-DD(1).md
	// 平行副本——刚建的副本只含骨架，删掉并复用原笔记，绝不在用户日志旁留平行文件
	const original = app.vault.getAbstractFileByPath(path);
	if (original instanceof TFile) {
		try {
			await app.fileManager.trashFile(file);
		} catch {
			// 副本清理失败不阻塞：仍写回原笔记
		}
		return original;
	}
	return file;
}

export async function readNoteText(app: App, path: string): Promise<string> {
	const file = app.vault.getAbstractFileByPath(path);
	if (!(file instanceof TFile)) throw new Error(`note not found: ${path}`);
	return app.vault.cachedRead(file);
}

export async function applyPlanToFile(app: App, path: string, plan: WritePlan): Promise<void> {
	if (plan.status !== "ok") throw new Error(`plan error: ${plan.reason}`);
	const file = app.vault.getAbstractFileByPath(path);
	if (!(file instanceof TFile)) throw new Error(`note not found: ${path}`);
	await app.vault.process(file, (text) => applyPlan(text, plan));
}
