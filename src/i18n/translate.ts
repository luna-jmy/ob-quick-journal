/**
 * 翻译核心（纯函数）：中文是源，键就是中文原文；英文查 en.ts 字典。
 * 语言解析顺序：显式设置 > Obsidian 界面语言（localeProvider）> 中文。
 */

export type Language = "zh" | "en";
export type LanguageSetting = "auto" | "zh" | "en";

import { EN } from "./en";

let currentSetting: LanguageSetting = "auto";
let localeProvider: () => string | undefined = () => undefined;

export function setLanguage(setting: LanguageSetting, provider?: () => string | undefined): void {
	currentSetting = setting;
	if (provider) localeProvider = provider;
}

export function effectiveLanguage(): Language {
	if (currentSetting === "zh" || currentSetting === "en") return currentSetting;
	const locale = localeProvider();
	if (locale && locale.toLowerCase().startsWith("zh")) return "zh";
	return locale ? "en" : "zh";
}

/** 取文案：英文模式下查字典，查不到回退中文原文（键）。 */
export function t(key: string): string {
	if (effectiveLanguage() === "en") {
		return EN[key] ?? key;
	}
	return key;
}
