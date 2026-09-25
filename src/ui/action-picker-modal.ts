/**
 * 动作选择弹窗（ribbon 入口）：列出所有捕获动作。
 */

import { Modal, setIcon } from "obsidian";
import type { CaptureActionDef } from "../types";
import { t } from "../i18n";

export class ActionPickerModal extends Modal {
	constructor(
		app: Modal["app"],
		private actions: CaptureActionDef[],
		private onPick: (action: CaptureActionDef) => void,
	) {
		super(app);
	}

	onOpen(): void {
		this.titleEl.setText(t("选择动作"));
		const list = this.contentEl.createDiv({ cls: "qj-action-list" });
		for (const action of this.actions) {
			const row = list.createDiv({ cls: "qj-action-row" });
			setIcon(row.createSpan({ cls: "qj-action-icon" }), action.icon);
			row.createSpan({ cls: "qj-action-name", text: t(action.nameKey) });
			row.onclick = () => {
				this.close();
				this.onPick(action);
			};
		}
	}
}
