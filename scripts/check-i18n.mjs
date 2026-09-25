/**
 * i18n 一致性检查：
 * 1. 漏翻：src 里 t("…") 字面量键必须存在于 src/i18n/en.ts（失败退出码 1）；
 * 2. 多余：en.ts 里有、但代码里既无字面量使用也无动态可能（仅提示，动态键 t(x) 无法静态判定）。
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "src");

function walk(dir) {
	const out = [];
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) out.push(...walk(p));
		else if (name.endsWith(".ts")) out.push(p);
	}
	return out;
}

const files = walk(srcDir).filter((f) => !f.includes(join("i18n", "en.ts")));
const used = new Set();
const callRe = /\bt\(\s*(["'])([^"'\n]+)\1/g;
for (const f of files) {
	const src = readFileSync(f, "utf8");
	for (const m of src.matchAll(callRe)) used.add(m[2]);
}

const enSrc = readFileSync(join(srcDir, "i18n", "en.ts"), "utf8");
const dict = new Set();
for (const m of enSrc.matchAll(/^\t"((?:[^"\\]|\\.)*)":/gm)) dict.add(m[1]);

const missing = [...used].filter((k) => !dict.has(k));
const extra = [...dict].filter((k) => !used.has(k));

if (missing.length > 0) {
	console.error("漏翻（t() 字面量键不在 en.ts）:");
	for (const k of missing) console.error(`  - ${k}`);
	process.exit(1);
}
if (extra.length > 0) {
	console.log(`提示：en.ts 有 ${extra.length} 个键未以字面量出现（可能供 t(field.label) 动态使用）`);
}
console.log(`i18n 检查通过：${used.size} 个字面量键，${dict.size} 个字典键。`);
