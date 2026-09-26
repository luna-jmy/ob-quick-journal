/**
 * 日志汇总视图（qj-summary）：期间工具栏 + 组件化卡片（顺序/增删在编辑模式调整）。
 * 组件实现见 views/components.ts；本文件负责注册表、数据组装、布局与编辑模式。
 * 编辑模式：卡片带拖拽手柄与删除钮，底部「添加组件」面板补齐隐藏组件；
 * 不调宽度，自动排版不变。
 */

import { ItemView, setIcon, type WorkspaceLeaf } from "obsidian";
import type QuickJournalPlugin from "../main";
import { doneByDay, taskStats } from "../metrics/aggregate";
import { VaultIndex } from "../services/vault-index";
import {
	renderCalendar,
	renderCheckin,
	renderFeedMini,
	renderHeatmap,
	renderQuickCapture,
	renderQueryPanel,
	renderTaskChart,
	renderTrend,
	type SummaryCtx,
} from "./components";
import {
	type Period,
	type PeriodKind,
	periodOf,
	shiftPeriod,
	dateKey,
} from "../periods/period";
import { t } from "../i18n";

export const VIEW_TYPE_QJ_SUMMARY = "qj-summary";

const KIND_LABEL: Record<PeriodKind, string> = {
	week: "周",
	month: "月",
	quarter: "季度",
	year: "年",
};

interface ComponentDef {
	id: string;
	title: string;
	/** 限定出现的期间类型（如月历不进年视图） */
	kinds?: PeriodKind[];
	render: (card: HTMLElement, ctx: SummaryCtx) => void | Promise<void>;
}

export class SummaryView extends ItemView {
	private kind: PeriodKind = "week";
	private period: Period = periodOf("week", new Date());
	private editing = false;
	private dragId: string | null = null;

