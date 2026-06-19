import { OutfitId } from "./OutfitSettings";
import { FinishType, PoseLowerSelection, PoseUpperSelection, RoomControlType, TaskType, WearBondageType } from "./TasksSettings";

export type TaskCannotStartReason = "unknown" | "invalid_data" | "not_enabled" | "not_available"
            | "not_available_same_task" | "not_available_incompatible" | "not_available_apply_item"
            | "not_available_outfit" | "not_available_lscg" | "not_available_bcx_rule"
            | "overwrite_only" | "can_start";

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

    // Used with most task for now (maybe change to optional in the future)
    gracePeriodMs: number; // in millisec

    // Optional depending on task type
    // "wear_bondage" task specifcs
    itemToWear?: WearBondageType;

    // "outfit" specifics
    outfitId?: OutfitId;
    removeOnFinish?: boolean;
    averageRandomExtPerHour?: number;

    // "nickname" specifics
    nickname?: string;
    original_nickname?: string; // Original nickname to restore

    // "pose" specifics
    target_pose?: AssetPoseName[];
    selected_upper_pose?: PoseUpperSelection;
    selected_lower_pose?: PoseLowerSelection;
    averageRandomPosePerHour?: number;

    // "room_control" specifics
    roomNameReq?: string;
    roomNameReqSearchDesc?: boolean; // If should Also search in room description for roomNameReq
    roomTypeReq?: RoomControlType;
    roomUseMaxMinutesReq?: boolean;
    roomMaxMinutesReq?: number; // Maximum time in a room (in minutes)
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


// return string to be used in html (can contain html code)
export function getTaskCannotStartReasonToString(reason: TaskCannotStartReason): string {
    switch (reason) {
        case "invalid_data":
            return "The provided data for the task is invalid.";
        case "not_enabled":
            return "The selected task is disabled in settings.";
        case "not_available":
            return "The selected task cannot be started now or not meeting pre-requirements.";
        case "not_available_same_task":
            return "The selected task cannot be started, a similar task is already active.";
        case "not_available_incompatible":
            return "The selected task cannot be started, it is incompatible with another task.";
        case "not_available_apply_item":
            return "The selected task cannot be started, item requiered is not available or blocked by another item.";
        case "not_available_outfit":
            return "The selected task cannot be started, cannot find an applicable outfit (not enabled or blocked)";
        case "not_available_lscg":
            return "The selected task cannot be started, an LSCG Magic/Curse/Effect is active.";
        case "not_available_bcx_rule":
            return "The selected task cannot be started, a BCX rule is preventing it.";
        case "overwrite_only":
            return "The same task type is already active, but it can be overwrited.";
        case "can_start":
            return "The selected task can start."; // Shouldn't be used to display
        default: // "unknown"
            return "An unknown error occurred!";
    }
}