/**
 * 设置页（原型阶段：语言 + 四个日志目录；动作/注册表编辑器后续里程碑）。
 * 注意：设置对象字段名是 config（避开 1.13 宿主保留的 settings）。
 */

import { PluginSettingTab, Setting, type App } from "obsidian";
import type QuickJournalPlugin from "./main";
import { setLanguage, t } from "./i18n";

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

		new Setting(this.containerEl).setName(t("日志目录")).setHeading();
		this.dirSetting(t("日日志目录"), "dailyDir");
		this.dirSetting(t("周日志目录"), "weeklyDir");
		this.dirSetting(t("月日志目录"), "monthlyDir");
		this.dirSetting(t("年日志目录"), "annualDir");

		this.containerEl.createEl("p", {
			cls: "qj-setting-note",
			text: t("捕获动作与字段注册表的编辑器在后续版本提供；当前使用出厂预设。"),
		});
	}

	private dirSetting(name: string, key: "dailyDir" | "weeklyDir" | "monthlyDir" | "annualDir"): void {
		new Setting(this.containerEl).setName(name).addText((text) => {
			text.setPlaceholder(t("示例：500 Journal/540 Daily"));
			text.setValue(this.plugin.config[key]);
			text.onChange(async (value) => {
				this.plugin.config[key] = value.trim();
				await this.plugin.saveConfig();
			});
		});
	}
}
