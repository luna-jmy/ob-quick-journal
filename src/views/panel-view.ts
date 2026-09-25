/**
 * 速记面板（qj-panel）：Thino 式内容流——顶部输入条直发列表标题区，
 * 下方按天聚合「开启内容汇总面板」的文本 / 列表标题区内容。
 * 日志文件变更后防抖自动刷新（对齐 TM 的 debounce 口径）。
 */

import {
	DropdownComponent,
	ItemView,
	Notice,
	TFile,
	debounce,
	setIcon,
	type WorkspaceLeaf,
} from "obsidian";
import type QuickJournalPlugin from "../main";
import type { JournalSection } from "../types";
import { VaultIndex } from "../services/vault-index";
import type { SectionEntry } from "../parse/section-entries";
import { ConfirmModal } from "../ui/confirm-modal";
import { EntryEditModal } from "../ui/entry-edit-modal";
import { dateKey } from "../periods/period";
import { t } from "../i18n";

export const VIEW_TYPE_QJ_PANEL = "qj-panel";

export class PanelView extends ItemView {
	private rangeDays = 7;
	private entries: SectionEntry[] = [];
	private feedEl: HTMLElement | null = null;
	private inputEl: HTMLTextAreaElement | null = null;
	private targetId = "";

	constructor(leaf: WorkspaceLeaf, private plugin: QuickJournalPlugin) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_QJ_PANEL;
	}

	getDisplayText(): string {
		return t("速记面板");
	}

	getIcon(): string {
		return "message-square-quote";
	}

	/** 日志文件变更 → 防抖刷新（obsidian 自带 debounce，取消语义清晰） */
	private scheduleRefresh = debounce(() => void this.loadFeed(), 1200, true);

	async onOpen(): Promise<void> {
		this.render();
		this.registerEvent(
			this.app.vault.on("modify", (file) => {
				if (file instanceof TFile && file.path.startsWith(this.plugin.config.dailyDir)) {
					this.scheduleRefresh();
				}
			}),
		);
	}

	onunload(): void {
		this.scheduleRefresh.cancel();
		super.onunload();
	}

	private render(): void {
		const root = this.contentEl;
		root.empty();
		root.addClass("qj-panel-root");

		const toolbar = root.createDiv({ cls: "qj-feed-toolbar" });
		for (const days of [7, 30]) {
			const btn = toolbar.createEl("button", {
				cls: `qj-btn${this.rangeDays === days ? " is-active" : ""}`,
				text: t(days === 7 ? "近 7 天" : "近 30 天"),
			});
			btn.type = "button";
			btn.onclick = () => {
				this.rangeDays = days;
				this.render();
			};
		}
		const refresh = toolbar.createEl("button", { cls: "qj-btn qj-icon-btn" });
		refresh.type = "button";
		setIcon(refresh, "refresh-cw");
		refresh.onclick = () => void this.loadFeed();

		this.renderInput(root);
		this.feedEl = root.createDiv({ cls: "qj-feed" });
		void this.loadFeed();
	}

	private panelSections(): JournalSection[] {
		return this.plugin.config.sections.filter(
			(s) => s.panel === true && (s.type === "text" || s.type === "list" || s.type === "paragraph"),
		);
	}

	/** 输入条可直发的目标：列表（追加）与段落（一天一条，覆盖需确认）。 */
	private writableSections(): JournalSection[] {
		return this.panelSections().filter((s) => s.type === "list" || s.type === "paragraph");
	}

	private renderInput(root: HTMLElement): void {
		const targets = this.writableSections();
		if (targets.length === 0) return;
		if (!targets.some((s) => s.id === this.targetId)) {
			this.targetId = targets[0].id;
		}

		const wrap = root.createDiv({ cls: "qj-panel-input" });
		const dropdown = new DropdownComponent(wrap);
		dropdown.addOptions(
			Object.fromEntries(targets.map((s) => [s.id, s.heading.replace(/^#+\s*/, "")])),
		);
		dropdown.setValue(this.targetId);
		dropdown.onChange((value) => (this.targetId = value));

		const input = wrap.createEl("textarea", { cls: "qj-input qj-textarea" });
		input.rows = 2;
		input.placeholder = t("记点什么…");
		this.inputEl = input;
		input.addEventListener("keydown", (evt) => {
			if (evt.key === "Enter" && !evt.shiftKey) {
				evt.preventDefault();
				void this.send();
			}
		});

		const send = wrap.createEl("button", { cls: "qj-btn qj-btn-primary qj-send-btn" });
		send.type = "button";
		setIcon(send, "send");
		send.setAttribute("aria-label", t("发送"));
		send.onclick = () => void this.send();
	}

	private async send(): Promise<void> {
		const value = this.inputEl?.value.trim() ?? "";
		if (value === "") return;
		const section = this.writableSections().find((s) => s.id === this.targetId);
		if (!section) return;
		if (section.type === "paragraph") {
			// 段落一天一条：已有内容时走确认弹窗（performCapture 里带 Notice 与确认流）
			await this.plugin.performCapture(section, { values: {}, lineValue: value }, false);
			if (this.inputEl) this.inputEl.value = "";
			await this.loadFeed();
			return;
		}
		const result = await this.plugin.capture.performSection(
			section,
			{ values: {}, lineValue: value },
			{ overwrite: false },
		);
		if (result.ok) {
			if (this.inputEl) this.inputEl.value = "";
			await this.loadFeed();
		} else if (result.reason === "error") {
			new Notice(`${t("写入失败")}: ${result.message}`);
		}
	}

	private async loadFeed(): Promise<void> {
		const sections = this.panelSections();
		if (this.feedEl === null) return;
		this.feedEl.empty();

		if (sections.length === 0) {
			this.feedEl.createDiv({ cls: "qj-empty", text: t("没有开启内容汇总面板的标题区") });
			return;
		}

		const index = new VaultIndex(this.app, this.plugin.config.dailyDir);
		const today = new Date();
		const days = Array.from({ length: this.rangeDays }, (_, i) => {
			const d = new Date(today);
			d.setDate(d.getDate() - i);
			return d;
		});
		this.entries = await index.collectEntries(days, sections);
		this.renderFeed();
	}

	private renderFeed(): void {
		const feed = this.feedEl;
		if (feed === null) return;
		feed.empty();
		if (this.entries.length === 0) {
			feed.createDiv({ cls: "qj-empty", text: t("暂无内容，先去记一条") });
			return;
		}

		const sections = this.panelSections();
		const sectionName = new Map(
			sections.map((s) => [s.id, s.heading.replace(/^#+\s*/, "")]),
		);
		const byDate = new Map<string, SectionEntry[]>();
		for (const entry of this.entries) {
			if (!byDate.has(entry.date)) byDate.set(entry.date, []);
			byDate.get(entry.date)!.push(entry);
		}

		for (const date of [...byDate.keys()].sort().reverse()) {
			const day = feed.createDiv({ cls: "qj-feed-day" });
			day.createSpan({ cls: "qj-feed-day-label", text: this.dayLabel(date) });
			for (const entry of byDate.get(date)!) {
				const section = sections.find((s) => s.id === entry.sectionId);
				if (!section) continue;
				const item = day.createDiv({ cls: "qj-feed-item" });

				const head = item.createDiv({ cls: "qj-feed-head" });
				const meta = head.createDiv({ cls: "qj-feed-meta" });
				meta.createSpan({ text: sectionName.get(entry.sectionId) ?? "" });
				if (entry.label) meta.createSpan({ cls: "qj-feed-label", text: entry.label });
				if (entry.time) meta.createSpan({ cls: "qj-feed-time", text: entry.time });

				const actions = head.createDiv({ cls: "qj-feed-actions" });
				this.actionButton(actions, "pencil", t("编辑"), () => this.editEntry(section, entry));
				this.actionButton(actions, "trash-2", t("删除"), () => this.deleteEntry(section, entry));
				this.actionButton(actions, "arrow-up-right", t("打开日志"), () => this.jumpTo(date));

				item.createDiv({ cls: "qj-feed-text", text: entry.text });
			}
		}
	}

	private actionButton(parent: HTMLElement, icon: string, label: string, onClick: () => void): void {
		const btn = parent.createEl("button", { cls: "qj-feed-btn" });
		btn.type = "button";
		btn.setAttribute("aria-label", label);
		setIcon(btn, icon);
		btn.onclick = (evt) => {
			evt.stopPropagation();
			onClick();
		};
	}

	private jumpTo(date: string): void {
		const file = new VaultIndex(this.app, this.plugin.config.dailyDir).dailyFile(date);
		if (file) void this.app.workspace.getLeaf(false).openFile(file);
	}

	private editEntry(section: JournalSection, entry: SectionEntry): void {
		new EntryEditModal(
			this.app,
			section.heading.replace(/^#+\s*/, ""),
			entry.content ?? entry.text,
			entry.kind !== "line",
			(content) => {
				void (async () => {
					const result = await this.plugin.capture.editEntry(section, entry, content);
					if (result.ok) {
						await this.loadFeed();
					} else {
						new Notice(this.entryError(result.message));
					}
				})();
			},
		).open();
	}

	private deleteEntry(section: JournalSection, entry: SectionEntry): void {
		new ConfirmModal(
			this.app,
			t("删除这条记录？"),
			entry.text.slice(0, 120),
			async () => {
				const result = await this.plugin.capture.deleteEntry(section, entry);
				if (result.ok) {
					await this.loadFeed();
				} else {
					new Notice(this.entryError(result.message));
				}
			},
			t("删除"),
		).open();
	}

	private entryError(message: string): string {
		if (message === "stale-line") return t("内容已变化，请刷新后重试");
		return `${t("写入失败")}: ${message}`;
	}

	private dayLabel(date: string): string {
		const now = new Date();
		if (date === dateKey(now)) return t("今天");
		const yesterday = new Date(now);
		yesterday.setDate(yesterday.getDate() - 1);
		if (date === dateKey(yesterday)) return t("昨天");
		return date.slice(5); // MM-DD
	}
}
