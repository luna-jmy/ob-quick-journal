/**
 * 流条目编辑弹窗：单条就地编辑（不跳回日志）。
 * line 条目单行编辑内容（列表标记与时间戳保留在原行里）；field / paragraph 多行。
 * 段落条目（attachmentSource 有值）带插图按钮，与速记面板输入条同款交互。
 */

import { Modal, setIcon } from "obsidian";
import { t } from "../i18n";
import { insertImageAttachment } from "./attachments";

export class EntryEditModal extends Modal {
	constructor(
		app: Modal["app"],
		title: string,
		private initial: string,
		private multiline: boolean,
		private onSave: (content: string) => void,
		/** 附件路径规则的来源笔记；仅段落条目传入 */
		private attachmentSource?: string,
	) {
		super(app);
		this.titleEl.setText(title);
	}

	onOpen(): void {
		const form = this.contentEl.createDiv({ cls: "qj-form" });
		const input = form.createEl("textarea", { cls: "qj-input qj-textarea" });
		input.rows = this.multiline ? 8 : 3;
		input.value = this.initial;

		const footer = form.createDiv({ cls: "qj-form-footer" });
		if (this.attachmentSource !== undefined) {
			// 插图按钮（仅段落）：选图 → 存入 Obsidian 附件位置 → 光标处插入 ![[…]]
			const attach = footer.createEl("button", { cls: "qj-btn qj-icon-btn qj-form-attach" });
			attach.type = "button";
			attach.setAttribute("aria-label", t("添加附件"));
			setIcon(attach, "paperclip");
			attach.onclick = () => {
				const picker = form.ownerDocument.createElement("input");
				picker.type = "file";
				picker.accept = "image/*";
				picker.onchange = () => void insertImageAttachment(this.app, picker.files?.[0] ?? null, this.attachmentSource!, input);
				picker.click();
			};
		}
		const cancel = footer.createEl("button", { cls: "qj-btn", text: t("取消") });
		cancel.type = "button";
		cancel.onclick = () => this.close();
		const save = footer.createEl("button", { cls: "qj-btn qj-btn-primary", text: t("保存") });
		save.type = "button";
		setIcon(save.createSpan({ cls: "qj-btn-icon" }), "check");
		save.onclick = () => {
			this.onSave(input.value);
			this.close();
		};
	}
}
