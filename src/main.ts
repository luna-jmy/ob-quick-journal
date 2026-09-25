/**
 * Quick Journal 入口：薄装配层——registerView / 命令 / ribbon / 设置。
 * 快速录入按日志类型（日/周/月/年）各有标题区；周/月/年复盘不设图标，命令调用，
 * 汇总视图的快速录入条也有入口。
 */

import { Notice, Plugin, TFile, WorkspaceLeaf } from "obsidian";
import type { JournalSection, PeriodType, QJConfig } from "./types";
import { mergeConfig } from "./types";
import { setLanguage, t } from "./i18n";
import { CaptureService } from "./services/capture-service";
import { ensureNote } from "./services/file-writer";
import { skeletonFor } from "./capture/skeleton";
import { CaptureModal } from "./ui/capture-modal";
import { ConfirmModal } from "./ui/confirm-modal";
import { ActionPickerModal } from "./ui/action-picker-modal";
import { SummaryView, VIEW_TYPE_QJ_SUMMARY } from "./views/summary-view";
import { PanelView, VIEW_TYPE_QJ_PANEL } from "./views/panel-view";
import { QJSettingTab } from "./settings";
import { dateKey, periodFromKey } from "./periods/period";

const TYPE_PREFIX: Record<PeriodType, string> = {
	daily: "",
	weekly: "周 · ",
	monthly: "月 · ",
	annual: "年 · ",
};

export default class QuickJournalPlugin extends Plugin {
	config!: QJConfig;
	/** 面板视图直发用；其余走 openSectionCapture 的弹窗流程 */
	capture!: CaptureService;

	/** obsidian.d.ts 1.8.7 未声明 App.locale（运行时存在），收口在这一个转换里 */
	private localeOf(app: unknown): string | undefined {
		return (app as { locale?: string })?.locale;
	}

	async onload(): Promise<void> {
		this.config = mergeConfig(await this.loadData());
		setLanguage(this.config.language, () => this.localeOf(this.app));
		this.capture = new CaptureService(this.app, () => this.config);

		this.registerView(VIEW_TYPE_QJ_SUMMARY, (leaf: WorkspaceLeaf) => new SummaryView(leaf, this));
		this.registerView(VIEW_TYPE_QJ_PANEL, (leaf: WorkspaceLeaf) => new PanelView(leaf, this));

		this.addCommand({
			id: "open-summary",
			name: t("打开日志汇总"),
			callback: () => void this.openView(VIEW_TYPE_QJ_SUMMARY, this.config.viewLocations.summary),
		});
		this.addCommand({
			id: "open-quick-capture",
			name: t("打开快速录入"),
			callback: () => this.openPicker(),
		});
		this.addCommand({
			id: "open-panel",
			name: t("打开速记面板"),
			callback: () => void this.openView(VIEW_TYPE_QJ_PANEL, this.config.viewLocations.panel),
		});

		for (const type of ["daily", "weekly", "monthly", "annual"] as PeriodType[]) {
			for (const section of this.config.journals[type].sections) {
				this.addSectionCommand(type, section);
			}
		}

		this.addRibbonIcon("notebook-pen", t("快速录入"), () => this.openPicker());
		this.addSettingTab(new QJSettingTab(this.app, this));
	}

	async saveConfig(): Promise<void> {
		await this.saveData(this.config);
	}

	/** 恢复出厂配置（保留已写入笔记的内容，只重置 data.json）。 */
	async resetConfig(): Promise<void> {
		this.config = mergeConfig(undefined);
		await this.saveData(this.config);
		setLanguage(this.config.language, () => this.localeOf(this.app));
	}

	openPicker(): void {
		// ribbon / 命令的快速录入面向日日志；周/月/年走各自命令或汇总入口
		new ActionPickerModal(this.app, this.config.journals.daily.sections, (section) =>
			this.openSectionCapture("daily", section),
		).open();
	}

