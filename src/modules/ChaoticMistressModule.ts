import { ModuleBase } from "./ModuleBase";
import { BC_SDK } from "../index";
import StorageManager from "@/utility/StroageManager";
import { ChaoticMistressSettings } from "@/models/ChaoticMistressSettings";
import ModuleManager from "@/utility/ModuleManager";
import { TaskManagerModule } from "./TaskManagerModule";
import { FinishType, FullFinishList, FullPunishementList, FullTaskList, FullTaskType, getFinishTypeSetting, getTaskTypeConstant, getTaskTypeSetting, PunishementType, SingleTaskSettings, TasksSettings, TaskType } from "@/models/TasksSettings";
import { ChatColor, CloneAndRandomizeList, sendLocalMessage, shouldTriggerFromAveragePerHour } from "@/utility/utility";
import { TaskCannotStartReason } from "@/models/TaskManagerSettings";
import { allOutfitList, getOutfitSettingsFromId, OutfitId, OutfitTag, RawOutfit } from "@/models/OutfitSettings";
import { isCharacterHaveEchoItem } from "@/utility/CharacterWrapper";

export class ChaoticMistressModule extends ModuleBase {
    TICK_PERIOD_MS: number = 1000 * 60; // 1 min
    lastTick: number = 0;

    settings: ChaoticMistressSettings;
    tasksSettings: TasksSettings;

    constructor() {
        super("ChaoticMistressModule", "Chaotic Mistress", "Manages karma and executes punishments.");
        this.settings = StorageManager.getChaoticMistressSettings();
        this.tasksSettings = StorageManager.getTasksSettings();
        this.load();
    }

    isEnabled(): boolean {
        return StorageManager.getGlobalEnable() /*&& this.settings.enable*/;
    }

    load(): void {
        // Hook for tick
        this.hook.push(BC_SDK.hookFunction('TimerProcess', 0, (args, next) => {
            next(args);

            if (window.CurrentScreen == "ChatRoom") {
                // Restrict tick to 1 per minutes to avoid performance issues
                const currentTime = Date.now();
                if (currentTime - this.lastTick >= this.TICK_PERIOD_MS) {
                    this.processTick();
                    this.lastTick = currentTime;
                }
            }
        }));
    }

    unload(): void {
        super.unload();
    }

    private processTick() {
        // Check if should trigger punishement
        if (this.settings.enablePointsSystem) {
            let isOverPunishThreshold = (this.settings.forcedPunishementThreshold > 0 && this.settings.badPts > this.settings.forcedPunishementThreshold);
            if (isOverPunishThreshold) {
                sendLocalMessage("Your have exceeded Bad Points threshold.", ChatColor.Red);
                this.triggerRandomPunishment();
                return;
            }
        }

        // Check if should trigger Random Task
        if (this.settings.enableRandomTasks) {
            if (shouldTriggerFromAveragePerHour(this.settings.averageNewTaskPerHour, this.TICK_PERIOD_MS)) {
                console.log("ATB: Random task triggered!");
                this.triggerRandomTask();
            }
        }
    }


    // To add/remove pts
    public modifyGoodPts(amount: number): void {
        this.settings.goodPts += amount;

        if (this.settings.goodPts < 0) this.settings.goodPts = 0;

        console.log(`ATB: Mistress Good Points changed: ${this.settings.goodPts}`);
        StorageManager.saveSettings();
    }

    // To add/remove pts
    public modifyBadPts(amount: number): void {
        this.settings.badPts += amount;

        if (this.settings.badPts < 0) this.settings.badPts = 0;

        console.log(`ATB: Mistress Bad Points changed: ${this.settings.badPts}`);
        StorageManager.saveSettings();
    }


    /*
    ********** Tasks related Functions **********
    */

