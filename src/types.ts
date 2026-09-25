/**
 * 领域模型 + 默认值 + config 合并（纯函数，零 DOM、不 import obsidian）。
 *
 * 字段注册表（FieldRegistry）是唯一源：捕获表单、笔记骨架、统计口径都从它出发。
 * 默认口径 = Luna 现行 TPL-Daily / TPL-Weekly / TPL-Monthly 模板里的字段行
 * （见 ob-tdk-general/specs/ob-quick-journal/ref-ob-templates/）。
 */

export type FieldKind = "bool" | "number" | "text";

export interface FieldDef {
	/** 字段行键，可含 emoji（前缀如 💊medicine、后缀如 weight⚖️） */
	key: string;
	/** 展示名（i18n 键，中文为源） */
	label: string;
	/** 单位含义（展示用） */
	unit?: string;
}

export interface FieldSection {
	id: string;
	/** 模板里的标题行原文（含 # 前缀与 emoji），定位锚点 */
	heading: string;
	kind: FieldKind;
	fields: FieldDef[];
}

export interface FieldRegistry {
	daily: FieldSection[];
	weekly: FieldSection[];
	monthly: FieldSection[];
	annual: FieldSection[];
}

export type FormFieldType = "bool" | "number" | "text" | "multiline";

export interface CaptureField {
	key: string;
	label: string;
	type: FormFieldType;
	required?: boolean;
}

export interface CaptureActionDef {
	id: string;
	/** 动作名（i18n 键，中文为源），命令名与按钮都用它 */
	nameKey: string;
	icon: string;
	/** fill = 按注册表定位填值；append = 渲染行模板追加 */
	kind: "fill" | "append";
	/** 目标期间：day = 当天日志；week = 本周复盘笔记 */
	period: "day" | "week";
	/** kind=fill 时：注册表 section id（在对应期间的 sections 里找） */
	sectionId?: string;
	/** kind=append 时：追加锚点标题 */
	heading?: string;
	/** kind=append 时：行模板，{{value}} 为表单值插值 */
	lineTemplate?: string;
	/** kind=append 时：自带表单字段 */
	fields?: CaptureField[];
}

export interface QJConfig {
	language: "auto" | "zh" | "en";
	dailyDir: string;
	weeklyDir: string;
	monthlyDir: string;
	annualDir: string;
	registry: FieldRegistry;
	actions: CaptureActionDef[];
}

export const BOOL_YES = "✔️";
export const BOOL_NO = "❌";

export const DEFAULT_REGISTRY: FieldRegistry = {
	daily: [
		{
			id: "checkin",
			heading: "### 每日打卡",
			kind: "bool",
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
			kind: "number",
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
			kind: "text",
			fields: [
				{ key: "今天最满意的事", label: "最满意" },
				{ key: "今天遇到的障碍或困难", label: "障碍困难" },
				{ key: "今天印象最深刻的事", label: "印象最深" },
				{ key: "明天想改进的事", label: "明天改进" },
			],
		},
	],
	weekly: [
		{
			id: "weekly-review",
			heading: "## 🤔 周末回顾与总结",
			kind: "text",
			fields: [
				{ key: "本周成就/亮点", label: "成就亮点" },
				{ key: "本周关键项目/计划进展", label: "项目进展" },
				{ key: "本周遇到的挑战/问题", label: "挑战问题" },
				{ key: "下周需要调整的地方", label: "需要调整" },
				{ key: "下周展望", label: "下周展望" },
			],
		},
	],
	monthly: [
		{
			id: "monthly-review",
			heading: "## 🤔 月度回顾与总结",
			kind: "text",
			fields: [
				{ key: "本月最大的成就/亮点", label: "成就亮点" },
				{ key: "本月关键项目进展", label: "项目进展" },
				{ key: "本月遇到的挑战/问题", label: "挑战问题" },
				{ key: "下月需要调整的地方", label: "需要调整" },
				{ key: "下月展望", label: "下月展望" },
			],
		},
	],
	annual: [],
};

