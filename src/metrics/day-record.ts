/**
 * 采集结果的载体类型：一天一条记录（字段值 + 任务行原文）。
 * 放在 metrics 旁边供 vault-index 与 aggregate 共用，本身无逻辑。
 */

export interface DayRecord {
	/** YYYY-MM-DD */
	date: string;
	/** 字段键 → 值（空字符串 = 预建空值行未填） */
	fieldValues: Record<string, string>;
	/** 任务行原文（统计时再解析） */
	taskLines: string[];
}
