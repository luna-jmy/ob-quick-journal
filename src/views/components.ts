/**
 * 日志汇总的组件集（参考 ob-workspace 的组件形态）：每个组件往卡片容器里画自己。
 * 数据全部来自本插件解析；查询块组件经 bridge 委托原插件渲染（探测 + 降级）。
 * 图表原生 SVG/CSS 自绘，只用 Obsidian CSS 变量（SPEC §6.1：不依赖 Charts）。
 */

import { type App, type Component } from "obsidian";
import type QuickJournalPlugin from "../main";
import type { PeriodType, QueryKind } from "../types";
import type { SectionEntry } from "../parse/section-entries";
import { taskSymbol } from "../parse/line-ops";
import { parseFieldLines } from "../parse/field-lines";
import { noteKeyFor } from "../capture/skeleton";
import { QueryBridge } from "../services/dataview-bridge";
import { VaultIndex } from "../services/vault-index";
import { boolStats, doneByDay } from "../metrics/aggregate";
import { compareVectors, radarGeometry, radarRenderable } from "../metrics/radar";
import type { DayRecord } from "../metrics/day-record";
import { monthGrid } from "../periods/month-grid";
import type { PeriodKind } from "../periods/period";
import { dateKey } from "../periods/period";
import { t } from "../i18n";

export interface SummaryCtx {
	plugin: QuickJournalPlugin;
	/** 当前期间类型（决定热力图形态、柱状图粒度、月历是否出现） */
	kind: PeriodKind;
	days: string[];
	records: Map<string, DayRecord>;
	entries: SectionEntry[];
	/** 已完成任务标识（统计口径） */
	doneMarkers: string[];
	/** 视图自身（MarkdownRenderer / executeJs 的组件归属） */
	component: Component;
	/** 编辑模式（查询块显示录入 UI 而不是渲染结果） */
	editing: boolean;
	/** 编辑操作后重渲染整个视图 */
	rerender: () => void;
}

const TYPE_PREFIX: Record<PeriodType, string> = {
	daily: "",
	weekly: "周 · ",
	monthly: "月 · ",
	quarterly: "季 · ",
	annual: "年 · ",
};

/** 汇总视图期间 → 对应的日志类型。录入条 / 雷达图 / 汇总页签开关共用。 */
export const PERIOD_KIND_TO_TYPE: Partial<Record<PeriodKind, PeriodType>> = {
	week: "weekly",
	month: "monthly",
	quarter: "quarterly",
	year: "annual",
};

export function cardShell(parent: HTMLElement, title: string): HTMLElement {
	const card = parent.createDiv({ cls: "qj-card" });
	card.createDiv({ cls: "qj-card-title", text: title });
	return card;
}

/** 快速录入条：仅当前视图对应期间日志的标题区按钮（该期间无标题区时由视图整条隐藏）。 */
export function renderQuickCapture(card: HTMLElement, ctx: SummaryCtx): void {
	const type = PERIOD_KIND_TO_TYPE[ctx.kind];
	if (type === undefined) return;
	renderCaptureRow(card, ctx, type);
}

/** 日志录入卡片：日志（daily）标题区按钮，所有期间视图可见。 */
export function renderDailyCapture(card: HTMLElement, ctx: SummaryCtx): void {
	renderCaptureRow(card, ctx, "daily");
}

/** 按钮行共用：某日志类型的全部标题区按钮（前缀 + 去井号标题）。 */
function renderCaptureRow(card: HTMLElement, ctx: SummaryCtx, type: PeriodType): void {
	const row = card.createDiv({ cls: "qj-capture-row" });
	for (const section of ctx.plugin.config.journals[type].sections) {
		const btn = row.createEl("button", {
			cls: "qj-btn",
			text: `${TYPE_PREFIX[type]}${section.heading.replace(/^#+\s*/, "")}`,
		});
		btn.type = "button";
		btn.onclick = () => ctx.plugin.openSectionCapture(type, section);
	}
}

