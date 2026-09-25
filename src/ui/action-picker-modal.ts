/**
 * 动作选择弹窗（ribbon 入口）：列出当前配置的标题区，按类型带图标。
 */

import { Modal, setIcon } from "obsidian";
import type { JournalSection, SectionType } from "../types";
import { t } from "../i18n";

const TYPE_ICON: Record<SectionType, string> = {
	checkin: "circle-check",
	data: "line-chart",
	text: "feather",
	list: "list-plus",
	paragraph: "align-left",
};

export class ActionPickerModal extends Modal {
	constructor(
		app: Modal["app"],
		private sections: JournalSection[],
		private onPick: (section: JournalSection) => void,
	) {
		super(app);
	}

	onOpen(): void {
		this.titleEl.setText(t("选择动作"));
		const list = this.contentEl.createDiv({ cls: "qj-action-list" });
		for (const section of this.sections) {
			const row = list.createDiv({ cls: "qj-action-row" });
			setIcon(row.createSpan({ cls: "qj-action-icon" }), TYPE_ICON[section.type]);
			row.createSpan({ cls: "qj-action-name", text: section.heading.replace(/^#+\s*/, "") });
			row.onclick = () => {
				this.close();
				this.onPick(section);
			};
		}
	}
}
