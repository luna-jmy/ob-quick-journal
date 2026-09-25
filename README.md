# Quick Journal

移动优先的日志快速录入与周期汇总插件：点一个按钮、填一个表单，打卡 / 数据 / 小结直接写进
当天日志的对应位置，全程不进 markdown 编辑模式；周 / 月 / 年汇总视图随时打开即得。

## 依赖

**无需任何其他插件**：解析、统计、界面全部插件内实现。后续版本接入的 Dataview / Tasks /
Templater 均为可选增强（查询块渲染、模板展开），不装也不影响核心功能。

## 安装

### BRAT（测试期推荐）

1. 安装 [BRAT](https://github.com/TfTHacker/obsidian42-brat)；
2. BRAT 设置 → **Add Beta plugin** → 输入 `luna-jmy/ob-quick-journal`；
3. 启用 **Quick Journal**。

### 手动

从 [Releases](https://github.com/luna-jmy/ob-quick-journal/releases) 下载 `main.js`、
`manifest.json`、`styles.css`，放进 `<vault>/.obsidian/plugins/quick-journal/` 后启用。

要求 Obsidian **1.8.7** 或更高版本。

## 用法

- **快速录入**：左侧 ribbon 图标（或命令面板搜「Quick Journal」）→ 选动作 → 填表单 → 提交。
  出厂动作：每日打卡 / 数据记录 / 今日小结 / 本周复盘 / 加一条任务 / 记一条灵感。
  留空的字段不会写入；已有值时插件会先确认再覆盖。
- **目标笔记不存在时自动创建**：按字段注册表生成含空值字段行的骨架笔记（frontmatter 与
  标题结构和现有日志模板同构，不带查询块与按钮）。
- **日志汇总**：命令「打开日志汇总」打开周 / 月 / 年视图：任务完成与新建、打卡率（比例条）、
  数值字段的均值与区间；周视图可一键打开 / 创建本周复盘笔记。
- 目录默认对齐现有体系（`500 Journal/540 Daily` 等），可在设置里改；界面语言跟随 Obsidian
  （中 / 英），也可手动指定。

## 已知限制（原型阶段）

- 汇总的查询块区段（dataview / dataviewjs / tasks）、趋势图表、上期字段链、模板接管编辑器
  尚未实现，按里程碑推进；
- 未在移动端实机验证的项目见 CHANGELOG 的「未验证」标注；
- 周起始日固定周一（与现有模板的 ISO 周口径一致），设置项后续提供。

## 隐私

纯本地：无网络请求、无遥测、无账号、无外部服务；写入只发生在你明确提交的日志 / 复盘笔记内。

## 许可

MIT。改动记录见 [CHANGELOG.md](./CHANGELOG.md)。
