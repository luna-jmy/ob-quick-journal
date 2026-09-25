/* Quick Journal — bundled 2026-09-25T10:39:58.196Z */
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => QuickJournalPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian10 = require("obsidian");

// src/types.ts
var BOOL_YES = "\u2714\uFE0F";
var BOOL_NO = "\u274C";
var DEFAULT_SECTIONS = [
  {
    id: "checkin",
    heading: "### \u6BCF\u65E5\u6253\u5361",
    type: "checkin",
    fields: [
      { key: "\u{1F48A}medicine", label: "\u5403\u836F" },
      { key: "\u{1F9E0}flashcard", label: "\u5361\u7247\u590D\u4E60" },
      { key: "\u{1F9D8}\u200D\u2642\uFE0Fmeditation", label: "\u51A5\u60F3" },
      { key: "\u{1F37D}\uFE0Ffasting", label: "\u8F7B\u65AD\u98DF" }
    ]
  },
  {
    id: "data",
    heading: "### \u6570\u636E\u8BB0\u5F55",
    type: "data",
    fields: [
      { key: "weight\u2696\uFE0F", label: "\u4F53\u91CD", unit: "kg" },
      { key: "exercise\u{1F553}", label: "\u8FD0\u52A8", unit: "\u5206\u949F" },
      { key: "reading\u{1F553}", label: "\u9605\u8BFB", unit: "\u5206\u949F" },
      { key: "saving\u{1F4B0}", label: "\u5B58\u5165", unit: "\u5143" },
      { key: "spent\u{1F4B0}", label: "\u652F\u51FA", unit: "\u5143" }
    ]
  },
  {
    id: "daily-review",
    heading: "## \u270D\uFE0F \u4ECA\u65E5\u5C0F\u7ED3\u4E0E\u56DE\u987E",
    type: "text",
    fields: [
      { key: "\u4ECA\u5929\u6700\u6EE1\u610F\u7684\u4E8B", label: "\u6700\u6EE1\u610F" },
      { key: "\u4ECA\u5929\u9047\u5230\u7684\u969C\u788D\u6216\u56F0\u96BE", label: "\u969C\u788D\u56F0\u96BE" },
      { key: "\u4ECA\u5929\u5370\u8C61\u6700\u6DF1\u523B\u7684\u4E8B", label: "\u5370\u8C61\u6700\u6DF1" },
      { key: "\u660E\u5929\u60F3\u6539\u8FDB\u7684\u4E8B", label: "\u660E\u5929\u6539\u8FDB" }
    ],
    panel: true
  },
  {
    id: "gtd",
    heading: "## \u{1F440} GTD\u4EFB\u52A1\u770B\u677F",
    type: "list",
    fields: [],
    lineTemplate: "- [ ] {{value}}"
  },
  {
    id: "ideas",
    heading: "## \u{1F4A1} \u7075\u611F\u4E0E\u601D\u8003",
    type: "list",
    fields: [],
    panel: true,
    timestamp: true
  }
];
var DEFAULT_CONFIG = {
  language: "auto",
  dailyDir: "500 Journal/540 Daily",
  templateNote: "",
  sections: DEFAULT_SECTIONS
};
function isRecord(v) {
  return typeof v === "object" && v !== null;
}
var SECTION_TYPES = ["checkin", "data", "text", "list", "paragraph"];
function sanitizeSection(raw, fallbackIndex) {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "string" && raw.id !== "" ? raw.id : `sec-${fallbackIndex}`;
  const heading = typeof raw.heading === "string" ? raw.heading : "";
  const type = SECTION_TYPES.includes(raw.type) ? raw.type : null;
  if (heading === "" || type === null) return null;
  const fields = Array.isArray(raw.fields) ? raw.fields.filter((f) => isRecord(f) && typeof f.key === "string").map((f) => ({
    key: String(f.key),
    label: typeof f.label === "string" && f.label !== "" ? f.label : String(f.key),
    ...typeof f.unit === "string" && f.unit !== "" ? { unit: f.unit } : {}
  })) : [];
  const lineTemplate = typeof raw.lineTemplate === "string" ? raw.lineTemplate : void 0;
  const panel = raw.panel === true ? true : void 0;
  const timestamp = raw.timestamp === true ? true : void 0;
  return {
    id,
    heading,
    type,
    fields,
    ...lineTemplate ? { lineTemplate } : {},
    ...panel ? { panel } : {},
    ...timestamp ? { timestamp } : {}
  };
}
function mergeConfig(saved) {
  const base = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  if (!isRecord(saved)) return base;
  if (saved.language === "zh" || saved.language === "en" || saved.language === "auto") {
    base.language = saved.language;
  }
  if (typeof saved.dailyDir === "string" && saved.dailyDir.trim() !== "") {
    base.dailyDir = saved.dailyDir;
  }
  if (typeof saved.templateNote === "string") {
    base.templateNote = saved.templateNote;
  }
  if (Array.isArray(saved.sections)) {
    const sections = saved.sections.map((s, i) => sanitizeSection(s, i)).filter((s) => s !== null);
    if (sections.length > 0) base.sections = sections;
    return base;
  }
  if (isRecord(saved.registry) && Array.isArray(saved.registry.daily)) {
    const kindMap = { bool: "checkin", number: "data", text: "text" };
    const migrated = saved.registry.daily.map((s, i) => {
      var _a;
      if (!isRecord(s)) return null;
      const type = (_a = kindMap[String(s.kind)]) != null ? _a : "text";
      return sanitizeSection({ ...s, type }, i);
    }).filter((s) => s !== null);
    if (migrated.length > 0) {
      const ids = new Set(migrated.map((s) => s.id));
      for (const extra of DEFAULT_SECTIONS) {
        if (extra.type === "list" && !ids.has(extra.id)) migrated.push(extra);
      }
      base.sections = migrated;
    }
  }
  return base;
}

