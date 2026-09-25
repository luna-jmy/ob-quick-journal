/**
 * 领域模型 + 默认值 + config 合并/迁移（纯函数，零 DOM、不 import obsidian）。
 *
 * v0.2 起配置单元是「标题区」（JournalSection）：日志里的一个标题对应一块录入配置。
 * - 有内联字段的标题区按类型填值（打卡 / 数据 / 文本）；
 * - 没有内联字段的标题区是列表，逐项追加内容；
 * - 标题区可从模板笔记自动识别（src/parse/detect-sections.ts）。
 * 范围仅日日志；周/月/年复盘另行开发，不在本模型内。
 */

export type SectionType = "checkin" | "data" | "text" | "list";

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
	/** 有内联字段的类型用；list 恒为空 */
	fields: SectionField[];
	/** list 类型用：追加行模板，默认 `- {{value}}`（GTD 等任务区可设 `- [ ] {{value}}`） */
	lineTemplate?: string;
}

export interface QJConfig {
	language: "auto" | "zh" | "en";
	dailyDir: string;
	/** 「从模板识别」读取的笔记路径（模板或任一日志） */
	templateNote: string;
	sections: JournalSection[];
}

export const BOOL_YES = "✔️";
export const BOOL_NO = "❌";

export const DEFAULT_SECTIONS: JournalSection[] = [
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
	},
];

export const DEFAULT_CONFIG: QJConfig = {
	language: "auto",
	dailyDir: "500 Journal/540 Daily",
	templateNote: "",
	sections: DEFAULT_SECTIONS,
};

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null;
}

const SECTION_TYPES: SectionType[] = ["checkin", "data", "text", "list"];

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
	const lineTemplate = typeof raw.lineTemplate === "string" ? raw.lineTemplate : undefined;
	return { id, heading, type, fields, ...(lineTemplate ? { lineTemplate } : {}) };
}

/** 深合并用户保存的 config 到默认值上（逐级兜底；v0.1 的 registry/actions 自动迁移）。 */
export function mergeConfig(saved: unknown): QJConfig {
	const base = JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as QJConfig;
	if (!isRecord(saved)) return base;
	if (saved.language === "zh" || saved.language === "en" || saved.language === "auto") {
		base.language = saved.language;
	}
	if (typeof saved.dailyDir === "string" && saved.dailyDir.trim() !== "") {
		base.dailyDir = saved.dailyDir;
	}
	if (typeof saved.templateNote === "string") {
		base.templateNote = saved.templateNote;
	}
	if (Array.isArray(saved.sections)) {
		const sections = saved.sections
			.map((s, i) => sanitizeSection(s, i))
			.filter((s): s is JournalSection => s !== null);
		if (sections.length > 0) base.sections = sections;
		return base;
	}
	// v0.1 迁移：registry.daily（bool/number/text）→ 标题区；周/月与 actions 丢弃（复盘另做）
	if (isRecord(saved.registry) && Array.isArray(saved.registry.daily)) {
		const kindMap: Record<string, SectionType> = { bool: "checkin", number: "data", text: "text" };
		const migrated: JournalSection[] = (saved.registry.daily as unknown[])
			.map((s, i) => {
				if (!isRecord(s)) return null;
				const type = kindMap[String(s.kind)] ?? "text";
				return sanitizeSection({ ...s, type }, i);
			})
			.filter((s): s is JournalSection => s !== null);
		if (migrated.length > 0) {
			const ids = new Set(migrated.map((s) => s.id));
			for (const extra of DEFAULT_SECTIONS) {
				if (extra.type === "list" && !ids.has(extra.id)) migrated.push(extra);
			}
			base.sections = migrated;
		}
	}
	return base;
}
