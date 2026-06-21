
/*
********** Types **********
*/

// TODO: "outfit" | "activity" | "say" | "arousal" | "escape"
export type TaskType = "wear_bondage" | "wear_outfit" | "naked" | "nickname" | "pose" | "room_control";
export type PunishementType = "full_bondage" | "harsh_outfit" | "doll" | "drone";

// TODO: "orgasm_given" | "spank_given" | "date_time"
export type FinishType = "duration" | "orgasm" | "orgasm_ruined" | "orgasm_resisted" | "spank";

export type WearBondageType = "hand" | "leg" | "gag" | "chastity" | "toy" | "blindfold" | "shock";
// excluded earwear

// Because some TaskType have several subType that can be active in paralel
// FullTaskType is needed to describe a single startable task
export interface FullTaskType {
    taskType: TaskType;
    taskSubType?: WearBondageType | null;
    // EndConditionType ?
}


// Specifcs types for task "pose"
// Category BodyUpper
export type PoseUpperSelection = 'BaseUpper' | 'BackBoxTie' | 'BackCuffs' | 'BackElbowTouch' | 'OverTheHead' | 'Yoked' | "random" | "free";
// Category BodyLower
export type PoseLowerSelection = 'BaseLower' | 'Kneel' | 'KneelingSpread' | 'LegsClosed' | "random" | "free";

// Specifcs types for task "room_control"
export type RoomControlType = "free" | "public_only" | "private_only"

/*
********** Task/Punish/Finish Settings **********
*/

export interface SingleTaskSettings {
    enable: boolean;
    //type: TaskType;

    randomWeight: number; // Weigthed chance to be picked among other tasks (for Chaotic Mistress)

    baseDurationMs: number; // in millisec
    baseGracePeriodMs: number; // in millisec

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
    enableHand: boolean;
    enableLeg: boolean;
    enableGag: boolean;
    enableChastity: boolean;
    enableToy: boolean;
    enableBlindfold: boolean;
    enableShock: boolean;
}

export interface WearOutfitTaskSettings extends SingleTaskSettings {
    averageRandomExtPerHour: number, // For Random Task
    chanceRemoveOnFinish: number, // For Random Task
    randomCanUseHarshOutfit: boolean // For Random Task
}

export interface PoseTaskSettings extends SingleTaskSettings {
    averageRandomPosePerHour: number, // For Random Task / Default value
}

export interface RoomControlTaskSettings extends SingleTaskSettings {
    //roomNameReq?: string;
    //roomTypeReq?: RoomControlType;
    roomMaxMinutesReq: number; // For Random Task / Default value
}

// Data for the TaskManagerModule
export interface TasksSettings {
    // Tasks
    wearBondageTaskSettings: WearBondageTaskSettings;
    wearOutfitTaskSettings: WearOutfitTaskSettings;
    nakedTaskSettings: SingleTaskSettings;
    nicknameTaskSettings: SingleTaskSettings;
    poseTaskSettings: PoseTaskSettings;
    roomControlTaskSettings: RoomControlTaskSettings;

    // Tasks Finish Condition
    taskFinishSettings: TaskFinishSettings;

    // Punishments
    fullBondagePunishmentSettings: SinglePunishmentSettings;
    harshOutfitPunishmentSettings: SinglePunishmentSettings;
    dollPunishmentSettings: SinglePunishmentSettings;
    dronePunishmentSettings: SinglePunishmentSettings;
}

