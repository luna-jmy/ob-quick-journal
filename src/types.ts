/**
 * 领域模型 + 默认值 + config 合并/迁移（纯函数，零 DOM、不 import obsidian）。
 *
 * v0.6 起配置按「日志类型」组织（daily / weekly / monthly / annual），每个类型一个
 * 目录 + 自己的快速录入标题区（周/月/年复盘即各自类型下的 text 标题区，命令调用、
 * 无独立图标）。速记面板仍只聚合 daily。
 * 汇总视图有组件布局（顺序可编辑）与手工查询块；两个视图可配置默认打开位置。
 */

export type SectionType = "checkin" | "data" | "text" | "list" | "paragraph";
export type PeriodType = "daily" | "weekly" | "monthly" | "annual";
/** 查询组件支持的种类：Tasks 插件没有公开查询 API，只保留 Dataview（官方 api） */
export type QueryKind = "dataview" | "dataviewjs";

export interface SectionField {
	/** 字段行键，可含 emoji（前缀如 💊medicine、后缀如 weight⚖️） */
	key: string;
	/** 展示名（自动识别时默认为去 emoji 的键，可在设置改） */
	label: string;
	/** 单位含义（展示用，可空） */
	unit?: string;
}

export interface JournalSection {
	/** 稳定标识，命令 ID 用（qj-<id>） */
	id: string;
	/** 日志里的标题行原文（含 # 前缀与 emoji），定位锚点 */
	heading: string;
	type: SectionType;
	/** 有内联字段的类型用；list 恒为空；paragraph 恒为空 */
	fields: SectionField[];
	/** list 类型用：追加行模板，默认 `- {{value}}`（GTD 等任务区可设 `- [ ] {{value}}`） */
	lineTemplate?: string;
	/** 文本/列表/段落类型可开：在速记面板里聚合该标题区的内容（仅 daily） */
	panel?: boolean;
	/** 面板开启后可用：写入时自动加 HH:mm 时间戳前缀，面板解析显示记录时间（仅 daily） */
	timestamp?: boolean;
}

export interface JournalConfig {
	/** 该类型日志的目录 */
	dir: string;
	sections: JournalSection[];
}

export interface CustomQuery {
	kind: QueryKind;
	code: string;
}

export type ViewLocation = "tab" | "sidebar";

export interface QJConfig {
	language: "auto" | "zh" | "en";
	/** 「从模板识别」读取的笔记路径（作用于 daily 的标题区） */
	templateNote: string;
	journals: Record<PeriodType, JournalConfig>;
	/** 汇总视图的组件顺序（编辑模式拖拽调整；缺省补齐、未知项剔除） */
	summaryLayout: string[];
	/** 手工查询块（编辑模式下录入，与日志内自动识别的合并渲染） */
	summaryQueries: CustomQuery[];
	/** 趋势组件选中的字段（sectionId::key） */
	trendSelection?: string;
	viewLocations: { summary: ViewLocation; panel: ViewLocation };
	/** 速记面板偏好 */
	panel: { showCompleted: boolean };
	/** 未完成任务滚动：哪些勾选框字符算「未完成」（可多选，默认空格 + > 与脚本一致） */
	rollover: { openMarkers: string[] };
}

export const BOOL_YES = "✔️";
export const BOOL_NO = "❌";

export const DEFAULT_DAILY_SECTIONS: JournalSection[] = [
	{
		id: "checkin",
		heading: "### 每日打卡",
		type: "checkin",
		fields: [
			{ key: "💊medicine", label: "吃药" },
			{ key: "🧠flashcard", label: "卡片复习" },
			{ key: "🧘‍♂️meditation", label: "冥想" },
			{ key: "🍽️fasting", label: "轻断食" },
		],
	},
	{
		id: "data",
		heading: "### 数据记录",
		type: "data",
		fields: [
			{ key: "weight⚖️", label: "体重", unit: "kg" },
			{ key: "exercise🕓", label: "运动", unit: "分钟" },
			{ key: "reading🕓", label: "阅读", unit: "分钟" },
			{ key: "saving💰", label: "存入", unit: "元" },
			{ key: "spent💰", label: "支出", unit: "元" },
		],
	},
	{
		id: "daily-review",
		heading: "## ✍️ 今日小结与回顾",
		type: "text",
		fields: [
			{ key: "今天最满意的事", label: "最满意" },
			{ key: "今天遇到的障碍或困难", label: "障碍困难" },
			{ key: "今天印象最深刻的事", label: "印象最深" },
			{ key: "明天想改进的事", label: "明天改进" },
		],
		panel: true,
	},
	{
		id: "gtd",
		heading: "## 👀 GTD任务看板",
		type: "list",
		fields: [],
		lineTemplate: "- [ ] {{value}}",
	},
	{
		id: "ideas",
		heading: "## 💡 灵感与思考",
		type: "list",
		fields: [],
		panel: true,
		timestamp: true,
	},
];

