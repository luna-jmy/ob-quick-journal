/**
 * Quick Journal 入口：薄装配层——registerView / 命令 / ribbon / 设置。
 * 快速录入按日志类型（日/周/月/季/年）各有标题区；周/月/季/年复盘不设图标，命令调用，
 * 汇总视图的快速录入条也有入口。
 */

import { Notice, Plugin, TFile, WorkspaceLeaf } from "obsidian";
import type { JournalSection, PeriodType, QJConfig } from "./types";
import { mergeConfig } from "./types";
import { setLanguage, t } from "./i18n";
import { CaptureService } from "./services/capture-service";
import { ensureNote } from "./services/file-writer";
import { VaultIndex } from "./services/vault-index";
import { skeletonFor, noteKeyFor } from "./capture/skeleton";
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
	quarterly: "季 · ",
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

		for (const type of ["daily", "weekly", "monthly", "quarterly", "annual"] as PeriodType[]) {
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
				.paragraphContent(type, this.currentKey(type), section)
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
		if (section.fields.length > 0) {
			// 打卡/数据/小结/对比：预填当前期间现有值——改的是当前数据，而不是每次从空开始
			void this.capture.sectionFieldValues(type, this.currentKey(type), section).then((values) => {
				new CaptureModal(
					this.app,
					section.heading.replace(/^#+\s*/, ""),
					section.type,
					section.fields,
					(payload) => void this.performCapture(type, section, payload, false),
					"",
					values,
					section.type === "compare" ? section.compare?.series : undefined,
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

	/** 各类型「当天」的键（预填定位用；跟随各日志配置的文件名格式）。 */
	private currentKey(type: PeriodType): string {
		if (type === "daily") return dateKey(new Date());
		return noteKeyFor(type, new Date(), this.config.journals[type].filenameFormat);
	}

	/** 捕获执行（含覆盖确认流）；速记面板直发段落也走这里。 */
	async performCapture(
		type: PeriodType,
		section: JournalSection,
		payload: { values: Record<string, string>; lineValue?: string; clearAll?: boolean },
		overwrite: boolean,
		now?: Date,
	): Promise<void> {
		if (payload.clearAll === true) {
			// 「清空当前内容」：显式操作，直接清空，不走覆盖确认
			const cleared = await this.capture.clearSection(type, section, { now });
			if (cleared.ok) {
				new Notice(`${t("已清空")} ${cleared.path} (${cleared.writtenLines})`);
			} else {
				new Notice(
					`${t("写入失败")}: ${cleared.reason === "error" ? cleared.message : cleared.reason}`,
				);
			}
			return;
		}
		const result = await this.capture.performSection(type, section, payload, { overwrite, now });
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

	/** 设置变更后重算汇总视图（统计口径等改了，已打开的视图不会自己重渲染）。 */
	refreshSummaryViews(): void {
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_QJ_SUMMARY)) {
			if (leaf.view instanceof SummaryView) void leaf.view.render();
		}
	}

	/** 打开某期间的日志/复盘笔记（递归子目录查找；不存在则按该类型建骨架到目录根）。月历入口用。 */
	async openPeriodNote(type: PeriodType, key: string): Promise<void> {
		const journal = this.config.journals[type];
		const index = new VaultIndex(this.app, journal.dir);
		const existing = type === "daily" ? index.dailyFile(key) : index.fileByKey(key);
		let file: TFile;
		if (existing) {
			file = existing;
		} else {
			const period = periodFromKey(key);
			if (period === null) {
				new Notice(`${t("写入失败")}: ${key}`);
				return;
			}
			const skeleton = skeletonFor(type, period.start, journal.sections, journal.filenameFormat);
			const dir = journal.dir.replace(/\/+$/, "");
			file = await ensureNote(this.app, `${dir}/${key}.md`, skeleton);
		}
		await this.app.workspace.getLeaf(false).openFile(file);
	}
}
