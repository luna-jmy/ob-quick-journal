/**
 * 日志汇总视图（qj-summary）：期间工具栏 + 组件化卡片。
 * 组件：快速录入 / 任务统计（柱状）/ 打卡汇总 / 数据趋势 / 月历 /
 * 任务完成热力图（近一年）/ 内容记录热力图（期内）/ 最近速记 / 日志内查询块。
 * 组件实现见 views/components.ts；本文件只做数据组装与布局。
 */

import { ItemView, setIcon, type WorkspaceLeaf } from "obsidian";
import type QuickJournalPlugin from "../main";
import { doneByDay, numberStats, taskStats } from "../metrics/aggregate";
import { VaultIndex } from "../services/vault-index";
import { dedupeQueries, findQueryBlocks } from "../parse/query-blocks";
import {
	cardShell,
	renderBarChart,
	renderCalendar,
	renderCheckin,
	renderFeedMini,
	renderHeatmap,
	renderQuickCapture,
	renderQueryPanel,
	renderTrend,
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
	year: "年",
};

export class SummaryView extends ItemView {
	private kind: PeriodKind = "week";
	private period: Period = periodOf("week", new Date());

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
		if (data === "month" || data === "year" || data === "week") this.kind = data;
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
		for (const kind of ["week", "month", "year"] as PeriodKind[]) {
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
		const refresh = nav.createEl("button", { cls: "qj-btn qj-icon-btn" });
		refresh.type = "button";
		setIcon(refresh, "refresh-cw");
		refresh.onclick = () => void this.render();
	}

	private async renderBody(body: HTMLElement): Promise<void> {
		const config = this.plugin.config;
		const index = new VaultIndex(this.app, config.dailyDir);
		const days = this.period.days.map(dateKey);

		// 期间数据
		const periodResult = await index.collectDayRecords(this.period.days);
		const records = periodResult.records;
		body.createDiv({ cls: "qj-period-header" }).createSpan({
			cls: "qj-period-count",
			text: `${records.size} ${t("条日志")}`,
		});

		// 近一年数据（热力图 / 月历徽标）
		const today = new Date();
		const yearDays = Array.from({ length: 365 }, (_, i) => {
			const d = new Date(today);
			d.setDate(d.getDate() - (364 - i));
			return d;
		});
		const yearRecords = (await index.collectDayRecords(yearDays)).records;
		const yearDaysKeys = yearDays.map(dateKey);
		const doneYear = doneByDay(yearDaysKeys, yearRecords);

		// 面板条目（最近速记 + 内容热力图）
		const panelSections = config.sections.filter((s) => s.panel === true);
		const entries = panelSections.length
			? await index.collectEntries(this.period.days, panelSections)
			: [];
		const entryCounts = new Map<string, number>();
		for (const e of entries) {
			entryCounts.set(e.date, (entryCounts.get(e.date) ?? 0) + 1);
		}

		// ── 组件布局 ──
		renderQuickCapture(body.createDiv({ cls: "qj-capture-strip" }), this.plugin);

		const cards = body.createDiv({ cls: "qj-cards" });

		// 任务统计卡（数字版）
		const tasks = taskStats(days, records);
		const taskCard = cardShell(cards, t("任务"));
		const grid = taskCard.createDiv({ cls: "qj-metric-grid" });
		for (const m of [
			{ label: t("完成"), value: tasks.doneInPeriod },
			{ label: t("新建"), value: tasks.createdInPeriod },
			{ label: t("记录"), value: `${tasks.done}/${tasks.total}` },
		]) {
			const cell = grid.createDiv({ cls: "qj-metric" });
			cell.createSpan({ cls: "qj-metric-value", text: String(m.value) });
			cell.createSpan({ cls: "qj-metric-label", text: m.label });
		}

		// 柱状图：周/月按天、年按月
		if (this.kind === "year") {
			const byMonth = new Map<number, number>();
			for (const [day, n] of doneYear) {
				const m = Number(day.slice(5, 7)) - 1;
				byMonth.set(m, (byMonth.get(m) ?? 0) + n);
			}
			renderBarChart(
				cards,
				Array.from({ length: 12 }, (_, m) => ({
					label: String(m + 1).padStart(2, "0"),
					value: byMonth.get(m) ?? 0,
				})),
			);
		} else {
			renderBarChart(
				cards,
				days.map((d) => ({ label: d.slice(8), value: doneYear.get(d) ?? 0 })),
			);
		}

		renderCheckin(cards, config.sections, days, records);

		// 数据趋势：数值字段逐日折线
		const trendFields = config.sections
			.filter((s) => s.type === "data")
			.flatMap((s) => {
				const stats = numberStats(s.fields, days, records);
				return stats
					.filter((st) => st.count > 0)
					.map((st) => {
						const values = new Map<string, number>();
						for (const day of days) {
							const raw = records.get(day)?.fieldValues[st.key];
							if (raw === undefined || raw === "") continue;
							const n = Number(raw);
							if (Number.isFinite(n)) values.set(day, n);
						}
						return { label: st.label, unit: st.unit, values, days };
					});
			});
		if (trendFields.length > 0) renderTrend(cards, trendFields);

		// 月历（期间起始月）
		renderCalendar(
			cards,
			this.app,
			config.dailyDir,
			this.period.start.getFullYear(),
			this.period.start.getMonth(),
			doneYear,
			new Set(yearRecords.keys()),
		);

		// 热力图 ×2
		renderHeatmap(cards, t("任务完成热力图"), yearDaysKeys, doneYear);
		if (panelSections.length > 0) {
			renderHeatmap(cards, t("内容记录热力图"), days, entryCounts);
		}

		// 最近速记
		renderFeedMini(cards, this.plugin, entries);

		// 查询块（期内日志）
		const texts = await index.periodTexts(this.period.days);
		const blocks = dedupeQueries(
			texts.flatMap(({ date, text }) => findQueryBlocks(text, `${config.dailyDir}/${date}.md`)),
		);
		await renderQueryPanel(cards, this.app, blocks, this);
	}
}
