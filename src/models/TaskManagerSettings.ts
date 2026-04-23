import { TaskType, WearBondageType } from "./TasksSettings";

export type TaskCannotStartReason = "unknown" | "not_enabled" | "not_available" | "overwrite_only" | "can_start";

// Data for each task
export interface TaskData {
    id: number;
    type: TaskType;
    progress: number; // generic % progress
    description: string;

    elapsedtimeMs: number; // in millisec
    totalDurationMs: number; // Serve as "endTime", task should finish when elapsedtimeMs reach this. (in millisec)

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