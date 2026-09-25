/**
 * 日志汇总的组件集（参考 ob-workspace 的组件形态）：每个组件往卡片容器里画自己。
 * 数据全部来自本插件解析；查询块组件经 bridge 委托原插件渲染（探测 + 降级）。
 * 图表原生 SVG/CSS 自绘，只用 Obsidian CSS 变量（SPEC §6.1：不依赖 Charts）。
 */

import type { App, Component } from "obsidian";
import type QuickJournalPlugin from "../main";
import type { JournalSection } from "../types";
import type { SectionEntry } from "../parse/section-entries";
import { taskSymbol } from "../parse/line-ops";
import type { QueryBlock } from "../parse/query-blocks";
import { QueryBridge } from "../services/dataview-bridge";
import { VaultIndex } from "../services/vault-index";
import { boolStats, numberStats } from "../metrics/aggregate";
import type { DayRecord } from "../metrics/day-record";
import { monthGrid } from "../periods/month-grid";
import { dateKey } from "../periods/period";
import { t } from "../i18n";

export function cardShell(parent: HTMLElement, title: string): HTMLElement {
	const card = parent.createDiv({ cls: "qj-card" });
	card.createDiv({ cls: "qj-card-title", text: title });
	return card;
}

/** 快速录入组件：每个标题区一枚按钮，点开捕获弹窗。 */
export function renderQuickCapture(parent: HTMLElement, plugin: QuickJournalPlugin): void {
	const card = cardShell(parent, t("快速录入"));
	const row = card.createDiv({ cls: "qj-capture-row" });
	for (const section of plugin.config.sections) {
		const btn = row.createEl("button", { cls: "qj-btn", text: section.heading.replace(/^#+\s*/, "") });
		btn.type = "button";
		btn.onclick = () => plugin.openSectionCapture(section);
	}
}

/** 柱状图组件：期间内完成任务数（周/月按天、年按月）。 */
export function renderBarChart(parent: HTMLElement, data: { label: string; value: number }[]): void {
	const card = cardShell(parent, t("任务完成统计"));
	const max = Math.max(1, ...data.map((d) => d.value));
	const chart = card.createDiv({ cls: "qj-bars" });
	data.forEach((d, i) => {
		const col = chart.createDiv({ cls: "qj-bar-col" });
		col.createDiv({
			cls: "qj-bar-v",
			attr: { style: `height:${Math.round((d.value / max) * 100)}%` },
			text: d.value > 0 ? String(d.value) : "",
		});
		if (i === 0 || i === data.length - 1 || data.length <= 16 || i % 3 === 0) {
			col.createSpan({ cls: "qj-bar-l", text: d.label });
		} else {
			col.createSpan({ cls: "qj-bar-l", text: " " });
		}
	});
}

/** 热力图组件（任务完成 / 内容记录共用）：days 为升序连续日期，counts 提供每日量。 */
export function renderHeatmap(
	parent: HTMLElement,
	title: string,
	days: string[],
	counts: Map<string, number>,
): void {
	const card = cardShell(parent, title);
	const grid = card.createDiv({ cls: "qj-heatmap" });
	const max = Math.max(1, ...counts.values());
	for (const day of days) {
		const n = counts.get(day) ?? 0;
		const level = n === 0 ? 0 : Math.min(4, 1 + Math.ceil((n / max) * 4) - 1);
		grid.createDiv({
			cls: `qj-hm-cell qj-hm-l${level}`,
			attr: { title: `${day} · ${n}` },
		});
	}
}

/** 数据趋势组件：每个数值字段一条 SVG 折线（缺日跳过连接）。 */
export function renderTrend(
	parent: HTMLElement,
	fields: { label: string; unit?: string; values: Map<string, number>; days: string[] }[],
): void {
	const card = cardShell(parent, t("数据趋势"));
	for (const f of fields) {
		const row = card.createDiv({ cls: "qj-trend-row" });
		row.createSpan({ cls: "qj-checkin-label", text: f.label });
		const points: { x: number; y: number }[] = [];
		const values = f.days.map((d) => f.values.get(d)).filter((v): v is number => v !== undefined);
		if (values.length < 2) {
			row.createSpan({ cls: "qj-muted", text: values.length === 1 ? String(values[0]) : "—" });
			continue;
		}
		const min = Math.min(...values);
		const max = Math.max(...values);
		const span = max - min || 1;
		const W = 100;
		const H = 30;
		f.days.forEach((day, i) => {
			const v = f.values.get(day);
			if (v === undefined) return;
			points.push({ x: (i / (f.days.length - 1)) * W, y: H - ((v - min) / span) * H });
		});
		const line = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
		const svg = row.createSvg("svg", {
			attr: { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "none" },
			cls: "qj-trend-svg",
		});
		svg.appendChild(createSvgEl(row, "polyline", { points: line }));
		const unit = f.unit ? ` ${f.unit}` : "";
		row.createSpan({ cls: "qj-data-value", text: `${values[values.length - 1]}${unit}` });
	}
}

function createSvgEl(host: HTMLElement, tag: string, attrs: Record<string, string>): SVGElement {
	// ownerDocument 从宿主元素取，避免裸全局 document（obsidian 1.8.7 无 activeDocument 导出）
	const el = host.ownerDocument.createElementNS("http://www.w3.org/2000/svg", tag);
	for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
	return el;
}

/** 月历组件：格子带日号、完成数徽标、有日记圆点；点击打开当日日志。 */
export function renderCalendar(
	parent: HTMLElement,
	app: App,
	dailyDir: string,
	year: number,
	month0: number,
	done: Map<string, number>,
	hasNote: Set<string>,
): void {
	const card = cardShell(parent, `${year}-${String(month0 + 1).padStart(2, "0")} ${t("月历")}`);
	const weekdays = ["一", "二", "三", "四", "五", "六", "日"].map((w) => t(w));
	const grid = card.createDiv({ cls: "qj-cal" });
	for (const w of weekdays) grid.createDiv({ cls: "qj-cal-head", text: w });
	const today = dateKey(new Date());
	const index = new VaultIndex(app, dailyDir);
	for (const week of monthGrid(year, month0)) {
		for (const cell of week) {
			const el = grid.createDiv({ cls: `qj-cal-cell${cell.inMonth ? "" : " qj-cal-out"}` });
			if (!cell.inMonth) continue;
			if (cell.key === today) el.addClass("is-today");
			el.createSpan({ cls: "qj-cal-day", text: String(cell.date.getDate()) });
			const n = done.get(cell.key) ?? 0;
			if (n > 0) el.createSpan({ cls: "qj-cal-badge", text: String(n) });
			if (hasNote.has(cell.key)) el.createSpan({ cls: "qj-cal-dot" });
			el.onclick = () => {
				const file = index.dailyFile(cell.key);
				if (file) void app.workspace.getLeaf(false).openFile(file);
			};
		}
	}
}

/** 打卡汇总组件（沿用比例条形态）。 */
export function renderCheckin(
	parent: HTMLElement,
	sections: JournalSection[],
	days: string[],
	records: Map<string, DayRecord>,
): void {
	for (const section of sections) {
		if (section.type !== "checkin") continue;
		const stats = boolStats(section.fields, days, records);
		const card = cardShell(parent, section.heading.replace(/^#+\s*/, ""));
		for (const s of stats) {
			const row = card.createDiv({ cls: "qj-checkin-row" });
			row.createSpan({ cls: "qj-checkin-label", text: s.label });
			const bar = row.createDiv({ cls: "qj-bar" });
			const recorded = s.yes + s.no;
			if (recorded > 0) {
				bar.createSpan({ cls: "qj-bar-yes", attr: { style: `flex-grow:${s.yes}` } });
				bar.createSpan({ cls: "qj-bar-no", attr: { style: `flex-grow:${s.no}` } });
			}
			row.createSpan({
				cls: "qj-checkin-count",
				text:
					recorded > 0
						? `${s.yes} / ${recorded} ${t("记录")} · ${t("缺")} ${s.missingDays}`
						: `${t("缺")} ${s.missingDays}`,
			});
		}
	}
}

/** 最近速记组件：期内最新若干条，按钮跳速记面板。 */
export function renderFeedMini(parent: HTMLElement, plugin: QuickJournalPlugin, entries: SectionEntry[]): void {
	const card = cardShell(parent, t("最近速记"));
	const latest = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8);
	if (latest.length === 0) {
		card.createDiv({ cls: "qj-muted", text: t("暂无内容，先去记一条") });
	} else {
		const names = new Map(
			plugin.config.sections
				.filter((s) => s.panel === true)
				.map((s) => [s.id, s.heading.replace(/^#+\s*/, "")]),
		);
		for (const e of latest) {
			const row = card.createDiv({ cls: "qj-mini-row" });
			row.createSpan({
				cls: "qj-feed-meta",
				text: `${names.get(e.sectionId) ?? ""}${e.time ? ` · ${e.time}` : ""}`,
			});
			// 小卡没有切换按钮，这里按 taskStatus 补状态符号
			const text =
				e.taskStatus !== undefined ? `${taskSymbol(e.taskStatus)} ${e.text}` : e.text;
			row.createSpan({ cls: "qj-mini-text", text: text.replace(/\n/g, " ") });
		}
	}
	const more = card.createEl("button", { cls: "qj-btn", text: t("打开速记面板") });
	more.type = "button";
	more.onclick = () => void plugin.openView("qj-panel");
}

/** 查询块组件：期内日志的 dataview / dataviewjs / tasks 块，委托原插件渲染。 */
export async function renderQueryPanel(
	parent: HTMLElement,
	app: App,
	blocks: QueryBlock[],
	component: Component,
): Promise<void> {
	const card = cardShell(parent, t("日志内查询块"));
	if (blocks.length === 0) {
		card.createDiv({ cls: "qj-muted", text: t("暂无查询块") });
		return;
	}
	const bridge = new QueryBridge(app);
	for (const block of blocks) {
		const wrap = card.createDiv({ cls: "qj-query-block" });
		wrap.createSpan({ cls: "qj-query-chip", text: block.kind });
		const body = wrap.createDiv({ cls: "qj-query-body" });
		let ok = false;
		if (block.kind === "dataview") {
			ok = await bridge.renderDvQuery(block.code, block.source, body, component);
		} else if (block.kind === "dataviewjs") {
			ok = bridge.renderDvJs(block.code, body, component, block.source);
		} else {
			ok = await bridge.renderTasksQuery(block.code, block.source, body, component);
		}
		if (!ok) {
			body.empty();
			body.createDiv({
				cls: "qj-muted",
				text:
					block.kind === "tasks" && !bridge.tasksAvailable
						? t("需要 Tasks 渲染")
						: block.kind !== "tasks" && !bridge.dataviewAvailable
							? t("需要 Dataview 渲染")
							: t("渲染失败"),
			});
		}
	}
}