	private addSectionCommand(type: PeriodType, section: JournalSection): void {
		this.addCommand({
			id: `qj-${section.id}`,
			name: `${t("快速录入")}: ${TYPE_PREFIX[type]}${section.heading.replace(/^#+\s*/, "")}`,
			callback: () => this.openSectionCapture(type, section),
		});
	}

	openSectionCapture(type: PeriodType, section: JournalSection): void {
		if (section.type === "paragraph") {
			// 段落重发 = 编辑态：预填当天现有内容，提交即整段重写（无需覆盖确认）
			void this.capture
				.paragraphContent(this.currentKey(type), section)
				.then((initial) => {
					new CaptureModal(
						this.app,
						section.heading.replace(/^#+\s*/, ""),
						section.type,
						section.fields,
						(payload) => void this.performCapture(type, section, payload, true),
						initial,
					).open();
				});
			return;
		}
		new CaptureModal(
			this.app,
			section.heading.replace(/^#+\s*/, ""),
			section.type,
			section.fields,
			(payload) => void this.performCapture(type, section, payload, false),
		).open();
	}

	/** 各类型「当天」的键（段落预填定位用）。 */
	private currentKey(type: PeriodType): string {
		if (type === "daily") return dateKey(new Date());
		const now = new Date();
		if (type === "weekly") {
			return this.capture.weeklyPath(now).split("/").pop()!.replace(/\.md$/, "");
		}
		if (type === "monthly") return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
		return String(now.getFullYear());
	}

	/** 捕获执行（含覆盖确认流）；速记面板直发段落也走这里。 */
	async performCapture(
		type: PeriodType,
		section: JournalSection,
		payload: { values: Record<string, string>; lineValue?: string },
		overwrite: boolean,
	): Promise<void> {
		const result = await this.capture.performSection(type, section, payload, { overwrite });
		if (result.ok) {
			const note = result.created ? `${t("创建笔记")} · ` : "";
			new Notice(`${note}${t("已写入")} ${result.path} (${result.writtenLines})`);
			return;
		}
		if (result.reason === "overwrite") {
			new ConfirmModal(
				this.app,
				t("以下字段已有值，覆盖写入？"),
				result.keys.join("\n"),
				() => void this.performCapture(type, section, payload, true),
			).open();
			return;
		}
		new Notice(`${t("写入失败")}: ${result.message}`);
	}

	/** 打开（或聚焦）某个视图；位置按设置（标签页 / 右侧边栏）。 */
	async openView(viewType: string, location: "tab" | "sidebar" = "tab"): Promise<void> {
		const { workspace } = this.app;
		const existing = workspace.getLeavesOfType(viewType);
		let leaf = existing.length > 0 ? existing[0] : null;
		if (leaf === null) {
			// 1.8.7 的 getRightLeaf 是同步签名（返回 leaf | null），不要 await
			leaf = location === "sidebar" ? workspace.getRightLeaf(false) : workspace.getLeaf("tab");
		}
		if (leaf === null) return;
		await leaf.setViewState({ type: viewType, active: true });
		await workspace.revealLeaf(leaf);
	}

	/** 打开某期间的日志/复盘笔记（不存在则按该类型标题区建骨架）。月历的年/月/周入口用。 */
	async openPeriodNote(type: PeriodType, key: string): Promise<void> {
		const dir = this.config.journals[type].dir.replace(/\/+$/, "");
		const path = `${dir}/${key}.md`;
		const existing = this.app.vault.getAbstractFileByPath(path);
		let file: TFile;
		if (existing instanceof TFile) {
			file = existing;
		} else {
			const period = periodFromKey(key);
			if (period === null) {
				new Notice(`${t("写入失败")}: ${key}`);
				return;
			}
			const skeleton = skeletonFor(type, period.start, this.config.journals[type].sections);
			file = await ensureNote(this.app, path, skeleton);
		}
		await this.app.workspace.getLeaf(false).openFile(file);
	}
}
