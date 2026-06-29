import { GeneralSettings } from "@/models/GeneralSettings";
import StorageManager from "./StorageManager";
import { RandomEventsSettings } from "@/models/RandomEventsSettings";
import { PenaltySettings } from "@/models/PenaltySettings";
import { TaskData, TaskManagerSettings } from "@/models/TaskManagerSettings";
import { PunishementType, TasksSettings } from "@/models/TasksSettings";
import { TaskManagerModule } from "@/modules/TaskManagerModule";
import { TaskBase } from "@/modules/Task/TaskBase";
import ModuleManager from "./ModuleManager";
import { RemoteModule } from "@/modules/RemoteModule";
import { PunishementManagerModule } from "@/modules/PunishementManagerModule";
import { OutfitsSettings } from "@/models/OutfitSettings";
import { DeviousShocksSettings } from "@/models/DeviousShocksSettings";
import { RemoteAccessSettings } from "@/models/RemoteAccessSettings";
import { RandomTaskSettings } from "@/models/RandomTaskSettings";

/**
 * Wrappers to handle most Character access between PlayerCharacter and OhterCharacter
 * This is mainly needed for Gui*Views that should work for both PlayerCharacter and OtherCharacter
 */

/**
 * Settings Wrapper
 */
export function getCharacterGeneralSettings(C: OtherCharacter | PlayerCharacter): GeneralSettings | undefined {
    if (C.IsPlayer()) return StorageManager.getGeneralSettings();
    if (C.ATB && C.ATB.GeneralModule) return C.ATB.GeneralModule;
    return undefined;
}
export function getCharacterRandomEventsSettings(C: OtherCharacter | PlayerCharacter): RandomEventsSettings | undefined {
    if (C.IsPlayer()) return StorageManager.getRandomEventsSettings();
    if (C.ATB && C.ATB.RandomEventsModule) return C.ATB.RandomEventsModule;
    return undefined;
}
export function getCharacterDeviousShocksSettings(C: OtherCharacter | PlayerCharacter): DeviousShocksSettings | undefined {
    if (C.IsPlayer()) return StorageManager.getDeviousShocksSettings();
    if (C.ATB && C.ATB.DeviousShocksModule) return C.ATB.DeviousShocksModule;
    return undefined;
}
export function getCharacterPenaltySettings(C: OtherCharacter | PlayerCharacter): PenaltySettings | undefined {
    if (C.IsPlayer()) return StorageManager.getPenaltySettings();
    if (C.ATB && C.ATB.PenaltySettings) return C.ATB.PenaltySettings;
    return undefined;
}
export function getCharacterRandomTaskSettings(C: OtherCharacter | PlayerCharacter): RandomTaskSettings | undefined {
    if (C.IsPlayer()) return StorageManager.getRandomTaskSettings();
    if (C.ATB && C.ATB.RandomTaskModule) return C.ATB.RandomTaskModule;
    return undefined;
}
export function getCharacterTaskManagerSettings(C: OtherCharacter | PlayerCharacter): TaskManagerSettings | undefined {
    if (C.IsPlayer()) return StorageManager.getTaskManagerSettings();
    if (C.ATB && C.ATB.TaskManagerModule) return C.ATB.TaskManagerModule;
    return undefined;
}
export function getCharacterTasksSettings(C: OtherCharacter | PlayerCharacter): TasksSettings | undefined {
    if (C.IsPlayer()) return StorageManager.getTasksSettings();
    if (C.ATB && C.ATB.TasksSettings) return C.ATB.TasksSettings;
    return undefined;
}
export function getCharacterOutfitSettings(C: OtherCharacter | PlayerCharacter): OutfitsSettings | undefined {
    if (C.IsPlayer()) return StorageManager.getOutfitSettings();
    if (C.ATB && C.ATB.OutfitsSettings) return C.ATB.OutfitsSettings;
    return undefined;
}
export function getCharacterRemoteAccessSettings(C: OtherCharacter | PlayerCharacter): RemoteAccessSettings | undefined {
    if (C.IsPlayer()) return StorageManager.getRemoteAccessSettings();
    if (C.ATB && C.ATB.RemoteAccessSettings) return C.ATB.RemoteAccessSettings;
    return undefined;
}
export function saveSettings(C: OtherCharacter | PlayerCharacter) {
    if (C.IsPlayer()) {
        StorageManager.saveSettings();
    }
    else if (C.ATB && C.MemberNumber) {
        RemoteModule.requestApplyOtherCharacterSettings(C.MemberNumber, C.ATB);
    }
}

export function isCharacterHaveEchoItem(C: any): boolean {
    if (C && C.ECHO_INFO2 && C.ECHO_INFO2.服装拓展) {
        return true;
    }
    return false;
}

/**
 * Operatrions Wrapper
 */

export function startTaskforCharacter(C: OtherCharacter | PlayerCharacter, taskData: TaskData, overwrite: boolean, initiatorName?: string): boolean {
    if (C.IsPlayer()) {
        const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;
        if (tm) return tm.startTask(taskData, overwrite, initiatorName);
    } else if (C.MemberNumber) {
        RemoteModule.requestStartTask(C.MemberNumber, taskData, overwrite);
        return true;
    }
    return false;
}

export function editTaskforCharacter(C: OtherCharacter | PlayerCharacter, taskData: TaskData, initiatorName?: string): boolean {
    if (C.IsPlayer()) {
        const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;
        if (tm) return tm.editTask(taskData, initiatorName);
    } else if (C.MemberNumber) {
        RemoteModule.requestEditTask(C.MemberNumber, taskData);
        return true;
    }
    return false;
}

export function startPunishementforCharacter(C: OtherCharacter | PlayerCharacter, type: PunishementType, duration: number, initiatorName?: string) {
    if (C.IsPlayer()) {
        PunishementManagerModule.startPunishementByType(type, duration, initiatorName);
    } else if (C.MemberNumber) {
        RemoteModule.requestStartPunishement(C.MemberNumber, type, duration);
    }
}

export function skipTaskforCharacter(C: OtherCharacter | PlayerCharacter, taskId: number, noCost: boolean, initiatorName?: string) {
    if (C.IsPlayer()) {
        const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;
        if (tm) tm.skipTask(taskId, noCost, initiatorName);
    } else if (C.MemberNumber) {
        RemoteModule.requestSkipTask(C.MemberNumber, taskId);
    }
}

// Only work for Player
export function getCharacterActiveTaskById(C: OtherCharacter | PlayerCharacter, taskId: number): TaskBase | undefined {
    if (C.IsPlayer()) {
        const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;
        if (tm) return tm.getActiveTaskById(taskId);
    }
    return undefined;
}