

/*
********** Types **********
*/

// TODO: "outfit" | "activity" | "say" | "arousal" | "escape"
export type TaskType = "wear_bondage";
export type PunishementType = "full_bondage";

// TODO: "orgasm_given" | "spank_given" | "date_time"
export type FinishType = "duration" | "orgasm" | "orgasm_ruined" | "orgasm_resisted" | "spank";

// TODO: "shock" | "blindfold"
export type WearBondageType = "hand" | "leg" | "gag" | "chastity" | "toy";
// excluded blindfold and earwear

// Because some TaskType have several subType that can be active in paralel
// FullTaskType is needed to describe a single startable task
export interface FullTaskType {
    taskType: TaskType;
    taskSubType?: WearBondageType | null;
    // EndConditionType ?
}


/*
********** Task/Punish/Finish Settings **********
*/

export interface SingleTaskSettings {
    enable: boolean;
    //type: TaskType;

    randomWeight: number; // Weigthed chance to be picked among other tasks (for Chaotic Mistress)

    baseDurationMs: number; // in millisec
    baseGoodPtsReward: number;
    baseBadPointsPenalty: number; // Can be either on complete failure or partial failure depending if the task can fail and end.
}

export interface SinglePunishmentSettings extends SingleTaskSettings {
    baseBadPtsReduction: number; // How much bad points is removed when taking this punishements
}

export interface SingleFinishSettings {
    enable: boolean;
    baseCount: number;
    randomWeight: number;
}

export interface TaskFinishSettings {
    //enableDuration: boolean; // Duration cannot be toggled Off
    //baseDuration: number; // I prefer baseDuration to stay per TaskType
    randWeightDuration: number;

    orgasm: SingleFinishSettings;
    orgasmRuined: SingleFinishSettings;
    orgasmResisted: SingleFinishSettings;
    spank: SingleFinishSettings;
}

export interface WearBondageTaskSettings extends SingleTaskSettings {
    baseGracePeriodMs: number; // in millisec

    enableHand: boolean;
    enableLeg: boolean;
    enableGag: boolean;
    enableChastity: boolean;
    enableToy: boolean;
}


// Data for the TaskManagerModule
export interface TasksSettings {
    // Tasks
    wearBondageTaskSettings: WearBondageTaskSettings;

    // Tasks Finish Condition
    taskFinishSettings: TaskFinishSettings;

    // Punishments
    fullBondagePunishmentSettings: SinglePunishmentSettings;
}

export const DefaultTasksSettings: TasksSettings = {
    wearBondageTaskSettings: {
        enable: true,
        randomWeight: 10,
        baseDurationMs: 30 * 60 * 1000, // 30 min
        baseGoodPtsReward: 10,
        baseBadPointsPenalty: 5,
        baseGracePeriodMs: 30 * 1000, // 30 sec,
        enableHand: true,
        enableLeg: true,
        enableGag: true,
        enableChastity: true,
        enableToy: true
    },
    taskFinishSettings: {
        randWeightDuration: 50,
        orgasm: {
            enable: true,
            baseCount: 20,
            randomWeight: 15,
        },
        orgasmRuined: {
            enable: true,
            baseCount: 40,
            randomWeight: 10,
        },
        orgasmResisted: {
            enable: true,
            baseCount: 15,
            randomWeight: 10,
        },
        spank: {
            enable: true,
            baseCount: 20,
            randomWeight: 5,
        },
    },
    fullBondagePunishmentSettings: {
        enable: true,
        randomWeight: 10,
        baseDurationMs: 30 * 60 * 1000, // 30 min
        baseGoodPtsReward: 20,
        baseBadPointsPenalty: 5,
        baseBadPtsReduction: 30,
    }
}


/*
********** Task/Punish List & Helper **********
*/

export const FullTaskList: FullTaskType[] =
[
    {taskType: "wear_bondage", taskSubType: "hand"},
    {taskType: "wear_bondage", taskSubType: "leg"},
    {taskType: "wear_bondage", taskSubType: "gag"},
    {taskType: "wear_bondage", taskSubType: "chastity"},
    {taskType: "wear_bondage", taskSubType: "toy"},
];

export const FullPunishementList: PunishementType[] =
[
    "full_bondage",
];

export const FullFinishList: FinishType[] =
[ "duration", "orgasm", "orgasm_ruined", "orgasm_resisted", "spank" ];


export function getTaskTypeSetting(setting: TasksSettings, type: TaskType | PunishementType): SingleTaskSettings | undefined {
    switch (type) {
        // Tasks
        case "wear_bondage":
            return setting.wearBondageTaskSettings;

        // Punishements
        case "full_bondage":
            return setting.fullBondagePunishmentSettings;
    }
    return undefined;
}

export function getTaskTypeConstant(type: TaskType | PunishementType): TaskConstant | undefined {
    switch (type) {
        // Tasks
        case "wear_bondage":
            return WearBondageTaskConstants;

        // Punishements
        case "full_bondage":
            return FullBondagePunishementConstants;
    }
    return undefined;
}

export function getFinishTypeSetting(setting: TasksSettings, finishType: FinishType, taskType: TaskType | undefined): SingleFinishSettings {
    switch (finishType) {
        case "duration":
            let baseDuration = 30 * 60 * 1000;
            if (taskType) {
                let taskTypeSetting = getTaskTypeSetting(setting, taskType);
                if (taskTypeSetting) {
                    baseDuration = taskTypeSetting.baseDurationMs;
                }
            }
            let durationSetting: SingleFinishSettings = {
                enable: true,
                baseCount: baseDuration,
                randomWeight: setting.taskFinishSettings.randWeightDuration
            }
            return durationSetting;

        case "orgasm":
            return setting.taskFinishSettings.orgasm;
        case "orgasm_ruined":
            return setting.taskFinishSettings.orgasmRuined;
        case "orgasm_resisted":
            return setting.taskFinishSettings.orgasmResisted;
        case "spank":
            return setting.taskFinishSettings.spank;
    }
}


/*
********** Task/Punish Constants **********
*/

// Constants for task/punishements so that everything is in one place

// TODO: still figuring out what to put there
export interface TaskConstant {
    name: string;
    //description: string;

    //minDuration: number;
    //maxDuration: number;

    incompatibleTasks?: FullTaskType[];

    // Task Used by Punishement
    mandatoryTasks?: FullTaskType[];
    optionalTasks?: FullTaskType[];

    // Wear specifics
    //minimumGracePeriod?: number;
    //handItemSlot: [],
}

export const WearBondageTaskConstants: TaskConstant = {
    name: "Wear Bondage/Restraint",
}

export const FullBondagePunishementConstants: TaskConstant = {
    name: "Full Bondage",

    mandatoryTasks: [
        {taskType: "wear_bondage", taskSubType: "hand"},
        {taskType: "wear_bondage", taskSubType: "leg"},
        {taskType: "wear_bondage", taskSubType: "gag"},
    ],
    optionalTasks: [
        {taskType: "wear_bondage", taskSubType: "chastity"},
        {taskType: "wear_bondage", taskSubType: "toy"},
    ],
}
