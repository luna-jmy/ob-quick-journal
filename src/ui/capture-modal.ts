/**
 * 捕获表单弹窗：按标题区类型渲染。
 * checkin → 每字段一组 ✔️/❌ 开关（不选 = 不写）；data → 数字输入；
 * text → 文本输入；list → 单条内容输入（追加一行）。
 * 插件表单不放脚本时代的「留空不写」之类提示——留空自然不写。
 */

import { Modal, setIcon } from "obsidian";
import type { SectionField, SectionType } from "../types";
import { BOOL_NO, BOOL_YES } from "../types";
import { t } from "../i18n";

export class CaptureModal extends Modal {
	private values: Record<string, string> = {};
	private lineValue = "";
	private boolState: Record<string, "yes" | "no" | ""> = {};

	constructor(
		app: Modal["app"],
		private title: string,
		private type: SectionType,
		private fields: SectionField[],
		private onSubmit: (payload: { values: Record<string, string>; lineValue?: string }) => void,
	) {
		super(app);
	}

	onOpen(): void {
		this.titleEl.setText(this.title);
		const form = this.contentEl.createDiv({ cls: "qj-form" });

		if (this.type === "list" || this.type === "paragraph") {
			const row = form.createDiv({ cls: "qj-field" });
			row.createEl("label", { cls: "qj-field-label", text: t("内容") });
			const input = row.createEl("textarea", { cls: "qj-input qj-textarea" });
			input.rows = this.type === "paragraph" ? 6 : 2;
			input.onchange = () => (this.lineValue = input.value);
		} else {
			for (const field of this.fields) {
				const row = form.createDiv({ cls: "qj-field" });
				row.createEl("label", { cls: "qj-field-label", text: field.label });
				if (this.type === "checkin") {
					this.boolState[field.key] = "";
					const seg = row.createDiv({ cls: "qj-boolseg" });
					for (const opt of [
						{ id: "yes" as const, label: BOOL_YES },
						{ id: "no" as const, label: BOOL_NO },
					]) {
						const btn = seg.createEl("button", {
							cls: "qj-boolseg-btn",
							text: opt.label,
						});
						btn.type = "button";
						btn.onclick = () => {
							this.boolState[field.key] =
								this.boolState[field.key] === opt.id ? "" : opt.id;
							btn.toggleClass("is-active", this.boolState[field.key] === opt.id);
						};
					}
				} else if (this.type === "data") {
					const input = row.createEl("input", { cls: "qj-input", type: "number" });
					input.inputMode = "decimal";
					input.onchange = () => (this.values[field.key] = input.value);
				} else {
					const input = row.createEl("input", { cls: "qj-input", type: "text" });
					input.onchange = () => (this.values[field.key] = input.value);
				}
			}
		}

		const footer = form.createDiv({ cls: "qj-form-footer" });
		const cancel = footer.createEl("button", { cls: "qj-btn", text: t("取消") });
		cancel.type = "button";
		cancel.onclick = () => this.close();
		const submit = footer.createEl("button", {
			cls: "qj-btn qj-btn-primary",
			text: t("提交"),
		});
		submit.type = "button";
		setIcon(submit.createSpan({ cls: "qj-btn-icon" }), "check");
		submit.onclick = () => {
			for (const [key, state] of Object.entries(this.boolState)) {
				if (state === "yes") this.values[key] = BOOL_YES;
				else if (state === "no") this.values[key] = BOOL_NO;
				else delete this.values[key];
			}
			this.onSubmit({ values: { ...this.values }, lineValue: this.lineValue });
			this.close();
		};
	}
}