/** 任务图组件：指标行（完成/新建/记录）+ 柱状图（周/月按天、年按月）合并为一张卡。 */
export function renderTaskChart(
	card: HTMLElement,
	ctx: SummaryCtx,
	metrics: { label: string; value: string }[],
	done: Map<string, number>,
): void {
	const grid = card.createDiv({ cls: "qj-metric-grid" });
	for (const m of metrics) {
		const cell = grid.createDiv({ cls: "qj-metric" });
		cell.createSpan({ cls: "qj-metric-value", text: m.value });
		cell.createSpan({ cls: "qj-metric-label", text: m.label });
	}

	const data =
		ctx.kind === "year" || ctx.kind === "quarter"
			? Array.from({ length: 12 }, (_, m) => {
					let sum = 0;
					for (const [day, n] of done) {
						if (Number(day.slice(5, 7)) - 1 === m) sum += n;
					}
					return { label: String(m + 1).padStart(2, "0"), value: sum };
				})
			: ctx.days.map((d) => ({ label: d.slice(8), value: done.get(d) ?? 0 }));

	const max = Math.max(1, ...data.map((d) => d.value));
	const chart = card.createDiv({ cls: "qj-bars" });
	for (const d of data) {
		const col = chart.createDiv({ cls: "qj-bar-col" });
		const plot = col.createDiv({ cls: "qj-bar-plot" });
		if (d.value > 0) plot.createSpan({ cls: "qj-bar-count", text: String(d.value) });
		plot.createDiv({
			cls: "qj-bar-v",
			attr: { style: `height:${Math.max(3, Math.round((d.value / max) * 100))}%` },
		});
		col.createSpan({ cls: "qj-bar-l", text: d.label });
	}
}

/**
 * 热力图组件（任务完成 / 内容记录共用），**随期间类型自适应**：
 * 周 = 7 个大格（星期 + 数量）；月 = 7 列日历格（日号 + 数量）；年 = 小格全年、整行展开。
 * 画进给定的卡片容器（标题由视图的注册表负责）。
 */
export function renderHeatmap(
	card: HTMLElement,
	ctx: SummaryCtx,
	counts: Map<string, number>,
	wide: boolean,
): void {
	if (wide) card.addClass("qj-card--wide");
	const max = Math.max(1, ...counts.values());
	const weekdays = ["一", "二", "三", "四", "五", "六", "日"].map((w) => t(w));

	if (ctx.kind === "week") {
		const row = card.createDiv({ cls: "qj-hm-week" });
		ctx.days.forEach((day, i) => {
			const n = counts.get(day) ?? 0;
			const box = row.createDiv({
				cls: `qj-hm-big qj-hm-l${level(n, max)}`,
				attr: { title: `${day} · ${n}` },
			});
			box.createSpan({ cls: "qj-hm-big-label", text: weekdays[i] });
			box.createSpan({ cls: "qj-hm-big-count", text: String(n) });
		});
		return;
	}

	if (ctx.kind === "month") {
		const grid = card.createDiv({ cls: "qj-hm-grid" });
		for (const w of weekdays) grid.createDiv({ cls: "qj-cal-head", text: w });
		const first = new Date(`${ctx.days[0]}T00:00:00`);
		const weeks = monthGrid(first.getFullYear(), first.getMonth());
		for (const week of weeks) {
			for (const cell of week) {
				const n = cell.inMonth ? (counts.get(cell.key) ?? 0) : -1;
				const box = grid.createDiv({
					cls: `qj-hm-cell-m${n < 0 ? " qj-cal-out" : ` qj-hm-l${level(n, max)}`}`,
					attr: { title: `${cell.key} · ${Math.max(0, n)}` },
				});
				box.createSpan({ cls: "qj-hm-cell-day", text: String(cell.date.getDate()) });
				if (n > 0) box.createSpan({ cls: "qj-hm-cell-count", text: String(n) });
			}
		}
		return;
	}

	// 年（或回退）：经典小格，7 行列流，横向铺满
	const grid = card.createDiv({ cls: "qj-heatmap" });
	for (const day of ctx.days) {
		const n = counts.get(day) ?? 0;
		grid.createDiv({
			cls: `qj-hm-cell qj-hm-l${level(n, max)}`,
			attr: { title: `${day} · ${n}` },
		});
	}
}

