/**
 * Quick Journal 入口：薄装配层——registerView / 命令 / ribbon / 设置。
 * 业务在 capture / parse / periods / metrics（纯函数）与 services / ui / views。
 */

import { Notice, Plugin, TFile, WorkspaceLeaf } from "obsidian";
import {
	type CaptureActionDef,
	type CaptureField,
	type QJConfig,
	mergeConfig,
	findSection,
	type FieldRegistry,
} from "./types";
import { setLanguage, t } from "./i18n";
import { CaptureService } from "./services/capture-service";
import { ensureNote, readNoteText } from "./services/file-writer";
import { weeklySkeleton } from "./capture/skeleton";
import { CaptureModal } from "./ui/capture-modal";
import { ConfirmModal } from "./ui/confirm-modal";
import { ActionPickerModal } from "./ui/action-picker-modal";
import { SummaryView, VIEW_TYPE_QJ_SUMMARY } from "./views/summary-view";
import { QJSettingTab } from "./settings";

export default class QuickJournalPlugin extends Plugin {
	config!: QJConfig;
	private capture!: CaptureService;

	/** obsidian.d.ts 1.8.7 未声明 App.locale（运行时存在），收口在这一个转换里 */
	private localeOf(app: unknown): string | undefined {
		return (app as { locale?: string })?.locale;
	}

	async onload(): Promise<void> {
		this.config = mergeConfig(await this.loadData());
		setLanguage(this.config.language, () => this.localeOf(this.app));
		this.capture = new CaptureService(this.app, () => this.config);

		this.registerView(VIEW_TYPE_QJ_SUMMARY, (leaf: WorkspaceLeaf) => new SummaryView(leaf, this));

		this.addCommand({
			id: "open-summary",
			name: t("打开日志汇总"),
			callback: () => void this.activateSummary(),
		});

		for (const action of this.config.actions) {
			this.addCommand({
				id: `capture-${action.id}`,
				name: t(action.nameKey),
				callback: () => this.openCapture(action),
			});
		}

		this.addRibbonIcon("notebook-pen", t("快速录入"), () => {
			new ActionPickerModal(this.app, this.config.actions, (action) => this.openCapture(action)).open();
		});

		this.addSettingTab(new QJSettingTab(this.app, this));
	}

	async saveConfig(): Promise<void> {
		await this.saveData(this.config);
	}

	/** 表单字段来源：fill 动作取注册表 section，append 动作用自带字段。 */
	private resolveFields(action: CaptureActionDef): CaptureField[] {
		if (action.kind === "fill") {
			const scope: keyof FieldRegistry = action.period === "week" ? "weekly" : "daily";
			const section = findSection(this.config.registry, scope, action.sectionId ?? "");
			if (!section) return [];
			return section.fields.map((f) => ({
				key: f.key,
				label: f.label,
				type: section.kind,
			}));
		}
		return action.fields ?? [];
	}

	openCapture(action: CaptureActionDef): void {
		const fields = this.resolveFields(action);
		if (fields.length === 0) {
			new Notice(`${t("定位失败")}: ${action.id}`);
			return;
		}
		new CaptureModal(this.app, action, fields, (values) => {
			void this.performCapture(action, values, false);
		}).open();
	}

	private async performCapture(
		action: CaptureActionDef,
		values: Record<string, string>,
		overwrite: boolean,
	): Promise<void> {
		const result = await this.capture.perform(action, values, { overwrite });
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
				() => void this.performCapture(action, values, true),
			).open();
			return;
		}
		new Notice(`${t("写入失败")}: ${result.message}`);
	}

	/** 确保本周复盘笔记存在（骨架），返回文件。 */
	async ensureWeeklyReview(date: Date): Promise<TFile | null> {
		const path = this.capture.weeklyPath(date);
		try {
			await readNoteText(this.app, path);
			const file = this.app.vault.getAbstractFileByPath(path);
			return file instanceof TFile ? file : null;
		} catch {
			const skeleton = weeklySkeleton(date, this.config.registry);
			return ensureNote(this.app, path, skeleton);
		}
	}

	private async activateSummary(): Promise<void> {
		const { workspace } = this.app;
		const existing = workspace.getLeavesOfType(VIEW_TYPE_QJ_SUMMARY);
		const leaf = existing.length > 0 ? existing[0] : workspace.getLeaf("tab");
		await leaf.setViewState({ type: VIEW_TYPE_QJ_SUMMARY, active: true });
		await workspace.revealLeaf(leaf);
	}
}
