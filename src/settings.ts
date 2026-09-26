/**
 * 设置页（布局参考 Project Master：分 tab、一类一页、记住所在页）。
 * 通用：语言 / 视图打开位置 / 重置；日志：日/周/月/年各自目录与标题区；
 * 速记面板：显示已完成、滚动未完成标识。
 * 注意：设置对象字段名是 config（§4.8）。
 */

import { Notice, PluginSettingTab, Setting, TFile, normalizePath, type App } from "obsidian";
import type QuickJournalPlugin from "./main";
import type { JournalSection, PeriodType, SectionType, ViewLocation } from "./types";
import { detectedToSections, detectSections } from "./parse/detect-sections";
import { ConfirmModal } from "./ui/confirm-modal";
import { setLanguage, t } from "./i18n";

const TYPE_LABEL: Record<PeriodType, string> = {
	daily: "日日志",
	weekly: "周",
	monthly: "月",
	annual: "年",
};

const SECTION_TYPE_LABEL: Record<SectionType, string> = {
	checkin: "打卡",
	data: "数据",
	text: "文本",
	list: "列表",
	paragraph: "段落",
};

type SettingsTabId = "general" | "journals" | "panel";

export class QJSettingTab extends PluginSettingTab {
	private settingsTab: SettingsTabId = "general";
	private journalTab: PeriodType = "daily";

	constructor(app: App, private plugin: QuickJournalPlugin) {
		super(app, plugin);
	}

	display(): void {
		// 结构性变更需要整页重绘——记住滚动位置，画完恢复，否则每次改动都跳回顶部
		const scroller = this.containerEl.closest(".vertical-tab-content");
		const scrollTop = scroller?.scrollTop ?? 0;
		this.containerEl.empty();

		this.renderTabBar();

		if (this.settingsTab === "general") this.renderGeneral();
		else if (this.settingsTab === "journals") this.renderJournals();
		else this.renderPanel();

		if (scroller !== null && scrollTop > 0) scroller.scrollTop = scrollTop;
	}

	private renderTabBar(): void {
		const tabs = this.containerEl.createDiv({ cls: "qj-tabs" });
		const items: { id: SettingsTabId; label: string }[] = [
			{ id: "general", label: t("通用") },
			{ id: "journals", label: t("日志") },
			{ id: "panel", label: t("速记面板") },
		];
		for (const item of items) {
			const btn = tabs.createEl("button", {
				cls: `qj-btn${this.settingsTab === item.id ? " is-active" : ""}`,
				text: item.label,
			});
			btn.type = "button";
			btn.onclick = () => {
				this.settingsTab = item.id;
				this.display();
			};
		}
	}

	// ── 通用 ────────────────────────────────────────────────────────────────

	private renderGeneral(): void {
		new Setting(this.containerEl)
			.setName(t("界面语言"))
			.addDropdown((drop) => {
				drop.addOption("auto", t("跟随 Obsidian"));
				drop.addOption("zh", t("中文"));
				drop.addOption("en", t("英文"));
				drop.setValue(this.plugin.config.language);
				drop.onChange(async (value) => {
					this.plugin.config.language = value as "auto" | "zh" | "en";
					setLanguage(this.plugin.config.language, () =>
						(this.app as unknown as { locale?: string })?.locale,
					);
					await this.plugin.saveConfig();
					this.display();
				});
			});

		new Setting(this.containerEl).setName(t("打开位置")).setHeading();
		for (const key of ["summary", "panel"] as const) {
			new Setting(this.containerEl)
				.setName(t(key === "summary" ? "日志汇总" : "速记面板"))
				.addDropdown((drop) => {
					drop.addOption("tab", t("标签页"));
					drop.addOption("sidebar", t("右侧边栏"));
					drop.setValue(this.plugin.config.viewLocations[key]);
					drop.onChange(async (value) => {
						this.plugin.config.viewLocations[key] = value as ViewLocation;
						await this.plugin.saveConfig();
					});
				});
		}

		this.containerEl.createEl("p", {
			cls: "qj-setting-note",
			text: t("命令在重载插件后按新配置生效；工具栏按钮与汇总视图即时生效。"),
		});

		new Setting(this.containerEl).addButton((btn) =>
			btn
				.setButtonText(t("恢复默认设置"))
				.setWarning()
				.onClick(() => {
					new ConfirmModal(
						this.app,
						t("恢复默认设置"),
						t("恢复默认设置说明"),
						async () => {
							await this.plugin.resetConfig();
							new Notice(t("已恢复默认设置，重载插件后命令按新配置生效。"));
							this.display();
						},
						t("恢复"),
					).open();
				}),
		);
	}

