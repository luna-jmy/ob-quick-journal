/**
 * 捕获编排：标题区 → 定位当天日志 →（不存在则建骨架）→ 纯函数出计划 → 原子落盘。
 * 界面只管收表单值；覆盖确认由调用方二次调用（overwrite: true）完成。
 */

import { TFile, type App } from "obsidian";
import type { JournalSection, QJConfig } from "../types";
import { planAppend, planFieldFill, type WritePlan } from "../capture/plan";
import { targetNotePath } from "../capture/variables";
import { dailySkeleton } from "../capture/skeleton";
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

	dailyPath(now: Date): string {
		return targetNotePath(this.getConfig().dailyDir, "{{date}}", now);
	}

	async performSection(
		section: JournalSection,
		payload: { values: Record<string, string>; lineValue?: string },
		opts: { overwrite: boolean; now?: Date },
	): Promise<CaptureResult> {
		const now = opts.now ?? new Date();
		const path = this.dailyPath(now);

		let text: string;
		let created = false;
		try {
			text = await readNoteText(this.app, path);
		} catch {
			const skeleton = dailySkeleton(now, this.getConfig().sections);
			const file: TFile = await ensureNote(this.app, path, skeleton);
			created = true;
			text = await this.app.vault.cachedRead(file);
		}

		let plan: WritePlan;
		if (section.type === "list") {
			const template = section.lineTemplate ?? "- {{value}}";
			const line = template.replaceAll("{{value}}", payload.lineValue ?? "");
			if (payload.lineValue === undefined || payload.lineValue.trim() === "" || line.includes("{{")) {
				return { ok: false, reason: "error", message: "empty value" };
			}
			plan = planAppend(text.split(/\r?\n/), {
				heading: section.heading,
				headingMissingCreates: true,
				line,
			});
		} else {
			const fillValues = section.fields
				.filter((f) => payload.values[f.key] !== undefined && payload.values[f.key] !== "")
				.map((f) => ({ key: f.key, value: payload.values[f.key] }));
			if (fillValues.length === 0) {
				return { ok: false, reason: "error", message: "no values to write" };
			}
			plan = planFieldFill(text.split(/\r?\n/), {
				heading: section.heading,
				headingMissingCreates: true,
				values: fillValues,
			});
		}

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
}