	constructor(leaf: WorkspaceLeaf, private plugin: QuickJournalPlugin) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_QJ_SUMMARY;
	}

	getDisplayText(): string {
		return t("日志汇总");
	}

	getIcon(): string {
		return "notebook-pen";
	}

	getViewData(): string {
		return this.kind;
	}

	setViewData(data: string): void {
		if (data === "month" || data === "year" || data === "week" || data === "quarter") {
			this.kind = data;
		}
	}

	async onOpen(): Promise<void> {
		await this.render();
	}

	async render(): Promise<void> {
		const root = this.contentEl;
		root.empty();
		root.addClass("qj-summary-root");
		this.renderToolbar(root.createDiv({ cls: "qj-toolbar" }));
		await this.renderBody(root.createDiv({ cls: "qj-body" }));
	}

	private renderToolbar(toolbar: HTMLElement): void {
		for (const kind of ["week", "month", "quarter", "year"] as PeriodKind[]) {
			const btn = toolbar.createEl("button", {
				cls: `qj-btn qj-kind-btn${kind === this.kind ? " is-active" : ""}`,
				text: t(KIND_LABEL[kind]),
			});
			btn.type = "button";
			btn.onclick = () => {
				this.kind = kind;
				this.period = periodOf(kind, new Date());
				void this.render();
			};
		}

		const nav = toolbar.createDiv({ cls: "qj-toolbar-nav" });
		const prev = nav.createEl("button", { cls: "qj-btn", text: `‹ ${t("上一期")}` });
		prev.type = "button";
		prev.onclick = () => {
			this.period = shiftPeriod(this.period, -1);
			void this.render();
		};
		nav.createSpan({ cls: "qj-toolbar-key", text: this.period.key });
		const next = nav.createEl("button", { cls: "qj-btn", text: `${t("下一期")} ›` });
		next.type = "button";
		next.onclick = () => {
			this.period = shiftPeriod(this.period, 1);
			void this.render();
		};
		const current = nav.createEl("button", { cls: "qj-btn", text: t("回到本期") });
		current.type = "button";
		current.onclick = () => {
			this.period = periodOf(this.kind, new Date());
			void this.render();
		};

		const edit = nav.createEl("button", {
			cls: `qj-btn qj-icon-btn${this.editing ? " is-active" : ""}`,
		});
		edit.type = "button";
		edit.setAttribute("aria-label", this.editing ? t("退出编辑") : t("编辑模式"));
		setIcon(edit, this.editing ? "check" : "settings-2");
		edit.onclick = () => {
			this.editing = !this.editing;
			void this.render();
		};

		const refresh = nav.createEl("button", { cls: "qj-btn qj-icon-btn" });
		refresh.type = "button";
		setIcon(refresh, "refresh-cw");
		refresh.onclick = () => void this.render();
	}

	/** 组件注册表（title 仅用于编辑模式的添加面板；卡片标题由视图统一画）。 */
	private components(): ComponentDef[] {
		return [
			{
				id: "task-chart",
				title: t("任务完成统计"),
				render: (card, ctx) => {
					const tasks = taskStats(ctx.days, ctx.records);
					const done = doneByDay(ctx.days, ctx.records);
					renderTaskChart(card, ctx, [
						{ label: t("完成"), value: String(tasks.doneInPeriod) },
						{ label: t("新建"), value: String(tasks.createdInPeriod) },
						{ label: t("记录"), value: `${tasks.done}/${tasks.total}` },
					], done);
				},
			},
			{
				id: "checkin",
				title: t("打卡"),
				render: (card, ctx) => renderCheckin(card, ctx),
			},
			{
				id: "trend",
				title: t("数据趋势"),
				render: (card, ctx) => renderTrend(card, ctx),
			},
			{
				id: "calendar",
				title: t("月历"),
				kinds: ["week", "month"],
				render: (card, ctx) => renderCalendar(card, this.app, ctx),
			},
			{
				id: "task-heatmap",
				title: t("任务完成热力图"),
				render: (card, ctx) =>
					renderHeatmap(
						card,
						ctx,
						doneByDay(ctx.days, ctx.records),
						ctx.kind === "year" || ctx.kind === "quarter",
					),
			},
			{
				id: "entry-heatmap",
				title: t("内容记录热力图"),
				render: (card, ctx) => {
					const counts = new Map<string, number>();
					for (const e of ctx.entries) {
						counts.set(e.date, (counts.get(e.date) ?? 0) + 1);
					}
					renderHeatmap(card, ctx, counts, ctx.kind === "year" || ctx.kind === "quarter");
				},
			},
			{
				id: "feed",
				title: t("最近速记"),
				render: (card, ctx) => renderFeedMini(card, ctx),
			},
			{
				id: "queries",
				title: t("查询"),
				render: (card, ctx) => void renderQueryPanel(card, this.app, ctx),
			},
		];
	}

	private hasPanelSections(): boolean {
		return this.plugin.config.journals.daily.sections.some((s) => s.panel === true);
	}

	private async renderBody(body: HTMLElement): Promise<void> {
		const config = this.plugin.config;
		// 非 daily 任务计数（开着时并入周/月/年日志的任务行）
		const extraDirs = config.stats.includeNonDailyTasks
			? (["weekly", "monthly", "annual"] as const)
					.map((type) => config.journals[type].dir)
					.filter((dir) => dir.trim() !== "")
			: [];
		const index = new VaultIndex(this.app, config.journals.daily.dir, extraDirs);
		const days = this.period.days.map(dateKey);
		const records = (await index.collectDayRecords(this.period.days)).records;

		body.createDiv({ cls: "qj-period-header" }).createSpan({
			cls: "qj-period-count",
			text: `${records.size} ${t("条日志")}`,
		});

		const panelSections = config.journals.daily.sections.filter((s) => s.panel === true);
		const entries = panelSections.length
			? await index.collectEntries(this.period.days, panelSections)
			: [];

		const ctx: SummaryCtx = {
			plugin: this.plugin,
			kind: this.kind,
			days,
			records,
			entries,
			component: this,
			editing: this.editing,
			rerender: () => void this.render(),
		};

		// 快速录入固定为顶端整行条（不卡片化、不进编辑布局）
		renderQuickCapture(body.createDiv({ cls: "qj-capture-strip" }), ctx);

		const defs = this.components();
		const visible = config.summaryLayout
			.map((id) => defs.find((d) => d.id === id))
			.filter((d): d is ComponentDef => d !== undefined)
			.filter((d) => d.kinds === undefined || d.kinds.includes(this.kind));

		const cards = body.createDiv({ cls: "qj-cards" });
		if (this.editing) cards.addClass("is-editing");

		for (const def of visible) {
			const wrap = cards.createDiv({ cls: "qj-card-wrap" });
			if (this.editing) this.attachEditChrome(wrap, def.id, def.title);
			const card = wrap.createDiv({ cls: "qj-card" });
			// 标题统一由注册表画（任务图自带表头，不加）
			if (def.id !== "task-chart") {
				card.createDiv({ cls: "qj-card-title", text: def.title });
			}
			await def.render(card, ctx);
		}

		if (this.editing) this.renderAddPalette(cards, defs);
	}

	/** 编辑模式外框：拖拽手柄 + 删除钮；拖放重排保存进 config。 */
	private attachEditChrome(wrap: HTMLElement, id: string, _title: string): void {
		const chrome = wrap.createDiv({ cls: "qj-card-chrome" });
		const handle = chrome.createEl("button", { cls: "qj-feed-btn" });
		handle.type = "button";
		handle.setAttribute("aria-label", t("拖动排序"));
		setIcon(handle, "grip-vertical");
		wrap.setAttribute("data-qj-component", id);

		const del = chrome.createEl("button", { cls: "qj-feed-btn" });
		del.type = "button";
		del.setAttribute("aria-label", t("删除"));
		setIcon(del, "trash-2");
		del.onclick = async () => {
			const layout = this.plugin.config.summaryLayout;
			this.plugin.config.summaryLayout = layout.filter((x) => x !== id);
			await this.plugin.saveConfig();
			void this.render();
		};

		// 拖拽：手柄启动，卡片为目标
		handle.draggable = true;
		wrap.ondragover = (evt) => {
			evt.preventDefault();
			wrap.addClass("is-drop-target");
		};
		wrap.ondragleave = () => wrap.removeClass("is-drop-target");
		wrap.ondrop = (evt) => {
			evt.preventDefault();
			wrap.removeClass("is-drop-target");
			const from = this.dragId;
			const to = wrap.getAttribute("data-qj-component");
			this.dragId = null;
			if (from === null || to === null || from === to) return;
			const layout = [...this.plugin.config.summaryLayout];
			const fromIdx = layout.indexOf(from);
			const toIdx = layout.indexOf(to);
			if (fromIdx < 0 || toIdx < 0) return;
			layout.splice(toIdx, 0, ...layout.splice(fromIdx, 1));
			this.plugin.config.summaryLayout = layout;
			void this.plugin.saveConfig().then(() => this.render());
		};
		handle.ondragstart = (evt) => {
			this.dragId = id;
			if (evt.dataTransfer) {
				evt.dataTransfer.setData("text/plain", id);
				evt.dataTransfer.effectAllowed = "move";
			}
		};
	}

	/** 编辑模式底部的「添加组件」面板（列出当前布局之外的组件）。 */
	private renderAddPalette(cards: HTMLElement, defs: ComponentDef[]): void {
		const hidden = defs.filter((d) => !this.plugin.config.summaryLayout.includes(d.id));
		const card = cards.createDiv({ cls: "qj-card qj-add-palette" });
		card.createDiv({ cls: "qj-card-title", text: t("添加组件") });
		if (hidden.length === 0) {
			card.createDiv({ cls: "qj-muted", text: t("所有组件均已显示") });
			return;
		}
		const row = card.createDiv({ cls: "qj-capture-row" });
		for (const def of hidden) {
			const btn = row.createEl("button", { cls: "qj-btn", text: `+ ${def.title}` });
			btn.type = "button";
			btn.onclick = async () => {
				this.plugin.config.summaryLayout.push(def.id);
				await this.plugin.saveConfig();
				void this.render();
			};
		}
	}
}