    triggerRandomTask(): void {
        let availTask: FullTaskType[] = ChaoticMistressModule.getAvailableTasks(Player, false);
        console.warn("ATB: triggerRandomTask: availTask: ", availTask);
        if (availTask.length === 0) {
            return;
        }

        // TODO: Special case (chance use punishment instead of task)

        const selectedTask = this.selectRandomByWeight("task", availTask);
        if (selectedTask) {
            const selectedFinish = this.selectRandomByWeight("finish", FullFinishList, selectedTask.taskType);
            // TODO: getAvailable finish (after task/outfit)

            const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;
            let taskSetting = getTaskTypeSetting(this.tasksSettings, selectedTask.taskType);

            if (tm && selectedFinish && taskSetting) {
                const finishSetting = getFinishTypeSetting(this.tasksSettings, selectedFinish, selectedTask.taskType);

                const baseFinishNeeded = finishSetting.baseCount;
                const randFinishNeeded = this.getRandomFinishCountOrDuration(baseFinishNeeded);
                const failure = taskSetting.baseBadPointsPenalty;
                const reward = ChaoticMistressModule.calculatePointsFromFinishCount(randFinishNeeded, baseFinishNeeded, taskSetting.baseGoodPtsReward, false);

                if (selectedTask.taskType === "wear_bondage" && selectedTask.taskSubType) {
                    const gracePeriod = this.tasksSettings.wearBondageTaskSettings.baseGracePeriodMs;
                    console.log(`ATB: triggerRandomTask: Selected ${selectedTask.taskType} wearType: ${selectedTask.taskSubType} finish type: ${selectedFinish} count: ${randFinishNeeded}`);
                    tm.startWearBondageTask(selectedTask.taskSubType, selectedFinish, randFinishNeeded, false, reward, failure, gracePeriod);
                }
                if (selectedTask.taskType === "wear_outfit") {
                    this.startRandomWearOutfitTask(selectedFinish, randFinishNeeded, reward, failure);
                }
            }
        }
    }

    // Additional part of triggerRandomTask (to reduce triggerRandomTask() size)
    private startRandomWearOutfitTask(selectedFinish, randFinishNeeded, reward, failure) {
        const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;
        const gracePeriod = this.tasksSettings.wearOutfitTaskSettings.baseGracePeriodMs;
        const avgRandomExt = this.tasksSettings.wearOutfitTaskSettings.averageRandomExtPerHour;

        // Select Random Outfit
        let excludeTags: OutfitTag[] = [];
        if (this.tasksSettings.wearOutfitTaskSettings.randomCanUseHarshOutfit == false) {
            excludeTags.push("harsh");
        }

        const selectedOutfit = this.selectRandomOutfit([], excludeTags); // exclude harsh outfit
        if (!selectedOutfit) {
            return;
        }

        // Calc Random removeOnFinish
        let removeOnFinish = true;
        if (Math.floor(Math.random() * 100) > this.tasksSettings.wearOutfitTaskSettings.chanceRemoveOnFinish) {
            removeOnFinish = false;
        }

        console.log(`ATB: triggerRandomTask: Selected wear_outfit outfitId: ${selectedOutfit} finish type: ${selectedFinish} count: ${randFinishNeeded}`);
        tm.startWearOutfitTask(selectedOutfit, selectedFinish, randFinishNeeded, false, reward, failure, gracePeriod, removeOnFinish, avgRandomExt);
    }

    selectRandomOutfit(includeTags: OutfitTag[] = [], excludeTags: OutfitTag[] = []): OutfitId | undefined {
        // build weighted list
        let totalWeight = 0;
        const weightedList = allOutfitList.map(outfit => {
            let weight = 0;

            let outfitSetting = getOutfitSettingsFromId(Player.ATB.OutfitsSettings, outfit.id);
            if (this.isOutfitAvailable(outfit, includeTags, excludeTags) && outfitSetting.enableForRandomTask) {
                weight = outfitSetting.randomWeight
            }

            if (weight < 0) weight = 0;
            totalWeight += weight;
            return { outfit, weight };
        });
        if (totalWeight === 0) {
            return undefined;
        }

        let randomRoll = Math.random() * totalWeight;

        // Select task based on weight
        let selected: OutfitId | undefined = undefined;
        for (let item of weightedList) {
            randomRoll -= item.weight;
            if (randomRoll <= 0) {
                selected = item.outfit.id;
                break;
            }
        }
        return selected;
    }

