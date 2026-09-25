/**
 * 设置页：语言 / 日志目录 / 模板笔记 + **标题区编辑器**。
 * 标题区是快速录入的配置单元：标题 + 类型（打卡/数据/文本/列表）+ 字段；
 * 「从模板识别」读模板笔记自动生成。注意：设置对象字段名是 config（§4.8）。
 */

import { Notice, PluginSettingTab, Setting, TFile, normalizePath, type App } from "obsidian";
import type QuickJournalPlugin from "./main";
import type { JournalSection, SectionType } from "./types";
import { detectedToSections, detectSections } from "./parse/detect-sections";
import { ConfirmModal } from "./ui/confirm-modal";
import { setLanguage, t } from "./i18n";

const TYPE_LABEL: Record<SectionType, string> = {
	checkin: "打卡",
	data: "数据",
	text: "文本",
	list: "列表",
	paragraph: "段落",
};

export class QJSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: QuickJournalPlugin) {
		super(app, plugin);
	}

	display(): void {
		this.containerEl.empty();

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

		new Setting(this.containerEl).setName(t("日日志目录")).addText((text) => {
			text.setPlaceholder(t("示例：500 Journal/540 Daily"));
			text.setValue(this.plugin.config.dailyDir);
			text.onChange(async (value) => {
				this.plugin.config.dailyDir = value.trim();
				await this.plugin.saveConfig();
			});
		});

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

		new Setting(this.containerEl).setName(t("标题区")).setHeading();
		for (const section of this.plugin.config.sections) {
			this.sectionEditor(section);
		}
		new Setting(this.containerEl).addButton((btn) =>
			btn
				.setButtonText(t("添加标题区"))
				.onClick(async () => {
					this.plugin.config.sections.push({
						id: `sec-${Date.now()}`,
						heading: "## ",
						type: "list",
						fields: [],
					});
					await this.plugin.saveConfig();
					this.display();
				}),
		);

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
		this.plugin.config.sections = sections;
		await this.plugin.saveConfig();
		const fieldCount = sections.reduce((n, s) => n + s.fields.length, 0);
		new Notice(`${t("识别到")} ${sections.length} ${t("个标题区")}、${fieldCount} ${t("个字段")}`);
		this.display();
	}

	private sectionEditor(section: JournalSection): void {
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
					drop.addOption(type, t(TYPE_LABEL[type]));
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
					const sections = this.plugin.config.sections;
					sections.splice(sections.indexOf(section), 1);
					await this.plugin.saveConfig();
					this.display();
				}),
			);

		if (section.type === "list" || section.type === "text" || section.type === "paragraph") {
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

		if (section.type === "list" || section.type === "paragraph") {
			// 时间戳只在面板开启后可用（面板负责解析显示）
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
}