// src/i18n/en.ts
var EN = {
  // ── 注册表字段标签（dynamic：field.label 直接展示，供自动识别回退与默认配置）──
  "\u5403\u836F": "Medicine",
  "\u5361\u7247\u590D\u4E60": "Flashcards",
  "\u51A5\u60F3": "Meditation",
  "\u8F7B\u65AD\u98DF": "Fasting",
  "\u4F53\u91CD": "Weight",
  "\u8FD0\u52A8": "Exercise",
  "\u9605\u8BFB": "Reading",
  "\u5B58\u5165": "Saved",
  "\u652F\u51FA": "Spent",
  "\u6700\u6EE1\u610F": "Best thing",
  "\u969C\u788D\u56F0\u96BE": "Obstacle",
  "\u5370\u8C61\u6700\u6DF1": "Most memorable",
  "\u660E\u5929\u6539\u8FDB": "Improve tomorrow",
  // ── 表单 ──
  "\u5185\u5BB9": "Content",
  "\u63D0\u4EA4": "Submit",
  "\u53D6\u6D88": "Cancel",
  "\u9009\u62E9\u52A8\u4F5C": "Choose a heading section",
  "\u5FEB\u901F\u5F55\u5165": "Quick capture",
  // ── 写入结果 ──
  "\u5DF2\u5199\u5165": "Written to",
  "\u521B\u5EFA\u7B14\u8BB0": "Created note",
  "\u5199\u5165\u5931\u8D25": "Write failed",
  "\u4EE5\u4E0B\u5B57\u6BB5\u5DF2\u6709\u503C\uFF0C\u8986\u76D6\u5199\u5165\uFF1F": "These fields already have values. Overwrite?",
  "\u8986\u76D6": "Overwrite",
  // ── 命令 / 视图 ──
  "\u6253\u5F00\u65E5\u5FD7\u6C47\u603B": "Open journal summary",
  "\u65E5\u5FD7\u6C47\u603B": "Journal summary",
  "\u6253\u5F00\u5FEB\u901F\u5F55\u5165": "Open quick capture",
  "\u6253\u5F00\u901F\u8BB0\u9762\u677F": "Open capture feed",
  "\u901F\u8BB0\u9762\u677F": "Capture feed",
  "\u8FD1 7 \u5929": "Last 7 days",
  "\u8FD1 30 \u5929": "Last 30 days",
  "\u8BB0\u70B9\u4EC0\u4E48\u2026": "Jot something\u2026",
  "\u53D1\u9001": "Send",
  "\u4ECA\u5929": "Today",
  "\u6628\u5929": "Yesterday",
  "\u6682\u65E0\u5185\u5BB9\uFF0C\u5148\u53BB\u8BB0\u4E00\u6761": "Nothing here yet \u2014 capture something first",
  "\u6CA1\u6709\u5F00\u542F\u5185\u5BB9\u6C47\u603B\u9762\u677F\u7684\u6807\u9898\u533A": "No heading sections are enabled for the capture feed yet",
  "\u7F16\u8F91": "Edit",
  "\u4FDD\u5B58": "Save",
  "\u6253\u5F00\u65E5\u5FD7": "Open note",
  "\u5220\u9664\u8FD9\u6761\u8BB0\u5F55\uFF1F": "Delete this entry?",
  "\u5185\u5BB9\u5DF2\u53D8\u5316\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5": "This entry changed since the feed loaded \u2014 refresh and try again",
  "\u5468": "Week",
  "\u6708": "Month",
  "\u5E74": "Year",
  "\u4E0A\u4E00\u671F": "Previous",
  "\u4E0B\u4E00\u671F": "Next",
  "\u56DE\u5230\u672C\u671F": "Current",
  "\u5237\u65B0": "Refresh",
  "\u4EFB\u52A1": "Tasks",
  "\u5B8C\u6210": "Done",
  "\u65B0\u5EFA": "Created",
  "\u8BB0\u5F55": "recorded",
  "\u7F3A": "missing",
  "\u6761\u65E5\u5FD7": "journal notes",
  "\u672C\u671F\u8FD8\u6CA1\u6709\u65E5\u5FD7\uFF0C\u5148\u53BB\u8BB0\u4E00\u6761": "No journal notes in this period yet \u2014 capture something first",
  // ── 设置 ──
  "\u8BBE\u7F6E": "Settings",
  "\u754C\u9762\u8BED\u8A00": "Interface language",
  "\u8DDF\u968F Obsidian": "Follow Obsidian",
  "\u4E2D\u6587": "Chinese",
  "\u82F1\u6587": "English",
  "\u65E5\u65E5\u5FD7\u76EE\u5F55": "Daily notes folder",
  "\u793A\u4F8B\uFF1A500 Journal/540 Daily": "e.g. 500 Journal/540 Daily",
  "\u6A21\u677F\u7B14\u8BB0": "Template note",
  "\u4ECE\u6A21\u677F\u8BC6\u522B\u8BF4\u660E": "Read this note and rebuild the heading sections below from its headings and inline fields.",
  "\u793A\u4F8B\uFF1A500 Journal/TPL-Daily.md": "e.g. 500 Journal/TPL-Daily.md",
  "\u4ECE\u6A21\u677F\u8BC6\u522B": "Detect from template",
  "\u8BF7\u5148\u586B\u5199\u6A21\u677F\u7B14\u8BB0\u8DEF\u5F84": "Fill in the template note path first",
  "\u627E\u4E0D\u5230\u7B14\u8BB0": "Note not found",
  "\u672A\u8BC6\u522B\u5230\u6807\u9898\u533A": "No heading sections detected",
  "\u8BC6\u522B\u5230": "Detected",
  "\u4E2A\u6807\u9898\u533A": "heading sections",
  "\u4E2A\u5B57\u6BB5": "fields",
  "\u6807\u9898\u533A": "Heading sections",
  "\u6DFB\u52A0\u6807\u9898\u533A": "Add heading section",
  "\u5220\u9664": "Remove",
  "\u884C\u6A21\u677F": "Line template",
  "\u5B57\u6BB5\u952E": "Field key",
  "\u5C55\u793A\u540D": "Display name",
  "\u5355\u4F4D": "Unit",
  "\u6DFB\u52A0\u5B57\u6BB5": "Add field",
  "\u5F00\u542F\u5185\u5BB9\u6C47\u603B\u9762\u677F": "Show in capture feed",
  "\u5728\u901F\u8BB0\u9762\u677F\u91CC\u805A\u5408\u663E\u793A\u8BE5\u6807\u9898\u533A\u7684\u5185\u5BB9": "Aggregate this section's content in the capture feed",
  "\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E": "Restore defaults",
  "\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E\u8BF4\u660E": "This clears all custom configuration and restores factory settings. Continue?",
  "\u5DF2\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E\uFF0C\u91CD\u8F7D\u63D2\u4EF6\u540E\u547D\u4EE4\u6309\u65B0\u914D\u7F6E\u751F\u6548\u3002": "Defaults restored; commands follow the new configuration after reloading the plugin.",
  "\u6062\u590D": "Restore",
  "\u6253\u5361": "Check-in",
  "\u6570\u636E": "Data",
  "\u6587\u672C": "Text",
  "\u5217\u8868": "List",
  "\u6BB5\u843D": "Paragraph",
  "\u81EA\u52A8\u6DFB\u52A0\u65F6\u95F4\u6233": "Auto timestamp",
  "\u8BB0\u5F55\u65F6\u81EA\u52A8\u52A0\u65F6\u95F4\u6233\u524D\u7F00\uFF08HH:mm\uFF09\uFF0C\u901F\u8BB0\u9762\u677F\u4F1A\u89E3\u6790\u5E76\u663E\u793A": "Prefix entries with HH:mm on capture; the capture feed parses and shows it",
  "\u547D\u4EE4\u5728\u91CD\u8F7D\u63D2\u4EF6\u540E\u6309\u65B0\u914D\u7F6E\u751F\u6548\uFF1B\u5DE5\u5177\u680F\u6309\u94AE\u4E0E\u6C47\u603B\u89C6\u56FE\u5373\u65F6\u751F\u6548\u3002": "Commands follow the new configuration after reloading the plugin; the toolbar button and the summary view apply immediately."
};

// src/i18n/translate.ts
var currentSetting = "auto";
var localeProvider = () => void 0;
function setLanguage(setting, provider) {
  currentSetting = setting;
  if (provider) localeProvider = provider;
}
function effectiveLanguage() {
  if (currentSetting === "zh" || currentSetting === "en") return currentSetting;
  const locale = localeProvider();
  if (locale && locale.toLowerCase().startsWith("zh")) return "zh";
  return locale ? "en" : "zh";
}
function t(key) {
  var _a;
  if (effectiveLanguage() === "en") {
    return (_a = EN[key]) != null ? _a : key;
  }
  return key;
}

