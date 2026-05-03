import { FinishType, TaskType, WearBondageType } from "./TasksSettings";

export type TaskCannotStartReason = "unknown" | "not_enabled" | "not_available" | "overwrite_only" | "can_start";

// Data for each task
export interface TaskData {
    id: number;
    type: TaskType;
    finishType: FinishType;
    progressPerc: number; // generic % progress
    description: string;

    // For FinishType: "duration"
    //elapsedtimeMs?: number; // in millisec
    //totalDurationMs?: number; // Serve as "endTime", task should finish when elapsedtimeMs reach this. (in millisec)
    // For FinishType: "orgasm" | "orgasm_ruined" | "orgasm_resisted" | "spank"
    // Depending of FinishType this seve as a count or time in ms for "duration"
    finishTotalNeeded: number; // total count needed (or total duration needed)
    finishCurrentCount: number; // current count

    enforce: boolean; // Force the task / unskippable

    goodPtsOnSucces: number;
    badPtsOnFailure: number; // Can be either on complete failure or partial failure depending if the task can fail and end.

    // Optional depending on task type
    // "wear_bondage" task specifcs
    itemToWear?: WearBondageType;
    gracePeriodMs?: number; // in millisec
}

// Data for the TaskManagerModule
export interface TaskManagerSettings {
    activeTasks: TaskData[];
}

export const DefaultTaskManagerSettings: TaskManagerSettings = {
    activeTasks: [],
}

// Internal fields that should not be externally modified
// Needed mainly to prevent remote settings change (apply_settings) to change/apply these (which are likely outdated)
export const TaskManagerInternalfields = ["activeTasks"];