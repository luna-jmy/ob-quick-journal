/**
 * 日志汇总视图（qj-summary）：期间工具栏 + 统计卡（任务 / 打卡 / 数据）+ 复盘区。
 * 原型阶段：统计全部来自本插件解析（无外部插件依赖）；图表与查询块区段后续里程碑接入。
 */

import { ItemView, setIcon, type TFile, type WorkspaceLeaf } from "obsidian";
import type QuickJournalPlugin from "../main";
import { boolStats, numberStats, taskStats } from "../metrics/aggregate";
import { VaultIndex } from "../services/vault-index";
import {
	type Period,
	type PeriodKind,
	periodOf,
	shiftPeriod,
	dateKey,
	weekKey,
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
		const kinds: PeriodKind[] = ["week", "month", "year"];
		for (const kind of kinds) {
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
		const index = new VaultIndex(this.app, config.dailyDir, config.weeklyDir);
		const days = this.period.days.map(dateKey);
		const { records } = await index.collectDayRecords(this.period.days);

		const header = body.createDiv({ cls: "qj-period-header" });
		header.createSpan({
			cls: "qj-period-count",
			text: `${records.size} ${t("条日志")}`,
		});

		if (records.size === 0) {
			body.createDiv({ cls: "qj-empty", text: t("本周还没有日志，先去记一条") });
			return;
		}

		const cards = body.createDiv({ cls: "qj-cards" });

		// 任务卡
		const tasks = taskStats(days, records);
		this.statCard(cards, t("任务"), [
			{ label: t("完成"), value: String(tasks.doneInPeriod) },
			{ label: t("新建"), value: String(tasks.createdInPeriod) },
			{ label: t("记录"), value: `${tasks.done}/${tasks.total}` },
		]);

		// 打卡卡（每字段一行 + 比例条）
		for (const section of config.registry.daily) {
			if (section.kind === "bool") {
				const stats = boolStats(section, days, records);
				const card = this.cardShell(cards, t("打卡"));
				for (const s of stats) {
					const row = card.createDiv({ cls: "qj-checkin-row" });
					row.createSpan({ cls: "qj-checkin-label", text: t(s.label) });
					const bar = row.createDiv({ cls: "qj-bar" });
					const recorded = s.yes + s.no;
					if (recorded > 0) {
						bar.createSpan({
							cls: "qj-bar-yes",
							attr: { style: `flex-grow:${s.yes}` },
						});
						bar.createSpan({
							cls: "qj-bar-no",
							attr: { style: `flex-grow:${s.no}` },
						});
					}
					row.createSpan({
						cls: "qj-checkin-count",
						text:
							recorded > 0
								? `${s.yes} / ${recorded} ${t("记录")} · ${t("缺")} ${s.missingDays}`
								: `${t("缺")} ${s.missingDays}`,
					});
				}
			} else if (section.kind === "number") {
				const stats = numberStats(section, days, records);
				const card = this.cardShell(cards, t("数据记录"));
				for (const s of stats) {
					const row = card.createDiv({ cls: "qj-data-row" });
					row.createSpan({ cls: "qj-checkin-label", text: t(s.label) });
					const unit = s.unit ? ` ${s.unit}` : "";
					row.createSpan({
						cls: "qj-data-value",
						text: s.count > 0 ? `均值 ${s.mean.toFixed(1)}${unit}（${s.min}~${s.max}）` : "—",
					});
				}
			} else {
				// text 字段：原型阶段在汇总里不展开，只提示完成度
				const card = this.cardShell(cards, t("今日小结"));
				card.createDiv({
					cls: "qj-muted",
					text: `${section.fields.length} × ${t("记录")}`,
				});
			}
		}

		// 复盘区（周视图）：打开 / 创建本周复盘笔记
		if (this.kind === "week") {
			const card = this.cardShell(cards, t("复盘"));
			const weekly = index.weeklyFile(weekKey(this.weekStartOfCurrentView()));
			const btn = card.createEl("button", {
				cls: "qj-btn",
				text: weekly ? t("打开复盘笔记") : t("创建复盘笔记"),
			});
			btn.type = "button";
			btn.onclick = async () => {
				let file: TFile | null = weekly;
				if (!file) {
					file = await this.plugin.ensureWeeklyReview(this.period.start);
				}
				if (file) await this.app.workspace.getLeaf(false).openFile(file);
			};
		}
	}

	private weekStartOfCurrentView(): Date {
		return this.kind === "week" ? this.period.start : new Date();
	}

	private cardShell(cards: HTMLElement, title: string): HTMLElement {
		const card = cards.createDiv({ cls: "qj-card" });
		card.createDiv({ cls: "qj-card-title", text: title });
		return card;
	}

	private statCard(
		cards: HTMLElement,
		title: string,
		metrics: { label: string; value: string }[],
	): void {
		const card = this.cardShell(cards, title);
		const grid = card.createDiv({ cls: "qj-metric-grid" });
		for (const m of metrics) {
			const cell = grid.createDiv({ cls: "qj-metric" });
			cell.createSpan({ cls: "qj-metric-value", text: m.value });
			cell.createSpan({ cls: "qj-metric-label", text: m.label });
		}
	}
}
