import { ChaoticMistressInternalfields, ChaoticMistressSettings, DefaultChaoticMistressSettings } from "./ChaoticMistressSettings";
import { DefaultDeviousShocksSettings, DeviousShocksSettings } from "./DeviousShocksSettings";
import { DefaultGeneralSettings, GeneralInternalfields, GeneralSettings } from "./GeneralSettings";
import { DefaultOutfitSettings, OutfitsSettings } from "./OutfitSettings";
import { DefaultRandomEventsSettings, RandomEventsSettings } from "./RandomEventsSettings";
import { DefaultRemoteAccessSettings, RemoteAccessSettings } from "./RemoteAccessSettings";
import { SleepControlSettings } from "./SleepControlSettings";
import { DefaultTaskManagerSettings, TaskManagerInternalfields, TaskManagerSettings } from "./TaskManagerSettings";
import { DefaultTasksSettings, TasksSettings } from "./TasksSettings";

export interface CoreSettings {
    Enable: boolean;
    GeneralModule: GeneralSettings;
    RandomEventsModule: RandomEventsSettings;
    DeviousShocksModule: DeviousShocksSettings;
    ChaoticMistressModule: ChaoticMistressSettings;
    TaskManagerModule: TaskManagerSettings;
    TasksSettings: TasksSettings;
    OutfitsSettings: OutfitsSettings;
    RemoteAccessSettings: RemoteAccessSettings;
    //SleepControlModule: SleepControlSettings;
}

export const DefaultCoreSettings: CoreSettings = {
    Enable: true,
    GeneralModule: DefaultGeneralSettings,
    RandomEventsModule: DefaultRandomEventsSettings,
    DeviousShocksModule: DefaultDeviousShocksSettings,
    ChaoticMistressModule: DefaultChaoticMistressSettings,
    TaskManagerModule: DefaultTaskManagerSettings,
    TasksSettings: DefaultTasksSettings,
    OutfitsSettings: DefaultOutfitSettings,
    RemoteAccessSettings: DefaultRemoteAccessSettings,
    //SleepControlModule: DefaultSleepControlSettings
}

// Internal fields that should not be externally modified
// Needed mainly to prevent remote settings change (apply_settings) to change/apply these (which are likely outdated)
export const allInternalfields = GeneralInternalfields.concat(ChaoticMistressInternalfields, TaskManagerInternalfields);