    isOutfitAvailable(outfit: RawOutfit, includeTags: OutfitTag[] = [], excludeTags: OutfitTag[] = []): boolean {
        let includeCond: boolean = false;
        let excludeCond: boolean = false;

        let outfitSetting = getOutfitSettingsFromId(Player.ATB.OutfitsSettings, outfit.id);
        if (!outfitSetting.enable) {
            return false;
        }

        // Ignore outfit using echo addon if player don't have it
        if (outfit.tags.includes("use_echo") && isCharacterHaveEchoItem(Player) == false) {
            return false;
        }

        if (includeTags.length > 0) {
            includeCond = outfit.tags.some((tag) => { return includeTags.includes(tag); });
        } else {
            includeCond = true;
        }

        if (excludeTags.length > 0) {
            excludeCond = (outfit.tags.some((tag) => { return excludeTags.includes(tag); }) == false);
        } else {
            excludeCond = true;
        }

        return (includeCond && excludeCond);
    }


    // Reminder: static should not use StoarageManager, getModule to be compatible with OtherCharacter
    public static getAvailableTasks(C: OtherCharacter | PlayerCharacter, allowOverwrite: boolean): FullTaskType[] {
        let availTask: FullTaskType[] = [];

        for (let i = 0; i < FullTaskList.length; i++) {
            let taskType: FullTaskType = FullTaskList[i];
            let reason: TaskCannotStartReason = TaskManagerModule.isTaskCanStart(C, taskType);
            if (reason == "can_start" || (allowOverwrite && reason == "overwrite_only")) {
                availTask.push(taskType);
            }
        }
        return availTask;
    }


    /*
    ********** Punishements related Functions **********
    */

    triggerRandomPunishment(): void {
        let availPunish: PunishementType[] = ChaoticMistressModule.getAvailablePunishements(Player);
        if (availPunish.length === 0) {
            return;
        }

        const selectedPunish = this.selectRandomByWeight("punish", availPunish);

        if (selectedPunish) {
            const duration = this.getRandomFinishCountOrDuration(this.tasksSettings.fullBondagePunishmentSettings.baseDurationMs);
            ChaoticMistressModule.startPunishementByType(selectedPunish, duration);
        }
    }

    public static getAvailablePunishements(C: OtherCharacter | PlayerCharacter = Player): PunishementType[] {
        let availPunish: PunishementType[] = [];

        const availTask: FullTaskType[] = this.getAvailableTasks(C, true);

        for (let i = 0; i < FullPunishementList.length; i++) {
            const punish: PunishementType = FullPunishementList[i];
            const punishConst = getTaskTypeConstant(punish);

            if (punishConst && punishConst.mandatoryTasks) {
                let mandatoryTasks: FullTaskType[] = punishConst?.mandatoryTasks;

                // Check if every mandatoryTasks is part of availTask
                const isAvailable = mandatoryTasks.every(mandatory => {
                    return availTask.some(available => 
                        available.taskType === mandatory.taskType && 
                        available.taskSubType === mandatory.taskSubType
                    );
                });

                // If the check passes (or if mandatoryTasks is empty), add it to the available list
                if (isAvailable) {
                    availPunish.push(punish);
                }
            }
        }

        return availPunish;
    }

    public static startPunishementByType(type: PunishementType, duration: number): boolean {
        const cm = ModuleManager.getModule("ChaoticMistressModule") as ChaoticMistressModule;
        if (cm) {
            if (type === "full_bondage") {
                return cm.startFullBondagePunishment(duration);
            }
            if (type === "harsh_outfit") {
                return cm.startHarshOutfitPunishment(duration);
            }
        }
        return false;
    }

    startFullBondagePunishment(duration: number): boolean {
        const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;
        if (tm) {
            const punishSetting = this.tasksSettings.fullBondagePunishmentSettings;
            const badPtsReduction = ChaoticMistressModule.calculatePointsFromFinishCount(duration, punishSetting.baseDurationMs, punishSetting.baseBadPtsReduction, true);
            const penalty = punishSetting.baseBadPointsPenalty;
            const reward = punishSetting.baseGoodPtsReward;
            //const grace = this.tasksSettings.wearBondageTaskSettings.baseGracePeriodMs;
            const grace = 15000;

            console.log(`ATB: startFullBondagePunishment: Starting with duration: ${duration}`);
            sendLocalMessage("Starting Full Bondage Punishement", ChatColor.Purple);

            tm.startWearBondageTask("hand", "duration", duration, true, reward, penalty, grace, true);
            tm.startWearBondageTask("leg", "duration", duration, true, reward, penalty, grace, true);
            tm.startWearBondageTask("gag", "duration", duration, true, reward, penalty, grace, true);
            tm.startWearBondageTask("chastity", "duration", duration, true, reward, penalty, grace, true);
            tm.startWearBondageTask("toy", "duration", duration, true, reward, penalty, grace, true);

            // TODO: check retrun and return false if needed
            this.modifyBadPts(-badPtsReduction);

            return true;
        }
        return false;
    }

