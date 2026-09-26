/**
 * 速记面板（qj-panel）：Thino 式内容流。
 * 工具栏：时间范围 · 标题筛选（同时控制输入目标与展示范围）· 显示已完成 · 搜索。
 * 条目：任务可点状态符号切换完成、任务/列表互转、编辑、删除、跳转；
 * 段落目标重发 = 进入编辑态（预填现有内容），不再走覆盖确认。
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
import { RolloverService } from "../services/rollover-service";
import type { SectionEntry } from "../parse/section-entries";
import { ConfirmModal } from "../ui/confirm-modal";
import { EntryEditModal } from "../ui/entry-edit-modal";
import { dateKey } from "../periods/period";
import { t } from "../i18n";

export const VIEW_TYPE_QJ_PANEL = "qj-panel";

const FILTER_ALL = "__all__";

export class PanelView extends ItemView {
	private rangeDays = 7;
	private entries: SectionEntry[] = [];
	private feedEl: HTMLElement | null = null;
	private inputEl: HTMLTextAreaElement | null = null;
	private targetId = "";
	/** 筛选（同时控制输入目标与展示范围）；空串 = 全部 */
	private filterId = "";
	private searchText = "";
	/** 顶部功能区收起（手机端把内容区顶上来） */
	private collapsed = false;

	private get showDone(): boolean {
		return this.plugin.config.panel.showCompleted;
	}

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
				if (
					file instanceof TFile &&
					file.path.startsWith(this.plugin.config.journals.daily.dir)
				) {
					this.scheduleRefresh();
				}
			}),
		);
	}

	onunload(): void {
		this.scheduleRefresh.cancel();
		super.onunload();
	}

	private panelSections(): JournalSection[] {
		return this.plugin.config.journals.daily.sections.filter(
			(s) =>
				s.panel === true &&
				(s.type === "text" || s.type === "list" || s.type === "paragraph"),
		);
	}

	/** 输入条可直发的目标：列表（追加）与段落（一天一条，重发即编辑）。 */
	private writableSections(): JournalSection[] {
		return this.panelSections().filter((s) => s.type === "list" || s.type === "paragraph");
	}

	private render(): void {
		const root = this.contentEl;
		root.empty();
		root.addClass("qj-panel-root");

		// 常驻细栏：展开/收起顶部功能区（手机端收起后内容区立刻顶上来）
		const bar = root.createDiv({ cls: "qj-panel-toggle" });
		const toggle = bar.createEl("button", {
			cls: `qj-btn qj-icon-btn${this.collapsed ? " is-active" : ""}`,
		});
		toggle.type = "button";
		toggle.setAttribute("aria-label", this.collapsed ? t("展开录入") : t("收起录入"));
		setIcon(toggle, this.collapsed ? "chevrons-down" : "chevrons-up");
		toggle.onclick = () => {
			this.collapsed = !this.collapsed;
			this.render();
		};
		bar.createSpan({
			cls: "qj-panel-toggle-label",
			text: this.collapsed ? t("展开录入") : t("收起录入"),
		});

		if (!this.collapsed) {
			this.renderToolbar(root);
			this.renderInput(root);
		}
		this.feedEl = root.createDiv({ cls: "qj-feed" });
		void this.loadFeed();
	}

	private renderToolbar(root: HTMLElement): void {
		// ── 工具栏 ──
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

		const filterDrop = new DropdownComponent(toolbar);
		filterDrop.addOption(FILTER_ALL, t("全部"));
		for (const s of this.panelSections()) {
			filterDrop.addOption(s.id, s.heading.replace(/^#+\s*/, ""));
		}
		filterDrop.setValue(this.filterId || FILTER_ALL);
		filterDrop.onChange((value) => {
			this.filterId = value === FILTER_ALL ? "" : value;
			this.render();
		});

		// 未完成任务滚动：从最近一期日志搬到今天（确认后原子迁移）
		const rollBtn = toolbar.createEl("button", { cls: "qj-btn qj-icon-btn" });
		rollBtn.type = "button";
		rollBtn.setAttribute("aria-label", t("滚动未完成任务"));
		setIcon(rollBtn, "calendar-clock");
		rollBtn.onclick = () => void this.rollover();

		const search = toolbar.createEl("input", { cls: "qj-input qj-search" });
		search.type = "search";
		search.placeholder = t("搜索");
		search.value = this.searchText;
		search.oninput = () => {
			this.searchText = search.value;
			this.renderFeed();
		};

		const refresh = toolbar.createEl("button", { cls: "qj-btn qj-icon-btn" });
		refresh.type = "button";
		setIcon(refresh, "refresh-cw");
		refresh.onclick = () => void this.loadFeed();
	}

	private renderInput(root: HTMLElement): void {
		// 筛选选中某个不可直发的标题区（如文本字段区）→ 输入条整体隐藏
		const filterSection = this.filterId
			? this.panelSections().find((s) => s.id === this.filterId)
			: undefined;
		if (filterSection && filterSection.type === "text") return;

		let targets: JournalSection[];
		if (filterSection) {
			targets = [filterSection];
		} else {
			targets = this.writableSections();
		}
		if (targets.length === 0) return;
		if (!targets.some((s) => s.id === this.targetId)) {
			this.targetId = targets[0].id;
		}

		// 卡片式录入区：目标行 / 自增高输入框 / 底部提示 + 发送
		const box = root.createDiv({ cls: "qj-composer" });
		const top = box.createDiv({ cls: "qj-composer-top" });
		if (targets.length > 1) {
			const dropdown = new DropdownComponent(top);
			dropdown.addOptions(
				Object.fromEntries(targets.map((s) => [s.id, s.heading.replace(/^#+\s*/, "")])),
			);
			dropdown.setValue(this.targetId);
			dropdown.onChange((value) => {
				this.targetId = value;
				updateHint();
			});
		} else {
			top.createSpan({
				cls: "qj-composer-target",
				text: targets[0].heading.replace(/^#+\s*/, ""),
			});
		}

		const input = box.createEl("textarea", { cls: "qj-composer-input" });
		input.rows = 1;
		input.placeholder = t("记点什么…");
		this.inputEl = input;
		const grow = () => {
			input.setCssProps({ height: "auto" });
			input.setCssProps({ height: `${Math.min(input.scrollHeight, 160)}px` });
		};
		input.addEventListener("input", grow);
		input.addEventListener("keydown", (evt) => {
			if (evt.key !== "Enter") return;
			const target = targets.find((s) => s.id === this.targetId) ?? targets[0];
			if (!evt.shiftKey) {
				evt.preventDefault();
				void this.send();
				return;
			}
			// 列表不支持换行：多行内容面板无法按行识别，只有段落可以 Shift+Enter
			if (target.type !== "paragraph") evt.preventDefault();
		});

		const foot = box.createDiv({ cls: "qj-composer-foot" });
		const hint = foot.createSpan({ cls: "qj-composer-hint" });
		const updateHint = () => {
			const target = targets.find((s) => s.id === this.targetId) ?? targets[0];
			hint.setText(
				target.type === "paragraph"
					? t("Enter 发送 · Shift+Enter 换行")
					: t("Enter 发送"),
			);
		};
		updateHint();
		const send = foot.createEl("button", { cls: "qj-btn qj-btn-primary qj-send-btn" });
		send.type = "button";
		setIcon(send.createSpan({ cls: "qj-btn-icon" }), "send");
		send.createSpan({ text: t("发送") });
		send.onclick = () => void this.send();
	}

	/** 未完成任务滚动：预览 → 确认 → 迁移 → 刷新。 */
	private async rollover(): Promise<void> {
		const service = new RolloverService(this.app, () => this.plugin.config);
		const preview = await service.preview(new Date());
		if (preview === null) {
			new Notice(t("没有可移动的任务"));
			return;
		}
		new ConfirmModal(
			this.app,
			t("移动未完成任务"),
			`${t("来自")} ${preview.sourceDate} · ${preview.blocks.length} ${t("个任务块")}`,
			async () => {
				const result = await service.perform(preview, new Date());
				if (result.ok) {
					new Notice(`${t("已移动")} ${result.moved} ${t("个任务块")} → ${result.from}`);
					await this.loadFeed();
				} else {
					new Notice(`${t("写入失败")}: ${result.message}`);
				}
			},
			t("移动"),
		).open();
	}

	private async send(): Promise<void> {
		const raw = this.inputEl?.value ?? "";
		if (raw.trim() === "") return;
		const section = this.writableSections().find((s) => s.id === this.targetId);
		if (!section) return;
		// 列表条目按行识别：粘贴/输入的多行内容压成单行；段落保留换行
		const value =
			section.type === "paragraph" ? raw.trim() : raw.replace(/\s*\n+\s*/g, " ").trim();
		if (value === "") return;
		if (this.inputEl) this.inputEl.value = "";

		if (section.type === "paragraph") {
			// 段落一天一条：已有内容 → 重发即编辑（预填），不再走覆盖确认
			const today = dateKey(new Date());
			const existing = await this.plugin.capture.paragraphContent(today, section);
			if (existing !== "") {
				new EntryEditModal(this.app, section.heading.replace(/^#+\s*/, ""), existing, true, (content) => {
					void (async () => {
						const result = await this.plugin.capture.editEntry(
							section,
							{ date: today, sectionId: section.id, kind: "paragraph", text: existing },
							content,
						);
						if (!result.ok) new Notice(this.entryError(result.message));
						await this.loadFeed();
					})();
				}).open();
				return;
			}
			await this.plugin.performCapture("daily", section, { values: {}, lineValue: value }, true);
			await this.loadFeed();
			return;
		}

		const result = await this.plugin.capture.performSection(
			"daily",
			section,
			{ values: {}, lineValue: value },
			{ overwrite: false },
		);
		if (result.ok) {
			await this.loadFeed();
		} else if (result.reason === "error") {
			new Notice(`${t("写入失败")}: ${result.message}`);
		}
	}

	private async loadFeed(): Promise<void> {
		const sections = this.panelSections();
		if (this.feedEl === null) return;

		if (sections.length === 0) {
			this.entries = [];
			this.renderFeed();
			return;
		}
		const index = new VaultIndex(this.app, this.plugin.config.journals.daily.dir);
		const today = new Date();
		const days = Array.from({ length: this.rangeDays }, (_, i) => {
			const d = new Date(today);
			d.setDate(d.getDate() - i);
			return d;
		});
		this.entries = await index.collectEntries(days, sections);
		this.renderFeed();
	}

	private visibleEntries(sections: JournalSection[]): SectionEntry[] {
		let list = this.entries;
		if (this.filterId !== "") list = list.filter((e) => e.sectionId === this.filterId);
		if (!this.showDone) {
			list = list.filter((e) => !(e.taskStatus === "x" || e.taskStatus === "X"));
		}
		const q = this.searchText.trim().toLowerCase();
		if (q !== "") {
			const name = new Map(sections.map((s) => [s.id, s.heading.replace(/^#+\s*/, "")]));
			list = list.filter(
				(e) =>
					e.text.toLowerCase().includes(q) ||
					(e.label ?? "").toLowerCase().includes(q) ||
					(name.get(e.sectionId) ?? "").toLowerCase().includes(q),
			);
		}
		return list;
	}

	private renderFeed(): void {
		const feed = this.feedEl;
		if (feed === null) return;
		feed.empty();
		const sections = this.panelSections();
		if (sections.length === 0) {
			feed.createDiv({ cls: "qj-empty", text: t("没有开启内容汇总面板的标题区") });
			return;
		}
		const entries = this.visibleEntries(sections);
		if (entries.length === 0) {
			feed.createDiv({ cls: "qj-empty", text: t("暂无内容，先去记一条") });
			return;
		}

		const sectionName = new Map(sections.map((s) => [s.id, s.heading.replace(/^#+\s*/, "")]));
		const byDate = new Map<string, SectionEntry[]>();
		for (const entry of entries) {
			if (!byDate.has(entry.date)) byDate.set(entry.date, []);
			byDate.get(entry.date)!.push(entry);
		}

		for (const date of [...byDate.keys()].sort().reverse()) {
			const day = feed.createDiv({ cls: "qj-feed-day" });
			day.createSpan({ cls: "qj-feed-day-label", text: this.dayLabel(date) });
			for (const entry of byDate.get(date)!) {
				const section = sections.find((s) => s.id === entry.sectionId);
				if (!section) continue;
				this.renderItem(day, date, section, entry, sectionName.get(entry.sectionId) ?? "");
			}
		}
	}

	private renderItem(
		day: HTMLElement,
		date: string,
		section: JournalSection,
		entry: SectionEntry,
		name: string,
	): void {
		const item = day.createDiv({ cls: "qj-feed-item" });
		const head = item.createDiv({ cls: "qj-feed-head" });
		const meta = head.createDiv({ cls: "qj-feed-meta" });
		// 任务条目：状态符号可点，直接切换完成
		if (entry.taskStatus !== undefined) {
			const toggle = meta.createEl("button", { cls: "qj-feed-toggle" });
			toggle.type = "button";
			toggle.setText(entry.taskStatus === "x" || entry.taskStatus === "X" ? "☑" : "☐");
			toggle.setAttribute("aria-label", t("切换完成"));
			toggle.onclick = (evt) => {
				evt.stopPropagation();
				void (async () => {
					const r = await this.plugin.capture.toggleTaskEntry(section, entry);
					if (!r.ok) new Notice(this.entryError(r.message));
					await this.loadFeed();
				})();
			};
		}
		meta.createSpan({ text: name });
		if (entry.label) meta.createSpan({ cls: "qj-feed-label", text: entry.label });
		if (entry.time) meta.createSpan({ cls: "qj-feed-time", text: entry.time });

		const actions = head.createDiv({ cls: "qj-feed-actions" });
		// 列表行：任务/列表互转、归档（行尾 [archive:: true]，面板隐藏）
		if (entry.kind === "line") {
			this.actionButton(actions, "repeat", t("任务/列表互转"), () => {
				void (async () => {
					const r = await this.plugin.capture.convertEntry(section, entry);
					if (!r.ok) new Notice(this.entryError(r.message));
					await this.loadFeed();
				})();
			});
			this.actionButton(actions, "archive", t("归档"), () => {
				void (async () => {
					const r = await this.plugin.capture.archiveEntry(section, entry);
					if (!r.ok) new Notice(this.entryError(r.message));
					await this.loadFeed();
				})();
			});
		}
		this.actionButton(actions, "pencil", t("编辑"), () => this.editEntry(section, entry));
		this.actionButton(actions, "trash-2", t("删除"), () => this.deleteEntry(section, entry));
		this.actionButton(actions, "arrow-up-right", t("打开日志"), () => this.jumpTo(date));

		item.createDiv({ cls: "qj-feed-text", text: entry.text });
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
		const file = new VaultIndex(this.app, this.plugin.config.journals.daily.dir).dailyFile(date);
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