export const DEFAULT_JOURNALS: Record<PeriodType, JournalConfig> = {
	daily: { dir: "500 Journal/540 Daily", sections: DEFAULT_DAILY_SECTIONS },
	weekly: {
		dir: "500 Journal/530 Weekly",
		sections: [
			{
				id: "weekly-review",
				heading: "## 🤔 周末回顾与总结",
				type: "text",
				fields: [
					{ key: "本周成就/亮点", label: "成就亮点" },
					{ key: "本周关键项目/计划进展", label: "项目进展" },
					{ key: "本周遇到的挑战/问题", label: "挑战问题" },
					{ key: "下周需要调整的地方", label: "需要调整" },
					{ key: "下周展望", label: "下周展望" },
				],
			},
		],
	},
	monthly: {
		dir: "500 Journal/520 Monthly",
		sections: [
			{
				id: "monthly-review",
				heading: "## 🤔 月度回顾与总结",
				type: "text",
				fields: [
					{ key: "本月最大的成就/亮点", label: "成就亮点" },
					{ key: "本月关键项目进展", label: "项目进展" },
					{ key: "本月遇到的挑战/问题", label: "挑战问题" },
					{ key: "下月需要调整的地方", label: "需要调整" },
					{ key: "下月展望", label: "下月展望" },
				],
			},
		],
	},
	annual: { dir: "500 Journal/510 Annual", sections: [] },
};

/** 汇总视图的组件 id（顺序即默认布局；快速录入固定为顶端整行条，不在此列）。 */
export const DEFAULT_SUMMARY_LAYOUT = [
	"task-chart",
	"checkin",
	"trend",
	"calendar",
	"task-heatmap",
	"entry-heatmap",
	"feed",
	"queries",
] as const;

export const DEFAULT_CONFIG: QJConfig = {
	language: "auto",
	templateNote: "",
	journals: DEFAULT_JOURNALS,
	summaryLayout: [...DEFAULT_SUMMARY_LAYOUT],
	summaryQueries: [],
	viewLocations: { summary: "tab", panel: "tab" },
	panel: { showCompleted: true },
	rollover: { openMarkers: [" ", ">"] },
};

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null;
}

const SECTION_TYPES: SectionType[] = ["checkin", "data", "text", "list", "paragraph"];
const PERIOD_TYPES: PeriodType[] = ["daily", "weekly", "monthly", "annual"];
const QUERY_KINDS: QueryKind[] = ["dataview", "dataviewjs"];

function sanitizeSection(raw: unknown, fallbackIndex: number): JournalSection | null {
	if (!isRecord(raw)) return null;
	const id = typeof raw.id === "string" && raw.id !== "" ? raw.id : `sec-${fallbackIndex}`;
	const heading = typeof raw.heading === "string" ? raw.heading : "";
	const type = SECTION_TYPES.includes(raw.type as SectionType) ? (raw.type as SectionType) : null;
	if (heading === "" || type === null) return null;
	const fields: SectionField[] = Array.isArray(raw.fields)
		? raw.fields
				.filter((f): f is Record<string, unknown> => isRecord(f) && typeof f.key === "string")
				.map((f) => ({
					key: String(f.key),
					label: typeof f.label === "string" && f.label !== "" ? f.label : String(f.key),
					...(typeof f.unit === "string" && f.unit !== "" ? { unit: f.unit } : {}),
				}))
		: [];
	return {
		id,
		heading,
		type,
		fields,
		...(typeof raw.lineTemplate === "string" ? { lineTemplate: raw.lineTemplate } : {}),
		...(raw.panel === true ? { panel: true } : {}),
		...(raw.timestamp === true ? { timestamp: true } : {}),
	};
}

