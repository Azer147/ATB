import { ChaoticMistressSettings, DefaultChaoticMistressSettings } from "./ChaoticMistressSettings";
import { DefaultGeneralSettings, GeneralSettings } from "./GeneralSettings";
import { DefaultRandomEventsSettings, RandomEventsSettings } from "./RandomEventsSettings";
import { SleepControlSettings } from "./SleepControlSettings";
import { DefaultTaskManagerSettings, TaskManagerSettings } from "./TaskManagerSettings";
import { DefaultTasksSettings, TasksSettings } from "./TasksSettings";

export interface CoreSettings {
    Enable: boolean;
    General: GeneralSettings;
    RandomEventsModule: RandomEventsSettings;
    ChaoticMistressModule: ChaoticMistressSettings;
    TaskManagerModule: TaskManagerSettings;
    TasksSettings: TasksSettings;
    //SleepControlModule: SleepControlSettings;
}

export const DefaultCoreSettings: CoreSettings = {
    Enable: true,
    General: DefaultGeneralSettings,
    RandomEventsModule: DefaultRandomEventsSettings,
    ChaoticMistressModule: DefaultChaoticMistressSettings,
    TaskManagerModule: DefaultTaskManagerSettings,
    TasksSettings: DefaultTasksSettings,
    //SleepControlModule: DefaultSleepControlSettings
}