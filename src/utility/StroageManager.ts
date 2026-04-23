import { ChaoticMistressSettings } from "@/models/ChaoticMistressSettings";
import { CoreSettings, DefaultCoreSettings } from "@/models/CoreSettings";
import { GeneralSettings } from "@/models/GeneralSettings";
import { RandomEventsSettings } from "@/models/RandomEventsSettings";
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
        return StorageManager.globalSettings.General;
    }
    static getRandomEventsSettings(): RandomEventsSettings {
        return StorageManager.globalSettings.RandomEventsModule;
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

    static saveSettings() {
        Player.ExtensionSettings.ATB = LZString.compressToBase64(JSON.stringify(Player.ATB));
        ServerPlayerExtensionSettingsSync("ATB");
    }

    static loadSettings() {
        let parsedData = {};
        if (Player.ExtensionSettings != undefined && Player.ExtensionSettings.ATB != undefined) {
            const parsed = LZString.decompressFromBase64(Player.ExtensionSettings.ATB);
            if (parsed) {
                parsedData = JSON.parse(parsed);
            }
        }

        const defaultSettings = this.buildDefaultSettings();
        StorageManager.globalSettings = StorageManager.cleanSavedData(defaultSettings, parsedData);

        Player.ATB = StorageManager.globalSettings;
        StorageManager.saveSettings(); // Save immediately to clean up any old/corrupted data
    }

    static buildDefaultSettings(): CoreSettings {
        return JSON.parse(JSON.stringify(DefaultCoreSettings));
    }

    // Makes parsed json conform to the structure of defaults, removing unknown properties and filling missing ones with default values
    static cleanSavedData<T extends Record<string, any>>(defaults: T, savedData: any): T {
        // If the saved data is not an object (could be null, string, number, etc), we return a clean copy of the defaults
        if (!savedData || typeof savedData !== "object") {
            return JSON.parse(JSON.stringify(defaults));
        }

        const result: any = {};

        for (const key in defaults) {
            if (Object.prototype.hasOwnProperty.call(defaults, key)) {
                const defaultValue = defaults[key];
                const savedValue = savedData[key];

                // If the default value is an object, we need to do a recursive clean
                if (typeof defaultValue === "object" && defaultValue !== null && !Array.isArray(defaultValue)) {
                    result[key] = StorageManager.cleanSavedData(defaultValue, savedValue);
                }
                // Primitive value
                else {
                    // Keep the saved value if it exists AND if its type matches the default
                    if (savedValue !== undefined && typeof savedValue === typeof defaultValue) {
                        result[key] = savedValue;
                    } else {
                        result[key] = defaultValue;
                    }
                }
            }
        }

        return result as T;
    }
}