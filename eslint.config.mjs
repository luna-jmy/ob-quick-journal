import obsidianmd from "eslint-plugin-obsidianmd";

/**
 * 官方 obsidianmd ESLint 预设（零 error 方可合并）。
 *
 * 兼容性说明（与 ob-project-center 同款解法）：eslint-plugin-obsidianmd 的
 * configs.recommended 在配置对象里使用了 `extends` 键，ESLint 9 会直接报错；
 * 用 inlineExtends() 把 `extends` 声明式展开为扁平配置，规则集本身不做增删。
 */
function inlineExtends(items) {
	const out = [];
	for (const item of items) {
		if (item && typeof item === "object" && "extends" in item) {
			const { extends: ext, ...rest } = item;
			for (const e of ext) {
				if (Array.isArray(e)) {
					out.push(...inlineExtends(e));
				} else {
					out.push(e);
				}
			}
			if (Object.keys(rest).length > 0) {
				out.push(rest);
			}
		} else {
			out.push(item);
		}
	}
	return out;
}

export default [
	{
		ignores: ["node_modules/**", "main.js", "coverage/**", "esbuild.config.mjs"],
	},
	...inlineExtends([...obsidianmd.configs.recommended]),
	{
		files: ["**/*.ts", "**/*.tsx"],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	/*
	 * 既定取舍（ob-tdk-general §4.8）：minAppVersion 1.8.7 下设置页只能实现 display()，
	 * 1.13 起它被标记弃用——降为 warn 接受，不当作待修问题；改用声明式设置 API 的
	 * 前提是把 minAppVersion 提到 1.13，那是产品决定。
	 */
	{
		files: ["src/settings.ts"],
		rules: {
			"@typescript-eslint/no-deprecated": "warn",
		},
	},
];