	// ── 日志（日/周/月/年） ──────────────────────────────────────────────────

	private renderJournals(): void {
		const tabs = this.containerEl.createDiv({ cls: "qj-tabs qj-tabs--inner" });
		for (const type of ["daily", "weekly", "monthly", "annual"] as PeriodType[]) {
			const btn = tabs.createEl("button", {
				cls: `qj-btn${this.journalTab === type ? " is-active" : ""}`,
				text: t(TYPE_LABEL[type]),
			});
			btn.type = "button";
			btn.onclick = () => {
				this.journalTab = type;
				this.display();
			};
		}

		const journal = this.plugin.config.journals[this.journalTab];
		new Setting(this.containerEl)
			.setName(t("日志目录"))
			.addText((text) => {
				text.setPlaceholder(t("示例：500 Journal/540 Daily"));
				text.setValue(journal.dir);
				text.onChange(async (value) => {
					journal.dir = value.trim();
					await this.plugin.saveConfig();
				});
			});

		if (this.journalTab === "daily") {
			new Setting(this.containerEl)
				.setName(t("模板笔记"))
				.setDesc(t("从模板识别说明"))
				.addText((text) => {
					text.setPlaceholder(t("示例：500 Journal/TPL-Daily.md"));
					text.setValue(this.plugin.config.templateNote);
					text.onChange(async (value) => {
						this.plugin.config.templateNote = value.trim();
						await this.plugin.saveConfig();
					});
				})
				.addButton((btn) =>
					btn
						.setButtonText(t("从模板识别"))
						.setCta()
						.onClick(() => void this.detectFromTemplate()),
				);
		}

		new Setting(this.containerEl).setName(t("标题区")).setHeading();
		for (const section of journal.sections) {
			this.sectionEditor(journal, section);
		}
		new Setting(this.containerEl).addButton((btn) =>
			btn
				.setButtonText(t("添加标题区"))
				.onClick(async () => {
					journal.sections.push({
						id: `sec-${Date.now()}`,
						heading: "## ",
						type: "list",
						fields: [],
					});
					await this.plugin.saveConfig();
					this.display();
				}),
		);
	}