// src/parse/field-lines.ts
var BRACKET_RE = /^\s*[-*]\s*\[([^\][]+?)::\s*(.*?)\]\s*$/;
var BARE_RE = /^\s*(?:[-*]\s+)?([^\s:#[^]][^:\n]*?)::\s*(.*)$/;
function parseFieldLines(lines) {
  const out = [];
  let inFence = false;
  let inFrontmatter = false;
  let frontmatterDone = false;
  lines.forEach((line, i) => {
    if (i === 0 && line.trim() === "---") {
      inFrontmatter = true;
      return;
    }
    if (inFrontmatter) {
      if (line.trim() === "---") {
        inFrontmatter = false;
        frontmatterDone = true;
      }
      return;
    }
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    if (line.trimStart().startsWith("%%")) return;
    const m = BRACKET_RE.exec(line);
    if (m) {
      out.push({ lineIndex: i, key: m[1].trim(), value: m[2].trim(), raw: line });
      return;
    }
    const b = BARE_RE.exec(line);
    if (b) {
      const key = b[1].trim();
      if (key.length > 0) {
        out.push({ lineIndex: i, key, value: b[2].trim(), raw: line });
      }
    }
  });
  void frontmatterDone;
  return out;
}
function renderFieldLine(key, value) {
  return value === "" ? `- [${key}::]` : `- [${key}:: ${value}]`;
}
function findHeadingIndex(lines, heading) {
  const target = heading.trim();
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === target) return i;
  }
  return -1;
}
function sectionRange(lines, headingIndex) {
  let end = lines.length;
  for (let i = headingIndex + 1; i < lines.length; i++) {
    if (/^#{1,6}\s/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return { start: headingIndex + 1, end };
}

// src/capture/plan.ts
function planFieldFill(lines, opts) {
  const headingIndex = findHeadingIndex(lines, opts.heading);
  if (headingIndex < 0) {
    if (!opts.headingMissingCreates) {
      return { status: "error", reason: "heading-not-found", heading: opts.heading };
    }
    let anchor = lines.length - 1;
    while (anchor >= 0 && lines[anchor].trim() === "") anchor--;
    const creates2 = [];
    let after = anchor;
    for (const v of opts.values) {
      creates2.push({ afterLineIndex: after, line: renderFieldLine(v.key, v.value) });
      after++;
    }
    return {
      status: "ok",
      createHeading: { heading: opts.heading, afterLineIndex: anchor },
      edits: [],
      creates: creates2
    };
  }
  const range = sectionRange(lines, headingIndex);
  const sectionLines = lines.slice(range.start, range.end);
  const byKey = /* @__PURE__ */ new Map();
  for (let i = 0; i < sectionLines.length; i++) {
    const m = /^\s*[-*]\s*\[([^\][]+?)::\s*(.*?)\]\s*$/.exec(sectionLines[i]);
    if (m && !byKey.has(m[1].trim())) {
      byKey.set(m[1].trim(), { relIndex: i, value: m[2].trim() });
    }
  }
  const edits = [];
  const creates = [];
  let lastFieldAbs = range.start - 1;
  for (let i = range.start; i < range.end; i++) {
    if (/^\s*[-*]\s*\[[^\][]+?::/.test(lines[i])) lastFieldAbs = i;
  }
  for (const v of opts.values) {
    const existing = byKey.get(v.key);
    if (existing) {
      const abs = range.start + existing.relIndex;
      edits.push({
        lineIndex: abs,
        key: v.key,
        newLine: renderFieldLine(v.key, v.value),
        previousValue: existing.value
      });
    } else {
      creates.push({ afterLineIndex: lastFieldAbs, line: renderFieldLine(v.key, v.value) });
      lastFieldAbs++;
    }
  }
  return { status: "ok", edits, creates };
}
function planAppend(lines, opts) {
  const headingIndex = findHeadingIndex(lines, opts.heading);
  if (headingIndex < 0) {
    if (!opts.headingMissingCreates) {
      return { status: "error", reason: "heading-not-found", heading: opts.heading };
    }
    let anchor = lines.length - 1;
    while (anchor >= 0 && lines[anchor].trim() === "") anchor--;
    return {
      status: "ok",
      createHeading: { heading: opts.heading, afterLineIndex: anchor },
      edits: [],
      creates: [{ afterLineIndex: anchor + 1, line: opts.line }]
    };
  }
  const range = sectionRange(lines, headingIndex);
  let insertAfter = headingIndex;
  for (let i = range.end - 1; i >= range.start; i--) {
    if (lines[i].trim() !== "") {
      insertAfter = i;
      break;
    }
  }
  return { status: "ok", edits: [], creates: [{ afterLineIndex: insertAfter, line: opts.line }] };
}
function planParagraph(lines, opts) {
  const headingIndex = findHeadingIndex(lines, opts.heading);
  const textLines = opts.text.trim() === "" ? [] : opts.text.split(/\r?\n/);
  if (headingIndex < 0) {
    if (!opts.headingMissingCreates || textLines.length === 0) {
      if (!opts.headingMissingCreates) {
        return { status: "error", reason: "heading-not-found", heading: opts.heading };
      }
      return { status: "ok", edits: [], creates: [], existingContent: "" };
    }
    let anchor = lines.length - 1;
    while (anchor >= 0 && lines[anchor].trim() === "") anchor--;
    const creates2 = textLines.map((line, i) => ({ afterLineIndex: anchor + i, line }));
    return {
      status: "ok",
      createHeading: { heading: opts.heading, afterLineIndex: anchor },
      edits: [],
      creates: creates2,
      existingContent: ""
    };
  }
  const range = sectionRange(lines, headingIndex);
  const contentLines = [];
  for (let i = range.start; i < range.end; i++) {
    if (lines[i].trim() !== "") contentLines.push(lines[i]);
  }
  if (contentLines.length === 0) {
    if (textLines.length === 0) return { status: "ok", edits: [], creates: [], existingContent: "" };
    const creates2 = textLines.map((line) => ({ afterLineIndex: headingIndex, line }));
    return { status: "ok", edits: [], creates: creates2, existingContent: "" };
  }
  const creates = textLines.length === 0 ? [{ afterLineIndex: headingIndex, line: "" }] : [...textLines, ""].map((line, i) => ({ afterLineIndex: headingIndex + i, line }));
  return {
    status: "ok",
    edits: [],
    creates,
    removeLines: { start: range.start, end: range.end },
    existingContent: contentLines[0].trim()
  };
}
function planEditLineAt(lineIndex, newLine) {
  return {
    status: "ok",
    edits: [{ lineIndex, key: "line", newLine, previousValue: "" }],
    creates: []
  };
}
function planDeleteLineAt(lineIndex) {
  return {
    status: "ok",
    edits: [],
    creates: [],
    removeLines: { start: lineIndex, end: lineIndex + 1 }
  };
}
function applyPlan(text, plan) {
  const lines = text.split(/\r?\n/);
  if (plan.removeLines) {
    lines.splice(plan.removeLines.start, plan.removeLines.end - plan.removeLines.start);
  }
  for (const e of plan.edits) {
    if (e.lineIndex < lines.length) lines[e.lineIndex] = e.newLine;
  }
  const inserts = plan.creates.map(
    (item, seq) => ({ ...item, seq })
  );
  if (plan.createHeading) {
    inserts.push({
      afterLineIndex: plan.createHeading.afterLineIndex,
      line: plan.createHeading.heading,
      seq: -1
    });
  }
  inserts.sort((a, b) => b.afterLineIndex - a.afterLineIndex || b.seq - a.seq);
  for (const item of inserts) {
    lines.splice(item.afterLineIndex + 1, 0, item.line);
  }
  return lines.join("\n");
}

// src/periods/period.ts
function dateKey(d) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
function isoWeekOf(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((date.getTime() - yearStart) / 864e5 + 1) / 7);
  return { year: date.getUTCFullYear(), week };
}
function mondayOfIsoWeek(year, week) {
  const jan4 = new Date(year, 0, 4);
  const jan4Day = (jan4.getDay() + 6) % 7;
  const week1Monday = new Date(year, 0, 4 - jan4Day);
  const monday = new Date(week1Monday);
  monday.setDate(monday.getDate() + (week - 1) * 7);
  return monday;
}
function addDays(d, n) {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}
function daysInMonth(year, month1) {
  return new Date(year, month1 + 1, 0).getDate();
}
function weekKey(d) {
  const { year, week } = isoWeekOf(d);
  return `${year}-W${String(week).padStart(2, "0")}`;
}
function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function yearKey(d) {
  return String(d.getFullYear());
}
function periodOf(kind, d) {
  if (kind === "week") {
    const { year, week } = isoWeekOf(d);
    const start2 = mondayOfIsoWeek(year, week);
    const days2 = Array.from({ length: 7 }, (_, i) => addDays(start2, i));
    return { kind, key: `${year}-W${String(week).padStart(2, "0")}`, start: start2, days: days2 };
  }
  if (kind === "month") {
    const start2 = new Date(d.getFullYear(), d.getMonth(), 1);
    const n = daysInMonth(d.getFullYear(), d.getMonth());
    const days2 = Array.from({ length: n }, (_, i) => addDays(start2, i));
    return { kind, key: monthKey(d), start: start2, days: days2 };
  }
  const start = new Date(d.getFullYear(), 0, 1);
  const end = new Date(d.getFullYear(), 11, 31);
  const days = [];
  for (let cur = start; cur <= end; cur = addDays(cur, 1)) days.push(new Date(cur));
  return { kind, key: yearKey(d), start, days };
}
function shiftPeriod(period, step) {
  if (period.kind === "week") {
    return periodOf("week", addDays(period.start, step * 7));
  }
  if (period.kind === "month") {
    const d = new Date(period.start.getFullYear(), period.start.getMonth() + step, 1);
    return periodOf("month", d);
  }
  return periodOf("year", new Date(period.start.getFullYear() + step, 0, 1));
}
function parseNoteDateKind(name) {
  const base = name.replace(/\.md$/i, "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(base)) return { kind: "day", key: base };
  if (/^\d{4}-W\d{2}$/.test(base)) return { kind: "week", key: base };
  if (/^\d{4}-\d{2}$/.test(base)) return { kind: "month", key: base };
  if (/^\d{4}$/.test(base)) return { kind: "year", key: base };
  return null;
}

// src/capture/variables.ts
function formatDate(d, format) {
  return format.replaceAll("YYYY", String(d.getFullYear())).replaceAll("YY", String(d.getFullYear()).slice(2)).replaceAll("MM", String(d.getMonth() + 1).padStart(2, "0")).replaceAll("DD", String(d.getDate()).padStart(2, "0"));
}
function renderTemplate(template, now) {
  const { year, week } = isoWeekOf(now);
  return template.replaceAll("{{date:YYYY-MM-DD}}", dateKey(now)).replaceAll("{{week}}", `${year}-W${String(week).padStart(2, "0")}`).replaceAll("{{month}}", monthKey(now)).replaceAll("{{year}}", yearKey(now)).replaceAll("{{weekKey}}", weekKey(now)).replace(/\{\{date:([^}]+)\}\}/g, (_all, fmt) => formatDate(now, fmt)).replaceAll("{{date}}", dateKey(now));
}
function targetNotePath(dir, fileTemplate, now) {
  const name = renderTemplate(fileTemplate, now);
  return `${dir.replace(/\/+$/, "")}/${name}.md`;
}

// src/capture/skeleton.ts
function dailySkeleton(date, sections) {
  const day = dateKey(date);
  const lines = [
    "---",
    "journal: Daily",
    `journal-date: ${day}`,
    "type: daily_log",
    `created: ${day}`,
    "tags:",
    "  - journal/daily",
    "---",
    "",
    `# ${day} \u65E5\u5FD7`,
    ""
  ];
  for (const section of sections) {
    lines.push(section.heading, "");
    for (const field of section.fields) lines.push(renderFieldLine(field.key, ""));
    lines.push("");
  }
  return lines.join("\n");
}

// src/services/file-writer.ts
var import_obsidian = require("obsidian");
async function ensureNote(app, path, skeleton) {
  const existing = app.vault.getAbstractFileByPath(path);
  if (existing instanceof import_obsidian.TFile) return existing;
  const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
  if (dir && !app.vault.getAbstractFileByPath(dir)) {
    try {
      await app.vault.createFolder(dir);
    } catch (e) {
    }
  }
  return app.vault.create(path, skeleton);
}
async function readNoteText(app, path) {
  const file = app.vault.getAbstractFileByPath(path);
  if (!(file instanceof import_obsidian.TFile)) throw new Error(`note not found: ${path}`);
  return app.vault.cachedRead(file);
}
async function applyPlanToFile(app, path, plan) {
  if (plan.status !== "ok") throw new Error(`plan error: ${plan.reason}`);
  const file = app.vault.getAbstractFileByPath(path);
  if (!(file instanceof import_obsidian.TFile)) throw new Error(`note not found: ${path}`);
  await app.vault.process(file, (text) => applyPlan(text, plan));
}

// src/services/capture-service.ts
var CaptureService = class {
  constructor(app, getConfig) {
    this.app = app;
    this.getConfig = getConfig;
  }
  dailyPath(now) {
    return targetNotePath(this.getConfig().dailyDir, "{{date}}", now);
  }
  async performSection(section, payload, opts) {
    var _a, _b;
    const now = (_a = opts.now) != null ? _a : /* @__PURE__ */ new Date();
    const path = this.dailyPath(now);
    let text;
    let created = false;
    try {
      text = await readNoteText(this.app, path);
    } catch (e) {
      const skeleton = dailySkeleton(now, this.getConfig().sections);
      const file = await ensureNote(this.app, path, skeleton);
      created = true;
      text = await this.app.vault.cachedRead(file);
    }
    let plan;
    if (section.type === "paragraph") {
      if (payload.lineValue === void 0 || payload.lineValue.trim() === "") {
        return { ok: false, reason: "error", message: "empty value" };
      }
      plan = planParagraph(text.split(/\r?\n/), {
        heading: section.heading,
        headingMissingCreates: true,
        text: this.withTimestamp(section, payload.lineValue, now)
      });
    } else if (section.type === "list") {
      if (payload.lineValue === void 0 || payload.lineValue.trim() === "") {
        return { ok: false, reason: "error", message: "empty value" };
      }
      const template = (_b = section.lineTemplate) != null ? _b : "- {{value}}";
      const line = template.replaceAll(
        "{{value}}",
        this.withTimestamp(section, payload.lineValue, now)
      );
      plan = planAppend(text.split(/\r?\n/), {
        heading: section.heading,
        headingMissingCreates: true,
        line
      });
    } else {
      const fillValues = section.fields.filter((f) => payload.values[f.key] !== void 0 && payload.values[f.key] !== "").map((f) => ({ key: f.key, value: payload.values[f.key] }));
      if (fillValues.length === 0) {
        return { ok: false, reason: "error", message: "no values to write" };
      }
      plan = planFieldFill(text.split(/\r?\n/), {
        heading: section.heading,
        headingMissingCreates: true,
        values: fillValues
      });
    }
    if (plan.status === "error") {
      return { ok: false, reason: "error", message: `${plan.reason}: ${plan.heading}` };
    }
    const overwrites = plan.edits.filter((e) => e.previousValue !== "").map((e) => e.key);
    if (plan.existingContent !== void 0 && plan.existingContent !== "") {
      overwrites.push(plan.existingContent);
    }
    if (overwrites.length > 0 && !opts.overwrite) {
      return { ok: false, reason: "overwrite", keys: overwrites, path };
    }
    await applyPlanToFile(this.app, path, plan);
    return {
      ok: true,
      path,
      created,
      writtenLines: plan.edits.length + plan.creates.length
    };
  }
  /** 时间戳单点：开启后 list / paragraph 的写入内容前加 HH:mm（面板解析显示）。 */
  withTimestamp(section, value, now) {
    if (section.timestamp !== true) return value;
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    return `${hh}:${mm} ${value}`;
  }
  // ── 速记面板的条目级写回（编辑 / 删除，不跳回日志） ─────────────────────
  /** 编辑一条流条目：line/field 原位改行（保留标记与时间戳），paragraph 整段重写。 */
  async editEntry(section, entry, content) {
    return this.mutateEntry(section, entry, content);
  }
  /** 删除一条流条目：line 删行，field 清值回空值行，paragraph 清空整段。 */
  async deleteEntry(section, entry) {
    return this.mutateEntry(section, entry, null);
  }
  async mutateEntry(section, entry, content) {
    var _a, _b, _c, _d;
    const path = `${this.getConfig().dailyDir.replace(/\/+$/, "")}/${entry.date}.md`;
    let text;
    try {
      text = await readNoteText(this.app, path);
    } catch (e) {
      return { ok: false, message: `note not found: ${entry.date}` };
    }
    const lines = text.split(/\r?\n/);
    let plan;
    if (entry.kind === "paragraph") {
      const body = content === null || content.trim() === "" ? "" : entry.time ? `${entry.time} ${content}` : content;
      plan = planParagraph(lines, {
        heading: section.heading,
        headingMissingCreates: false,
        text: body
      });
    } else {
      if (entry.lineIndex === void 0 || entry.lineIndex >= lines.length || lines[entry.lineIndex] !== entry.raw) {
        return { ok: false, message: "stale-line" };
      }
      if (content === null) {
        plan = entry.kind === "field" ? planEditLineAt(entry.lineIndex, renderFieldLine((_a = entry.key) != null ? _a : "", "")) : planDeleteLineAt(entry.lineIndex);
      } else if (entry.kind === "field") {
        plan = planEditLineAt(entry.lineIndex, renderFieldLine((_b = entry.key) != null ? _b : "", content));
      } else {
        const line = `${(_c = entry.prefix) != null ? _c : ""}${entry.time ? `${entry.time} ` : ""}${content}`;
        plan = planEditLineAt(entry.lineIndex, line);
      }
    }
    if (plan.status === "error") {
      return { ok: false, message: `${plan.reason}: ${(_d = plan.heading) != null ? _d : section.heading}` };
    }
    await applyPlanToFile(this.app, path, plan);
    return { ok: true };
  }
};

// src/ui/capture-modal.ts
var import_obsidian2 = require("obsidian");
var CaptureModal = class extends import_obsidian2.Modal {
  constructor(app, title, type, fields, onSubmit) {
    super(app);
    this.title = title;
    this.type = type;
    this.fields = fields;
    this.onSubmit = onSubmit;
    this.values = {};
    this.lineValue = "";
    this.boolState = {};
  }
  onOpen() {
    this.titleEl.setText(this.title);
    const form = this.contentEl.createDiv({ cls: "qj-form" });
    if (this.type === "list" || this.type === "paragraph") {
      const row = form.createDiv({ cls: "qj-field" });
      row.createEl("label", { cls: "qj-field-label", text: t("\u5185\u5BB9") });
      const input = row.createEl("textarea", { cls: "qj-input qj-textarea" });
      input.rows = this.type === "paragraph" ? 6 : 2;
      input.onchange = () => this.lineValue = input.value;
    } else {
      for (const field of this.fields) {
        const row = form.createDiv({ cls: "qj-field" });
        row.createEl("label", { cls: "qj-field-label", text: field.label });
        if (this.type === "checkin") {
          this.boolState[field.key] = "";
          const seg = row.createDiv({ cls: "qj-boolseg" });
          for (const opt of [
            { id: "yes", label: BOOL_YES },
            { id: "no", label: BOOL_NO }
          ]) {
            const btn = seg.createEl("button", {
              cls: "qj-boolseg-btn",
              text: opt.label
            });
            btn.type = "button";
            btn.onclick = () => {
              this.boolState[field.key] = this.boolState[field.key] === opt.id ? "" : opt.id;
              btn.toggleClass("is-active", this.boolState[field.key] === opt.id);
            };
          }
        } else if (this.type === "data") {
          const input = row.createEl("input", { cls: "qj-input", type: "number" });
          input.inputMode = "decimal";
          input.onchange = () => this.values[field.key] = input.value;
        } else {
          const input = row.createEl("input", { cls: "qj-input", type: "text" });
          input.onchange = () => this.values[field.key] = input.value;
        }
      }
    }
    const footer = form.createDiv({ cls: "qj-form-footer" });
    const cancel = footer.createEl("button", { cls: "qj-btn", text: t("\u53D6\u6D88") });
    cancel.type = "button";
    cancel.onclick = () => this.close();
    const submit = footer.createEl("button", {
      cls: "qj-btn qj-btn-primary",
      text: t("\u63D0\u4EA4")
    });
    submit.type = "button";
    (0, import_obsidian2.setIcon)(submit.createSpan({ cls: "qj-btn-icon" }), "check");
    submit.onclick = () => {
      for (const [key, state] of Object.entries(this.boolState)) {
        if (state === "yes") this.values[key] = BOOL_YES;
        else if (state === "no") this.values[key] = BOOL_NO;
        else delete this.values[key];
      }
      this.onSubmit({ values: { ...this.values }, lineValue: this.lineValue });
      this.close();
    };
  }
};

// src/ui/confirm-modal.ts
var import_obsidian3 = require("obsidian");
var ConfirmModal = class extends import_obsidian3.Modal {
  constructor(app, title, body, onAccept, acceptLabel = t("\u8986\u76D6")) {
    super(app);
    this.title = title;
    this.body = body;
    this.onAccept = onAccept;
    this.acceptLabel = acceptLabel;
  }
  onOpen() {
    this.titleEl.setText(this.title);
    this.contentEl.createEl("p", { cls: "qj-confirm-body", text: this.body });
    const footer = this.contentEl.createDiv({ cls: "qj-form-footer" });
    const cancel = footer.createEl("button", { cls: "qj-btn", text: t("\u53D6\u6D88") });
    cancel.type = "button";
    cancel.onclick = () => this.close();
    const accept = footer.createEl("button", {
      cls: "qj-btn qj-btn-primary",
      text: this.acceptLabel
    });
    accept.type = "button";
    accept.onclick = () => {
      this.close();
      void this.onAccept();
    };
  }
};

// src/ui/action-picker-modal.ts
var import_obsidian4 = require("obsidian");
var TYPE_ICON = {
  checkin: "circle-check",
  data: "line-chart",
  text: "feather",
  list: "list-plus",
  paragraph: "align-left"
};
var ActionPickerModal = class extends import_obsidian4.Modal {
  constructor(app, sections, onPick) {
    super(app);
    this.sections = sections;
    this.onPick = onPick;
  }
  onOpen() {
    this.titleEl.setText(t("\u9009\u62E9\u52A8\u4F5C"));
    const list = this.contentEl.createDiv({ cls: "qj-action-list" });
    for (const section of this.sections) {
      const row = list.createDiv({ cls: "qj-action-row" });
      (0, import_obsidian4.setIcon)(row.createSpan({ cls: "qj-action-icon" }), TYPE_ICON[section.type]);
      row.createSpan({ cls: "qj-action-name", text: section.heading.replace(/^#+\s*/, "") });
      row.onclick = () => {
        this.close();
        this.onPick(section);
      };
    }
  }
};

// src/views/summary-view.ts
var import_obsidian6 = require("obsidian");

// src/parse/task-lines.ts
var TASK_RE = /^\s*[-*]\s+\[([ xX/-])\]\s*(.*)$/;
function extractDate(mark, body) {
  const re = new RegExp(`${mark}\\s*(\\d{4}-\\d{2}-\\d{2})`);
  const m = re.exec(body);
  return m ? m[1] : void 0;
}
function parseTaskLine(line) {
  const m = TASK_RE.exec(line);
  if (!m) return null;
  const status = m[1];
  const body = m[2];
  return {
    line,
    done: status === "x" || status === "X",
    doneDate: extractDate("\u2705", body),
    createdDate: extractDate("\u2795", body)
  };
}
function parseTaskLines(lines) {
  return lines.map((l) => parseTaskLine(l)).filter((t2) => t2 !== null);
}

// src/metrics/aggregate.ts
function boolStats(fields, days, records) {
  return fields.map((f) => {
    let yes = 0;
    let no = 0;
    let missingDays = 0;
    for (const day of days) {
      const rec = records.get(day);
      const value = rec == null ? void 0 : rec.fieldValues[f.key];
      if (value === void 0 || value === "") {
        missingDays++;
      } else if (value === BOOL_YES) {
        yes++;
      } else if (value === BOOL_NO) {
        no++;
      } else {
        missingDays++;
      }
    }
    return { key: f.key, label: f.label, yes, no, missingDays };
  });
}
function numberStats(fields, days, records) {
  return fields.map((f) => {
    var _a;
    const samples = [];
    for (const day of days) {
      const raw = (_a = records.get(day)) == null ? void 0 : _a.fieldValues[f.key];
      if (raw === void 0 || raw === "") continue;
      const n = Number(raw);
      if (Number.isFinite(n)) samples.push({ date: day, value: n });
    }
    if (samples.length === 0) {
      return { key: f.key, label: f.label, unit: f.unit, count: 0, min: 0, max: 0, mean: 0, sum: 0 };
    }
    const values = samples.map((s) => s.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const latest = samples[samples.length - 1];
    return {
      key: f.key,
      label: f.label,
      unit: f.unit,
      count: samples.length,
      min: Math.min(...values),
      max: Math.max(...values),
      mean: sum / samples.length,
      sum,
      latest: latest.value,
      latestDate: latest.date
    };
  });
}
function taskStats(days, records) {
  const daySet = new Set(days);
  let total = 0;
  let done = 0;
  let doneInPeriod = 0;
  let createdInPeriod = 0;
  for (const rec of records.values()) {
    for (const task of parseTaskLines(rec.taskLines)) {
      total++;
      if (task.done) {
        done++;
        if (!task.doneDate || daySet.has(task.doneDate)) doneInPeriod++;
      }
      if (task.createdDate && daySet.has(task.createdDate)) createdInPeriod++;
    }
  }
  return { total, done, doneInPeriod, createdInPeriod };
}

// src/services/vault-index.ts
var import_obsidian5 = require("obsidian");

// src/parse/section-entries.ts
var BRACKET_FIELD_RE = /^\s*[-*]\s*\[([^\][]+?)::\s*(.*?)\]\s*$/;
var LIST_ITEM_RE = /^\s*[-*]\s+(.*)$/;
var TASK_ITEM_RE = /^\s*[-*]\s+\[([ xX/-])\]\s*(.*)$/;
var TIMESTAMP_RE = /^(\d{1,2}:\d{2})(?::\d{2})?\s+/;
function splitTimestamp(text) {
  const m = TIMESTAMP_RE.exec(text);
  if (!m) return { text };
  return { time: m[1], text: text.slice(m[0].length) };
}
function taskPrefix(status) {
  if (status === " ") return "\u2610";
  if (status === "x" || status === "X") return "\u2611";
  if (status === "-") return "\u2715";
  return "\u25D0";
}
function collectEntries(date, lines, sections) {
  var _a;
  const out = [];
  for (const section of sections) {
    const headingIndex = findHeadingIndex(lines, section.heading);
    if (headingIndex < 0) continue;
    const { start, end } = sectionRange(lines, headingIndex);
    let inFence = false;
    if (section.type === "paragraph") {
      const content = [];
      for (let i = start; i < end; i++) {
        const line = lines[i];
        if (line.trimStart().startsWith("```")) {
          inFence = !inFence;
          continue;
        }
        if (inFence) continue;
        if (line.trimStart().startsWith("%%")) continue;
        if (line.trim() !== "") content.push(line.trim());
      }
      if (content.length === 0) continue;
      const joined = content.join("\n");
      const ts = splitTimestamp(joined);
      out.push({ date, sectionId: section.id, kind: "paragraph", ...ts });
      continue;
    }
    for (let i = start; i < end; i++) {
      const line = lines[i];
      if (line.trimStart().startsWith("```")) {
        inFence = !inFence;
        continue;
      }
      if (inFence) continue;
      if (line.trimStart().startsWith("%%")) continue;
      const field = BRACKET_FIELD_RE.exec(line);
      if (field) {
        if (section.type !== "text") continue;
        const value = field[2].trim();
        if (value === "") continue;
        const def = section.fields.find((f) => f.key === field[1].trim());
        out.push({
          date,
          sectionId: section.id,
          kind: "field",
          label: (_a = def == null ? void 0 : def.label) != null ? _a : field[1].trim(),
          text: value,
          content: value,
          key: field[1].trim(),
          lineIndex: i,
          raw: line
        });
        continue;
      }
      if (section.type !== "list") continue;
      const task = TASK_ITEM_RE.exec(line);
      if (task) {
        if (task[2].trim() === "") continue;
        const ts = splitTimestamp(task[2].trim());
        out.push({
          date,
          sectionId: section.id,
          kind: "line",
          ...ts,
          text: `${taskPrefix(task[1])} ${ts.text}`,
          content: ts.text,
          prefix: line.slice(0, line.length - task[2].length),
          lineIndex: i,
          raw: line
        });
        continue;
      }
      const item = LIST_ITEM_RE.exec(line);
      if (item && item[1].trim() !== "") {
        const ts = splitTimestamp(item[1].trim());
        out.push({
          date,
          sectionId: section.id,
          kind: "line",
          ...ts,
          content: ts.text,
          text: ts.text,
          prefix: line.slice(0, line.length - item[1].length),
          lineIndex: i,
          raw: line
        });
      }
    }
  }
  return out;
}

// src/services/vault-index.ts
var VaultIndex = class {
  constructor(app, dailyDir) {
    this.app = app;
    this.dailyDir = dailyDir;
  }
  filesUnder(dir) {
    const prefix = dir.replace(/\/+$/, "") + "/";
    return this.app.vault.getMarkdownFiles().filter((f) => f.path.startsWith(prefix));
  }
  /** 采集期间内逐日的记录（只读，走 cachedRead）。 */
  async collectDayRecords(days) {
    const records = /* @__PURE__ */ new Map();
    let mtimeFallback = 0;
    const daySet = new Set(days.map(dateKey));
    const byDate = /* @__PURE__ */ new Map();
    for (const file of this.filesUnder(this.dailyDir)) {
      const date = this.resolveDate(file);
      if (date) byDate.set(date, file);
    }
    for (const day of days) {
      const key = dateKey(day);
      const file = byDate.get(key);
      if (!file || !daySet.has(key)) continue;
      const text = await this.app.vault.cachedRead(file);
      const fields = {};
      for (const fl of parseFieldLines(text.split(/\r?\n/))) {
        if (!(fl.key in fields)) fields[fl.key] = fl.value;
      }
      const taskLines = text.split(/\r?\n/).filter((l) => /^\s*[-*]\s+\[([ xX/-])\]/.test(l));
      records.set(key, { date: key, fieldValues: fields, taskLines });
    }
    return { records, mtimeFallback };
  }
  /** 速记面板用：期间逐日的标题区内容条目（只采集，不做判断）。 */
  async collectEntries(days, sections) {
    const byDate = /* @__PURE__ */ new Map();
    for (const file of this.filesUnder(this.dailyDir)) {
      const date = this.resolveDate(file);
      if (date) byDate.set(date, file);
    }
    const entries = [];
    for (const day of days) {
      const file = byDate.get(dateKey(day));
      if (!file) continue;
      const text = await this.app.vault.cachedRead(file);
      entries.push(...collectEntries(dateKey(day), text.split(/\r?\n/), sections));
    }
    return entries;
  }
  /** 按日期键打开日志笔记。 */
  dailyFile(dateStr) {
    const file = this.app.vault.getAbstractFileByPath(
      `${this.dailyDir.replace(/\/+$/, "")}/${dateStr}.md`
    );
    return file instanceof import_obsidian5.TFile ? file : null;
  }
  resolveDate(file) {
    var _a;
    const cache = this.app.metadataCache.getFileCache(file);
    const fmDate = (_a = cache == null ? void 0 : cache.frontmatter) == null ? void 0 : _a["journal-date"];
    if (typeof fmDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fmDate)) return fmDate;
    const name = parseNoteDateKind(file.name);
    if ((name == null ? void 0 : name.kind) === "day") return name.key;
    return null;
  }
};

// src/views/summary-view.ts
var VIEW_TYPE_QJ_SUMMARY = "qj-summary";
var KIND_LABEL = {
  week: "\u5468",
  month: "\u6708",
  year: "\u5E74"
};
var SummaryView = class extends import_obsidian6.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.kind = "week";
    this.period = periodOf("week", /* @__PURE__ */ new Date());
  }
  getViewType() {
    return VIEW_TYPE_QJ_SUMMARY;
  }
  getDisplayText() {
    return t("\u65E5\u5FD7\u6C47\u603B");
  }
  getIcon() {
    return "notebook-pen";
  }
  getViewData() {
    return this.kind;
  }
  setViewData(data) {
    if (data === "month" || data === "year" || data === "week") this.kind = data;
  }
  async onOpen() {
    await this.render();
  }
  async render() {
    const root = this.contentEl;
    root.empty();
    root.addClass("qj-summary-root");
    this.renderToolbar(root.createDiv({ cls: "qj-toolbar" }));
    await this.renderBody(root.createDiv({ cls: "qj-body" }));
  }
  renderToolbar(toolbar) {
    const kinds = ["week", "month", "year"];
    for (const kind of kinds) {
      const btn = toolbar.createEl("button", {
        cls: `qj-btn qj-kind-btn${kind === this.kind ? " is-active" : ""}`,
        text: t(KIND_LABEL[kind])
      });
      btn.type = "button";
      btn.onclick = () => {
        this.kind = kind;
        this.period = periodOf(kind, /* @__PURE__ */ new Date());
        void this.render();
      };
    }
    const nav = toolbar.createDiv({ cls: "qj-toolbar-nav" });
    const prev = nav.createEl("button", { cls: "qj-btn", text: `\u2039 ${t("\u4E0A\u4E00\u671F")}` });
    prev.type = "button";
    prev.onclick = () => {
      this.period = shiftPeriod(this.period, -1);
      void this.render();
    };
    nav.createSpan({ cls: "qj-toolbar-key", text: this.period.key });
    const next = nav.createEl("button", { cls: "qj-btn", text: `${t("\u4E0B\u4E00\u671F")} \u203A` });
    next.type = "button";
    next.onclick = () => {
      this.period = shiftPeriod(this.period, 1);
      void this.render();
    };
    const current = nav.createEl("button", { cls: "qj-btn", text: t("\u56DE\u5230\u672C\u671F") });
    current.type = "button";
    current.onclick = () => {
      this.period = periodOf(this.kind, /* @__PURE__ */ new Date());
      void this.render();
    };
    const refresh = nav.createEl("button", { cls: "qj-btn qj-icon-btn" });
    refresh.type = "button";
    (0, import_obsidian6.setIcon)(refresh, "refresh-cw");
    refresh.onclick = () => void this.render();
  }
  async renderBody(body) {
    const config = this.plugin.config;
    const index = new VaultIndex(this.app, config.dailyDir);
    const days = this.period.days.map(dateKey);
    const { records } = await index.collectDayRecords(this.period.days);
    body.createDiv({ cls: "qj-period-header" }).createSpan({
      cls: "qj-period-count",
      text: `${records.size} ${t("\u6761\u65E5\u5FD7")}`
    });
    if (records.size === 0) {
      body.createDiv({ cls: "qj-empty", text: t("\u672C\u671F\u8FD8\u6CA1\u6709\u65E5\u5FD7\uFF0C\u5148\u53BB\u8BB0\u4E00\u6761") });
      return;
    }
    const cards = body.createDiv({ cls: "qj-cards" });
    const tasks = taskStats(days, records);
    this.statCard(cards, t("\u4EFB\u52A1"), [
      { label: t("\u5B8C\u6210"), value: String(tasks.doneInPeriod) },
      { label: t("\u65B0\u5EFA"), value: String(tasks.createdInPeriod) },
      { label: t("\u8BB0\u5F55"), value: `${tasks.done}/${tasks.total}` }
    ]);
    for (const section of config.sections) {
      if (section.type === "checkin") {
        const stats = boolStats(section.fields, days, records);
        const card = this.cardShell(cards, section.heading.replace(/^#+\s*/, ""));
        for (const s of stats) {
          const row = card.createDiv({ cls: "qj-checkin-row" });
          row.createSpan({ cls: "qj-checkin-label", text: s.label });
          const bar = row.createDiv({ cls: "qj-bar" });
          const recorded = s.yes + s.no;
          if (recorded > 0) {
            bar.createSpan({ cls: "qj-bar-yes", attr: { style: `flex-grow:${s.yes}` } });
            bar.createSpan({ cls: "qj-bar-no", attr: { style: `flex-grow:${s.no}` } });
          }
          row.createSpan({
            cls: "qj-checkin-count",
            text: recorded > 0 ? `${s.yes} / ${recorded} ${t("\u8BB0\u5F55")} \xB7 ${t("\u7F3A")} ${s.missingDays}` : `${t("\u7F3A")} ${s.missingDays}`
          });
        }
      } else if (section.type === "data") {
        const stats = numberStats(section.fields, days, records);
        const card = this.cardShell(cards, section.heading.replace(/^#+\s*/, ""));
        for (const s of stats) {
          const row = card.createDiv({ cls: "qj-data-row" });
          row.createSpan({ cls: "qj-checkin-label", text: s.label });
          const unit = s.unit ? ` ${s.unit}` : "";
          row.createSpan({
            cls: "qj-data-value",
            text: s.count > 0 ? `\u5747\u503C ${s.mean.toFixed(1)}${unit}\uFF08${s.min}~${s.max}\uFF09` : "\u2014"
          });
        }
      }
    }
  }
  cardShell(cards, title) {
    const card = cards.createDiv({ cls: "qj-card" });
    card.createDiv({ cls: "qj-card-title", text: title });
    return card;
  }
  statCard(cards, title, metrics) {
    const card = this.cardShell(cards, title);
    const grid = card.createDiv({ cls: "qj-metric-grid" });
    for (const m of metrics) {
      const cell = grid.createDiv({ cls: "qj-metric" });
      cell.createSpan({ cls: "qj-metric-value", text: m.value });
      cell.createSpan({ cls: "qj-metric-label", text: m.label });
    }
  }
};

// src/views/panel-view.ts
var import_obsidian8 = require("obsidian");

// src/ui/entry-edit-modal.ts
var import_obsidian7 = require("obsidian");
var EntryEditModal = class extends import_obsidian7.Modal {
  constructor(app, title, initial, multiline, onSave) {
    super(app);
    this.initial = initial;
    this.multiline = multiline;
    this.onSave = onSave;
    this.titleEl.setText(title);
  }
  onOpen() {
    const form = this.contentEl.createDiv({ cls: "qj-form" });
    const input = form.createEl("textarea", { cls: "qj-input qj-textarea" });
    input.rows = this.multiline ? 8 : 3;
    input.value = this.initial;
    const footer = form.createDiv({ cls: "qj-form-footer" });
    const cancel = footer.createEl("button", { cls: "qj-btn", text: t("\u53D6\u6D88") });
    cancel.type = "button";
    cancel.onclick = () => this.close();
    const save = footer.createEl("button", { cls: "qj-btn qj-btn-primary", text: t("\u4FDD\u5B58") });
    save.type = "button";
    (0, import_obsidian7.setIcon)(save.createSpan({ cls: "qj-btn-icon" }), "check");
    save.onclick = () => {
      this.onSave(input.value);
      this.close();
    };
  }
};

// src/views/panel-view.ts
var VIEW_TYPE_QJ_PANEL = "qj-panel";
var PanelView = class extends import_obsidian8.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.rangeDays = 7;
    this.entries = [];
    this.feedEl = null;
    this.inputEl = null;
    this.targetId = "";
    /** 日志文件变更 → 防抖刷新（obsidian 自带 debounce，取消语义清晰） */
    this.scheduleRefresh = (0, import_obsidian8.debounce)(() => void this.loadFeed(), 1200, true);
  }
  getViewType() {
    return VIEW_TYPE_QJ_PANEL;
  }
  getDisplayText() {
    return t("\u901F\u8BB0\u9762\u677F");
  }
  getIcon() {
    return "message-square-quote";
  }
  async onOpen() {
    this.render();
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file instanceof import_obsidian8.TFile && file.path.startsWith(this.plugin.config.dailyDir)) {
          this.scheduleRefresh();
        }
      })
    );
  }
  onunload() {
    this.scheduleRefresh.cancel();
    super.onunload();
  }
  render() {
    const root = this.contentEl;
    root.empty();
    root.addClass("qj-panel-root");
    const toolbar = root.createDiv({ cls: "qj-feed-toolbar" });
    for (const days of [7, 30]) {
      const btn = toolbar.createEl("button", {
        cls: `qj-btn${this.rangeDays === days ? " is-active" : ""}`,
        text: t(days === 7 ? "\u8FD1 7 \u5929" : "\u8FD1 30 \u5929")
      });
      btn.type = "button";
      btn.onclick = () => {
        this.rangeDays = days;
        this.render();
      };
    }
    const refresh = toolbar.createEl("button", { cls: "qj-btn qj-icon-btn" });
    refresh.type = "button";
    (0, import_obsidian8.setIcon)(refresh, "refresh-cw");
    refresh.onclick = () => void this.loadFeed();
    this.renderInput(root);
    this.feedEl = root.createDiv({ cls: "qj-feed" });
    void this.loadFeed();
  }
  panelSections() {
    return this.plugin.config.sections.filter(
      (s) => s.panel === true && (s.type === "text" || s.type === "list" || s.type === "paragraph")
    );
  }
  /** 输入条可直发的目标：列表（追加）与段落（一天一条，覆盖需确认）。 */
  writableSections() {
    return this.panelSections().filter((s) => s.type === "list" || s.type === "paragraph");
  }
  renderInput(root) {
    const targets = this.writableSections();
    if (targets.length === 0) return;
    if (!targets.some((s) => s.id === this.targetId)) {
      this.targetId = targets[0].id;
    }
    const wrap = root.createDiv({ cls: "qj-panel-input" });
    const dropdown = new import_obsidian8.DropdownComponent(wrap);
    dropdown.addOptions(
      Object.fromEntries(targets.map((s) => [s.id, s.heading.replace(/^#+\s*/, "")]))
    );
    dropdown.setValue(this.targetId);
    dropdown.onChange((value) => this.targetId = value);
    const input = wrap.createEl("textarea", { cls: "qj-input qj-textarea" });
    input.rows = 2;
    input.placeholder = t("\u8BB0\u70B9\u4EC0\u4E48\u2026");
    this.inputEl = input;
    input.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter" && !evt.shiftKey) {
        evt.preventDefault();
        void this.send();
      }
    });
    const send = wrap.createEl("button", { cls: "qj-btn qj-btn-primary qj-send-btn" });
    send.type = "button";
    (0, import_obsidian8.setIcon)(send, "send");
    send.setAttribute("aria-label", t("\u53D1\u9001"));
    send.onclick = () => void this.send();
  }
  async send() {
    var _a, _b;
    const value = (_b = (_a = this.inputEl) == null ? void 0 : _a.value.trim()) != null ? _b : "";
    if (value === "") return;
    const section = this.writableSections().find((s) => s.id === this.targetId);
    if (!section) return;
    if (section.type === "paragraph") {
      await this.plugin.performCapture(section, { values: {}, lineValue: value }, false);
      if (this.inputEl) this.inputEl.value = "";
      await this.loadFeed();
      return;
    }
    const result = await this.plugin.capture.performSection(
      section,
      { values: {}, lineValue: value },
      { overwrite: false }
    );
    if (result.ok) {
      if (this.inputEl) this.inputEl.value = "";
      await this.loadFeed();
    } else if (result.reason === "error") {
      new import_obsidian8.Notice(`${t("\u5199\u5165\u5931\u8D25")}: ${result.message}`);
    }
  }
  async loadFeed() {
    const sections = this.panelSections();
    if (this.feedEl === null) return;
    this.feedEl.empty();
    if (sections.length === 0) {
      this.feedEl.createDiv({ cls: "qj-empty", text: t("\u6CA1\u6709\u5F00\u542F\u5185\u5BB9\u6C47\u603B\u9762\u677F\u7684\u6807\u9898\u533A") });
      return;
    }
    const index = new VaultIndex(this.app, this.plugin.config.dailyDir);
    const today = /* @__PURE__ */ new Date();
    const days = Array.from({ length: this.rangeDays }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return d;
    });
    this.entries = await index.collectEntries(days, sections);
    this.renderFeed();
  }
  renderFeed() {
    var _a;
    const feed = this.feedEl;
    if (feed === null) return;
    feed.empty();
    if (this.entries.length === 0) {
      feed.createDiv({ cls: "qj-empty", text: t("\u6682\u65E0\u5185\u5BB9\uFF0C\u5148\u53BB\u8BB0\u4E00\u6761") });
      return;
    }
    const sections = this.panelSections();
    const sectionName = new Map(
      sections.map((s) => [s.id, s.heading.replace(/^#+\s*/, "")])
    );
    const byDate = /* @__PURE__ */ new Map();
    for (const entry of this.entries) {
      if (!byDate.has(entry.date)) byDate.set(entry.date, []);
      byDate.get(entry.date).push(entry);
    }
    for (const date of [...byDate.keys()].sort().reverse()) {
      const day = feed.createDiv({ cls: "qj-feed-day" });
      day.createSpan({ cls: "qj-feed-day-label", text: this.dayLabel(date) });
      for (const entry of byDate.get(date)) {
        const section = sections.find((s) => s.id === entry.sectionId);
        if (!section) continue;
        const item = day.createDiv({ cls: "qj-feed-item" });
        const head = item.createDiv({ cls: "qj-feed-head" });
        const meta = head.createDiv({ cls: "qj-feed-meta" });
        meta.createSpan({ text: (_a = sectionName.get(entry.sectionId)) != null ? _a : "" });
        if (entry.label) meta.createSpan({ cls: "qj-feed-label", text: entry.label });
        if (entry.time) meta.createSpan({ cls: "qj-feed-time", text: entry.time });
        const actions = head.createDiv({ cls: "qj-feed-actions" });
        this.actionButton(actions, "pencil", t("\u7F16\u8F91"), () => this.editEntry(section, entry));
        this.actionButton(actions, "trash-2", t("\u5220\u9664"), () => this.deleteEntry(section, entry));
        this.actionButton(actions, "arrow-up-right", t("\u6253\u5F00\u65E5\u5FD7"), () => this.jumpTo(date));
        item.createDiv({ cls: "qj-feed-text", text: entry.text });
      }
    }
  }
  actionButton(parent, icon, label, onClick) {
    const btn = parent.createEl("button", { cls: "qj-feed-btn" });
    btn.type = "button";
    btn.setAttribute("aria-label", label);
    (0, import_obsidian8.setIcon)(btn, icon);
    btn.onclick = (evt) => {
      evt.stopPropagation();
      onClick();
    };
  }
  jumpTo(date) {
    const file = new VaultIndex(this.app, this.plugin.config.dailyDir).dailyFile(date);
    if (file) void this.app.workspace.getLeaf(false).openFile(file);
  }
  editEntry(section, entry) {
    var _a;
    new EntryEditModal(
      this.app,
      section.heading.replace(/^#+\s*/, ""),
      (_a = entry.content) != null ? _a : entry.text,
      entry.kind !== "line",
      (content) => {
        void (async () => {
          const result = await this.plugin.capture.editEntry(section, entry, content);
          if (result.ok) {
            await this.loadFeed();
          } else {
            new import_obsidian8.Notice(this.entryError(result.message));
          }
        })();
      }
    ).open();
  }
  deleteEntry(section, entry) {
    new ConfirmModal(
      this.app,
      t("\u5220\u9664\u8FD9\u6761\u8BB0\u5F55\uFF1F"),
      entry.text.slice(0, 120),
      async () => {
        const result = await this.plugin.capture.deleteEntry(section, entry);
        if (result.ok) {
          await this.loadFeed();
        } else {
          new import_obsidian8.Notice(this.entryError(result.message));
        }
      },
      t("\u5220\u9664")
    ).open();
  }
  entryError(message) {
    if (message === "stale-line") return t("\u5185\u5BB9\u5DF2\u53D8\u5316\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5");
    return `${t("\u5199\u5165\u5931\u8D25")}: ${message}`;
  }
  dayLabel(date) {
    const now = /* @__PURE__ */ new Date();
    if (date === dateKey(now)) return t("\u4ECA\u5929");
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date === dateKey(yesterday)) return t("\u6628\u5929");
    return date.slice(5);
  }
};

// src/settings.ts
var import_obsidian9 = require("obsidian");

// src/parse/detect-sections.ts
var HEADING_RE = /^#{1,6}\s/;
var FIELD_RE = /^\s*[-*]\s*\[([^\][]+?)::\s*(.*?)\]\s*$/;
function detectSections(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let inFence = false;
  let inFrontmatter = false;
  let current = null;
  lines.forEach((line) => {
    if (line.trim() === "---" && !inFence && (out.length === 0 && !current || inFrontmatter)) {
      if (!inFrontmatter && lines.indexOf(line) === 0) {
        inFrontmatter = true;
      } else if (inFrontmatter) {
        inFrontmatter = false;
      }
      return;
    }
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence;
      return;
    }
    if (inFence || inFrontmatter) return;
    if (HEADING_RE.test(line)) {
      current = { heading: line.trim(), fieldKeys: [] };
      out.push(current);
      return;
    }
    if (!current) return;
    const m = FIELD_RE.exec(line);
    if (m) {
      const key = m[1].trim();
      if (key !== "" && !current.fieldKeys.includes(key)) current.fieldKeys.push(key);
    }
  });
  return out;
}
function suggestType(heading, fieldCount) {
  if (fieldCount === 0) return "list";
  if (/打卡/.test(heading)) return "checkin";
  if (/数据|记录/.test(heading)) return "data";
  return "text";
}
var EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/gu;
function defaultLabel(key) {
  const cleaned = key.replace(EMOJI_RE, "").replace(/‍/g, "").replace(/️/g, "").trim();
  return cleaned !== "" ? cleaned : key;
}
function detectedToSections(detected) {
  return detected.map((d, i) => {
    const type = suggestType(d.heading, d.fieldKeys.length);
    return {
      id: `sec-${i + 1}`,
      heading: d.heading,
      type,
      fields: d.fieldKeys.map((key) => ({ key, label: defaultLabel(key) })),
      ...type === "list" ? { lineTemplate: "- {{value}}" } : {}
    };
  });
}

// src/settings.ts
var TYPE_LABEL = {
  checkin: "\u6253\u5361",
  data: "\u6570\u636E",
  text: "\u6587\u672C",
  list: "\u5217\u8868",
  paragraph: "\u6BB5\u843D"
};
var QJSettingTab = class extends import_obsidian9.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    this.containerEl.empty();
    new import_obsidian9.Setting(this.containerEl).setName(t("\u754C\u9762\u8BED\u8A00")).addDropdown((drop) => {
      drop.addOption("auto", t("\u8DDF\u968F Obsidian"));
      drop.addOption("zh", t("\u4E2D\u6587"));
      drop.addOption("en", t("\u82F1\u6587"));
      drop.setValue(this.plugin.config.language);
      drop.onChange(async (value) => {
        this.plugin.config.language = value;
        setLanguage(
          this.plugin.config.language,
          () => {
            var _a;
            return (_a = this.app) == null ? void 0 : _a.locale;
          }
        );
        await this.plugin.saveConfig();
        this.display();
      });
    });
    new import_obsidian9.Setting(this.containerEl).setName(t("\u65E5\u65E5\u5FD7\u76EE\u5F55")).addText((text) => {
      text.setPlaceholder(t("\u793A\u4F8B\uFF1A500 Journal/540 Daily"));
      text.setValue(this.plugin.config.dailyDir);
      text.onChange(async (value) => {
        this.plugin.config.dailyDir = value.trim();
        await this.plugin.saveConfig();
      });
    });
    new import_obsidian9.Setting(this.containerEl).setName(t("\u6A21\u677F\u7B14\u8BB0")).setDesc(t("\u4ECE\u6A21\u677F\u8BC6\u522B\u8BF4\u660E")).addText((text) => {
      text.setPlaceholder(t("\u793A\u4F8B\uFF1A500 Journal/TPL-Daily.md"));
      text.setValue(this.plugin.config.templateNote);
      text.onChange(async (value) => {
        this.plugin.config.templateNote = value.trim();
        await this.plugin.saveConfig();
      });
    }).addButton(
      (btn) => btn.setButtonText(t("\u4ECE\u6A21\u677F\u8BC6\u522B")).setCta().onClick(() => void this.detectFromTemplate())
    );
    new import_obsidian9.Setting(this.containerEl).setName(t("\u6807\u9898\u533A")).setHeading();
    for (const section of this.plugin.config.sections) {
      this.sectionEditor(section);
    }
    new import_obsidian9.Setting(this.containerEl).addButton(
      (btn) => btn.setButtonText(t("\u6DFB\u52A0\u6807\u9898\u533A")).onClick(async () => {
        this.plugin.config.sections.push({
          id: `sec-${Date.now()}`,
          heading: "## ",
          type: "list",
          fields: []
        });
        await this.plugin.saveConfig();
        this.display();
      })
    );
    this.containerEl.createEl("p", {
      cls: "qj-setting-note",
      text: t("\u547D\u4EE4\u5728\u91CD\u8F7D\u63D2\u4EF6\u540E\u6309\u65B0\u914D\u7F6E\u751F\u6548\uFF1B\u5DE5\u5177\u680F\u6309\u94AE\u4E0E\u6C47\u603B\u89C6\u56FE\u5373\u65F6\u751F\u6548\u3002")
    });
    new import_obsidian9.Setting(this.containerEl).addButton(
      (btn) => btn.setButtonText(t("\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E")).setWarning().onClick(() => {
        new ConfirmModal(
          this.app,
          t("\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E"),
          t("\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E\u8BF4\u660E"),
          async () => {
            await this.plugin.resetConfig();
            new import_obsidian9.Notice(t("\u5DF2\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E\uFF0C\u91CD\u8F7D\u63D2\u4EF6\u540E\u547D\u4EE4\u6309\u65B0\u914D\u7F6E\u751F\u6548\u3002"));
            this.display();
          },
          t("\u6062\u590D")
        ).open();
      })
    );
  }
  async detectFromTemplate() {
    const path = (0, import_obsidian9.normalizePath)(this.plugin.config.templateNote);
    if (path === "") {
      new import_obsidian9.Notice(t("\u8BF7\u5148\u586B\u5199\u6A21\u677F\u7B14\u8BB0\u8DEF\u5F84"));
      return;
    }
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof import_obsidian9.TFile)) {
      new import_obsidian9.Notice(`${t("\u627E\u4E0D\u5230\u7B14\u8BB0")}\uFF1A${path}`);
      return;
    }
    const text = await this.app.vault.cachedRead(file);
    const sections = detectedToSections(detectSections(text));
    if (sections.length === 0) {
      new import_obsidian9.Notice(t("\u672A\u8BC6\u522B\u5230\u6807\u9898\u533A"));
      return;
    }
    this.plugin.config.sections = sections;
    await this.plugin.saveConfig();
    const fieldCount = sections.reduce((n, s) => n + s.fields.length, 0);
    new import_obsidian9.Notice(`${t("\u8BC6\u522B\u5230")} ${sections.length} ${t("\u4E2A\u6807\u9898\u533A")}\u3001${fieldCount} ${t("\u4E2A\u5B57\u6BB5")}`);
    this.display();
  }
  sectionEditor(section) {
    const container = this.containerEl.createDiv({ cls: "qj-section-editor" });
    new import_obsidian9.Setting(container).addText((text) => {
      text.setPlaceholder("### \u2026");
      text.setValue(section.heading);
      text.onChange(async (value) => {
        section.heading = value;
        await this.plugin.saveConfig();
      });
    }).addDropdown((drop) => {
      for (const type of ["checkin", "data", "text", "list", "paragraph"]) {
        drop.addOption(type, t(TYPE_LABEL[type]));
      }
      drop.setValue(section.type);
      drop.onChange(async (value) => {
        section.type = value;
        await this.plugin.saveConfig();
        this.display();
      });
    }).addExtraButton(
      (btn) => btn.setIcon("trash-2").setTooltip(t("\u5220\u9664")).onClick(async () => {
        const sections = this.plugin.config.sections;
        sections.splice(sections.indexOf(section), 1);
        await this.plugin.saveConfig();
        this.display();
      })
    );
    if (section.type === "list" || section.type === "text" || section.type === "paragraph") {
      new import_obsidian9.Setting(container).setName(t("\u5F00\u542F\u5185\u5BB9\u6C47\u603B\u9762\u677F")).setDesc(t("\u5728\u901F\u8BB0\u9762\u677F\u91CC\u805A\u5408\u663E\u793A\u8BE5\u6807\u9898\u533A\u7684\u5185\u5BB9")).addToggle(
        (toggle) => toggle.setValue(section.panel === true).onChange(async (value) => {
          section.panel = value ? true : void 0;
          await this.plugin.saveConfig();
          this.display();
        })
      );
    }
    if (section.type === "list" || section.type === "paragraph") {
      new import_obsidian9.Setting(container).setName(t("\u81EA\u52A8\u6DFB\u52A0\u65F6\u95F4\u6233")).setDesc(t("\u8BB0\u5F55\u65F6\u81EA\u52A8\u52A0\u65F6\u95F4\u6233\u524D\u7F00\uFF08HH:mm\uFF09\uFF0C\u901F\u8BB0\u9762\u677F\u4F1A\u89E3\u6790\u5E76\u663E\u793A")).addToggle((toggle) => {
        toggle.setDisabled(section.panel !== true);
        toggle.setValue(section.timestamp === true);
        toggle.onChange(async (value) => {
          section.timestamp = value ? true : void 0;
          await this.plugin.saveConfig();
        });
      });
    }
    if (section.type === "list") {
      new import_obsidian9.Setting(container).setName(t("\u884C\u6A21\u677F")).setDesc("{{value}}").addText((text) => {
        var _a;
        text.setValue((_a = section.lineTemplate) != null ? _a : "- {{value}}");
        text.onChange(async (value) => {
          section.lineTemplate = value;
          await this.plugin.saveConfig();
        });
      });
      return;
    }
    for (const field of section.fields) {
      const row = new import_obsidian9.Setting(container).setClass("qj-field-editor");
      row.addText((text) => {
        text.setPlaceholder(t("\u5B57\u6BB5\u952E"));
        text.setValue(field.key);
        text.onChange(async (value) => {
          field.key = value;
          await this.plugin.saveConfig();
        });
      });
      row.addText((text) => {
        text.setPlaceholder(t("\u5C55\u793A\u540D"));
        text.setValue(field.label);
        text.onChange(async (value) => {
          field.label = value;
          await this.plugin.saveConfig();
        });
      });
      if (section.type === "data") {
        row.addText((text) => {
          var _a;
          text.setPlaceholder(t("\u5355\u4F4D"));
          text.setValue((_a = field.unit) != null ? _a : "");
          text.onChange(async (value) => {
            field.unit = value;
            await this.plugin.saveConfig();
          });
        });
      }
      row.addExtraButton(
        (btn) => btn.setIcon("x").setTooltip(t("\u5220\u9664")).onClick(async () => {
          section.fields.splice(section.fields.indexOf(field), 1);
          await this.plugin.saveConfig();
          this.display();
        })
      );
    }
    new import_obsidian9.Setting(container).addButton(
      (btn) => btn.setButtonText(t("\u6DFB\u52A0\u5B57\u6BB5")).onClick(async () => {
        section.fields.push({ key: "", label: "" });
        await this.plugin.saveConfig();
        this.display();
      })
    );
  }
};

