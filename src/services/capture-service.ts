/**
 * 捕获编排：解析动作 → 定位目标笔记 →（不存在则建骨架）→ 纯函数出计划 → 原子落盘。
 * 界面只管收表单值；覆盖确认由调用方二次调用（overwrite: true）完成。
 */

import type { App } from "obsidian";
import {
	type CaptureActionDef,
	type FieldRegistry,
	type QJConfig,
	findSection,
} from "../types";
import { planAppend, planFieldFill, type WritePlan } from "../capture/plan";
import { targetNotePath } from "../capture/variables";
import { dailySkeleton, weeklySkeleton } from "../capture/skeleton";
import { applyPlanToFile, ensureNote, readNoteText } from "./file-writer";

export type CaptureResult =
	| { ok: true; path: string; created: boolean; writtenLines: number }
	| { ok: false; reason: "overwrite"; keys: string[]; path: string }
	| { ok: false; reason: "error"; message: string };

export class CaptureService {
	constructor(
		private app: App,
		private getConfig: () => QJConfig,
	) {}

	targetPath(action: CaptureActionDef, now: Date): string {
		const config = this.getConfig();
		if (action.period === "week") {
			return targetNotePath(config.weeklyDir, "{{week}}", now);
		}
		return targetNotePath(config.dailyDir, "{{date}}", now);
	}

	weeklyPath(now: Date): string {
		return targetNotePath(this.getConfig().weeklyDir, "{{week}}", now);
	}

	async perform(
		action: CaptureActionDef,
		values: Record<string, string>,
		opts: { overwrite: boolean; now?: Date },
	): Promise<CaptureResult> {
		const config = this.getConfig();
		const now = opts.now ?? new Date();
		const path = this.targetPath(action, now);

		let plan: WritePlan;
		if (action.kind === "fill") {
			const scope: keyof FieldRegistry = action.period === "week" ? "weekly" : "daily";
			const section = findSection(config.registry, scope, action.sectionId ?? "");
			if (!section) {
				return { ok: false, reason: "error", message: `unknown section: ${action.sectionId}` };
			}
			const fillValues = section.fields
				.filter((f) => values[f.key] !== undefined && values[f.key] !== "")
				.map((f) => ({ key: f.key, value: values[f.key] }));
			if (fillValues.length === 0) {
				return { ok: false, reason: "error", message: "no values to write" };
			}
			let text: string;
			let created = false;
			try {
				text = await readNoteText(this.app, path);
			} catch {
				const skeleton =
					action.period === "week" ? weeklySkeleton(now, config.registry) : dailySkeleton(now, config.registry);
				await ensureNote(this.app, path, skeleton);
				created = true;
				text = skeleton;
			}
			plan = planFieldFill(text.split(/\r?\n/), {
				heading: section.heading,
				headingMissingCreates: true,
				values: fillValues,
			});
			if (plan.status === "error") {
				return { ok: false, reason: "error", message: `${plan.reason}: ${plan.heading}` };
			}
			const overwrites = plan.edits.filter((e) => e.previousValue !== "").map((e) => e.key);
			if (overwrites.length > 0 && !opts.overwrite) {
				return { ok: false, reason: "overwrite", keys: overwrites, path };
			}
			await applyPlanToFile(this.app, path, plan);
			return {
				ok: true,
				path,
				created,
				writtenLines: plan.edits.length + plan.creates.length,
			};
		}

		// append
		const line = (action.lineTemplate ?? "- {{value}}").replaceAll("{{value}}", values.value ?? "");
		if (line.trim() === "-" || line.includes("{{")) {
			return { ok: false, reason: "error", message: "empty value" };
		}
		let text: string;
		let created = false;
		try {
			text = await readNoteText(this.app, path);
		} catch {
			const skeleton = dailySkeleton(now, config.registry);
			await ensureNote(this.app, path, skeleton);
			created = true;
			text = skeleton;
		}
		plan = planAppend(text.split(/\r?\n/), {
			heading: action.heading ?? "",
			headingMissingCreates: true,
			line,
		});
		if (plan.status === "error") {
			return { ok: false, reason: "error", message: `${plan.reason}: ${plan.heading}` };
		}
		await applyPlanToFile(this.app, path, plan);
		return { ok: true, path, created, writtenLines: 1 };
	}
}