function sanitizeJournal(raw: unknown, fallback: JournalConfig): JournalConfig {
	if (!isRecord(raw)) return fallback;
	const dir = typeof raw.dir === "string" && raw.dir.trim() !== "" ? raw.dir : fallback.dir;
	let sections: JournalSection[];
	if (Array.isArray(raw.sections)) {
		sections = raw.sections
			.map((s, i) => sanitizeSection(s, i))
			.filter((s): s is JournalSection => s !== null);
		if (sections.length === 0) sections = fallback.sections;
	} else {
		sections = fallback.sections;
	}
	return { dir, sections };
}

function sanitizeQueries(raw: unknown): CustomQuery[] {
	if (!Array.isArray(raw)) return [];
	return raw
		.filter((q): q is Record<string, unknown> => isRecord(q) && typeof q.code === "string")
		.filter((q) => QUERY_KINDS.includes(q.kind as QueryKind))
		.map((q) => ({ kind: q.kind as QueryKind, code: String(q.code) }))
		.filter((q) => q.code.trim() !== "");
}

function sanitizeLayout(raw: unknown): string[] {
	if (!Array.isArray(raw)) return [...DEFAULT_SUMMARY_LAYOUT];
	const known = new Set<string>(DEFAULT_SUMMARY_LAYOUT);
	const kept = raw.filter((id): id is string => typeof id === "string" && known.has(id));
	const out = [...new Set(kept)];
	for (const id of DEFAULT_SUMMARY_LAYOUT) {
		if (!out.includes(id)) out.push(id);
	}
	return out;
}

/** 深合并用户保存的 config（v0.5 的扁平结构自动迁移到按类型组织）。 */
export function mergeConfig(saved: unknown): QJConfig {
	const base = JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as QJConfig;
	if (!isRecord(saved)) return base;
	if (saved.language === "zh" || saved.language === "en" || saved.language === "auto") {
		base.language = saved.language;
	}
	if (typeof saved.templateNote === "string") {
		base.templateNote = saved.templateNote;
	}
	if (isRecord(saved.journals)) {
		for (const type of PERIOD_TYPES) {
			base.journals[type] = sanitizeJournal(saved.journals[type], base.journals[type]);
		}
	} else if (typeof saved.dailyDir === "string" || Array.isArray(saved.sections)) {
		// v0.5 迁移：dailyDir + sections → journals.daily
		base.journals.daily = sanitizeJournal(
			{ dir: saved.dailyDir, sections: saved.sections },
			base.journals.daily,
		);
	}
	base.summaryLayout = sanitizeLayout(saved.summaryLayout);
	base.summaryQueries = sanitizeQueries(saved.summaryQueries);
	if (typeof saved.trendSelection === "string") base.trendSelection = saved.trendSelection;
	if (isRecord(saved.viewLocations)) {
		const vl = saved.viewLocations;
		if (vl.summary === "tab" || vl.summary === "sidebar") {
			base.viewLocations.summary = vl.summary;
		}
		if (vl.panel === "tab" || vl.panel === "sidebar") {
			base.viewLocations.panel = vl.panel;
		}
	}
	if (isRecord(saved.panel)) {
		if (typeof saved.panel.showCompleted === "boolean") {
			base.panel.showCompleted = saved.panel.showCompleted;
		}
	}
	if (isRecord(saved.rollover) && Array.isArray(saved.rollover.openMarkers)) {
		const markers = saved.rollover.openMarkers as unknown[];
		const cleaned = markers.filter((m): m is string => typeof m === "string" && m.length === 1);
		if (cleaned.length > 0) base.rollover.openMarkers = cleaned;
	}
	return base;
}

/** 跨类型找标题区（命令与汇总入口用）。 */
export function findSectionById(
	config: QJConfig,
	sectionId: string,
): { type: PeriodType; section: JournalSection } | null {
	for (const type of PERIOD_TYPES) {
		const section = config.journals[type].sections.find((s) => s.id === sectionId);
		if (section) return { type, section };
	}
	return null;
}
