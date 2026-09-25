/**
 * 流条目编辑弹窗：单条就地编辑（不跳回日志）。
 * line 条目单行编辑内容（列表标记与时间戳保留在原行里）；field / paragraph 多行。
 */

import { Modal, setIcon } from "obsidian";
import { t } from "../i18n";

export class EntryEditModal extends Modal {
	constructor(
		app: Modal["app"],
		title: string,
		private initial: string,
		private multiline: boolean,
		private onSave: (content: string) => void,
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
