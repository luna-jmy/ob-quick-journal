/**
 * 捕获表单弹窗：按标题区类型渲染。
 * checkin → 每字段一组 ✔️/❌ 单选开关（不选 = 不动该行）；data → 数字输入；
 * text → 文本输入；list / paragraph → 单条内容输入。
 * 预填语义（用户口径 2026-09-30）：表单显示当前值，但只提交用户改过的字段——
 * 未动的不重写（也不触发覆盖确认）；「清空当前内容」显式把所有字段写回空值行。
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
		private onSubmit: (payload: {
			values: Record<string, string>;
			lineValue?: string;
			clearAll?: boolean;
		}) => void,
		/** list / paragraph 预填内容（段落重发 = 编辑态） */
		private initial = "",
		/** 字段当前值（仅展示预填；不进提交，改了才提交） */
		private initialValues: Record<string, string> = {},
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
			if (this.initial !== "") input.value = this.initial;
			input.onchange = () => (this.lineValue = input.value);
		} else {
			for (const field of this.fields) {
				const current = this.initialValues[field.key] ?? "";
				const row = form.createDiv({ cls: "qj-field" });
				row.createEl("label", { cls: "qj-field-label", text: field.label });
				if (this.type === "checkin") {
					// 预填显示当前选中态（仅展示；不写 values，动了才提交）
					this.boolState[field.key] =
						current === BOOL_YES ? "yes" : current === BOOL_NO ? "no" : "";
					const seg = row.createDiv({ cls: "qj-boolseg" });
					const buttons: Record<"yes" | "no", HTMLButtonElement | undefined> = {
						yes: undefined,
						no: undefined,
					};
					const sync = (): void => {
						buttons.yes?.toggleClass("is-active", this.boolState[field.key] === "yes");
						buttons.no?.toggleClass("is-active", this.boolState[field.key] === "no");
					};
					for (const opt of [
						{ id: "yes" as const, label: BOOL_YES },
						{ id: "no" as const, label: BOOL_NO },
					]) {
						const btn = seg.createEl("button", {
							cls: "qj-boolseg-btn",
							text: opt.label,
						});
						btn.type = "button";
						buttons[opt.id] = btn;
						// 单选：点另一个自动取消当前（此前两个能同时点亮）
						btn.onclick = () => {
							this.boolState[field.key] =
								this.boolState[field.key] === opt.id ? "" : opt.id;
							sync();
						};
					}
					sync();
				} else if (this.type === "data") {
					const input = row.createEl("input", { cls: "qj-input", type: "number" });
					input.inputMode = "decimal";
					if (current !== "") input.value = current;
					input.onchange = () => (this.values[field.key] = input.value);
				} else {
					const input = row.createEl("input", { cls: "qj-input", type: "text" });
					if (current !== "") input.value = current;
					input.onchange = () => (this.values[field.key] = input.value);
				}
			}
		}

		const footer = form.createDiv({ cls: "qj-form-footer" });
		// 字段类表单提供整卡清空：显式把全部字段写回空值行（不动 = 不提交）
		if (this.fields.length > 0 && this.type !== "list" && this.type !== "paragraph") {
			const clear = footer.createEl("button", { cls: "qj-btn qj-btn-danger", text: t("清空当前内容") });
			clear.type = "button";
			clear.onclick = () => {
				this.onSubmit({ values: {}, clearAll: true });
				this.close();
			};
		}
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
			const merged: Record<string, string> = { ...this.values };
			for (const [key, state] of Object.entries(this.boolState)) {
				if (state === "yes") merged[key] = BOOL_YES;
				else if (state === "no") merged[key] = BOOL_NO;
			}
			// 只提交与当前值不同的字段：没动过、或改回原值的都不重写——
			// 重写同值会误触发「已有值，覆盖写入？」确认
			const changed: Record<string, string> = {};
			for (const [key, value] of Object.entries(merged)) {
				if (value !== (this.initialValues[key] ?? "")) changed[key] = value;
			}
			this.onSubmit({ values: changed, lineValue: this.lineValue });
			this.close();
		};
	}
}
