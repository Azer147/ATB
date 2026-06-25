import { ChaoticMistressSettings } from "@/models/ChaoticMistressSettings";
import { allInternalfields, CoreSettings, DefaultCoreSettings } from "@/models/CoreSettings";
import { DeviousShocksSettings } from "@/models/DeviousShocksSettings";
import { GeneralSettings } from "@/models/GeneralSettings";
import { OutfitsSettings } from "@/models/OutfitSettings";
import { RandomEventsSettings } from "@/models/RandomEventsSettings";
import { isCharHaveRemoteAccessOnTarget, RemoteAccessSettings } from "@/models/RemoteAccessSettings";
import { TaskManagerSettings } from "@/models/TaskManagerSettings";
import { TasksSettings } from "@/models/TasksSettings";

export default class StorageManager {
    private static globalSettings: CoreSettings = DefaultCoreSettings;
    static getGlobalEnable(): boolean {
        return StorageManager.globalSettings.Enable;
    }
    static setGlobalEnable(value: boolean) {
        StorageManager.globalSettings.Enable = value;
    }
    static getGeneralSettings(): GeneralSettings {
        return StorageManager.globalSettings.GeneralModule;
    }
    static getRandomEventsSettings(): RandomEventsSettings {
        return StorageManager.globalSettings.RandomEventsModule;
    }
    static getDeviousShocksSettings(): DeviousShocksSettings {
        return StorageManager.globalSettings.DeviousShocksModule;
    }
    static getChaoticMistressSettings(): ChaoticMistressSettings {
        return StorageManager.globalSettings.ChaoticMistressModule;
    }
    static getTaskManagerSettings(): TaskManagerSettings {
        return StorageManager.globalSettings.TaskManagerModule;
    }
    static getTasksSettings(): TasksSettings {
        return StorageManager.globalSettings.TasksSettings;
    }
    static getOutfitSettings(): OutfitsSettings {
        return StorageManager.globalSettings.OutfitsSettings;
    }
    static getRemoteAccessSettings(): RemoteAccessSettings {
        return StorageManager.globalSettings.RemoteAccessSettings;
    }

    static getPublicSettings(): CoreSettings {
        const publicSettings: CoreSettings = {
            Enable: this.getGlobalEnable(),
            GeneralModule: this.getGeneralSettings(),
            RandomEventsModule: this.getRandomEventsSettings(),
            DeviousShocksModule: this.getDeviousShocksSettings(),
            ChaoticMistressModule: this.getChaoticMistressSettings(),
            TaskManagerModule: this.getTaskManagerSettings(),
            TasksSettings: this.getTasksSettings(),
            OutfitsSettings: this.getOutfitSettings(),
            RemoteAccessSettings: this.getRemoteAccessSettings()
        }
        return publicSettings;
    }

    static saveSettings() {
        Player.ExtensionSettings.ATB = LZString.compressToBase64(JSON.stringify(Player.ATB));
        ServerPlayerExtensionSettingsSync("ATB");
    }

    static loadSettings() {
        let parsedData: any = {};
        if (Player.ExtensionSettings != undefined && Player.ExtensionSettings.ATB != undefined) {
            const parsed = LZString.decompressFromBase64(Player.ExtensionSettings.ATB);
            if (parsed) {
                parsedData = JSON.parse(parsed);
            }
        }

        StorageManager.globalSettings = StorageManager.cleanSavedData(parsedData);

        Player.ATB = StorageManager.globalSettings;
        StorageManager.saveSettings(); // Save immediately to clean up any old/corrupted data
    }

    // return a Deep copy of the default settings
    private static buildDefaultSettings(): CoreSettings {
        return JSON.parse(JSON.stringify(DefaultCoreSettings)) as CoreSettings;
    }

    // Makes savedData (parsed json) conform to the structure of defaults, removing unknown properties and filling missing ones with default values
    // Note: This will create a new CoreSettings object, not suitable for existing settings.
    public static cleanSavedData(savedData: any): CoreSettings {
        // buildDefaultSettings make a deep copy of default
        const baseSettings = StorageManager.buildDefaultSettings();
        // using baseSettings as a base object, we apply savedData to it without changing any reference.
        StorageManager.mergeSettings(baseSettings, savedData);

        return baseSettings;
    }