    startHarshOutfitPunishment(duration: number): boolean {
        const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;
        if (tm) {
            const punishSetting = this.tasksSettings.harshOutfitPunishmentSettings;
            const badPtsReduction = ChaoticMistressModule.calculatePointsFromFinishCount(duration, punishSetting.baseDurationMs, punishSetting.baseBadPtsReduction, true);
            const penalty = punishSetting.baseBadPointsPenalty;
            const reward = punishSetting.baseGoodPtsReward;
            //const grace = this.tasksSettings.wearBondageTaskSettings.baseGracePeriodMs;
            const grace = 15000;
            const avgRandomExt = this.tasksSettings.wearOutfitTaskSettings.averageRandomExtPerHour;

            const selectedOutfit = this.selectRandomOutfit(["harsh"], []); // only harsh outfit
            if (!selectedOutfit) {
                return false;
            }

            console.log(`ATB: startHarshOutfitPunishment: Starting with duration: ${duration} and outfit: ${selectedOutfit}`);
            sendLocalMessage("Starting Harsh Outfit Punishement", ChatColor.Purple);

            tm.startWearOutfitTask(selectedOutfit, "duration", duration, true, reward, penalty, grace, true, avgRandomExt, true);

            // TODO: check retrun and return false if needed
            this.modifyBadPts(-badPtsReduction);

            return true;
        }
        return false;
    }


    /*
    ********** Helper Functions **********
    */

    getRandomFinishCountOrDuration(baseCount: number): number {
        // Duration will multiplied be between Min and Max
        const baseRandMultMin = (this.settings.minRandomFinishNeeded / 100);
        const baseRandMultMax = (this.settings.maxRandomFinishNeeded / 100);

        let randMult = (Math.random() * baseRandMultMax) + baseRandMultMin;
        return Math.floor(baseCount * randMult);
    }

    // increase / decrease basePts from the difference between duration and baseDuration
    public static calculatePointsFromFinishCount(selectedFinishCount: number, baseFinishCount: number, basePts: number, enforced: boolean): number {
        if (selectedFinishCount == 0) return 0;
        let durDiffPerc = selectedFinishCount / baseFinishCount;
        let bonusMult = 1;
        if (enforced) bonusMult = 1.2; // 20% bonus if enforced
        return Math.floor(basePts * durDiffPerc * bonusMult);
    }

    // Work for FullTaskType, PunishementType and FinishType
    private selectRandomByWeight<T extends FullTaskType | PunishementType | FinishType>(type: "task" | "punish" | "finish", availList: T[], taskType: TaskType | undefined = undefined): T | undefined {
        // build task+weight list
        let totalWeight = 0;
        const weightedTasks = availList.map(task => {
            let weight = 0;
            let mainType;

            // FullTaskType is object, others are string
            if (type == "task" && typeof task != "string") {
                mainType = task.taskType;
            } else {
                mainType = task;
            }

            let typeSetting;
            if (type == "finish") {
                typeSetting = getFinishTypeSetting(this.tasksSettings, mainType, taskType);
            } else {
                typeSetting = getTaskTypeSetting(this.tasksSettings, mainType);
            }
            if (typeSetting) {
                weight = typeSetting.randomWeight;
            }

            if (weight < 0) weight = 0;
            totalWeight += weight;
            return { task, weight };
        });
        if (totalWeight === 0) {
            return;
        }

        let randomRoll = Math.random() * totalWeight;

        // Select task based on weight
        let selectedTask: T | undefined = undefined;
        for (let item of weightedTasks) {
            randomRoll -= item.weight;
            if (randomRoll <= 0) {
                selectedTask = item.task;
                break;
            }
        }
        return selectedTask;
    }

}