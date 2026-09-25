/**
 * 通用确认弹窗（覆盖写入前二次确认用）。
 */

import { Modal } from "obsidian";
import { t } from "../i18n";

export class ConfirmModal extends Modal {
	constructor(
		app: Modal["app"],
		private title: string,
		private body: string,
		private onAccept: () => void | Promise<void>,
		private acceptLabel = t("覆盖"),
	) {
		super(app);
	}

	onOpen(): void {
		this.titleEl.setText(this.title);
		this.contentEl.createEl("p", { cls: "qj-confirm-body", text: this.body });
		const footer = this.contentEl.createDiv({ cls: "qj-form-footer" });
		const cancel = footer.createEl("button", { cls: "qj-btn", text: t("取消") });
		cancel.type = "button";
		cancel.onclick = () => this.close();
		const accept = footer.createEl("button", {
			cls: "qj-btn qj-btn-primary",
			text: this.acceptLabel,
		});
		accept.type = "button";
		accept.onclick = () => {
			this.close();
			void this.onAccept();
		};
	}
}