    // Apply settings received, use mergeSettings
    // Also prevent applying internal settings that shouldn't modified from an external source
    public static applyExternalSettingsToPlayer(sender: number, newSettings: CoreSettings) {
        // Ignore all internal fields that shouldn't be changed
        const ignoredKeys = Object.assign([], allInternalfields);

        // Ignore everything sender does not have access based on RemoteAccessSettings
        const remoteAccessSettings = StorageManager.getRemoteAccessSettings();
        if (remoteAccessSettings) {
            if (!isCharHaveRemoteAccessOnTarget(sender, Player, remoteAccessSettings.taskSettingsPermission)) {
                ignoredKeys.push("wearBondageTaskSettings");
                ignoredKeys.push("wearOutfitTaskSettings");
                ignoredKeys.push("nakedTaskSettings");
                ignoredKeys.push("nicknameTaskSettings");
                ignoredKeys.push("poseTaskSettings");
                ignoredKeys.push("roomControlTaskSettings");
                ignoredKeys.push("taskFinishSettings");
            }
            if (!isCharHaveRemoteAccessOnTarget(sender, Player, remoteAccessSettings.punishementSettingsPermission)) {
                ignoredKeys.push("fullBondagePunishmentSettings");
                ignoredKeys.push("harshOutfitPunishmentSettings");
                ignoredKeys.push("dollPunishmentSettings");
                ignoredKeys.push("dronePunishmentSettings");
            }
            if (!isCharHaveRemoteAccessOnTarget(sender, Player, remoteAccessSettings.chaoticMistressSettingsPermission)) {
                ignoredKeys.push("ChaoticMistressModule");
            }
            if (!isCharHaveRemoteAccessOnTarget(sender, Player, remoteAccessSettings.randomEventSettingsPermission)) {
                ignoredKeys.push("RandomEventsModule");
            }
            if (!isCharHaveRemoteAccessOnTarget(sender, Player, remoteAccessSettings.outfitSettingsPermission)) {
                ignoredKeys.push("OutfitsSettings");
            }
            if (!isCharHaveRemoteAccessOnTarget(sender, Player, remoteAccessSettings.remoteAccessSettingsPermission)) {
                ignoredKeys.push("RemoteAccessSettings");
            }

            // TODO
            /*if (!isCharHaveRemoteAccessOnTarget(sender, Player, remoteAccessSettings.harshSettingsPermission)) {
                ignoredKeys.push("");
            }
            if (!isCharHaveRemoteAccessOnTarget(sender, Player, remoteAccessSettings.lockSettingsPermission)) {
                ignoredKeys.push("");
            }
            if (!isCharHaveRemoteAccessOnTarget(sender, Player, remoteAccessSettings.fullLockSettingsPermission)) {
                ignoredKeys.push("");
            }*/
        }

        StorageManager.mergeSettings(StorageManager.globalSettings, newSettings, allInternalfields);
    }

    // Apply newData to target, without changing any reference.
    public static mergeSettings<T extends Record<string, any>>(target: T, newData: any, ignoredKeys: string[] = []): void {
        if (!newData || typeof newData !== "object") {
            return;
        }

        for (const key in target) {
            if (Object.prototype.hasOwnProperty.call(target, key)) {
                const targetValue = target[key];
                const newValue = newData[key];

                // ignore empty property
                if (newValue === null || newValue === undefined) {
                    continue;
                }
                // ignore ignoredKeys
                if (ignoredKeys && ignoredKeys.length > 0 && ignoredKeys.includes(key)) {
                    console.log("ATB: DEBUG: mergeSettings: ignoring key: ", key);
                    continue;
                }

                // If the target property is a nested object, recursively mutate it
                if (typeof targetValue === "object" && targetValue !== null && !Array.isArray(targetValue)) {
                    StorageManager.mergeSettings(targetValue, newValue, ignoredKeys);
                }
                // Primitive value or Array
                else {
                    // Only apply if the saved value exists and matches the expected type
                    if (newValue !== undefined && typeof newValue === typeof targetValue) {
                        target[key] = newValue;
                    }
                }
            }
        }
    }
}