/**
 * 捕获表单弹窗：按字段类型渲染触屏友好的控件。
 * bool → 三态大按钮（✔️ / ❌ / 留空跳过）；number → 数字输入；text / multiline → 输入框。
 * 留空的字段不写入（提交时直接丢弃）。
 */

import { Modal, setIcon } from "obsidian";
import type { CaptureActionDef, CaptureField } from "../types";
import { BOOL_NO, BOOL_YES } from "../types";
import { t } from "../i18n";

export class CaptureModal extends Modal {
	private values: Record<string, string> = {};
	private boolState: Record<string, "yes" | "no" | ""> = {};

	constructor(
		app: Modal["app"],
		private action: CaptureActionDef,
		private fields: CaptureField[],
		private onSubmit: (values: Record<string, string>) => void,
	) {
		super(app);
	}

	onOpen(): void {
		this.titleEl.setText(t(this.action.nameKey));
		const form = this.contentEl.createDiv({ cls: "qj-form" });

		for (const field of this.fields) {
			const row = form.createDiv({ cls: "qj-field" });
			row.createEl("label", { cls: "qj-field-label", text: t(field.label) });

			if (field.type === "bool") {
				this.boolState[field.key] = "";
				const seg = row.createDiv({ cls: "qj-boolseg" });
				const options: { id: "yes" | "no" | ""; label: string; cls: string }[] = [
					{ id: "yes", label: BOOL_YES, cls: "qj-bool-yes" },
					{ id: "no", label: BOOL_NO, cls: "qj-bool-no" },
					{ id: "", label: t("跳过（留空不写）"), cls: "qj-bool-skip" },
				];
				for (const opt of options) {
					const btn = seg.createEl("button", {
						cls: `qj-boolseg-btn ${opt.cls}`,
						text: opt.label,
					});
					btn.type = "button";
					btn.onclick = () => {
						this.boolState[field.key] = opt.id;
						seg.querySelectorAll(".qj-boolseg-btn").forEach((b) => b.removeClass("is-active"));
						btn.addClass("is-active");
					};
				}
			} else if (field.type === "number") {
				const input = row.createEl("input", { cls: "qj-input", type: "number" });
				input.inputMode = "decimal";
				input.placeholder = t("跳过（留空不写）");
				input.onchange = () => (this.values[field.key] = input.value);
			} else if (field.type === "multiline") {
				const input = row.createEl("textarea", { cls: "qj-input qj-textarea" });
				input.placeholder = t("跳过（留空不写）");
				input.onchange = () => (this.values[field.key] = input.value);
			} else {
				const input = row.createEl("input", { cls: "qj-input", type: "text" });
				input.placeholder = t("跳过（留空不写）");
				input.onchange = () => (this.values[field.key] = input.value);
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
		submit.onclick = () => {
			for (const [key, state] of Object.entries(this.boolState)) {
				if (state === "yes") this.values[key] = BOOL_YES;
				else if (state === "no") this.values[key] = BOOL_NO;
				else delete this.values[key];
			}
			this.onSubmit({ ...this.values });
			this.close();
		};
		setIcon(submit.createSpan({ cls: "qj-btn-icon" }), "check");
	}
}