function level(n: number, max: number): number {
	if (n === 0) return 0;
	return Math.min(4, Math.max(1, Math.ceil((n / max) * 4)));
}

/** 数据趋势组件：单选字段一条折线（不同字段单位/量纲不同，不混画）。 */
export function renderTrend(card: HTMLElement, ctx: SummaryCtx): void {
	const config = ctx.plugin.config;
	const fields: { id: string; label: string; unit?: string; values: Map<string, number> }[] = [];
	for (const section of config.journals.daily.sections) {
		if (section.type !== "data") continue;
		for (const f of section.fields) {
			const values = new Map<string, number>();
			for (const day of ctx.days) {
				const raw = ctx.records.get(day)?.fieldValues[f.key];
				if (raw === undefined || raw === "") continue;
				const n = Number(raw);
				if (Number.isFinite(n)) values.set(day, n);
			}
			if (values.size > 0) fields.push({ id: `${section.id}::${f.key}`, label: f.label, unit: f.unit, values });
		}
	}
	if (fields.length === 0) {
		card.createDiv({ cls: "qj-muted", text: "—" });
		return;
	}

	const selected = fields.find((f) => f.id === config.trendSelection) ?? fields[0];
	const select = card.createEl("select", { cls: "qj-input qj-trend-select" });
	for (const f of fields) {
		const opt = select.createEl("option", { text: f.label, attr: { value: f.id } });
		if (f.id === selected.id) opt.selected = true;
	}
	select.onchange = async () => {
		config.trendSelection = select.value;
		await ctx.plugin.saveConfig();
		ctx.rerender();
	};

	renderSparkline(card, selected, ctx.days);
}

function renderSparkline(
	card: HTMLElement,
	f: { label: string; unit?: string; values: Map<string, number> },
	days: string[],
): void {
	const row = card.createDiv({ cls: "qj-trend-row" });
	const values = days.map((d) => f.values.get(d)).filter((v): v is number => v !== undefined);
	if (values.length === 0) {
		row.createSpan({ cls: "qj-muted", text: "—" });
		return;
	}
	const min = Math.min(...values);
	const max = Math.max(...values);
	const span = max - min;
	const W = 100;
	const H = 60;
	const PAD = 5;
	// 全等值时画居中的平线（不再贴底）；正常时上下留边
	const yOf = (v: number): number =>
		span === 0 ? H / 2 : PAD + (1 - (v - min) / span) * (H - 2 * PAD);
	const points = days
		.map((day, i) => {
			const v = f.values.get(day);
			if (v === undefined) return null;
			const x = days.length === 1 ? W - 3 : 2 + (i / (days.length - 1)) * (W - 4);
			return { x, y: yOf(v) };
		})
		.filter((p): p is { x: number; y: number } => p !== null);

	// Y 轴标签用 HTML 画（SVG 文本在拉伸坐标系里会变形）
	const fmt = (v: number): string => (Number.isInteger(v) ? String(v) : v.toFixed(1));
	const yaxis = row.createDiv({ cls: "qj-trend-yaxis" });
	yaxis.createSpan({ text: fmt(max) });
	yaxis.createSpan({ text: fmt((max + min) / 2) });
	yaxis.createSpan({ text: fmt(min) });

	const plot = row.createDiv({ cls: "qj-trend-plot" });
	const svg = plot.createSvg("svg", {
		attr: { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "none" },
		cls: "qj-trend-svg",
	});
	// 网格（max/mid/min 三条虚线）+ 轴线
	for (const y of [PAD, H / 2, H - PAD]) {
		svg.appendChild(
			createSvgEl(row, "line", {
				x1: "2",
				y1: y.toFixed(1),
				x2: String(W - 2),
				y2: y.toFixed(1),
				"class": "qj-trend-grid",
			}),
		);
	}
	svg.appendChild(createSvgEl(row, "line", { x1: "2", y1: "0", x2: "2", y2: String(H), "class": "qj-trend-axis" }));
	svg.appendChild(
		createSvgEl(row, "line", { x1: "0", y1: String(H - 1), x2: String(W), y2: String(H - 1), "class": "qj-trend-axis" }),
	);
	if (points.length >= 2) {
		const line = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
		svg.appendChild(createSvgEl(row, "polyline", { points: line }));
	}
	for (const p of points) {
		svg.appendChild(
			createSvgEl(row, "circle", {
				cx: p.x.toFixed(1),
				cy: p.y.toFixed(1),
				r: "2",
			}),
		);
	}

	// X 轴：首/中/尾日期
	const xaxis = plot.createDiv({ cls: "qj-trend-xaxis" });
	const mid = days[Math.floor((days.length - 1) / 2)] ?? days[0];
	xaxis.createSpan({ text: days[0].slice(5) });
	xaxis.createSpan({ text: mid.slice(5) });
	xaxis.createSpan({ text: days[days.length - 1].slice(5) });

	const unit = f.unit ? ` ${f.unit}` : "";
	const stats = row.createDiv({ cls: "qj-trend-stats" });
	stats.createSpan({ text: `${t("最新")} ${values[values.length - 1]}${unit}` });
	stats.createSpan({ text: `${t("最大")} ${max}${unit}` });
	stats.createSpan({ text: `${t("最小")} ${min}${unit}` });
}