	private async detectFromTemplate(): Promise<void> {
		const path = normalizePath(this.plugin.config.templateNote);
		if (path === "") {
			new Notice(t("请先填写模板笔记路径"));
			return;
		}
		const file = this.app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) {
			new Notice(`${t("找不到笔记")}：${path}`);
			return;
		}
		const text = await this.app.vault.cachedRead(file);
		const sections = detectedToSections(detectSections(text));
		if (sections.length === 0) {
			new Notice(t("未识别到标题区"));
			return;
		}
		this.plugin.config.journals.daily.sections = sections;
		await this.plugin.saveConfig();
		const fieldCount = sections.reduce((n, s) => n + s.fields.length, 0);
		new Notice(`${t("识别到")} ${sections.length} ${t("个标题区")}、${fieldCount} ${t("个字段")}`);
		this.display();
	}

	private sectionEditor(journal: { sections: JournalSection[] }, section: JournalSection): void {
		const container = this.containerEl.createDiv({ cls: "qj-section-editor" });

		new Setting(container)
			.addText((text) => {
				text.setPlaceholder("### …");
				text.setValue(section.heading);
				text.onChange(async (value) => {
					section.heading = value;
					await this.plugin.saveConfig();
				});
			})
			.addDropdown((drop) => {
				for (const type of ["checkin", "data", "text", "list", "paragraph"] as SectionType[]) {
					drop.addOption(type, t(SECTION_TYPE_LABEL[type]));
				}
				drop.setValue(section.type);
				drop.onChange(async (value) => {
					section.type = value as SectionType;
					await this.plugin.saveConfig();
					this.display();
				});
			})
			.addExtraButton((btn) =>
				btn.setIcon("trash-2").setTooltip(t("删除")).onClick(async () => {
					journal.sections.splice(journal.sections.indexOf(section), 1);
					await this.plugin.saveConfig();
					this.display();
				}),
			);

		// 速记面板相关开关仅对日日志有意义（面板只聚合 daily）
		if (
			this.journalTab === "daily" &&
			(section.type === "list" || section.type === "text" || section.type === "paragraph")
		) {
			new Setting(container)
				.setName(t("开启内容汇总面板"))
				.setDesc(t("在速记面板里聚合显示该标题区的内容"))
				.addToggle((toggle) =>
					toggle.setValue(section.panel === true).onChange(async (value) => {
						section.panel = value ? true : undefined;
						await this.plugin.saveConfig();
						this.display();
					}),
				);
		}
		if (this.journalTab === "daily" && (section.type === "list" || section.type === "paragraph")) {
			new Setting(container)
				.setName(t("自动添加时间戳"))
				.setDesc(t("记录时自动加时间戳前缀（HH:mm），速记面板会解析并显示"))
				.addToggle((toggle) => {
					toggle.setDisabled(section.panel !== true);
					toggle.setValue(section.timestamp === true);
					toggle.onChange(async (value) => {
						section.timestamp = value ? true : undefined;
						await this.plugin.saveConfig();
					});
				});
		}

		if (section.type === "list") {
			new Setting(container)
				.setName(t("行模板"))
				.setDesc("{{value}}")
				.addText((text) => {
					text.setValue(section.lineTemplate ?? "- {{value}}");
					text.onChange(async (value) => {
						section.lineTemplate = value;
						await this.plugin.saveConfig();
					});
				});
			return;
		}

		// 段落类型没有字段行，不提供字段编辑器
		if (section.type === "paragraph") return;

		for (const field of section.fields) {
			const row = new Setting(container).setClass("qj-field-editor");
			row.addText((text) => {
				text.setPlaceholder(t("字段键"));
				text.setValue(field.key);
				text.onChange(async (value) => {
					field.key = value;
					await this.plugin.saveConfig();
				});
			});
			row.addText((text) => {
				text.setPlaceholder(t("展示名"));
				text.setValue(field.label);
				text.onChange(async (value) => {
					field.label = value;
					await this.plugin.saveConfig();
				});
			});
			if (section.type === "data") {
				row.addText((text) => {
					text.setPlaceholder(t("单位"));
					text.setValue(field.unit ?? "");
					text.onChange(async (value) => {
						field.unit = value;
						await this.plugin.saveConfig();
					});
				});
			}
			row.addExtraButton((btn) =>
				btn.setIcon("x").setTooltip(t("删除")).onClick(async () => {
					section.fields.splice(section.fields.indexOf(field), 1);
					await this.plugin.saveConfig();
					this.display();
				}),
			);
		}
		new Setting(container).addButton((btn) =>
			btn
				.setButtonText(t("添加字段"))
				.onClick(async () => {
					section.fields.push({ key: "", label: "" });
					await this.plugin.saveConfig();
					this.display();
				}),
		);
	}

	// ── 速记面板 ────────────────────────────────────────────────────────────

	private renderPanel(): void {
		new Setting(this.containerEl)
			.setName(t("显示已完成任务"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.config.panel.showCompleted).onChange(async (value) => {
					this.plugin.config.panel.showCompleted = value;
					await this.plugin.saveConfig();
				}),
			);

		new Setting(this.containerEl)
			.setName(t("未完成任务标识"))
			.setDesc(t("滚动时计入未完成的勾选框字符（空格始终包含），逗号分隔"))
			.addText((text) => {
				text.setPlaceholder(">,/");
				text.setValue(this.plugin.config.rollover.openMarkers.join(","));
				text.onChange(async (value) => {
					const markers = value
						.split(",")
						.map((token) => token.trim())
						.filter((token) => token.length === 1 && token !== " ");
					this.plugin.config.rollover.openMarkers = markers;
					await this.plugin.saveConfig();
				});
			});
	}
}
