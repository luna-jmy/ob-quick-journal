/**
 * file-writer：唯一落盘出口。
 * - 目标笔记不存在 → vault.create（骨架由调用方生成）
 * - 修改一律走 vault.process 原子回调（applyPlan 纯函数）
 * 失败抛异常，由调用方 Notice 提示；任何失败都不会留下半行。
 */

import { TFile, type App } from "obsidian";
import { applyPlan, type WritePlan } from "../capture/plan";
import { applyFieldOccurrences, type OccurrenceEdit } from "../parse/note-fields";

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

/** 一行的批量字段改动：`raw` 是扫描时的整行原文（stale 校验基准） */
export interface FieldLineEdits {
	lineIndex: number;
	raw: string;
	changes: OccurrenceEdit[];
}

export type FieldEditResult = "ok" | "stale" | "error";

/**
 * 批量替换行内字段值（rewriteRawLine 的 stale 先例推广成整批 all-or-nothing）：
 * vault.process 里**先整批校验**每行仍与扫描时一致，任一行被别的插件 / 窗口改过
 * → 原文返回（什么也不写）+ "stale"；全过才逐行拼接替换。
 * 拒写宁可整批失败也不半批落盘——半批会让「哪些字段改了」变成猜谜。
 */
export async function applyFieldEdits(
	app: App,
	path: string,
	edits: readonly FieldLineEdits[],
): Promise<FieldEditResult> {
	const file = app.vault.getAbstractFileByPath(path);
	if (!(file instanceof TFile)) return "error";
	let stale = false;
	try {
		await app.vault.process(file, (text) => {
			const lines = text.split(/\r?\n/);
			for (const edit of edits) {
				if (lines[edit.lineIndex] !== edit.raw) {
					stale = true;
					return text;
				}
			}
			for (const edit of edits) {
				const next = applyFieldOccurrences(edit.raw, edit.changes);
				if (next === null) {
					stale = true;
					return text;
				}
				lines[edit.lineIndex] = next;
			}
			return lines.join("\n");
		});
	} catch {
		return "error";
	}
	return stale ? "stale" : "ok";
}