function createSvgEl(host: HTMLElement, tag: string, attrs: Record<string, string>): SVGElement {
	// ownerDocument 从宿主元素取，避免裸全局 document（obsidian 1.8.7 无 activeDocument 导出）
	const el = host.ownerDocument.createElementNS("http://www.w3.org/2000/svg", tag);
	for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
	return el;
}

/**
 * 对比雷达图组件：当前期间类型对应日志里的对比区段，两个系列画在同一张雷达上。
 * 笔记缺失给一键建骨架（骨架含两系列占位行）；只有一个系列有值时画单多边形。
 */
export async function renderRadar(card: HTMLElement, app: App, ctx: SummaryCtx): Promise<void> {
	const type = PERIOD_KIND_TO_TYPE[ctx.kind];
	const journal = type !== undefined ? ctx.plugin.config.journals[type] : null;
	const sections =
		journal !== null
			? journal.sections.filter((s) => s.type === "compare" && s.compare !== undefined)
			: [];
	if (sections.length === 0) {
		card.createDiv({ cls: "qj-muted", text: "—" });
		return;
	}

	// 带时间部分的字符串按本地时区解析（裸 YYYY-MM-DD 走 UTC）
	const start = new Date(`${ctx.days[0]}T00:00:00`);
	const key = noteKeyFor(type!, start, journal!.filenameFormat);
	const file = new VaultIndex(app, journal!.dir).fileByKey(key);
	if (file === null) {
		const row = card.createDiv({ cls: "qj-radar-empty" });
		row.createSpan({ cls: "qj-muted", text: `${t("未找到期间笔记")} ${key}` });
		const btn = row.createEl("button", { cls: "qj-btn", text: t("创建笔记") });
		btn.type = "button";
		btn.onclick = () => void ctx.plugin.openPeriodNote(type!, key);
		return;
	}

	const noteText = await app.vault.cachedRead(file);
	const fieldValues: Record<string, string> = {};
	for (const fl of parseFieldLines(noteText.split(/\r?\n/))) {
		if (!(fl.key in fieldValues)) fieldValues[fl.key] = fl.value;
	}

	for (const section of sections) {
		const block = card.createDiv({ cls: "qj-radar-block" });
		block.createDiv({
			cls: "qj-checkin-heading",
			text: section.heading.replace(/^#+\s*/, ""),
		});
		const vectors = compareVectors(section, fieldValues);
		const dims = section.fields.map((f) => f.label);
		if (!radarRenderable(vectors, dims)) {
			block.createDiv({ cls: "qj-muted", text: t("暂无对比数据") });
			continue;
		}
		const geo = radarGeometry(dims, vectors);

		const legend = block.createDiv({ cls: "qj-radar-legend" });
		for (const [i, v] of vectors.entries()) {
			const chip = legend.createSpan({ cls: `qj-radar-chip qj-radar-chip--${i === 0 ? "a" : "b"}` });
			chip.createSpan({ cls: "qj-radar-swatch" });
			chip.createSpan({ text: v.label });
		}

		const svg = block.createSvg("svg", {
			attr: { viewBox: `0 0 ${geo.size} ${geo.size}` },
			cls: "qj-radar-svg",
		});
		for (const ring of geo.rings) {
			svg.appendChild(createSvgEl(block, "polygon", { points: ring, "class": "qj-radar-ring" }));
		}
		for (const s of geo.spokes) {
			svg.appendChild(
				createSvgEl(block, "line", {
					x1: s.x1.toFixed(1),
					y1: s.y1.toFixed(1),
					x2: s.x2.toFixed(1),
					y2: s.y2.toFixed(1),
					"class": "qj-radar-spoke",
				}),
			);
		}
		for (const l of geo.labels) {
			const label = createSvgEl(block, "text", {
				x: l.x,
				y: l.y,
				"text-anchor": l.anchor,
				"class": "qj-radar-label",
			});
			label.textContent = l.text;
			svg.appendChild(label);
		}
		for (const [i, s] of geo.series.entries()) {
			const cls = i === 0 ? "a" : "b";
			if (s.points.length >= 3) {
				svg.appendChild(
					createSvgEl(block, "polygon", {
						points: s.points.map((p) => `${p.x},${p.y}`).join(" "),
						"class": `qj-radar-poly qj-radar-poly--${cls}`,
					}),
				);
			}
			for (const p of s.points) {
				const dot = createSvgEl(block, "circle", {
					cx: String(p.x),
					cy: String(p.y),
					r: "3",
					"class": `qj-radar-dot qj-radar-dot--${cls}`,
				});
				const tip = createSvgEl(block, "title", {});
				tip.textContent = `${p.dim} · ${s.label}: ${p.v}`;
				dot.appendChild(tip);
				svg.appendChild(dot);
			}
		}
	}
}

/** 月历组件：年/月片可点开对应复盘笔记；周号列点开周日志；格子点开当日日志。
 * 周/月视图同构（整月网格）；周视图高亮当前期间所在的那一周。 */
export function renderCalendar(card: HTMLElement, app: App, ctx: SummaryCtx): void {
	const config = ctx.plugin.config;
	// 带时间部分的字符串按本地时区解析（裸 YYYY-MM-DD 会走 UTC，月初跨界周锚错月份）
	const first = new Date(`${ctx.days[0]}T00:00:00`);
	const year = first.getFullYear();
	const month0 = first.getMonth();
	const key = `${year}-${String(month0 + 1).padStart(2, "0")}`;
	// 周视图：高亮期间内的日期（整周）
	const inPeriod = ctx.kind === "week" ? new Set(ctx.days) : null;

	const title = card.createDiv({ cls: "qj-cal-title" });
	const yearChip = title.createEl("button", { cls: "qj-cal-chip", text: String(year) });
	yearChip.type = "button";
	yearChip.onclick = () => void ctx.plugin.openPeriodNote("annual", String(year));
	const monthChip = title.createEl("button", { cls: "qj-cal-chip", text: key });
	monthChip.type = "button";
	monthChip.onclick = () => void ctx.plugin.openPeriodNote("monthly", key);

	const weekdays = ["一", "二", "三", "四", "五", "六", "日"].map((w) => t(w));
	const grid = card.createDiv({ cls: "qj-cal" });
	grid.createDiv({ cls: "qj-cal-head", text: "W" });
	for (const w of weekdays) grid.createDiv({ cls: "qj-cal-head", text: w });

	// 完成口径与其余组件一致：✅ 完成日期优先，无日期按笔记归属日（doneByDay）
	const done = doneByDay(ctx.days, ctx.records, ctx.doneMarkers);
	const today = dateKey(new Date());
	const index = new VaultIndex(app, config.journals.daily.dir);
	for (const week of monthGrid(year, month0)) {
		const monday = week[0].date;
		const weekCell = grid.createDiv({ cls: "qj-cal-weekno" });
		const wmatch = /^(\d{4})-W(\d{2})$/.exec(weekKeyOf(monday));
		weekCell.setText(wmatch ? wmatch[2] : "");
		weekCell.onclick = () => {
			const k = weekKeyOf(monday);
			if (k) void ctx.plugin.openPeriodNote("weekly", k);
		};
		for (const cell of week) {
			const el = grid.createDiv({ cls: `qj-cal-cell${cell.inMonth ? "" : " qj-cal-out"}` });
			if (!cell.inMonth) continue;
			if (inPeriod?.has(cell.key)) el.addClass("is-in-period");
			if (cell.key === today) el.addClass("is-today");
			el.createSpan({ cls: "qj-cal-day", text: String(cell.date.getDate()) });
			const n = done.get(cell.key) ?? 0;
			if (n > 0) el.createSpan({ cls: "qj-cal-badge", text: String(n) });
			if (ctx.records.has(cell.key)) el.createSpan({ cls: "qj-cal-dot" });
			el.onclick = () => {
				const file = index.dailyFile(cell.key);
				if (file) void app.workspace.getLeaf(false).openFile(file);
			};
		}
	}
}

function weekKeyOf(d: Date): string {
	const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
	const dayNum = date.getUTCDay() || 7;
	date.setUTCDate(date.getUTCDate() + 4 - dayNum);
	const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
	const week = Math.ceil(((date.getTime() - yearStart) / 86400000 + 1) / 7);
	return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** 打卡汇总组件（沿用比例条形态）。 */
export function renderCheckin(card: HTMLElement, ctx: SummaryCtx): void {
	for (const section of ctx.plugin.config.journals.daily.sections) {
		if (section.type !== "checkin") continue;
		const stats = boolStats(section.fields, ctx.days, ctx.records);
		const block = card.createDiv();
		block.createDiv({ cls: "qj-checkin-heading", text: section.heading.replace(/^#+\s*/, "") });
		for (const s of stats) {
			const row = block.createDiv({ cls: "qj-checkin-row" });
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
export function renderFeedMini(card: HTMLElement, ctx: SummaryCtx): void {
	const latest = [...ctx.entries].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8);
	if (latest.length === 0) {
		card.createDiv({ cls: "qj-muted", text: t("暂无内容，先去记一条") });
	} else {
		const names = new Map(
			ctx.plugin.config.journals.daily.sections
				.filter((s) => s.panel === true)
				.map((s) => [s.id, s.heading.replace(/^#+\s*/, "")]),
		);
		for (const e of latest) {
			const row = card.createDiv({ cls: "qj-mini-row" });
			row.createSpan({
				cls: "qj-feed-meta",
				text: `${names.get(e.sectionId) ?? ""}${e.time ? ` · ${e.time}` : ""}`,
			});
			// 小卡没有切换按钮，这里按任务状态补状态符号
			const text =
				e.taskState !== undefined && e.taskStatus !== undefined
					? `${taskSymbol(e.taskState, e.taskStatus)} ${e.text}`
					: e.text;
			row.createSpan({ cls: "qj-mini-text", text: text.replace(/\n/g, " ") });
		}
	}
	const more = card.createEl("button", { cls: "qj-btn", text: t("打开速记面板") });
	more.type = "button";
	more.onclick = () => void ctx.plugin.openView("qj-panel", ctx.plugin.config.viewLocations.panel);
}

/** 查询块组件：只渲染用户手动添加的查询（无预设、不自动识别日志里的块）。
 * dataview / dataviewjs 委托 Dataview 官方入口（CW 同款：executeJs / tryQueryMarkdown）。 */
export async function renderQueryPanel(card: HTMLElement, app: App, ctx: SummaryCtx): Promise<void> {
	const config = ctx.plugin.config;
	if (ctx.editing) {
		renderQueryEditor(card, ctx);
		return;
	}
	if (config.summaryQueries.length === 0) {
		card.createDiv({ cls: "qj-muted", text: t("暂无查询块") });
		return;
	}
	const fallbackSource = ctx.plugin.capture.dailyPath(new Date());
	const bridge = new QueryBridge(app);
	for (const q of config.summaryQueries) {
		const wrap = card.createDiv({ cls: "qj-query-block" });
		if (q.title) wrap.createDiv({ cls: "qj-query-title", text: q.title });
		wrap.createSpan({ cls: "qj-query-chip", text: q.kind });
		const body = wrap.createDiv({ cls: "qj-query-body" });
		const ok =
			q.kind === "dataview"
				? await bridge.renderDvQuery(q.code, fallbackSource, body, ctx.component)
				: await bridge.renderDvJs(q.code, fallbackSource, body, ctx.component);
		if (!ok) {
			body.empty();
			body.createDiv({
				cls: "qj-muted",
				text: bridge.dataviewAvailable ? t("渲染失败") : t("需要 Dataview 渲染"),
			});
		}
	}
}

/** 编辑模式下的查询配置：列表编辑/删除 + 新增（标题 + 类型 + 语句）。 */
function renderQueryEditor(card: HTMLElement, ctx: SummaryCtx): void {
	const config = ctx.plugin.config;
	const rerender = ctx.rerender;
	let editIndex = -1; // ≥0 时表单处于编辑态，保存时替换该条
	const add = card.createDiv({ cls: "qj-query-add" });
	const titleInput = add.createEl("input", { cls: "qj-input", type: "text" });
	titleInput.placeholder = t("查询标题");
	const kindSel = add.createEl("select", { cls: "qj-input" });
	for (const k of ["dataview", "dataviewjs"] as QueryKind[]) {
		kindSel.createEl("option", { text: k, attr: { value: k } });
	}
	const code = add.createEl("textarea", { cls: "qj-input qj-textarea" });
	code.rows = 3;
	code.placeholder = t("查询语句");
	const btn = add.createEl("button", { cls: "qj-btn", text: t("添加查询") });
	btn.type = "button";

	const startEdit = (index: number): void => {
		editIndex = index;
		const q = config.summaryQueries[index];
		if (!q) return;
		titleInput.value = q.title ?? "";
		kindSel.value = q.kind;
		code.value = q.code;
		btn.setText(t("保存修改"));
	};

	btn.onclick = async () => {
		if (code.value.trim() === "") return;
		const title = titleInput.value.trim();
		const entry = {
			...(title !== "" ? { title } : {}),
			kind: kindSel.value as QueryKind,
			code: code.value.trim(),
		};
		if (editIndex >= 0 && editIndex < config.summaryQueries.length) {
			config.summaryQueries[editIndex] = entry;
		} else {
			config.summaryQueries.push(entry);
		}
		await ctx.plugin.saveConfig();
		rerender();
	};

	for (const [index, q] of [...config.summaryQueries].entries()) {
		const row = card.createDiv({ cls: "qj-query-edit-row" });
		if (q.title) row.createSpan({ cls: "qj-query-title", text: q.title });
		row.createSpan({ cls: "qj-query-chip", text: q.kind });
		row.createSpan({ cls: "qj-query-edit-code", text: q.code.split("\n")[0].slice(0, 60) });
		const edit = row.createEl("button", { cls: "qj-feed-btn", text: "✎" });
		edit.type = "button";
		edit.setAttribute("aria-label", t("编辑"));
		edit.onclick = () => startEdit(index);
		const del = row.createEl("button", { cls: "qj-feed-btn" });
		del.type = "button";
		del.setAttribute("aria-label", t("删除"));
		del.setText("✕");
		del.onclick = async () => {
			config.summaryQueries = config.summaryQueries.filter((x) => x !== q);
			await ctx.plugin.saveConfig();
			rerender();
		};
	}
	card.appendChild(add);
}