export const DefaultTasksSettings: TasksSettings = {
    wearBondageTaskSettings: {
        enable: true,
        randomWeight: 10,
        baseDurationMs: 30 * 60 * 1000, // 30 min
        baseGracePeriodMs: 30 * 1000, // 30 sec,
        baseGoodPtsReward: 10,
        baseBadPointsPenalty: 5,
        enableHand: true,
        enableLeg: true,
        enableGag: true,
        enableChastity: true,
        enableToy: true,
        enableBlindfold: false,
        enableShock: true
    },
    wearOutfitTaskSettings: {
        enable: true,
        randomWeight: 20,
        baseDurationMs: 30 * 60 * 1000, // 30 min
        baseGracePeriodMs: 45 * 1000, // 45sec
        baseGoodPtsReward: 10,
        baseBadPointsPenalty: 5,
        averageRandomExtPerHour: 20,
        chanceRemoveOnFinish: 50,
        randomCanUseHarshOutfit: false
    },
    nakedTaskSettings: {
        enable: true,
        randomWeight: 10,
        baseDurationMs: 30 * 60 * 1000, // 30 min
        baseGracePeriodMs: 45 * 1000, // 45sec
        baseGoodPtsReward: 10,
        baseBadPointsPenalty: 5,
    },
    nicknameTaskSettings: {
        enable: true,
        randomWeight: 0, // not available for random tasks
        baseDurationMs: 120 * 60 * 1000, // 120 min
        baseGracePeriodMs: 90 * 1000, // 90sec
        baseGoodPtsReward: 10,
        baseBadPointsPenalty: 20,
    },
    poseTaskSettings: {
        enable: true,
        randomWeight: 5,
        baseDurationMs: 30 * 60 * 1000, // 30 min
        baseGracePeriodMs: 60 * 1000, // 60sec
        baseGoodPtsReward: 20,
        baseBadPointsPenalty: 1,
        averageRandomPosePerHour: 15,
    },
    roomControlTaskSettings: {
        enable: true,
        randomWeight: 0, // not available for random tasks (for now?)
        baseDurationMs: 60 * 60 * 1000, // 60 min
        baseGracePeriodMs: 3 * 60 * 1000, // 3min
        baseGoodPtsReward: 30,
        baseBadPointsPenalty: 1,
        roomMaxMinutesReq: 15, // 15min
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
        baseGracePeriodMs: 15 * 1000, // 15 sec
        baseGoodPtsReward: 20,
        baseBadPointsPenalty: 5,
        baseBadPtsReduction: 20,
    },
    harshOutfitPunishmentSettings: {
        enable: true,
        randomWeight: 10,
        baseDurationMs: 30 * 60 * 1000, // 30 min
        baseGracePeriodMs: 15 * 1000, // 15 sec
        baseGoodPtsReward: 30,
        baseBadPointsPenalty: 5,
        baseBadPtsReduction: 30,
    },
    dollPunishmentSettings: {
        enable: true,
        randomWeight: 5,
        baseDurationMs: 30 * 60 * 1000, // 30 min
        baseGracePeriodMs: 60 * 1000, // 60 sec
        baseGoodPtsReward: 20,
        baseBadPointsPenalty: 3,
        baseBadPtsReduction: 40,
    },
    dronePunishmentSettings: {
        enable: true,
        randomWeight: 5,
        baseDurationMs: 30 * 60 * 1000, // 30 min
        baseGracePeriodMs: 60 * 1000, // 60 sec
        baseGoodPtsReward: 30,
        baseBadPointsPenalty: 1,
        baseBadPtsReduction: 50,
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
    {taskType: "wear_bondage", taskSubType: "blindfold"},
    {taskType: "wear_bondage", taskSubType: "shock"},
    {taskType: "wear_outfit"},
    {taskType: "naked"},
    {taskType: "nickname"},
    {taskType: "pose"},
    {taskType: "room_control"}
];

export const FullPunishementList: PunishementType[] =
[
    "full_bondage",
    "harsh_outfit",
    "doll",
    "drone"
];

export const FullFinishList: FinishType[] =
[ "duration", "orgasm", "orgasm_ruined", "orgasm_resisted", "spank" ];


export function getTaskTypeSetting(setting: TasksSettings, type: TaskType | PunishementType): SingleTaskSettings | undefined {
    switch (type) {
        // Tasks
        case "wear_bondage":
            return setting.wearBondageTaskSettings;
        case "wear_outfit":
            return setting.wearOutfitTaskSettings;
        case "naked":
            return setting.nakedTaskSettings;
        case "nickname":
            return setting.nicknameTaskSettings;
        case "pose":
            return setting.poseTaskSettings;
        case "room_control":
            return setting.roomControlTaskSettings;

        // Punishements
        case "full_bondage":
            return setting.fullBondagePunishmentSettings;
        case "harsh_outfit":
            return setting.harshOutfitPunishmentSettings;
        case "doll":
            return setting.dollPunishmentSettings;
        case "drone":
            return setting.dronePunishmentSettings;
    }
    return undefined;
}

export function getTaskTypeConstant(type: TaskType | PunishementType): TaskConstant | undefined {
    switch (type) {
        // Tasks
        case "wear_bondage":
            return WearBondageTaskConstants;
        case "wear_outfit":
            return WearOutfitTaskConstants;
        case "naked":
            return NakedTaskConstants;
        case "nickname":
            return NicknameTaskConstants;
        case "pose":
            return PoseTaskConstants;
        case "room_control":
            return RoomControlTaskConstants;

        // Punishements
        case "full_bondage":
            return FullBondagePunishementConstants;
        case "harsh_outfit":
            return HarshOutfitPunishementConstants;
        case "doll":
            return DollPunishementConstants;
        case "drone":
            return DronePunishementConstants;
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
    incompatibleTasks: [
        {taskType: "wear_outfit"},
    ],
}
export const WearOutfitTaskConstants: TaskConstant = {
    name: "Wear Outfit",
    incompatibleTasks: [
        {taskType: "wear_bondage", taskSubType: "hand"},
        {taskType: "wear_bondage", taskSubType: "leg"},
        {taskType: "wear_bondage", taskSubType: "gag"},
        {taskType: "wear_bondage", taskSubType: "chastity"},
        {taskType: "wear_bondage", taskSubType: "toy"},
        {taskType: "wear_bondage", taskSubType: "blindfold"},
        {taskType: "wear_bondage", taskSubType: "shock"},
        {taskType: "naked"},
    ],
}
export const NakedTaskConstants: TaskConstant = {
    name: "Naked",
    incompatibleTasks: [
        {taskType: "wear_outfit"},
    ],
}
export const NicknameTaskConstants: TaskConstant = {
    name: "Nickname Control",
}
export const PoseTaskConstants: TaskConstant = {
    name: "Pose Control",
}
export const RoomControlTaskConstants: TaskConstant = {
    name: "Room Control",
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
        {taskType: "wear_bondage", taskSubType: "blindfold"},
        {taskType: "wear_bondage", taskSubType: "shock"},
    ],
    incompatibleTasks: [
        {taskType: "wear_outfit"},
    ],
}
export const HarshOutfitPunishementConstants: TaskConstant = {
    name: "Harsh Outfit",

    mandatoryTasks: [
        {taskType: "wear_outfit"},
    ],
    incompatibleTasks: [
        {taskType: "wear_bondage"},
        {taskType: "naked"},
    ],
}
export const DollPunishementConstants: TaskConstant = {
    name: "Doll Play",

    mandatoryTasks: [
        {taskType: "wear_outfit"},
    ],
    optionalTasks: [
        {taskType: "nickname"},
        {taskType: "room_control"},
    ],
    incompatibleTasks: [
        {taskType: "wear_bondage"},
        {taskType: "naked"},
    ],
}
export const DronePunishementConstants: TaskConstant = {
    name: "Drone Play",

    mandatoryTasks: [
        {taskType: "wear_outfit"},
    ],
    optionalTasks: [
        {taskType: "nickname"},
        {taskType: "pose"},
        {taskType: "room_control"},
    ],
    incompatibleTasks: [
        {taskType: "wear_bondage"},
        {taskType: "naked"},
    ],
}