export const DEFAULT_ACTIONS: CaptureActionDef[] = [
	{
		id: "daily-checkin",
		nameKey: "每日打卡",
		icon: "check-circle",
		kind: "fill",
		period: "day",
		sectionId: "checkin",
	},
	{
		id: "daily-data",
		nameKey: "数据记录",
		icon: "line-chart",
		kind: "fill",
		period: "day",
		sectionId: "data",
	},
	{
		id: "daily-review",
		nameKey: "今日小结",
		icon: "feather",
		kind: "fill",
		period: "day",
		sectionId: "daily-review",
	},
	{
		id: "weekly-review",
		nameKey: "本周复盘",
		icon: "calendar-check",
		kind: "fill",
		period: "week",
		sectionId: "weekly-review",
	},
	{
		id: "add-task",
		nameKey: "加一条任务",
		icon: "square-check",
		kind: "append",
		period: "day",
		heading: "## 👀 GTD任务看板",
		lineTemplate: "- [ ] {{value}}",
		fields: [{ key: "value", label: "任务描述", type: "text", required: true }],
	},
	{
		id: "add-note",
		nameKey: "记一条灵感",
		icon: "lightbulb",
		kind: "append",
		period: "day",
		heading: "## 💡 灵感与思考",
		lineTemplate: "- {{value}}",
		fields: [{ key: "value", label: "内容", type: "text", required: true }],
	},
];

export const DEFAULT_CONFIG: QJConfig = {
	language: "auto",
	dailyDir: "500 Journal/540 Daily",
	weeklyDir: "500 Journal/530 Weekly",
	monthlyDir: "500 Journal/520 Monthly",
	annualDir: "500 Journal/510 Annual",
	registry: DEFAULT_REGISTRY,
	actions: DEFAULT_ACTIONS,
};

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null;
}

/** 深合并用户保存的 config 到默认值上（逐级兜底，缺字段/坏类型取默认）。 */
export function mergeConfig(saved: unknown): QJConfig {
	const base = JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as QJConfig;
	if (!isRecord(saved)) return base;
	if (saved.language === "zh" || saved.language === "en" || saved.language === "auto") {
		base.language = saved.language;
	}
	for (const key of ["dailyDir", "weeklyDir", "monthlyDir", "annualDir"] as const) {
		if (typeof saved[key] === "string" && saved[key].trim() !== "") {
			base[key] = saved[key];
		}
	}
	if (isRecord(saved.registry)) {
		for (const scope of ["daily", "weekly", "monthly", "annual"] as const) {
			const savedScope = saved.registry[scope];
			if (Array.isArray(savedScope)) {
				base.registry[scope] = mergeSections(savedScope, base.registry[scope]);
			}
		}
	}
	if (Array.isArray(saved.actions)) {
		base.actions = saved.actions.filter((a): a is CaptureActionDef =>
			isRecord(a) && typeof a.id === "string" && typeof a.nameKey === "string",
		);
	}
	return base;
}

function mergeSections(saved: unknown[], fallback: FieldSection[]): FieldSection[] {
	const out: FieldSection[] = [];
	for (const raw of saved) {
		if (!isRecord(raw) || typeof raw.id !== "string" || typeof raw.heading !== "string") continue;
		if (raw.kind !== "bool" && raw.kind !== "number" && raw.kind !== "text") continue;
		const fields: FieldDef[] = Array.isArray(raw.fields)
			? raw.fields.filter(
					(f): f is FieldDef =>
						isRecord(f) && typeof f.key === "string" && typeof f.label === "string",
				)
			: [];
		out.push({ id: raw.id, heading: raw.heading, kind: raw.kind, fields });
	}
	if (out.length === 0) return fallback;
	return out;
}

/** 从注册表取某期间类型的某个 section。 */
export function findSection(
	registry: FieldRegistry,
	scope: keyof FieldRegistry,
	sectionId: string,
): FieldSection | undefined {
	return registry[scope].find((s) => s.id === sectionId);
}