// src/main.ts
var QuickJournalPlugin = class extends import_obsidian10.Plugin {
  /** obsidian.d.ts 1.8.7 未声明 App.locale（运行时存在），收口在这一个转换里 */
  localeOf(app) {
    return app == null ? void 0 : app.locale;
  }
  async onload() {
    this.config = mergeConfig(await this.loadData());
    setLanguage(this.config.language, () => this.localeOf(this.app));
    this.capture = new CaptureService(this.app, () => this.config);
    this.registerView(VIEW_TYPE_QJ_SUMMARY, (leaf) => new SummaryView(leaf, this));
    this.registerView(VIEW_TYPE_QJ_PANEL, (leaf) => new PanelView(leaf, this));
    this.addCommand({
      id: "open-summary",
      name: t("\u6253\u5F00\u65E5\u5FD7\u6C47\u603B"),
      callback: () => void this.activateView(VIEW_TYPE_QJ_SUMMARY)
    });
    this.addCommand({
      id: "open-quick-capture",
      name: t("\u6253\u5F00\u5FEB\u901F\u5F55\u5165"),
      callback: () => this.openPicker()
    });
    this.addCommand({
      id: "open-panel",
      name: t("\u6253\u5F00\u901F\u8BB0\u9762\u677F"),
      callback: () => void this.activateView(VIEW_TYPE_QJ_PANEL)
    });
    for (const section of this.config.sections) {
      this.addSectionCommand(section);
    }
    this.addRibbonIcon("notebook-pen", t("\u5FEB\u901F\u5F55\u5165"), () => this.openPicker());
    this.addSettingTab(new QJSettingTab(this.app, this));
  }
  async saveConfig() {
    await this.saveData(this.config);
  }
  /** 恢复出厂配置（保留已写入笔记的内容，只重置 data.json）。 */
  async resetConfig() {
    this.config = mergeConfig(void 0);
    await this.saveData(this.config);
    setLanguage(this.config.language, () => this.localeOf(this.app));
  }
  openPicker() {
    new ActionPickerModal(
      this.app,
      this.config.sections,
      (section) => this.openSectionCapture(section)
    ).open();
  }
  addSectionCommand(section) {
    this.addCommand({
      id: `qj-${section.id}`,
      name: `${t("\u5FEB\u901F\u5F55\u5165")}: ${section.heading.replace(/^#+\s*/, "")}`,
      callback: () => this.openSectionCapture(section)
    });
  }
  openSectionCapture(section) {
    new CaptureModal(
      this.app,
      section.heading.replace(/^#+\s*/, ""),
      section.type,
      section.fields,
      (payload) => void this.performCapture(section, payload, false)
    ).open();
  }
  /** 捕获执行（含覆盖确认流）；速记面板直发段落也走这里。 */
  async performCapture(section, payload, overwrite) {
    const result = await this.capture.performSection(section, payload, { overwrite });
    if (result.ok) {
      const note = result.created ? `${t("\u521B\u5EFA\u7B14\u8BB0")} \xB7 ` : "";
      new import_obsidian10.Notice(`${note}${t("\u5DF2\u5199\u5165")} ${result.path} (${result.writtenLines})`);
      return;
    }
    if (result.reason === "overwrite") {
      new ConfirmModal(
        this.app,
        t("\u4EE5\u4E0B\u5B57\u6BB5\u5DF2\u6709\u503C\uFF0C\u8986\u76D6\u5199\u5165\uFF1F"),
        result.keys.join("\n"),
        () => void this.performCapture(section, payload, true)
      ).open();
      return;
    }
    new import_obsidian10.Notice(`${t("\u5199\u5165\u5931\u8D25")}: ${result.message}`);
  }
  async activateView(viewType) {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(viewType);
    const leaf = existing.length > 0 ? existing[0] : workspace.getLeaf("tab");
    await leaf.setViewState({ type: viewType, active: true });
    await workspace.revealLeaf(leaf);
  }
};
