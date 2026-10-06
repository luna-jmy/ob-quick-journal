/**
 * 段落附件（图片）：写入 vault（走 Obsidian 附件路径规则），把嵌入语法插到
 * 输入框光标处（光标在末尾即追加）。速记面板输入条与条目编辑弹窗共用。
 */

import { App, Notice } from "obsidian";
import { t } from "../i18n";

export async function insertImageAttachment(
	app: App,
	file: File | null,
	sourcePath: string,
	input: HTMLTextAreaElement,
): Promise<void> {
	if (file === null) return;
	try {
		const buffer = await file.arrayBuffer();
		const path = await app.fileManager.getAvailablePathForAttachment(file.name, sourcePath);
		await app.vault.createBinary(path, buffer);
		const name = path.split("/").pop() ?? path;
		const embed = `![[${name}]]`;
		const before = input.value.slice(0, input.selectionStart);
		const after = input.value.slice(input.selectionEnd);
		const pre = before === "" || before.endsWith("\n") ? "" : "\n";
		const post = after === "" ? "\n" : after.startsWith("\n") ? "" : "\n";
		input.value = `${before}${pre}${embed}${post}${after}`;
		const caret = `${before}${pre}${embed}`.length;
		input.focus();
		input.setSelectionRange(caret, caret);
		input.dispatchEvent(new Event("input"));
		new Notice(`${t("已写入")} ${path}`);
	} catch (error) {
		new Notice(`${t("写入失败")}: ${error instanceof Error ? error.message : String(error)}`);
	}
}
