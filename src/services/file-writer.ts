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
	return app.vault.create(path, skeleton);
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
