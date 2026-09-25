/**
 * Quick Journal 入口：薄装配层——registerView / 命令 / ribbon / 设置。
 * 范围：日日志快速录入（按设置的标题区）；复盘与汇总增强另行开发。
 */

import { Notice, Plugin, WorkspaceLeaf } from "obsidian";
import type { JournalSection, QJConfig } from "./types";
import { mergeConfig } from "./types";
import { setLanguage, t } from "./i18n";
import { CaptureService } from "./services/capture-service";
import { CaptureModal } from "./ui/capture-modal";
import { ConfirmModal } from "./ui/confirm-modal";
import { ActionPickerModal } from "./ui/action-picker-modal";
import { SummaryView, VIEW_TYPE_QJ_SUMMARY } from "./views/summary-view";
import { PanelView, VIEW_TYPE_QJ_PANEL } from "./views/panel-view";
import { QJSettingTab } from "./settings";

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
			callback: () => void this.activateView(VIEW_TYPE_QJ_SUMMARY),
		});

		this.addCommand({
			id: "open-quick-capture",
			name: t("打开快速录入"),
			callback: () => this.openPicker(),
		});

		this.addCommand({
			id: "open-panel",
			name: t("打开速记面板"),
			callback: () => void this.activateView(VIEW_TYPE_QJ_PANEL),
		});

		for (const section of this.config.sections) {
			this.addSectionCommand(section);
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
		new ActionPickerModal(this.app, this.config.sections, (section) =>
			this.openSectionCapture(section),
		).open();
	}

	private addSectionCommand(section: JournalSection): void {
		this.addCommand({
			id: `qj-${section.id}`,
			name: `${t("快速录入")}: ${section.heading.replace(/^#+\s*/, "")}`,
			callback: () => this.openSectionCapture(section),
		});
	}

	openSectionCapture(section: JournalSection): void {
		new CaptureModal(
			this.app,
			section.heading.replace(/^#+\s*/, ""),
			section.type,
			section.fields,
			(payload) => void this.performCapture(section, payload, false),
		).open();
	}

	private async performCapture(
		section: JournalSection,
		payload: { values: Record<string, string>; lineValue?: string },
		overwrite: boolean,
	): Promise<void> {
		const result = await this.capture.performSection(section, payload, { overwrite });
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
				() => void this.performCapture(section, payload, true),
			).open();
			return;
		}
		new Notice(`${t("写入失败")}: ${result.message}`);
	}

	private async activateView(viewType: string): Promise<void> {
		const { workspace } = this.app;
		const existing = workspace.getLeavesOfType(viewType);
		const leaf = existing.length > 0 ? existing[0] : workspace.getLeaf("tab");
		await leaf.setViewState({ type: viewType, active: true });
		await workspace.revealLeaf(leaf);
	}
}
