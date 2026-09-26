/* Quick Journal — bundled 2026-09-26T04:37:00.961Z */
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
var import_obsidian12 = require("obsidian");

// src/types.ts
var BOOL_YES = "\u2714\uFE0F";
var BOOL_NO = "\u274C";
var DEFAULT_DAILY_SECTIONS = [
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
var DEFAULT_JOURNALS = {
  daily: { dir: "500 Journal/540 Daily", sections: DEFAULT_DAILY_SECTIONS },
  weekly: {
    dir: "500 Journal/530 Weekly",
    sections: [
      {
        id: "weekly-review",
        heading: "## \u{1F914} \u5468\u672B\u56DE\u987E\u4E0E\u603B\u7ED3",
        type: "text",
        fields: [
          { key: "\u672C\u5468\u6210\u5C31/\u4EAE\u70B9", label: "\u6210\u5C31\u4EAE\u70B9" },
          { key: "\u672C\u5468\u5173\u952E\u9879\u76EE/\u8BA1\u5212\u8FDB\u5C55", label: "\u9879\u76EE\u8FDB\u5C55" },
          { key: "\u672C\u5468\u9047\u5230\u7684\u6311\u6218/\u95EE\u9898", label: "\u6311\u6218\u95EE\u9898" },
          { key: "\u4E0B\u5468\u9700\u8981\u8C03\u6574\u7684\u5730\u65B9", label: "\u9700\u8981\u8C03\u6574" },
          { key: "\u4E0B\u5468\u5C55\u671B", label: "\u4E0B\u5468\u5C55\u671B" }
        ]
      }
    ]
  },
  monthly: {
    dir: "500 Journal/520 Monthly",
    sections: [
      {
        id: "monthly-review",
        heading: "## \u{1F914} \u6708\u5EA6\u56DE\u987E\u4E0E\u603B\u7ED3",
        type: "text",
        fields: [
          { key: "\u672C\u6708\u6700\u5927\u7684\u6210\u5C31/\u4EAE\u70B9", label: "\u6210\u5C31\u4EAE\u70B9" },
          { key: "\u672C\u6708\u5173\u952E\u9879\u76EE\u8FDB\u5C55", label: "\u9879\u76EE\u8FDB\u5C55" },
          { key: "\u672C\u6708\u9047\u5230\u7684\u6311\u6218/\u95EE\u9898", label: "\u6311\u6218\u95EE\u9898" },
          { key: "\u4E0B\u6708\u9700\u8981\u8C03\u6574\u7684\u5730\u65B9", label: "\u9700\u8981\u8C03\u6574" },
          { key: "\u4E0B\u6708\u5C55\u671B", label: "\u4E0B\u6708\u5C55\u671B" }
        ]
      }
    ]
  },
  annual: { dir: "500 Journal/510 Annual", sections: [] }
};
var DEFAULT_SUMMARY_LAYOUT = [
  "task-chart",
  "checkin",
  "trend",
  "calendar",
  "task-heatmap",
  "entry-heatmap",
  "feed",
  "queries"
];
var DEFAULT_CONFIG = {
  language: "auto",
  templateNote: "",
  journals: DEFAULT_JOURNALS,
  summaryLayout: [...DEFAULT_SUMMARY_LAYOUT],
  summaryQueries: [],
  viewLocations: { summary: "tab", panel: "tab" },
  panel: { showCompleted: true },
  rollover: { openMarkers: [">"] }
};
function isRecord(v) {
  return typeof v === "object" && v !== null;
}
var SECTION_TYPES = ["checkin", "data", "text", "list", "paragraph"];
var PERIOD_TYPES = ["daily", "weekly", "monthly", "annual"];
var QUERY_KINDS = ["dataview", "dataviewjs"];
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
  return {
    id,
    heading,
    type,
    fields,
    ...typeof raw.lineTemplate === "string" ? { lineTemplate: raw.lineTemplate } : {},
    ...raw.panel === true ? { panel: true } : {},
    ...raw.timestamp === true ? { timestamp: true } : {}
  };
}
function sanitizeJournal(raw, fallback) {
  if (!isRecord(raw)) return fallback;
  const dir = typeof raw.dir === "string" && raw.dir.trim() !== "" ? raw.dir : fallback.dir;
  let sections;
  if (Array.isArray(raw.sections)) {
    sections = raw.sections.map((s, i) => sanitizeSection(s, i)).filter((s) => s !== null);
    if (sections.length === 0) sections = fallback.sections;
  } else {
    sections = fallback.sections;
  }
  return { dir, sections };
}
function sanitizeQueries(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((q) => isRecord(q) && typeof q.code === "string").filter((q) => QUERY_KINDS.includes(q.kind)).map((q) => ({ kind: q.kind, code: String(q.code) })).filter((q) => q.code.trim() !== "");
}
function sanitizeLayout(raw) {
  if (!Array.isArray(raw)) return [...DEFAULT_SUMMARY_LAYOUT];
  const known = new Set(DEFAULT_SUMMARY_LAYOUT);
  const kept = raw.filter((id) => typeof id === "string" && known.has(id));
  const out = [...new Set(kept)];
  for (const id of DEFAULT_SUMMARY_LAYOUT) {
    if (!out.includes(id)) out.push(id);
  }
  return out;
}
function mergeConfig(saved) {
  const base = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  if (!isRecord(saved)) return base;
  if (saved.language === "zh" || saved.language === "en" || saved.language === "auto") {
    base.language = saved.language;
  }
  if (typeof saved.templateNote === "string") {
    base.templateNote = saved.templateNote;
  }
  if (isRecord(saved.journals)) {
    for (const type of PERIOD_TYPES) {
      base.journals[type] = sanitizeJournal(saved.journals[type], base.journals[type]);
    }
  } else if (typeof saved.dailyDir === "string" || Array.isArray(saved.sections)) {
    base.journals.daily = sanitizeJournal(
      { dir: saved.dailyDir, sections: saved.sections },
      base.journals.daily
    );
  }
  base.summaryLayout = sanitizeLayout(saved.summaryLayout);
  base.summaryQueries = sanitizeQueries(saved.summaryQueries);
  if (typeof saved.trendSelection === "string") base.trendSelection = saved.trendSelection;
  if (isRecord(saved.viewLocations)) {
    const vl = saved.viewLocations;
    if (vl.summary === "tab" || vl.summary === "sidebar") {
      base.viewLocations.summary = vl.summary;
    }
    if (vl.panel === "tab" || vl.panel === "sidebar") {
      base.viewLocations.panel = vl.panel;
    }
  }
  if (isRecord(saved.panel)) {
    if (typeof saved.panel.showCompleted === "boolean") {
      base.panel.showCompleted = saved.panel.showCompleted;
    }
  }
  if (isRecord(saved.rollover) && Array.isArray(saved.rollover.openMarkers)) {
    const markers = saved.rollover.openMarkers;
    const cleaned = markers.filter(
      (m) => typeof m === "string" && m.length === 1 && m !== " "
    );
    base.rollover.openMarkers = cleaned;
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
  "\u5168\u90E8": "All",
  "\u663E\u793A\u5DF2\u5B8C\u6210": "Show completed",
  "\u641C\u7D22": "Search",
  "\u5207\u6362\u5B8C\u6210": "Toggle done",
  "\u4EFB\u52A1/\u5217\u8868\u4E92\u8F6C": "Toggle task / list",
  "\u4EFB\u52A1\u5B8C\u6210\u70ED\u529B\u56FE": "Task completion heatmap",
  "\u5185\u5BB9\u8BB0\u5F55\u70ED\u529B\u56FE": "Entry heatmap",
  "\u4EFB\u52A1\u5B8C\u6210\u7EDF\u8BA1": "Tasks completed",
  "\u6570\u636E\u8D8B\u52BF": "Data trends",
  "\u6700\u65B0": "Last",
  "\u6700\u5927": "Max",
  "\u6700\u5C0F": "Min",
  "\u6708\u5386": "Calendar",
  "\u6700\u8FD1\u901F\u8BB0": "Recent captures",
  "\u65E5\u5FD7\u5185\u67E5\u8BE2\u5757": "Queries in journals",
  "\u67E5\u8BE2": "Queries",
  "\u4E0D\u652F\u6301\u7684\u67E5\u8BE2\u884C": "Unsupported query line",
  "\u652F\u6301\u7684\u7B5B\u9009\u8BF4\u660E": "Supported: path / filename includes, tags include, done / not done, status.type is (not)",
  "\u6CA1\u6709\u5339\u914D\u7684\u4EFB\u52A1": "No matching tasks",
  "\u5C55\u5F00\u5F55\u5165": "Show capture bar",
  "\u6536\u8D77\u5F55\u5165": "Hide capture bar",
  "\u663E\u793A\u5DF2\u5B8C\u6210\u4EFB\u52A1": "Show completed tasks",
  "\u672A\u5B8C\u6210\u4EFB\u52A1\u6807\u8BC6": "Unfinished task markers",
  "\u6EDA\u52A8\u65F6\u8BA1\u5165\u672A\u5B8C\u6210\u7684\u52FE\u9009\u6846\u5B57\u7B26\uFF08\u7A7A\u683C\u59CB\u7EC8\u5305\u542B\uFF09\uFF0C\u9017\u53F7\u5206\u9694": "Checkbox characters treated as unfinished when rolling over (space is always included), comma-separated",
  "\u6EDA\u52A8\u672A\u5B8C\u6210\u4EFB\u52A1": "Roll over unfinished tasks",
  "\u79FB\u52A8\u672A\u5B8C\u6210\u4EFB\u52A1": "Move unfinished tasks",
  "\u6765\u81EA": "From",
  "\u4E2A\u4EFB\u52A1\u5757": "task blocks",
  "\u6CA1\u6709\u53EF\u79FB\u52A8\u7684\u4EFB\u52A1": "No unfinished tasks to move",
  "\u5DF2\u79FB\u52A8": "Moved",
  "\u79FB\u52A8": "Move",
  "Enter \u53D1\u9001 \xB7 Shift+Enter \u6362\u884C": "Enter to send \xB7 Shift+Enter for a new line",
  "Enter \u53D1\u9001": "Enter to send",
  "\u5F52\u6863": "Archive",
  "\u901A\u7528": "General",
  "\u65E5\u5FD7": "Journals",
  "\u9700\u8981 Dataview \u6E32\u67D3": "Requires the Dataview plugin",
  "\u9700\u8981 Tasks \u6E32\u67D3": "Requires the Tasks plugin",
  "\u6E32\u67D3\u5931\u8D25": "Failed to render",
  "\u6682\u65E0\u67E5\u8BE2\u5757": "No queries yet \u2014 add some in edit mode",
  "\u4E00": "Mo",
  "\u4E8C": "Tu",
  "\u4E09": "We",
  "\u56DB": "Th",
  "\u4E94": "Fr",
  "\u516D": "Sa",
  "\u65E5": "Su",
  "\u65E5\u65E5\u5FD7": "Daily",
  "\u7F16\u8F91\u6A21\u5F0F": "Edit layout",
  "\u9000\u51FA\u7F16\u8F91": "Done editing",
  "\u6DFB\u52A0\u7EC4\u4EF6": "Add component",
  "\u6240\u6709\u7EC4\u4EF6\u5747\u5DF2\u663E\u793A": "All components are shown",
  "\u62D6\u52A8\u6392\u5E8F": "Drag to reorder",
  "\u67E5\u8BE2\u8BED\u53E5": "Query",
  "\u6DFB\u52A0\u67E5\u8BE2": "Add query",
  "\u6253\u5F00\u4F4D\u7F6E": "Default open location",
  "\u6807\u7B7E\u9875": "Tab",
  "\u53F3\u4FA7\u8FB9\u680F": "Right sidebar",
  "\u65E5\u5FD7\u76EE\u5F55": "Journal folder",
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
  const creates = textLines.length === 0 ? [{ afterLineIndex: headingIndex, line: "" }] : [...textLines, ""].map((line) => ({ afterLineIndex: headingIndex, line }));
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
function planInsertLines(lines, opts) {
  if (opts.newLines.length === 0) {
    return { status: "ok", edits: [], creates: [] };
  }
  const single = planAppend(lines, {
    heading: opts.heading,
    headingMissingCreates: opts.headingMissingCreates,
    line: opts.newLines[0]
  });
  if (single.status !== "ok") return single;
  if (single.creates.length === 0) return single;
  const anchor = single.creates[0].afterLineIndex;
  return {
    status: "ok",
    createHeading: single.createHeading,
    edits: [],
    creates: opts.newLines.map((line) => ({ afterLineIndex: anchor, line }))
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
function periodFromKey(key) {
  const w = /^(\d{4})-W(\d{2})$/.exec(key);
  if (w) {
    const year = Number(w[1]);
    const week = Number(w[2]);
    if (week < 1 || week > 53) return null;
    const start = mondayOfIsoWeek(year, week);
    return periodOf("week", start);
  }
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  if (m) return periodOf("month", new Date(Number(m[1]), Number(m[2]) - 1, 1));
  const y = /^(\d{4})$/.exec(key);
  if (y) return periodOf("year", new Date(Number(y[1]), 0, 1));
  return null;
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

// src/capture/skeleton.ts
function pad2(n) {
  return String(n).padStart(2, "0");
}
function noteKeyFor(type, now) {
  if (type === "weekly") {
    const { year, week } = isoWeekOf(now);
    return `${year}-W${pad2(week)}`;
  }
  if (type === "monthly") return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
  if (type === "annual") return String(now.getFullYear());
  return dateKey(now);
}
function skeletonFor(type, now, sections) {
  const day = dateKey(now);
  let frontmatter;
  let title;
  if (type === "weekly") {
    const { year, week } = isoWeekOf(now);
    const key = `${year}-W${pad2(week)}`;
    frontmatter = [
      "---",
      "journal: Weekly",
      `journal-date: ${dateKey(mondayOfIsoWeek(year, week))}`,
      "type: weekly_review",
      `year: ${year}`,
      `month: ${pad2(now.getMonth() + 1)}`,
      `week: W${pad2(week)}`,
      `created: ${day}`,
      "tags:",
      "  - journal/weekly",
      "---"
    ];
    title = `# ${key} \u5468\u65E5\u5FD7`;
  } else if (type === "monthly") {
    const key = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
    frontmatter = [
      "---",
      "journal: Monthly",
      `journal-date: ${dateKey(new Date(now.getFullYear(), now.getMonth(), 1))}`,
      "type: monthly_review",
      `year: ${now.getFullYear()}`,
      `month: ${pad2(now.getMonth() + 1)}`,
      `created: ${day}`,
      "tags:",
      "  - journal/monthly",
      "---"
    ];
    title = `# ${key} \u6708\u5EA6\u65E5\u5FD7`;
  } else if (type === "annual") {
    frontmatter = [
      "---",
      "journal: Annual",
      `journal-date: ${now.getFullYear()}-01-01`,
      "type: annual_review",
      `year: ${now.getFullYear()}`,
      `created: ${day}`,
      "tags:",
      "  - journal/annual",
      "---"
    ];
    title = `# ${now.getFullYear()} \u5E74\u5EA6\u65E5\u5FD7`;
  } else {
    frontmatter = [
      "---",
      "journal: Daily",
      `journal-date: ${day}`,
      "type: daily_log",
      `created: ${day}`,
      "tags:",
      "  - journal/daily",
      "---"
    ];
    title = `# ${day} \u65E5\u5FD7`;
  }
  const lines = [...frontmatter, "", title, ""];
  for (const section of sections) {
    lines.push(section.heading, "");
    for (const field of section.fields) lines.push(renderFieldLine(field.key, ""));
    lines.push("");
  }
  return lines.join("\n");
}

// src/parse/section-entries.ts
var BRACKET_FIELD_RE = /^\s*[-*]\s*\[([^\][]+?)::\s*(.*?)\]\s*$/;
var LIST_ITEM_RE = /^\s*[-*]\s+(.*)$/;
var TASK_ITEM_RE = /^\s*[-*]\s+\[([ xX/-])\]\s*(.*)$/;
var TIMESTAMP_RE = /^(\d{1,2}:\d{2})(?::\d{2})?\s+/;
var ARCHIVE_RE = /\s*\[archive::\s*[^\]]*?\]\s*$/;
function splitTimestamp(text) {
  const m = TIMESTAMP_RE.exec(text);
  if (!m) return { text };
  return { time: m[1], text: text.slice(m[0].length) };
}
function stripArchive(line) {
  const m = ARCHIVE_RE.exec(line);
  if (!m) return { line, archived: false };
  return { line: line.slice(0, m.index).trimEnd(), archived: true };
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
        content.push(line.trimEnd());
      }
      while (content.length > 0 && content[0] === "") content.shift();
      while (content.length > 0 && content[content.length - 1] === "") content.pop();
      if (content.every((l) => l === "")) continue;
      const firstIdx = content.findIndex((l) => l !== "");
      const ts = splitTimestamp(content[firstIdx]);
      if (ts.time !== void 0) content[firstIdx] = ts.text;
      out.push({
        date,
        sectionId: section.id,
        kind: "paragraph",
        time: ts.time,
        text: content.join("\n"),
        content: content.join("\n")
      });
      continue;
    }
    for (let i = start; i < end; i++) {
      const raw = lines[i];
      if (raw.trimStart().startsWith("```")) {
        inFence = !inFence;
        continue;
      }
      if (inFence) continue;
      if (raw.trimStart().startsWith("%%")) continue;
      const { line, archived } = stripArchive(raw);
      if (archived) continue;
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
          // 状态符号不进正文：面板里按钮负责显示与切换，别处渲染层按 taskStatus 自行补
          text: ts.text,
          content: ts.text,
          prefix: line.slice(0, line.length - task[2].length),
          lineIndex: i,
          raw: line,
          taskStatus: task[1]
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

// src/parse/line-ops.ts
var TASK_LINE_RE = /^(\s*[-*]\s+\[)([ xX/-])(\]\s*)(.*)$/;
var LIST_LINE_RE = /^(\s*[-*]\s+)(\S.*)$/;
var DONE_DATE_RE = /\s*✅\s*\d{4}-\d{2}-\d{2}\s*$/;
function toggleTaskLine(raw, today) {
  const m = TASK_LINE_RE.exec(raw);
  if (!m) return null;
  const [, head, status, tail, body] = m;
  if (status === "x" || status === "X") {
    const undone = body.replace(DONE_DATE_RE, "");
    return `${head} ${tail}${undone.trimEnd()}`;
  }
  const cleaned = body.replace(DONE_DATE_RE, "").trimEnd();
  return `${head}x${tail}${cleaned} \u2705 ${today}`;
}
function convertListTask(raw) {
  const task = TASK_LINE_RE.exec(raw);
  if (task) {
    const [, head, status, , body] = task;
    const cleaned = (status === "x" || status === "X" ? body.replace(DONE_DATE_RE, "") : body).trim();
    return `${head.replace(/\[\s*$/, "")}${cleaned}`;
  }
  const list = LIST_LINE_RE.exec(raw);
  if (list) {
    return `${list[1]}[ ] ${list[2]}`;
  }
  return null;
}
function taskSymbol(status) {
  if (status === " ") return "\u2610";
  if (status === "x" || status === "X") return "\u2611";
  if (status === "-") return "\u2715";
  return "\u25D0";
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
  journal(type) {
    return this.getConfig().journals[type];
  }
  notePath(type, now) {
    const dir = this.journal(type).dir.replace(/\/+$/, "");
    return `${dir}/${noteKeyFor(type, now)}.md`;
  }
  /** 兼容旧调用（面板 / 日志定位用）。 */
  dailyPath(now) {
    return this.notePath("daily", now);
  }
  weeklyPath(now) {
    return this.notePath("weekly", now);
  }
  async performSection(type, section, payload, opts) {
    var _a, _b;
    const now = (_a = opts.now) != null ? _a : /* @__PURE__ */ new Date();
    const path = this.notePath(type, now);
    let text;
    let created = false;
    try {
      text = await readNoteText(this.app, path);
    } catch (e) {
      const skeleton = skeletonFor(type, now, this.journal(type).sections);
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
  /** 时间戳单点：开启后 list / paragraph 的写入内容前加 HH:mm（面板解析显示）。仅 daily。 */
  withTimestamp(section, value, now) {
    if (section.timestamp !== true) return value;
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    return `${hh}:${mm} ${value}`;
  }
  // ── 速记面板的条目级写回（编辑 / 删除 / 切换，不跳回日志） ───────────────
  async editEntry(section, entry, content) {
    return this.mutateEntry(section, entry, content);
  }
  async deleteEntry(section, entry) {
    return this.mutateEntry(section, entry, null);
  }
  /** 切换任务完成态（面板点击状态符号）。 */
  async toggleTaskEntry(section, entry) {
    return this.rewriteRawLine(entry, (raw) => toggleTaskLine(raw, dateKey(/* @__PURE__ */ new Date())));
  }
  /** 列表 ↔ 任务互转（面板条目按钮）。 */
  async convertEntry(section, entry) {
    return this.rewriteRawLine(entry, convertListTask);
  }
  /** 归档（面板隐藏）：行尾追加 [archive:: true]（dataview 内联字段，可被外部识别）。 */
  async archiveEntry(section, entry) {
    return this.rewriteRawLine(entry, (raw) => `${raw} [archive:: true]`);
  }
  entryPath(entry) {
    return `${this.journal("daily").dir.replace(/\/+$/, "")}/${entry.date}.md`;
  }
  async readLines(path) {
    try {
      return (await readNoteText(this.app, path)).split(/\r?\n/);
    } catch (e) {
      return null;
    }
  }
  async rewriteRawLine(entry, build) {
    if (entry.lineIndex === void 0 || entry.raw === void 0) {
      return { ok: false, message: "not a line entry" };
    }
    const path = this.entryPath(entry);
    const lines = await this.readLines(path);
    if (lines === null) return { ok: false, message: `note not found: ${entry.date}` };
    if (entry.lineIndex >= lines.length || lines[entry.lineIndex] !== entry.raw) {
      return { ok: false, message: "stale-line" };
    }
    const newLine = build(entry.raw);
    if (newLine === null) return { ok: false, message: "unsupported line" };
    await applyPlanToFile(this.app, path, planEditLineAt(entry.lineIndex, newLine));
    return { ok: true };
  }
  /** 段落「重发 = 编辑」：取当天段落现有内容做表单预填（空返回 ""）。 */
  async paragraphContent(dateStr, section) {
    var _a, _b;
    const path = this.entryPath({ date: dateStr, sectionId: section.id, kind: "paragraph", text: "" });
    const lines = await this.readLines(path);
    if (lines === null) return "";
    const entries = collectEntries(dateStr, lines, [section]);
    return (_b = (_a = entries[0]) == null ? void 0 : _a.text) != null ? _b : "";
  }
  async mutateEntry(section, entry, content) {
    var _a, _b, _c, _d;
    const path = this.entryPath(entry);
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
  constructor(app, title, type, fields, onSubmit, initial = "") {
    super(app);
    this.title = title;
    this.type = type;
    this.fields = fields;
    this.onSubmit = onSubmit;
    this.initial = initial;
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
      if (this.initial !== "") input.value = this.initial;
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
var import_obsidian7 = require("obsidian");

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
function doneByDay(days, records) {
  var _a, _b;
  const out = /* @__PURE__ */ new Map();
  for (const day of days) out.set(day, 0);
  for (const rec of records.values()) {
    for (const task of parseTaskLines(rec.taskLines)) {
      if (!task.done) continue;
      const key = (_a = task.doneDate) != null ? _a : rec.date;
      if (out.has(key)) out.set(key, ((_b = out.get(key)) != null ? _b : 0) + 1);
    }
  }
  return out;
}

// src/services/vault-index.ts
var import_obsidian5 = require("obsidian");
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

// src/services/dataview-bridge.ts
var import_obsidian6 = require("obsidian");
var QueryBridge = class {
  constructor(app) {
    this.app = app;
  }
  dataview() {
    var _a, _b;
    const plugins = this.app.plugins;
    const api = (_b = (_a = plugins == null ? void 0 : plugins.plugins) == null ? void 0 : _a.dataview) == null ? void 0 : _b.api;
    return typeof (api == null ? void 0 : api.executeJs) === "function" ? api : void 0;
  }
  get dataviewAvailable() {
    return this.dataview() !== void 0;
  }
  /** ```dataview 查询：tryQueryMarkdown + MarkdownRenderer。 */
  async renderDvQuery(code, sourcePath, container, component) {
    try {
      const api = this.dataview();
      if (!api || typeof api.tryQueryMarkdown !== "function") return false;
      const md = await api.tryQueryMarkdown(code, sourcePath);
      container.empty();
      await import_obsidian6.MarkdownRenderer.render(this.app, md, container, sourcePath, component);
      return true;
    } catch (e) {
      return false;
    }
  }
  /** ```dataviewjs：官方 executeJs 入口（CW 同款），不自己 eval。 */
  async renderDvJs(code, sourcePath, container, component) {
    try {
      const api = this.dataview();
      if (!api) return false;
      container.empty();
      await api.executeJs(code, container, component, sourcePath);
      return true;
    } catch (e) {
      return false;
    }
  }
};

// src/periods/month-grid.ts
function dateKey2(d) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
function monthGrid(year, month0) {
  const first = new Date(year, month0, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month0, 1 - offset);
  const weeks = [];
  const cursor = new Date(start);
  while (true) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push({
        date: new Date(cursor),
        key: dateKey2(cursor),
        inMonth: cursor.getMonth() === month0
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    if (cursor.getMonth() !== month0 && cursor.getDay() === 1) break;
    if (weeks.length >= 6) break;
  }
  return weeks;
}

// src/views/components.ts
var TYPE_PREFIX = {
  daily: "",
  weekly: "\u5468 \xB7 ",
  monthly: "\u6708 \xB7 ",
  annual: "\u5E74 \xB7 "
};
function renderQuickCapture(card, ctx) {
  const row = card.createDiv({ cls: "qj-capture-row" });
  for (const type of ["daily", "weekly", "monthly", "annual"]) {
    for (const section of ctx.plugin.config.journals[type].sections) {
      const btn = row.createEl("button", {
        cls: "qj-btn",
        text: `${TYPE_PREFIX[type]}${section.heading.replace(/^#+\s*/, "")}`
      });
      btn.type = "button";
      btn.onclick = () => ctx.plugin.openSectionCapture(type, section);
    }
  }
}
function renderTaskChart(card, ctx, metrics, done) {
  const grid = card.createDiv({ cls: "qj-metric-grid" });
  for (const m of metrics) {
    const cell = grid.createDiv({ cls: "qj-metric" });
    cell.createSpan({ cls: "qj-metric-value", text: m.value });
    cell.createSpan({ cls: "qj-metric-label", text: m.label });
  }
  const data = ctx.kind === "year" ? Array.from({ length: 12 }, (_, m) => {
    let sum = 0;
    for (const [day, n] of done) {
      if (Number(day.slice(5, 7)) - 1 === m) sum += n;
    }
    return { label: String(m + 1).padStart(2, "0"), value: sum };
  }) : ctx.days.map((d) => {
    var _a;
    return { label: d.slice(8), value: (_a = done.get(d)) != null ? _a : 0 };
  });
  const max = Math.max(1, ...data.map((d) => d.value));
  const chart = card.createDiv({ cls: "qj-bars" });
  for (const d of data) {
    const col = chart.createDiv({ cls: "qj-bar-col" });
    const plot = col.createDiv({ cls: "qj-bar-plot" });
    if (d.value > 0) plot.createSpan({ cls: "qj-bar-count", text: String(d.value) });
    plot.createDiv({
      cls: "qj-bar-v",
      attr: { style: `height:${Math.max(3, Math.round(d.value / max * 100))}%` }
    });
    col.createSpan({ cls: "qj-bar-l", text: d.label });
  }
}
function renderHeatmap(card, ctx, counts, wide) {
  var _a, _b;
  if (wide) card.addClass("qj-card--wide");
  const max = Math.max(1, ...counts.values());
  const weekdays = ["\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D", "\u65E5"].map((w) => t(w));
  if (ctx.kind === "week") {
    const row = card.createDiv({ cls: "qj-hm-week" });
    ctx.days.forEach((day, i) => {
      var _a2;
      const n = (_a2 = counts.get(day)) != null ? _a2 : 0;
      const box = row.createDiv({
        cls: `qj-hm-big qj-hm-l${level(n, max)}`,
        attr: { title: `${day} \xB7 ${n}` }
      });
      box.createSpan({ cls: "qj-hm-big-label", text: weekdays[i] });
      box.createSpan({ cls: "qj-hm-big-count", text: String(n) });
    });
    return;
  }
  if (ctx.kind === "month") {
    const grid2 = card.createDiv({ cls: "qj-hm-grid" });
    for (const w of weekdays) grid2.createDiv({ cls: "qj-cal-head", text: w });
    const first = /* @__PURE__ */ new Date(`${ctx.days[0]}T00:00:00`);
    const weeks = monthGrid(first.getFullYear(), first.getMonth());
    for (const week of weeks) {
      for (const cell of week) {
        const n = cell.inMonth ? (_a = counts.get(cell.key)) != null ? _a : 0 : -1;
        const box = grid2.createDiv({
          cls: `qj-hm-cell-m${n < 0 ? " qj-cal-out" : ` qj-hm-l${level(n, max)}`}`,
          attr: { title: `${cell.key} \xB7 ${Math.max(0, n)}` }
        });
        box.createSpan({ cls: "qj-hm-cell-day", text: String(cell.date.getDate()) });
        if (n > 0) box.createSpan({ cls: "qj-hm-cell-count", text: String(n) });
      }
    }
    return;
  }
  const grid = card.createDiv({ cls: "qj-heatmap" });
  for (const day of ctx.days) {
    const n = (_b = counts.get(day)) != null ? _b : 0;
    grid.createDiv({
      cls: `qj-hm-cell qj-hm-l${level(n, max)}`,
      attr: { title: `${day} \xB7 ${n}` }
    });
  }
}
function level(n, max) {
  if (n === 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil(n / max * 4)));
}
function renderTrend(card, ctx) {
  var _a, _b;
  const config = ctx.plugin.config;
  const fields = [];
  for (const section of config.journals.daily.sections) {
    if (section.type !== "data") continue;
    for (const f of section.fields) {
      const values = /* @__PURE__ */ new Map();
      for (const day of ctx.days) {
        const raw = (_a = ctx.records.get(day)) == null ? void 0 : _a.fieldValues[f.key];
        if (raw === void 0 || raw === "") continue;
        const n = Number(raw);
        if (Number.isFinite(n)) values.set(day, n);
      }
      if (values.size > 0) fields.push({ id: `${section.id}::${f.key}`, label: f.label, unit: f.unit, values });
    }
  }
  if (fields.length === 0) {
    card.createDiv({ cls: "qj-muted", text: "\u2014" });
    return;
  }
  const selected = (_b = fields.find((f) => f.id === config.trendSelection)) != null ? _b : fields[0];
  const select = card.createEl("select", { cls: "qj-input qj-trend-select" });
  for (const f of fields) {
    const opt = select.createEl("option", { text: f.label, attr: { value: f.id } });
    if (f.id === selected.id) opt.selected = true;
  }
  select.onchange = async () => {
    config.trendSelection = select.value;
    await ctx.plugin.saveConfig();
    ctx.rerender();
  };
  renderSparkline(card, selected, ctx.days);
}
function renderSparkline(card, f, days) {
  var _a;
  const row = card.createDiv({ cls: "qj-trend-row" });
  const values = days.map((d) => f.values.get(d)).filter((v) => v !== void 0);
  if (values.length === 0) {
    row.createSpan({ cls: "qj-muted", text: "\u2014" });
    return;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const W = 100;
  const H = 60;
  const PAD = 5;
  const yOf = (v) => span === 0 ? H / 2 : PAD + (1 - (v - min) / span) * (H - 2 * PAD);
  const points = days.map((day, i) => {
    const v = f.values.get(day);
    if (v === void 0) return null;
    const x = days.length === 1 ? W - 3 : 2 + i / (days.length - 1) * (W - 4);
    return { x, y: yOf(v) };
  }).filter((p) => p !== null);
  const fmt = (v) => Number.isInteger(v) ? String(v) : v.toFixed(1);
  const yaxis = row.createDiv({ cls: "qj-trend-yaxis" });
  yaxis.createSpan({ text: fmt(max) });
  yaxis.createSpan({ text: fmt((max + min) / 2) });
  yaxis.createSpan({ text: fmt(min) });
  const plot = row.createDiv({ cls: "qj-trend-plot" });
  const svg = plot.createSvg("svg", {
    attr: { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "none" },
    cls: "qj-trend-svg"
  });
  for (const y of [PAD, H / 2, H - PAD]) {
    svg.appendChild(
      createSvgEl(row, "line", {
        x1: "2",
        y1: y.toFixed(1),
        x2: String(W - 2),
        y2: y.toFixed(1),
        "class": "qj-trend-grid"
      })
    );
  }
  svg.appendChild(createSvgEl(row, "line", { x1: "2", y1: "0", x2: "2", y2: String(H), "class": "qj-trend-axis" }));
  svg.appendChild(
    createSvgEl(row, "line", { x1: "0", y1: String(H - 1), x2: String(W), y2: String(H - 1), "class": "qj-trend-axis" })
  );
  if (points.length >= 2) {
    const line = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    svg.appendChild(createSvgEl(row, "polyline", { points: line }));
  }
  for (const p of points) {
    svg.appendChild(
      createSvgEl(row, "circle", {
        cx: p.x.toFixed(1),
        cy: p.y.toFixed(1),
        r: "2"
      })
    );
  }
  const xaxis = plot.createDiv({ cls: "qj-trend-xaxis" });
  const mid = (_a = days[Math.floor((days.length - 1) / 2)]) != null ? _a : days[0];
  xaxis.createSpan({ text: days[0].slice(5) });
  xaxis.createSpan({ text: mid.slice(5) });
  xaxis.createSpan({ text: days[days.length - 1].slice(5) });
  const unit = f.unit ? ` ${f.unit}` : "";
  const stats = row.createDiv({ cls: "qj-trend-stats" });
  stats.createSpan({ text: `${t("\u6700\u65B0")} ${values[values.length - 1]}${unit}` });
  stats.createSpan({ text: `${t("\u6700\u5927")} ${max}${unit}` });
  stats.createSpan({ text: `${t("\u6700\u5C0F")} ${min}${unit}` });
}
function createSvgEl(host, tag, attrs) {
  const el = host.ownerDocument.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}
function renderCalendar(card, app, ctx) {
  var _a;
  const config = ctx.plugin.config;
  const first = /* @__PURE__ */ new Date(`${ctx.days[0]}T00:00:00`);
  const year = first.getFullYear();
  const month0 = first.getMonth();
  const key = `${year}-${String(month0 + 1).padStart(2, "0")}`;
  const inPeriod = ctx.kind === "week" ? new Set(ctx.days) : null;
  const title = card.createDiv({ cls: "qj-cal-title" });
  const yearChip = title.createEl("button", { cls: "qj-cal-chip", text: String(year) });
  yearChip.type = "button";
  yearChip.onclick = () => void ctx.plugin.openPeriodNote("annual", String(year));
  const monthChip = title.createEl("button", { cls: "qj-cal-chip", text: key });
  monthChip.type = "button";
  monthChip.onclick = () => void ctx.plugin.openPeriodNote("monthly", key);
  const weekdays = ["\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D", "\u65E5"].map((w) => t(w));
  const grid = card.createDiv({ cls: "qj-cal" });
  grid.createDiv({ cls: "qj-cal-head", text: "W" });
  for (const w of weekdays) grid.createDiv({ cls: "qj-cal-head", text: w });
  const done = /* @__PURE__ */ new Map();
  for (const [day, rec] of ctx.records) {
    let n = 0;
    for (const line of rec.taskLines) {
      if (/^\s*[-*]\s+\[[xX]\]/.test(line)) n++;
    }
    if (n > 0) done.set(day, n);
  }
  const today = dateKey(/* @__PURE__ */ new Date());
  const index = new VaultIndex(app, config.journals.daily.dir);
  for (const week of monthGrid(year, month0)) {
    const monday = week[0].date;
    const weekCell = grid.createDiv({ cls: "qj-cal-weekno" });
    const wmatch = /^(\d{4})-W(\d{2})$/.exec(weekKeyOf(monday));
    weekCell.setText(wmatch ? wmatch[2] : "");
    weekCell.onclick = () => {
      const k = weekKeyOf(monday);
      if (k) void ctx.plugin.openPeriodNote("weekly", k);
    };
    for (const cell of week) {
      const el = grid.createDiv({ cls: `qj-cal-cell${cell.inMonth ? "" : " qj-cal-out"}` });
      if (!cell.inMonth) continue;
      if (inPeriod == null ? void 0 : inPeriod.has(cell.key)) el.addClass("is-in-period");
      if (cell.key === today) el.addClass("is-today");
      el.createSpan({ cls: "qj-cal-day", text: String(cell.date.getDate()) });
      const n = (_a = done.get(cell.key)) != null ? _a : 0;
      if (n > 0) el.createSpan({ cls: "qj-cal-badge", text: String(n) });
      if (ctx.records.has(cell.key)) el.createSpan({ cls: "qj-cal-dot" });
      el.onclick = () => {
        const file = index.dailyFile(cell.key);
        if (file) void app.workspace.getLeaf(false).openFile(file);
      };
    }
  }
}
function weekKeyOf(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((date.getTime() - yearStart) / 864e5 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
function renderCheckin(card, ctx) {
  for (const section of ctx.plugin.config.journals.daily.sections) {
    if (section.type !== "checkin") continue;
    const stats = boolStats(section.fields, ctx.days, ctx.records);
    const block = card.createDiv();
    block.createDiv({ cls: "qj-checkin-heading", text: section.heading.replace(/^#+\s*/, "") });
    for (const s of stats) {
      const row = block.createDiv({ cls: "qj-checkin-row" });
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
  }
}
function renderFeedMini(card, ctx) {
  var _a;
  const latest = [...ctx.entries].sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 8);
  if (latest.length === 0) {
    card.createDiv({ cls: "qj-muted", text: t("\u6682\u65E0\u5185\u5BB9\uFF0C\u5148\u53BB\u8BB0\u4E00\u6761") });
  } else {
    const names = new Map(
      ctx.plugin.config.journals.daily.sections.filter((s) => s.panel === true).map((s) => [s.id, s.heading.replace(/^#+\s*/, "")])
    );
    for (const e of latest) {
      const row = card.createDiv({ cls: "qj-mini-row" });
      row.createSpan({
        cls: "qj-feed-meta",
        text: `${(_a = names.get(e.sectionId)) != null ? _a : ""}${e.time ? ` \xB7 ${e.time}` : ""}`
      });
      const text = e.taskStatus !== void 0 ? `${taskSymbol(e.taskStatus)} ${e.text}` : e.text;
      row.createSpan({ cls: "qj-mini-text", text: text.replace(/\n/g, " ") });
    }
  }
  const more = card.createEl("button", { cls: "qj-btn", text: t("\u6253\u5F00\u901F\u8BB0\u9762\u677F") });
  more.type = "button";
  more.onclick = () => void ctx.plugin.openView("qj-panel", ctx.plugin.config.viewLocations.panel);
}
async function renderQueryPanel(card, app, ctx) {
  const config = ctx.plugin.config;
  if (ctx.editing) {
    renderQueryEditor(card, ctx);
    return;
  }
  if (config.summaryQueries.length === 0) {
    card.createDiv({ cls: "qj-muted", text: t("\u6682\u65E0\u67E5\u8BE2\u5757") });
    return;
  }
  const fallbackSource = ctx.plugin.capture.dailyPath(/* @__PURE__ */ new Date());
  const bridge = new QueryBridge(app);
  for (const q of config.summaryQueries) {
    const wrap = card.createDiv({ cls: "qj-query-block" });
    wrap.createSpan({ cls: "qj-query-chip", text: q.kind });
    const body = wrap.createDiv({ cls: "qj-query-body" });
    const ok = q.kind === "dataview" ? await bridge.renderDvQuery(q.code, fallbackSource, body, ctx.component) : await bridge.renderDvJs(q.code, fallbackSource, body, ctx.component);
    if (!ok) {
      body.empty();
      body.createDiv({
        cls: "qj-muted",
        text: bridge.dataviewAvailable ? t("\u6E32\u67D3\u5931\u8D25") : t("\u9700\u8981 Dataview \u6E32\u67D3")
      });
    }
  }
}
function renderQueryEditor(card, ctx) {
  const config = ctx.plugin.config;
  const rerender = ctx.rerender;
  for (const q of [...config.summaryQueries]) {
    const row = card.createDiv({ cls: "qj-query-edit-row" });
    row.createSpan({ cls: "qj-query-chip", text: q.kind });
    row.createSpan({ cls: "qj-query-edit-code", text: q.code.split("\n")[0].slice(0, 60) });
    const del = row.createEl("button", { cls: "qj-feed-btn" });
    del.type = "button";
    del.setAttribute("aria-label", t("\u5220\u9664"));
    del.setText("\u2715");
    del.onclick = async () => {
      config.summaryQueries = config.summaryQueries.filter((x) => x !== q);
      await ctx.plugin.saveConfig();
      rerender();
    };
  }
  const add = card.createDiv({ cls: "qj-query-add" });
  const kindSel = add.createEl("select", { cls: "qj-input" });
  for (const k of ["dataview", "dataviewjs"]) {
    kindSel.createEl("option", { text: k, attr: { value: k } });
  }
  const code = add.createEl("textarea", { cls: "qj-input qj-textarea" });
  code.rows = 3;
  code.placeholder = t("\u67E5\u8BE2\u8BED\u53E5");
  const btn = add.createEl("button", { cls: "qj-btn", text: t("\u6DFB\u52A0\u67E5\u8BE2") });
  btn.type = "button";
  btn.onclick = async () => {
    if (code.value.trim() === "") return;
    config.summaryQueries.push({ kind: kindSel.value, code: code.value.trim() });
    await ctx.plugin.saveConfig();
    rerender();
  };
}

// src/views/summary-view.ts
var VIEW_TYPE_QJ_SUMMARY = "qj-summary";
var KIND_LABEL = {
  week: "\u5468",
  month: "\u6708",
  year: "\u5E74"
};
var SummaryView = class extends import_obsidian7.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.kind = "week";
    this.period = periodOf("week", /* @__PURE__ */ new Date());
    this.editing = false;
    this.dragId = null;
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
    for (const kind of ["week", "month", "year"]) {
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
    const edit = nav.createEl("button", {
      cls: `qj-btn qj-icon-btn${this.editing ? " is-active" : ""}`
    });
    edit.type = "button";
    edit.setAttribute("aria-label", this.editing ? t("\u9000\u51FA\u7F16\u8F91") : t("\u7F16\u8F91\u6A21\u5F0F"));
    (0, import_obsidian7.setIcon)(edit, this.editing ? "check" : "settings-2");
    edit.onclick = () => {
      this.editing = !this.editing;
      void this.render();
    };
    const refresh = nav.createEl("button", { cls: "qj-btn qj-icon-btn" });
    refresh.type = "button";
    (0, import_obsidian7.setIcon)(refresh, "refresh-cw");
    refresh.onclick = () => void this.render();
  }
  /** 组件注册表（title 仅用于编辑模式的添加面板；卡片标题由视图统一画）。 */
  components() {
    return [
      {
        id: "task-chart",
        title: t("\u4EFB\u52A1\u5B8C\u6210\u7EDF\u8BA1"),
        render: (card, ctx) => {
          const tasks = taskStats(ctx.days, ctx.records);
          const done = doneByDay(ctx.days, ctx.records);
          renderTaskChart(card, ctx, [
            { label: t("\u5B8C\u6210"), value: String(tasks.doneInPeriod) },
            { label: t("\u65B0\u5EFA"), value: String(tasks.createdInPeriod) },
            { label: t("\u8BB0\u5F55"), value: `${tasks.done}/${tasks.total}` }
          ], done);
        }
      },
      {
        id: "checkin",
        title: t("\u6253\u5361"),
        render: (card, ctx) => renderCheckin(card, ctx)
      },
      {
        id: "trend",
        title: t("\u6570\u636E\u8D8B\u52BF"),
        render: (card, ctx) => renderTrend(card, ctx)
      },
      {
        id: "calendar",
        title: t("\u6708\u5386"),
        kinds: ["week", "month"],
        render: (card, ctx) => renderCalendar(card, this.app, ctx)
      },
      {
        id: "task-heatmap",
        title: t("\u4EFB\u52A1\u5B8C\u6210\u70ED\u529B\u56FE"),
        render: (card, ctx) => renderHeatmap(card, ctx, doneByDay(ctx.days, ctx.records), ctx.kind === "year")
      },
      {
        id: "entry-heatmap",
        title: t("\u5185\u5BB9\u8BB0\u5F55\u70ED\u529B\u56FE"),
        render: (card, ctx) => {
          var _a;
          const counts = /* @__PURE__ */ new Map();
          for (const e of ctx.entries) {
            counts.set(e.date, ((_a = counts.get(e.date)) != null ? _a : 0) + 1);
          }
          renderHeatmap(card, ctx, counts, ctx.kind === "year");
        }
      },
      {
        id: "feed",
        title: t("\u6700\u8FD1\u901F\u8BB0"),
        render: (card, ctx) => renderFeedMini(card, ctx)
      },
      {
        id: "queries",
        title: t("\u67E5\u8BE2"),
        render: (card, ctx) => void renderQueryPanel(card, this.app, ctx)
      }
    ];
  }
  hasPanelSections() {
    return this.plugin.config.journals.daily.sections.some((s) => s.panel === true);
  }
  async renderBody(body) {
    const config = this.plugin.config;
    const index = new VaultIndex(this.app, config.journals.daily.dir);
    const days = this.period.days.map(dateKey);
    const records = (await index.collectDayRecords(this.period.days)).records;
    body.createDiv({ cls: "qj-period-header" }).createSpan({
      cls: "qj-period-count",
      text: `${records.size} ${t("\u6761\u65E5\u5FD7")}`
    });
    const panelSections = config.journals.daily.sections.filter((s) => s.panel === true);
    const entries = panelSections.length ? await index.collectEntries(this.period.days, panelSections) : [];
    const ctx = {
      plugin: this.plugin,
      kind: this.kind,
      days,
      records,
      entries,
      component: this,
      editing: this.editing,
      rerender: () => void this.render()
    };
    renderQuickCapture(body.createDiv({ cls: "qj-capture-strip" }), ctx);
    const defs = this.components();
    const visible = config.summaryLayout.map((id) => defs.find((d) => d.id === id)).filter((d) => d !== void 0).filter((d) => d.kinds === void 0 || d.kinds.includes(this.kind));
    const cards = body.createDiv({ cls: "qj-cards" });
    if (this.editing) cards.addClass("is-editing");
    for (const def of visible) {
      const wrap = cards.createDiv({ cls: "qj-card-wrap" });
      if (this.editing) this.attachEditChrome(wrap, def.id, def.title);
      const card = wrap.createDiv({ cls: "qj-card" });
      if (def.id !== "task-chart") {
        card.createDiv({ cls: "qj-card-title", text: def.title });
      }
      await def.render(card, ctx);
    }
    if (this.editing) this.renderAddPalette(cards, defs);
  }
  /** 编辑模式外框：拖拽手柄 + 删除钮；拖放重排保存进 config。 */
  attachEditChrome(wrap, id, _title) {
    const chrome = wrap.createDiv({ cls: "qj-card-chrome" });
    const handle = chrome.createEl("button", { cls: "qj-feed-btn" });
    handle.type = "button";
    handle.setAttribute("aria-label", t("\u62D6\u52A8\u6392\u5E8F"));
    (0, import_obsidian7.setIcon)(handle, "grip-vertical");
    wrap.setAttribute("data-qj-component", id);
    const del = chrome.createEl("button", { cls: "qj-feed-btn" });
    del.type = "button";
    del.setAttribute("aria-label", t("\u5220\u9664"));
    (0, import_obsidian7.setIcon)(del, "trash-2");
    del.onclick = async () => {
      const layout = this.plugin.config.summaryLayout;
      this.plugin.config.summaryLayout = layout.filter((x) => x !== id);
      await this.plugin.saveConfig();
      void this.render();
    };
    handle.draggable = true;
    wrap.ondragover = (evt) => {
      evt.preventDefault();
      wrap.addClass("is-drop-target");
    };
    wrap.ondragleave = () => wrap.removeClass("is-drop-target");
    wrap.ondrop = (evt) => {
      evt.preventDefault();
      wrap.removeClass("is-drop-target");
      const from = this.dragId;
      const to = wrap.getAttribute("data-qj-component");
      this.dragId = null;
      if (from === null || to === null || from === to) return;
      const layout = [...this.plugin.config.summaryLayout];
      const fromIdx = layout.indexOf(from);
      const toIdx = layout.indexOf(to);
      if (fromIdx < 0 || toIdx < 0) return;
      layout.splice(toIdx, 0, ...layout.splice(fromIdx, 1));
      this.plugin.config.summaryLayout = layout;
      void this.plugin.saveConfig().then(() => this.render());
    };
    handle.ondragstart = (evt) => {
      this.dragId = id;
      if (evt.dataTransfer) {
        evt.dataTransfer.setData("text/plain", id);
        evt.dataTransfer.effectAllowed = "move";
      }
    };
  }
  /** 编辑模式底部的「添加组件」面板（列出当前布局之外的组件）。 */
  renderAddPalette(cards, defs) {
    const hidden = defs.filter((d) => !this.plugin.config.summaryLayout.includes(d.id));
    const card = cards.createDiv({ cls: "qj-card qj-add-palette" });
    card.createDiv({ cls: "qj-card-title", text: t("\u6DFB\u52A0\u7EC4\u4EF6") });
    if (hidden.length === 0) {
      card.createDiv({ cls: "qj-muted", text: t("\u6240\u6709\u7EC4\u4EF6\u5747\u5DF2\u663E\u793A") });
      return;
    }
    const row = card.createDiv({ cls: "qj-capture-row" });
    for (const def of hidden) {
      const btn = row.createEl("button", { cls: "qj-btn", text: `+ ${def.title}` });
      btn.type = "button";
      btn.onclick = async () => {
        this.plugin.config.summaryLayout.push(def.id);
        await this.plugin.saveConfig();
        void this.render();
      };
    }
  }
};

// src/views/panel-view.ts
var import_obsidian10 = require("obsidian");

// src/services/rollover-service.ts
var import_obsidian8 = require("obsidian");

// src/capture/rollover.ts
function openTaskMatcher(markers) {
  const escaped = markers.map((m) => m.replace(/[\\\]^-]/g, "\\$&")).join("");
  const re = new RegExp(`^\\s*-\\s\\[[${escaped}]\\]\\s`);
  return (line) => re.test(line);
}
function extractUnfinishedBlocks(lines, markers) {
  const isOpenTask = openTaskMatcher(markers);
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    if (!isOpenTask(lines[i])) {
      i++;
      continue;
    }
    const start = i;
    const blockLines = [lines[i]];
    let j = i + 1;
    while (j < lines.length) {
      const next = lines[j];
      if (next.trim() === "") {
        const look = j + 1;
        if (look < lines.length && /^\s+\S/.test(lines[look])) {
          blockLines.push(next, lines[look]);
          j = look + 1;
          continue;
        }
        break;
      }
      if (/^\s+\S/.test(next)) {
        blockLines.push(next);
        j++;
        continue;
      }
      break;
    }
    blocks.push({ start, end: j, lines: [...blockLines] });
    i = j;
  }
  return blocks;
}
function removeBlocks(text, blocks) {
  const lines = text.split(/\r?\n/);
  const sorted = [...blocks].sort((a, b) => b.start - a.start);
  for (const block of sorted) {
    lines.splice(block.start, block.end - block.start);
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}
function blocksToLines(blocks) {
  return blocks.flatMap((b) => b.lines);
}

// src/services/rollover-service.ts
var MAX_LOOKBACK = 365;
var RolloverService = class {
  constructor(app, getConfig) {
    this.app = app;
    this.getConfig = getConfig;
  }
  /** 完整标记集 = 空格（隐含标配）+ 配置的额外标识。 */
  markers() {
    return [" ", ...this.getConfig().rollover.openMarkers];
  }
  dir(type) {
    return this.getConfig().journals[type].dir.replace(/\/+$/, "");
  }
  dailyPath(dateStr) {
    return `${this.dir("daily")}/${dateStr}.md`;
  }
  /** 往回找最近一期有未完成任务的日日志（不含今天）。 */
  async preview(now) {
    const markers = this.markers();
    const cursor = new Date(now);
    for (let i = 0; i < MAX_LOOKBACK; i++) {
      cursor.setDate(cursor.getDate() - 1);
      const path = this.dailyPath(dateKey(cursor));
      const file = this.app.vault.getAbstractFileByPath(path);
      if (!(file instanceof import_obsidian8.TFile)) continue;
      const text = await this.app.vault.cachedRead(file);
      const blocks = extractUnfinishedBlocks(text.split(/\r?\n/), markers);
      if (blocks.length > 0) {
        return { sourcePath: path, sourceDate: dateKey(cursor), blocks };
      }
    }
    return null;
  }
  /** 执行迁移：目标 = 今天日日志的任务列表区（首个行模板带 `[ ]` 的 list 区）。 */
  async perform(preview, now) {
    var _a;
    const config = this.getConfig();
    const todayPath = this.dailyPath(dateKey(now));
    try {
      await readNoteText(this.app, todayPath);
    } catch (e) {
      await ensureNote(this.app, todayPath, skeletonFor("daily", now, config.journals.daily.sections));
    }
    let todayText;
    try {
      todayText = await readNoteText(this.app, todayPath);
    } catch (e) {
      return { ok: false, message: `note not found: ${todayPath}` };
    }
    const sections = config.journals.daily.sections;
    const target = (_a = sections.find((s) => {
      var _a2;
      return s.type === "list" && ((_a2 = s.lineTemplate) != null ? _a2 : "").includes("[ ]");
    })) != null ? _a : sections.find((s) => s.type === "list");
    const lines = blocksToLines(preview.blocks);
    const todayLines = todayText.split(/\r?\n/);
    const plan = target ? planInsertLines(todayLines, {
      heading: target.heading,
      headingMissingCreates: true,
      newLines: lines
    }) : planInsertLines(todayLines, {
      heading: "## Tasks",
      headingMissingCreates: true,
      newLines: lines
    });
    if (plan.status !== "ok") {
      return { ok: false, message: plan.reason };
    }
    await applyPlanToFile(this.app, todayPath, plan);
    const markers = this.markers();
    const sourceFile = this.app.vault.getAbstractFileByPath(preview.sourcePath);
    if (!(sourceFile instanceof import_obsidian8.TFile)) {
      return { ok: false, message: `note not found: ${preview.sourcePath}` };
    }
    await this.app.vault.process(
      sourceFile,
      (text) => removeBlocks(text, extractUnfinishedBlocks(text.split(/\r?\n/), markers))
    );
    return { ok: true, moved: preview.blocks.length, from: preview.sourceDate };
  }
};

// src/ui/entry-edit-modal.ts
var import_obsidian9 = require("obsidian");
var EntryEditModal = class extends import_obsidian9.Modal {
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
    (0, import_obsidian9.setIcon)(save.createSpan({ cls: "qj-btn-icon" }), "check");
    save.onclick = () => {
      this.onSave(input.value);
      this.close();
    };
  }
};

// src/views/panel-view.ts
var VIEW_TYPE_QJ_PANEL = "qj-panel";
var FILTER_ALL = "__all__";
var PanelView = class extends import_obsidian10.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.rangeDays = 7;
    this.entries = [];
    this.feedEl = null;
    this.inputEl = null;
    this.targetId = "";
    /** 筛选（同时控制输入目标与展示范围）；空串 = 全部 */
    this.filterId = "";
    this.searchText = "";
    /** 顶部功能区收起（手机端把内容区顶上来） */
    this.collapsed = false;
    /** 日志文件变更 → 防抖刷新（obsidian 自带 debounce，取消语义清晰） */
    this.scheduleRefresh = (0, import_obsidian10.debounce)(() => void this.loadFeed(), 1200, true);
  }
  get showDone() {
    return this.plugin.config.panel.showCompleted;
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
        if (file instanceof import_obsidian10.TFile && file.path.startsWith(this.plugin.config.journals.daily.dir)) {
          this.scheduleRefresh();
        }
      })
    );
  }
  onunload() {
    this.scheduleRefresh.cancel();
    super.onunload();
  }
  panelSections() {
    return this.plugin.config.journals.daily.sections.filter(
      (s) => s.panel === true && (s.type === "text" || s.type === "list" || s.type === "paragraph")
    );
  }
  /** 输入条可直发的目标：列表（追加）与段落（一天一条，重发即编辑）。 */
  writableSections() {
    return this.panelSections().filter((s) => s.type === "list" || s.type === "paragraph");
  }
  render() {
    const root = this.contentEl;
    root.empty();
    root.addClass("qj-panel-root");
    const bar = root.createDiv({ cls: "qj-panel-toggle" });
    const toggle = bar.createEl("button", {
      cls: `qj-btn qj-icon-btn${this.collapsed ? " is-active" : ""}`
    });
    toggle.type = "button";
    toggle.setAttribute("aria-label", this.collapsed ? t("\u5C55\u5F00\u5F55\u5165") : t("\u6536\u8D77\u5F55\u5165"));
    (0, import_obsidian10.setIcon)(toggle, this.collapsed ? "chevrons-down" : "chevrons-up");
    toggle.onclick = () => {
      this.collapsed = !this.collapsed;
      this.render();
    };
    bar.createSpan({
      cls: "qj-panel-toggle-label",
      text: this.collapsed ? t("\u5C55\u5F00\u5F55\u5165") : t("\u6536\u8D77\u5F55\u5165")
    });
    if (!this.collapsed) {
      this.renderToolbar(root);
      this.renderInput(root);
    }
    this.feedEl = root.createDiv({ cls: "qj-feed" });
    void this.loadFeed();
  }
  renderToolbar(root) {
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
    const filterDrop = new import_obsidian10.DropdownComponent(toolbar);
    filterDrop.addOption(FILTER_ALL, t("\u5168\u90E8"));
    for (const s of this.panelSections()) {
      filterDrop.addOption(s.id, s.heading.replace(/^#+\s*/, ""));
    }
    filterDrop.setValue(this.filterId || FILTER_ALL);
    filterDrop.onChange((value) => {
      this.filterId = value === FILTER_ALL ? "" : value;
      this.render();
    });
    const doneBtn = toolbar.createEl("button", {
      cls: `qj-btn qj-icon-btn${this.showDone ? " is-active" : ""}`
    });
    doneBtn.type = "button";
    doneBtn.setAttribute("aria-label", t("\u663E\u793A\u5DF2\u5B8C\u6210\u4EFB\u52A1"));
    (0, import_obsidian10.setIcon)(doneBtn, this.showDone ? "eye" : "eye-off");
    doneBtn.onclick = () => {
      this.plugin.config.panel.showCompleted = !this.showDone;
      void this.plugin.saveConfig().then(() => this.render());
    };
    const rollBtn = toolbar.createEl("button", { cls: "qj-btn qj-icon-btn" });
    rollBtn.type = "button";
    rollBtn.setAttribute("aria-label", t("\u6EDA\u52A8\u672A\u5B8C\u6210\u4EFB\u52A1"));
    (0, import_obsidian10.setIcon)(rollBtn, "calendar-clock");
    rollBtn.onclick = () => void this.rollover();
    const search = toolbar.createEl("input", { cls: "qj-input qj-search" });
    search.type = "search";
    search.placeholder = t("\u641C\u7D22");
    search.value = this.searchText;
    search.oninput = () => {
      this.searchText = search.value;
      this.renderFeed();
    };
    const refresh = toolbar.createEl("button", { cls: "qj-btn qj-icon-btn" });
    refresh.type = "button";
    (0, import_obsidian10.setIcon)(refresh, "refresh-cw");
    refresh.onclick = () => void this.loadFeed();
  }
  renderInput(root) {
    const filterSection = this.filterId ? this.panelSections().find((s) => s.id === this.filterId) : void 0;
    if (filterSection && filterSection.type === "text") return;
    let targets;
    if (filterSection) {
      targets = [filterSection];
    } else {
      targets = this.writableSections();
    }
    if (targets.length === 0) return;
    if (!targets.some((s) => s.id === this.targetId)) {
      this.targetId = targets[0].id;
    }
    const box = root.createDiv({ cls: "qj-composer" });
    const top = box.createDiv({ cls: "qj-composer-top" });
    if (targets.length > 1) {
      const dropdown = new import_obsidian10.DropdownComponent(top);
      dropdown.addOptions(
        Object.fromEntries(targets.map((s) => [s.id, s.heading.replace(/^#+\s*/, "")]))
      );
      dropdown.setValue(this.targetId);
      dropdown.onChange((value) => {
        this.targetId = value;
        updateHint();
      });
    } else {
      top.createSpan({
        cls: "qj-composer-target",
        text: targets[0].heading.replace(/^#+\s*/, "")
      });
    }
    const input = box.createEl("textarea", { cls: "qj-composer-input" });
    input.rows = 1;
    input.placeholder = t("\u8BB0\u70B9\u4EC0\u4E48\u2026");
    this.inputEl = input;
    const grow = () => {
      input.setCssProps({ height: "auto" });
      input.setCssProps({ height: `${Math.min(input.scrollHeight, 160)}px` });
    };
    input.addEventListener("input", grow);
    input.addEventListener("keydown", (evt) => {
      var _a;
      if (evt.key !== "Enter") return;
      const target = (_a = targets.find((s) => s.id === this.targetId)) != null ? _a : targets[0];
      if (!evt.shiftKey) {
        evt.preventDefault();
        void this.send();
        return;
      }
      if (target.type !== "paragraph") evt.preventDefault();
    });
    const foot = box.createDiv({ cls: "qj-composer-foot" });
    const hint = foot.createSpan({ cls: "qj-composer-hint" });
    const updateHint = () => {
      var _a;
      const target = (_a = targets.find((s) => s.id === this.targetId)) != null ? _a : targets[0];
      hint.setText(
        target.type === "paragraph" ? t("Enter \u53D1\u9001 \xB7 Shift+Enter \u6362\u884C") : t("Enter \u53D1\u9001")
      );
    };
    updateHint();
    const send = foot.createEl("button", { cls: "qj-btn qj-btn-primary qj-send-btn" });
    send.type = "button";
    (0, import_obsidian10.setIcon)(send.createSpan({ cls: "qj-btn-icon" }), "send");
    send.createSpan({ text: t("\u53D1\u9001") });
    send.onclick = () => void this.send();
  }
  /** 未完成任务滚动：预览 → 确认 → 迁移 → 刷新。 */
  async rollover() {
    const service = new RolloverService(this.app, () => this.plugin.config);
    const preview = await service.preview(/* @__PURE__ */ new Date());
    if (preview === null) {
      new import_obsidian10.Notice(t("\u6CA1\u6709\u53EF\u79FB\u52A8\u7684\u4EFB\u52A1"));
      return;
    }
    new ConfirmModal(
      this.app,
      t("\u79FB\u52A8\u672A\u5B8C\u6210\u4EFB\u52A1"),
      `${t("\u6765\u81EA")} ${preview.sourceDate} \xB7 ${preview.blocks.length} ${t("\u4E2A\u4EFB\u52A1\u5757")}`,
      async () => {
        const result = await service.perform(preview, /* @__PURE__ */ new Date());
        if (result.ok) {
          new import_obsidian10.Notice(`${t("\u5DF2\u79FB\u52A8")} ${result.moved} ${t("\u4E2A\u4EFB\u52A1\u5757")} \u2192 ${result.from}`);
          await this.loadFeed();
        } else {
          new import_obsidian10.Notice(`${t("\u5199\u5165\u5931\u8D25")}: ${result.message}`);
        }
      },
      t("\u79FB\u52A8")
    ).open();
  }
  async send() {
    var _a, _b;
    const raw = (_b = (_a = this.inputEl) == null ? void 0 : _a.value) != null ? _b : "";
    if (raw.trim() === "") return;
    const section = this.writableSections().find((s) => s.id === this.targetId);
    if (!section) return;
    const value = section.type === "paragraph" ? raw.trim() : raw.replace(/\s*\n+\s*/g, " ").trim();
    if (value === "") return;
    if (this.inputEl) this.inputEl.value = "";
    if (section.type === "paragraph") {
      const today = dateKey(/* @__PURE__ */ new Date());
      const existing = await this.plugin.capture.paragraphContent(today, section);
      if (existing !== "") {
        new EntryEditModal(this.app, section.heading.replace(/^#+\s*/, ""), existing, true, (content) => {
          void (async () => {
            const result2 = await this.plugin.capture.editEntry(
              section,
              { date: today, sectionId: section.id, kind: "paragraph", text: existing },
              content
            );
            if (!result2.ok) new import_obsidian10.Notice(this.entryError(result2.message));
            await this.loadFeed();
          })();
        }).open();
        return;
      }
      await this.plugin.performCapture("daily", section, { values: {}, lineValue: value }, true);
      await this.loadFeed();
      return;
    }
    const result = await this.plugin.capture.performSection(
      "daily",
      section,
      { values: {}, lineValue: value },
      { overwrite: false }
    );
    if (result.ok) {
      await this.loadFeed();
    } else if (result.reason === "error") {
      new import_obsidian10.Notice(`${t("\u5199\u5165\u5931\u8D25")}: ${result.message}`);
    }
  }
  async loadFeed() {
    const sections = this.panelSections();
    if (this.feedEl === null) return;
    if (sections.length === 0) {
      this.entries = [];
      this.renderFeed();
      return;
    }
    const index = new VaultIndex(this.app, this.plugin.config.journals.daily.dir);
    const today = /* @__PURE__ */ new Date();
    const days = Array.from({ length: this.rangeDays }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return d;
    });
    this.entries = await index.collectEntries(days, sections);
    this.renderFeed();
  }
  visibleEntries(sections) {
    let list = this.entries;
    if (this.filterId !== "") list = list.filter((e) => e.sectionId === this.filterId);
    if (!this.showDone) {
      list = list.filter((e) => !(e.taskStatus === "x" || e.taskStatus === "X"));
    }
    const q = this.searchText.trim().toLowerCase();
    if (q !== "") {
      const name = new Map(sections.map((s) => [s.id, s.heading.replace(/^#+\s*/, "")]));
      list = list.filter(
        (e) => {
          var _a, _b;
          return e.text.toLowerCase().includes(q) || ((_a = e.label) != null ? _a : "").toLowerCase().includes(q) || ((_b = name.get(e.sectionId)) != null ? _b : "").toLowerCase().includes(q);
        }
      );
    }
    return list;
  }
  renderFeed() {
    var _a;
    const feed = this.feedEl;
    if (feed === null) return;
    feed.empty();
    const sections = this.panelSections();
    if (sections.length === 0) {
      feed.createDiv({ cls: "qj-empty", text: t("\u6CA1\u6709\u5F00\u542F\u5185\u5BB9\u6C47\u603B\u9762\u677F\u7684\u6807\u9898\u533A") });
      return;
    }
    const entries = this.visibleEntries(sections);
    if (entries.length === 0) {
      feed.createDiv({ cls: "qj-empty", text: t("\u6682\u65E0\u5185\u5BB9\uFF0C\u5148\u53BB\u8BB0\u4E00\u6761") });
      return;
    }
    const sectionName = new Map(sections.map((s) => [s.id, s.heading.replace(/^#+\s*/, "")]));
    const byDate = /* @__PURE__ */ new Map();
    for (const entry of entries) {
      if (!byDate.has(entry.date)) byDate.set(entry.date, []);
      byDate.get(entry.date).push(entry);
    }
    for (const date of [...byDate.keys()].sort().reverse()) {
      const day = feed.createDiv({ cls: "qj-feed-day" });
      day.createSpan({ cls: "qj-feed-day-label", text: this.dayLabel(date) });
      for (const entry of byDate.get(date)) {
        const section = sections.find((s) => s.id === entry.sectionId);
        if (!section) continue;
        this.renderItem(day, date, section, entry, (_a = sectionName.get(entry.sectionId)) != null ? _a : "");
      }
    }
  }
  renderItem(day, date, section, entry, name) {
    const item = day.createDiv({ cls: "qj-feed-item" });
    const head = item.createDiv({ cls: "qj-feed-head" });
    const meta = head.createDiv({ cls: "qj-feed-meta" });
    if (entry.taskStatus !== void 0) {
      const toggle = meta.createEl("button", { cls: "qj-feed-toggle" });
      toggle.type = "button";
      toggle.setText(entry.taskStatus === "x" || entry.taskStatus === "X" ? "\u2611" : "\u2610");
      toggle.setAttribute("aria-label", t("\u5207\u6362\u5B8C\u6210"));
      toggle.onclick = (evt) => {
        evt.stopPropagation();
        void (async () => {
          const r = await this.plugin.capture.toggleTaskEntry(section, entry);
          if (!r.ok) new import_obsidian10.Notice(this.entryError(r.message));
          await this.loadFeed();
        })();
      };
    }
    meta.createSpan({ text: name });
    if (entry.label) meta.createSpan({ cls: "qj-feed-label", text: entry.label });
    if (entry.time) meta.createSpan({ cls: "qj-feed-time", text: entry.time });
    const actions = head.createDiv({ cls: "qj-feed-actions" });
    if (entry.kind === "line") {
      this.actionButton(actions, "repeat", t("\u4EFB\u52A1/\u5217\u8868\u4E92\u8F6C"), () => {
        void (async () => {
          const r = await this.plugin.capture.convertEntry(section, entry);
          if (!r.ok) new import_obsidian10.Notice(this.entryError(r.message));
          await this.loadFeed();
        })();
      });
      this.actionButton(actions, "archive", t("\u5F52\u6863"), () => {
        void (async () => {
          const r = await this.plugin.capture.archiveEntry(section, entry);
          if (!r.ok) new import_obsidian10.Notice(this.entryError(r.message));
          await this.loadFeed();
        })();
      });
    }
    this.actionButton(actions, "pencil", t("\u7F16\u8F91"), () => this.editEntry(section, entry));
    this.actionButton(actions, "trash-2", t("\u5220\u9664"), () => this.deleteEntry(section, entry));
    this.actionButton(actions, "arrow-up-right", t("\u6253\u5F00\u65E5\u5FD7"), () => this.jumpTo(date));
    item.createDiv({ cls: "qj-feed-text", text: entry.text });
  }
  actionButton(parent, icon, label, onClick) {
    const btn = parent.createEl("button", { cls: "qj-feed-btn" });
    btn.type = "button";
    btn.setAttribute("aria-label", label);
    (0, import_obsidian10.setIcon)(btn, icon);
    btn.onclick = (evt) => {
      evt.stopPropagation();
      onClick();
    };
  }
  jumpTo(date) {
    const file = new VaultIndex(this.app, this.plugin.config.journals.daily.dir).dailyFile(date);
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
            new import_obsidian10.Notice(this.entryError(result.message));
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
          new import_obsidian10.Notice(this.entryError(result.message));
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
var import_obsidian11 = require("obsidian");

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
  daily: "\u65E5\u65E5\u5FD7",
  weekly: "\u5468",
  monthly: "\u6708",
  annual: "\u5E74"
};
var SECTION_TYPE_LABEL = {
  checkin: "\u6253\u5361",
  data: "\u6570\u636E",
  text: "\u6587\u672C",
  list: "\u5217\u8868",
  paragraph: "\u6BB5\u843D"
};
var QJSettingTab = class extends import_obsidian11.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.settingsTab = "general";
    this.journalTab = "daily";
  }
  display() {
    var _a;
    const scroller = this.containerEl.closest(".vertical-tab-content");
    const scrollTop = (_a = scroller == null ? void 0 : scroller.scrollTop) != null ? _a : 0;
    this.containerEl.empty();
    this.renderTabBar();
    if (this.settingsTab === "general") this.renderGeneral();
    else if (this.settingsTab === "journals") this.renderJournals();
    else this.renderPanel();
    if (scroller !== null && scrollTop > 0) scroller.scrollTop = scrollTop;
  }
  renderTabBar() {
    const tabs = this.containerEl.createDiv({ cls: "qj-tabs" });
    const items = [
      { id: "general", label: t("\u901A\u7528") },
      { id: "journals", label: t("\u65E5\u5FD7") },
      { id: "panel", label: t("\u901F\u8BB0\u9762\u677F") }
    ];
    for (const item of items) {
      const btn = tabs.createEl("button", {
        cls: `qj-btn${this.settingsTab === item.id ? " is-active" : ""}`,
        text: item.label
      });
      btn.type = "button";
      btn.onclick = () => {
        this.settingsTab = item.id;
        this.display();
      };
    }
  }
  // ── 通用 ────────────────────────────────────────────────────────────────
  renderGeneral() {
    new import_obsidian11.Setting(this.containerEl).setName(t("\u754C\u9762\u8BED\u8A00")).addDropdown((drop) => {
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
    new import_obsidian11.Setting(this.containerEl).setName(t("\u6253\u5F00\u4F4D\u7F6E")).setHeading();
    for (const key of ["summary", "panel"]) {
      new import_obsidian11.Setting(this.containerEl).setName(t(key === "summary" ? "\u65E5\u5FD7\u6C47\u603B" : "\u901F\u8BB0\u9762\u677F")).addDropdown((drop) => {
        drop.addOption("tab", t("\u6807\u7B7E\u9875"));
        drop.addOption("sidebar", t("\u53F3\u4FA7\u8FB9\u680F"));
        drop.setValue(this.plugin.config.viewLocations[key]);
        drop.onChange(async (value) => {
          this.plugin.config.viewLocations[key] = value;
          await this.plugin.saveConfig();
        });
      });
    }
    this.containerEl.createEl("p", {
      cls: "qj-setting-note",
      text: t("\u547D\u4EE4\u5728\u91CD\u8F7D\u63D2\u4EF6\u540E\u6309\u65B0\u914D\u7F6E\u751F\u6548\uFF1B\u5DE5\u5177\u680F\u6309\u94AE\u4E0E\u6C47\u603B\u89C6\u56FE\u5373\u65F6\u751F\u6548\u3002")
    });
    new import_obsidian11.Setting(this.containerEl).addButton(
      (btn) => btn.setButtonText(t("\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E")).setWarning().onClick(() => {
        new ConfirmModal(
          this.app,
          t("\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E"),
          t("\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E\u8BF4\u660E"),
          async () => {
            await this.plugin.resetConfig();
            new import_obsidian11.Notice(t("\u5DF2\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E\uFF0C\u91CD\u8F7D\u63D2\u4EF6\u540E\u547D\u4EE4\u6309\u65B0\u914D\u7F6E\u751F\u6548\u3002"));
            this.display();
          },
          t("\u6062\u590D")
        ).open();
      })
    );
  }
  // ── 日志（日/周/月/年） ──────────────────────────────────────────────────
  renderJournals() {
    const tabs = this.containerEl.createDiv({ cls: "qj-tabs qj-tabs--inner" });
    for (const type of ["daily", "weekly", "monthly", "annual"]) {
      const btn = tabs.createEl("button", {
        cls: `qj-btn${this.journalTab === type ? " is-active" : ""}`,
        text: t(TYPE_LABEL[type])
      });
      btn.type = "button";
      btn.onclick = () => {
        this.journalTab = type;
        this.display();
      };
    }
    const journal = this.plugin.config.journals[this.journalTab];
    new import_obsidian11.Setting(this.containerEl).setName(t("\u65E5\u5FD7\u76EE\u5F55")).addText((text) => {
      text.setPlaceholder(t("\u793A\u4F8B\uFF1A500 Journal/540 Daily"));
      text.setValue(journal.dir);
      text.onChange(async (value) => {
        journal.dir = value.trim();
        await this.plugin.saveConfig();
      });
    });
    if (this.journalTab === "daily") {
      new import_obsidian11.Setting(this.containerEl).setName(t("\u6A21\u677F\u7B14\u8BB0")).setDesc(t("\u4ECE\u6A21\u677F\u8BC6\u522B\u8BF4\u660E")).addText((text) => {
        text.setPlaceholder(t("\u793A\u4F8B\uFF1A500 Journal/TPL-Daily.md"));
        text.setValue(this.plugin.config.templateNote);
        text.onChange(async (value) => {
          this.plugin.config.templateNote = value.trim();
          await this.plugin.saveConfig();
        });
      }).addButton(
        (btn) => btn.setButtonText(t("\u4ECE\u6A21\u677F\u8BC6\u522B")).setCta().onClick(() => void this.detectFromTemplate())
      );
    }
    new import_obsidian11.Setting(this.containerEl).setName(t("\u6807\u9898\u533A")).setHeading();
    for (const section of journal.sections) {
      this.sectionEditor(journal, section);
    }
    new import_obsidian11.Setting(this.containerEl).addButton(
      (btn) => btn.setButtonText(t("\u6DFB\u52A0\u6807\u9898\u533A")).onClick(async () => {
        journal.sections.push({
          id: `sec-${Date.now()}`,
          heading: "## ",
          type: "list",
          fields: []
        });
        await this.plugin.saveConfig();
        this.display();
      })
    );
  }
  async detectFromTemplate() {
    const path = (0, import_obsidian11.normalizePath)(this.plugin.config.templateNote);
    if (path === "") {
      new import_obsidian11.Notice(t("\u8BF7\u5148\u586B\u5199\u6A21\u677F\u7B14\u8BB0\u8DEF\u5F84"));
      return;
    }
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof import_obsidian11.TFile)) {
      new import_obsidian11.Notice(`${t("\u627E\u4E0D\u5230\u7B14\u8BB0")}\uFF1A${path}`);
      return;
    }
    const text = await this.app.vault.cachedRead(file);
    const sections = detectedToSections(detectSections(text));
    if (sections.length === 0) {
      new import_obsidian11.Notice(t("\u672A\u8BC6\u522B\u5230\u6807\u9898\u533A"));
      return;
    }
    this.plugin.config.journals.daily.sections = sections;
    await this.plugin.saveConfig();
    const fieldCount = sections.reduce((n, s) => n + s.fields.length, 0);
    new import_obsidian11.Notice(`${t("\u8BC6\u522B\u5230")} ${sections.length} ${t("\u4E2A\u6807\u9898\u533A")}\u3001${fieldCount} ${t("\u4E2A\u5B57\u6BB5")}`);
    this.display();
  }
  sectionEditor(journal, section) {
    const container = this.containerEl.createDiv({ cls: "qj-section-editor" });
    new import_obsidian11.Setting(container).addText((text) => {
      text.setPlaceholder("### \u2026");
      text.setValue(section.heading);
      text.onChange(async (value) => {
        section.heading = value;
        await this.plugin.saveConfig();
      });
    }).addDropdown((drop) => {
      for (const type of ["checkin", "data", "text", "list", "paragraph"]) {
        drop.addOption(type, t(SECTION_TYPE_LABEL[type]));
      }
      drop.setValue(section.type);
      drop.onChange(async (value) => {
        section.type = value;
        await this.plugin.saveConfig();
        this.display();
      });
    }).addExtraButton(
      (btn) => btn.setIcon("trash-2").setTooltip(t("\u5220\u9664")).onClick(async () => {
        journal.sections.splice(journal.sections.indexOf(section), 1);
        await this.plugin.saveConfig();
        this.display();
      })
    );
    if (this.journalTab === "daily" && (section.type === "list" || section.type === "text" || section.type === "paragraph")) {
      new import_obsidian11.Setting(container).setName(t("\u5F00\u542F\u5185\u5BB9\u6C47\u603B\u9762\u677F")).setDesc(t("\u5728\u901F\u8BB0\u9762\u677F\u91CC\u805A\u5408\u663E\u793A\u8BE5\u6807\u9898\u533A\u7684\u5185\u5BB9")).addToggle(
        (toggle) => toggle.setValue(section.panel === true).onChange(async (value) => {
          section.panel = value ? true : void 0;
          await this.plugin.saveConfig();
          this.display();
        })
      );
    }
    if (this.journalTab === "daily" && (section.type === "list" || section.type === "paragraph")) {
      new import_obsidian11.Setting(container).setName(t("\u81EA\u52A8\u6DFB\u52A0\u65F6\u95F4\u6233")).setDesc(t("\u8BB0\u5F55\u65F6\u81EA\u52A8\u52A0\u65F6\u95F4\u6233\u524D\u7F00\uFF08HH:mm\uFF09\uFF0C\u901F\u8BB0\u9762\u677F\u4F1A\u89E3\u6790\u5E76\u663E\u793A")).addToggle((toggle) => {
        toggle.setDisabled(section.panel !== true);
        toggle.setValue(section.timestamp === true);
        toggle.onChange(async (value) => {
          section.timestamp = value ? true : void 0;
          await this.plugin.saveConfig();
        });
      });
    }
    if (section.type === "list") {
      new import_obsidian11.Setting(container).setName(t("\u884C\u6A21\u677F")).setDesc("{{value}}").addText((text) => {
        var _a;
        text.setValue((_a = section.lineTemplate) != null ? _a : "- {{value}}");
        text.onChange(async (value) => {
          section.lineTemplate = value;
          await this.plugin.saveConfig();
        });
      });
      return;
    }
    if (section.type === "paragraph") return;
    for (const field of section.fields) {
      const row = new import_obsidian11.Setting(container).setClass("qj-field-editor");
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
    new import_obsidian11.Setting(container).addButton(
      (btn) => btn.setButtonText(t("\u6DFB\u52A0\u5B57\u6BB5")).onClick(async () => {
        section.fields.push({ key: "", label: "" });
        await this.plugin.saveConfig();
        this.display();
      })
    );
  }
  // ── 速记面板 ────────────────────────────────────────────────────────────
  renderPanel() {
    new import_obsidian11.Setting(this.containerEl).setName(t("\u663E\u793A\u5DF2\u5B8C\u6210\u4EFB\u52A1")).addToggle(
      (toggle) => toggle.setValue(this.plugin.config.panel.showCompleted).onChange(async (value) => {
        this.plugin.config.panel.showCompleted = value;
        await this.plugin.saveConfig();
      })
    );
    new import_obsidian11.Setting(this.containerEl).setName(t("\u672A\u5B8C\u6210\u4EFB\u52A1\u6807\u8BC6")).setDesc(t("\u6EDA\u52A8\u65F6\u8BA1\u5165\u672A\u5B8C\u6210\u7684\u52FE\u9009\u6846\u5B57\u7B26\uFF08\u7A7A\u683C\u59CB\u7EC8\u5305\u542B\uFF09\uFF0C\u9017\u53F7\u5206\u9694")).addText((text) => {
      text.setPlaceholder(">,/");
      text.setValue(this.plugin.config.rollover.openMarkers.join(","));
      text.onChange(async (value) => {
        const markers = value.split(",").map((token) => token.trim()).filter((token) => token.length === 1 && token !== " ");
        this.plugin.config.rollover.openMarkers = markers;
        await this.plugin.saveConfig();
      });
    });
  }
};

// src/main.ts
var TYPE_PREFIX2 = {
  daily: "",
  weekly: "\u5468 \xB7 ",
  monthly: "\u6708 \xB7 ",
  annual: "\u5E74 \xB7 "
};
var QuickJournalPlugin = class extends import_obsidian12.Plugin {
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
      callback: () => void this.openView(VIEW_TYPE_QJ_SUMMARY, this.config.viewLocations.summary)
    });
    this.addCommand({
      id: "open-quick-capture",
      name: t("\u6253\u5F00\u5FEB\u901F\u5F55\u5165"),
      callback: () => this.openPicker()
    });
    this.addCommand({
      id: "open-panel",
      name: t("\u6253\u5F00\u901F\u8BB0\u9762\u677F"),
      callback: () => void this.openView(VIEW_TYPE_QJ_PANEL, this.config.viewLocations.panel)
    });
    for (const type of ["daily", "weekly", "monthly", "annual"]) {
      for (const section of this.config.journals[type].sections) {
        this.addSectionCommand(type, section);
      }
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
      this.config.journals.daily.sections,
      (section) => this.openSectionCapture("daily", section)
    ).open();
  }
  addSectionCommand(type, section) {
    this.addCommand({
      id: `qj-${section.id}`,
      name: `${t("\u5FEB\u901F\u5F55\u5165")}: ${TYPE_PREFIX2[type]}${section.heading.replace(/^#+\s*/, "")}`,
      callback: () => this.openSectionCapture(type, section)
    });
  }
  openSectionCapture(type, section) {
    if (section.type === "paragraph") {
      void this.capture.paragraphContent(this.currentKey(type), section).then((initial) => {
        new CaptureModal(
          this.app,
          section.heading.replace(/^#+\s*/, ""),
          section.type,
          section.fields,
          (payload) => void this.performCapture(type, section, payload, true),
          initial
        ).open();
      });
      return;
    }
    new CaptureModal(
      this.app,
      section.heading.replace(/^#+\s*/, ""),
      section.type,
      section.fields,
      (payload) => void this.performCapture(type, section, payload, false)
    ).open();
  }
  /** 各类型「当天」的键（段落预填定位用）。 */
  currentKey(type) {
    if (type === "daily") return dateKey(/* @__PURE__ */ new Date());
    const now = /* @__PURE__ */ new Date();
    if (type === "weekly") {
      return this.capture.weeklyPath(now).split("/").pop().replace(/\.md$/, "");
    }
    if (type === "monthly") return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return String(now.getFullYear());
  }
  /** 捕获执行（含覆盖确认流）；速记面板直发段落也走这里。 */
  async performCapture(type, section, payload, overwrite) {
    const result = await this.capture.performSection(type, section, payload, { overwrite });
    if (result.ok) {
      const note = result.created ? `${t("\u521B\u5EFA\u7B14\u8BB0")} \xB7 ` : "";
      new import_obsidian12.Notice(`${note}${t("\u5DF2\u5199\u5165")} ${result.path} (${result.writtenLines})`);
      return;
    }
    if (result.reason === "overwrite") {
      new ConfirmModal(
        this.app,
        t("\u4EE5\u4E0B\u5B57\u6BB5\u5DF2\u6709\u503C\uFF0C\u8986\u76D6\u5199\u5165\uFF1F"),
        result.keys.join("\n"),
        () => void this.performCapture(type, section, payload, true)
      ).open();
      return;
    }
    new import_obsidian12.Notice(`${t("\u5199\u5165\u5931\u8D25")}: ${result.message}`);
  }
  /** 打开（或聚焦）某个视图；位置按设置（标签页 / 右侧边栏）。 */
  async openView(viewType, location = "tab") {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(viewType);
    let leaf = existing.length > 0 ? existing[0] : null;
    if (leaf === null) {
      leaf = location === "sidebar" ? workspace.getRightLeaf(false) : workspace.getLeaf("tab");
    }
    if (leaf === null) return;
    await leaf.setViewState({ type: viewType, active: true });
    await workspace.revealLeaf(leaf);
  }
  /** 打开某期间的日志/复盘笔记（不存在则按该类型标题区建骨架）。月历的年/月/周入口用。 */
  async openPeriodNote(type, key) {
    const dir = this.config.journals[type].dir.replace(/\/+$/, "");
    const path = `${dir}/${key}.md`;
    const existing = this.app.vault.getAbstractFileByPath(path);
    let file;
    if (existing instanceof import_obsidian12.TFile) {
      file = existing;
    } else {
      const period = periodFromKey(key);
      if (period === null) {
        new import_obsidian12.Notice(`${t("\u5199\u5165\u5931\u8D25")}: ${key}`);
        return;
      }
      const skeleton = skeletonFor(type, period.start, this.config.journals[type].sections);
      file = await ensureNote(this.app, path, skeleton);
    }
    await this.app.workspace.getLeaf(false).openFile(file);
  }
};
