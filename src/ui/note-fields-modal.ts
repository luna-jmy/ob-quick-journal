/**
 * 当前笔记字段批量录入弹窗：scanNoteFields 的分节渲染，一个窗口改完一整篇。
 * 与 CaptureModal 的差别：面向**任意笔记**（不要求是配置的日志）、字段来自扫描
 * 而非配置、一行可有多处。控件按 fieldControlKind（打卡三段 / 数字框 / 文本框），
 * 只收集值有变化的字段（同 CaptureModal「只提交动过的」口径）；
 * 保存走 applyFieldEdits——stale 整批拒写，不半批落盘。
 */

import { Modal, Notice, TFile, setIcon } from "obsidian";
import { t } from "../i18n";
import { BOOL_NO, BOOL_YES, type QJConfig } from "../types";
import {
	fieldControlKind,
	scanNoteFields,
	sectionTypeForHeading,
	type FieldOccurrence,
} from "../parse/note-fields";
import { applyFieldEdits, type FieldLineEdits } from "../services/file-writer";

/** 一个字段的编辑态：draft 为 null = 未动（不提交） */
interface Draft {
	field: FieldOccurrence;
	draft: string | null;
}

export class NoteFieldsModal extends Modal {
	constructor(
		app: Modal["app"],
		private readonly file: TFile,
		private readonly initialText: string,
		private readonly config: QJConfig,
	) {
		super(app);
	}

	onOpen(): void {
		this.titleEl.setText(t("当前笔记字段"));
		const scan = scanNoteFields(this.initialText.split(/\r?\n/));
		if (scan.count === 0) {
			this.contentEl.createDiv({ cls: "qj-empty", text: t("没有找到内联字段") });
			return;
		}

		const form = this.contentEl.createDiv({ cls: "qj-form qj-note-fields" });
		const drafts: Draft[] = [];

		for (const section of scan.sections) {
			form.createDiv({
				cls: "qj-note-fields-section",
				text: section.headingText ?? t("未分组字段"),
			});

			// 命中配置的标题区带类型控件；未配置的按值启发（fieldControlKind 内部处理）
			const typed =
				section.headingText === null
					? null
					: sectionTypeForHeading(section.headingText, this.config);
			for (const field of section.fields) {
				const kind = fieldControlKind(typed?.type ?? null, field.value);
				drafts.push(this.renderFieldRow(form, field, kind));
			}
		}

		const footer = this.contentEl.createDiv({ cls: "qj-form-footer" });
		const cancel = footer.createEl("button", { cls: "qj-btn", text: t("取消") });
		cancel.type = "button";
		cancel.onclick = () => this.close();
		const submit = footer.createEl("button", { cls: "qj-btn qj-btn-primary", text: t("提交") });
		submit.type = "button";
		setIcon(submit.createSpan({ cls: "qj-btn-icon" }), "check");
		submit.onclick = () => void this.submit(drafts);
	}

	/** 一行一个字段；返回编辑态供提交收集 */
	private renderFieldRow(
		form: HTMLElement,
		field: FieldOccurrence,
		kind: "checkin" | "number" | "text",
	): Draft {
		const draft: Draft = { field, draft: null };
		const row = form.createDiv({ cls: "qj-field" });
		row.createEl("label", { cls: "qj-field-label", text: field.key });

		if (kind === "checkin") {
			/*
			 * 三段：✔️ / ❌ / 清空。点已选中的档位 = 回到当前值（撤销这次改动，
			 * 不再是「点了取消选择」——那会把「想撤回」误写成「想清空」）。
			 */
			const state = { value: field.value };
			const seg = row.createDiv({ cls: "qj-boolseg" });
			const buttons: Partial<Record<"yes" | "no" | "clear", HTMLButtonElement>> = {};
			const sync = (): void => {
				buttons.yes?.toggleClass("is-active", state.value === BOOL_YES);
				buttons.no?.toggleClass("is-active", state.value === BOOL_NO);
				buttons.clear?.toggleClass("is-active", state.value === "");
				draft.draft = state.value === field.value ? null : state.value;
			};
			const options = [
				{ id: "yes" as const, label: BOOL_YES, value: BOOL_YES },
				{ id: "no" as const, label: BOOL_NO, value: BOOL_NO },
				{ id: "clear" as const, label: t("清空"), value: "" },
			];
			for (const opt of options) {
				const btn = seg.createEl("button", { cls: "qj-boolseg-btn", text: opt.label });
				btn.type = "button";
				buttons[opt.id] = btn;
				btn.onclick = () => {
					state.value = state.value === opt.value ? field.value : opt.value;
					sync();
				};
			}
			sync();
			return draft;
		}

		const input = row.createEl("input", {
			cls: "qj-input",
			type: kind === "number" ? "number" : "text",
		});
		if (kind === "number") input.inputMode = "decimal";
		input.value = field.value;
		input.onchange = () => {
			draft.draft = input.value === field.value ? null : input.value;
		};
		return draft;
	}

	private async submit(drafts: Draft[]): Promise<void> {
		const byLine = new Map<number, FieldLineEdits>();
		let changed = 0;
		for (const { field, draft } of drafts) {
			if (draft === null) continue;
			const entry =
				byLine.get(field.lineIndex) ??
				{ lineIndex: field.lineIndex, raw: field.raw, changes: [] };
			entry.changes.push({ matchIndex: field.matchIndex, value: draft });
			byLine.set(field.lineIndex, entry);
			changed += 1;
		}
		if (changed === 0) {
			this.close();
			return;
		}

		const result = await applyFieldEdits(this.app, this.file.path, [...byLine.values()]);
		if (result === "ok") {
			// t() 不带插值，数字按 main.ts 的 Notice 模式拼在括号里
			new Notice(`${t("已更新字段")} (${changed})`);
		} else if (result === "stale") {
			new Notice(t("笔记已被修改，未写入，请重试"));
		} else {
			new Notice(t("写入失败"));
		}
		this.close();
	}
}
