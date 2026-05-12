import { GeneralSettings } from "@/models/GeneralSettings";
import StorageManager from "./StroageManager";
import { RandomEventsSettings } from "@/models/RandomEventsSettings";
import { ChaoticMistressSettings } from "@/models/ChaoticMistressSettings";
import { TaskData, TaskManagerSettings } from "@/models/TaskManagerSettings";
import { PunishementType, TasksSettings } from "@/models/TasksSettings";
import { TaskManagerModule } from "@/modules/TaskManagerModule";
import { TaskBase } from "@/modules/Task/TaskBase";
import ModuleManager from "./ModuleManager";
import { RemoteModule } from "@/modules/RemoteModule";
import { ChaoticMistressModule } from "@/modules/ChaoticMistressModule";
import { OutfitsSettings } from "@/models/OutfitSettings";

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
export function getCharacterChaoticMistressSettings(C: OtherCharacter | PlayerCharacter): ChaoticMistressSettings | undefined {
    if (C.IsPlayer()) return StorageManager.getChaoticMistressSettings();
    if (C.ATB && C.ATB.ChaoticMistressModule) return C.ATB.ChaoticMistressModule;
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

export function startTaskforCharacter(C: OtherCharacter | PlayerCharacter, taskData: TaskData, overwrite: boolean): boolean {
    if (C.IsPlayer()) {
        const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;
        if (tm) return tm.startTask(taskData, overwrite);
    } else if (C.MemberNumber) {
        RemoteModule.requestStartTask(C.MemberNumber, taskData, overwrite);
        return true;
    }
    return false;
}

export function startPunishementforCharacter(C: OtherCharacter | PlayerCharacter, type: PunishementType, duration: number) {
    if (C.IsPlayer()) {
        //const cm = ModuleManager.getModule("ChaoticMistressModule") as ChaoticMistressModule;
        ChaoticMistressModule.startPunishementByType(type, duration);
    } else if (C.MemberNumber) {
        RemoteModule.requestStartPunishement(C.MemberNumber, type, duration);
    }
}

export function skipTaskforCharacter(C: OtherCharacter | PlayerCharacter, taskId: number) {
    if (C.IsPlayer()) {
        const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;
        if (tm) tm.skipTask(taskId);
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