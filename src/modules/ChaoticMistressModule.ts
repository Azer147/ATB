import { ModuleBase } from "./ModuleBase";
import { BC_SDK } from "../index";
import StorageManager from "@/utility/StroageManager";
import { ChaoticMistressSettings } from "@/models/ChaoticMistressSettings";
import ModuleManager from "@/utility/ModuleManager";
import { TaskManagerModule } from "./TaskManagerModule";
import { FullPunishementList, FullTaskList, FullTaskType, getTaskTypeConstant, getTaskTypeSetting, PunishementType, SingleTaskSettings, TasksSettings, TaskType } from "@/models/TasksSettings";
import { ChatColor, sendLocalMessage } from "@/utility/utility";
import { TaskCannotStartReason } from "@/models/TaskManagerSettings";

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
            let averageTaskPerHour = this.settings.averageNewTaskPerHour;
            if (averageTaskPerHour) {
                const msPerHour = 60 * 60 * 1000;

                // Example: If TICK_PERIOD_MS is 60000 (1 min) and averageTaskPerHour is 2.
                // (60000 / 3600000) * 2 = 0.0333 (A 3.33% chance every minute)
                const chanceRandomTask = (this.TICK_PERIOD_MS / msPerHour) * averageTaskPerHour;

                // Roll the dice
                if (Math.random() < chanceRandomTask) {
                    console.log("ATB: Random task triggered!");
                    this.triggerRandomTask();
                }
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
        let availTask: FullTaskType[] = this.getAvailableTasks(false);
        if (availTask.length === 0) {
            return;
        }

        // TODO: Special case (chance use punishment instead of task)

        const selectedTask = this.selectRandomTaskByWeight(availTask);

        if (selectedTask) {
            const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;
            let taskSetting = getTaskTypeSetting(this.tasksSettings, selectedTask.taskType);

            if (tm && taskSetting) {
                const duration = this.getRandomDuration(taskSetting.baseDurationMs);
                const failure = taskSetting.baseBadPointsPenalty;
                const reward = ChaoticMistressModule.calculatePointsFromDuration(duration, taskSetting.baseDurationMs, taskSetting.baseGoodPtsReward, false);

                if (selectedTask.taskType === "wear_bondage" && selectedTask.taskSubType) {
                        const gracePeriod = this.tasksSettings.wearBondageTaskSettings.baseGracePeriodMs;
                        console.log(`ATB: triggerRandomTask: Selected ${selectedTask.taskType} wearType: ${selectedTask.taskSubType} duration: ${duration}`);
                        tm.startWearBondageTask(selectedTask.taskSubType, duration, false, reward, failure, gracePeriod);
                }
            }
        }
    }


    getAvailableTasks(allowOverwrite: boolean): FullTaskType[] {
        let availTask: FullTaskType[] = [];
        const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;
        if (!tm) {
            return [];
        }

        for (let i = 0; i < FullTaskList.length; i++) {
            let taskType: FullTaskType = FullTaskList[i];
            let reason: TaskCannotStartReason = tm.isTaskCanStart(taskType);
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
        let availPunish: PunishementType[] = this.getAvailablePunishements();
        if (availPunish.length === 0) {
            return;
        }

        const selectedPunish = this.selectRandomTaskByWeight(availPunish);

        if (selectedPunish && selectedPunish === "full_bondage") {
            //this.triggerRandomWearTask();
            const duration = this.getRandomDuration(this.tasksSettings.fullBondagePunishmentSettings.baseDurationMs);
            this.startFullBondagePunishment(duration);
        }
    }

    getAvailablePunishements(): PunishementType[] {
        let availPunish: PunishementType[] = [];
        const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;
        if (!tm) {
            return [];
        }

        const availTask: FullTaskType[] = this.getAvailableTasks(true);

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


    startFullBondagePunishment(duration: number): boolean {
        const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;
        if (tm) {
            const punishSetting = this.tasksSettings.fullBondagePunishmentSettings;
            const badPtsReduction = ChaoticMistressModule.calculatePointsFromDuration(duration, punishSetting.baseDurationMs, punishSetting.baseBadPtsReduction, true);
            const penalty = punishSetting.baseBadPointsPenalty;
            const reward = punishSetting.baseGoodPtsReward;
            //const grace = this.tasksSettings.wearBondageTaskSettings.baseGracePeriodMs;

            console.log(`ATB: startFullBondagePunishment: Starting with duration: ${duration}`);
            sendLocalMessage("Starting Full Bondage Punishement", ChatColor.Purple);

            tm.startWearBondageTask("hand", duration, true, reward, penalty, 15000, true);
            tm.startWearBondageTask("leg", duration, true, reward, penalty, 15000, true);
            tm.startWearBondageTask("gag", duration, true, reward, penalty, 15000, true);
            tm.startWearBondageTask("chastity", duration, true, reward, penalty, 15000, true);
            tm.startWearBondageTask("toy", duration, true, reward, penalty, 15000, true);

            // TODO: check retrun and return false if needed
            this.modifyBadPts(-badPtsReduction);

            return true;
        }
        return false;
    }


    /*
    ********** Helper Functions **********
    */

    getRandomDuration(baseDuration: number): number {
        // Duration will multiplied be between Min and Max
        const baseRandMultMin = (this.settings.minRandomDuration / 100);
        const baseRandMultMax = (this.settings.maxRandomDuration / 100);

        let randMult = (Math.random() * baseRandMultMax) + baseRandMultMin;
        return (baseDuration * randMult);
    }

    // increase / decrease basePts from the difference between duration and baseDuration
    public static calculatePointsFromDuration(durationMs: number, baseDurationMs: number, basePts: number, enforced: boolean): number {
        if (durationMs == 0) return 0;
        let durDiffPerc = durationMs / baseDurationMs;
        let bonusMult = 1;
        if (enforced) bonusMult = 1.2; // 20% bonus if enforced
        return Math.floor(basePts * durDiffPerc * bonusMult);
    }

    // Work for FullTaskType and PunishementType
    private selectRandomTaskByWeight<T extends FullTaskType | PunishementType>(availList: T[]): T | undefined {
        // build task+weight list
        let totalWeight = 0;
        const weightedTasks = availList.map(task => {
            let weight = 0;
            let mainType;

            if (typeof task === "string") {
                // Can bo only PunishementType
                mainType = task;
            } else {
                // can bo only FullTaskType
                mainType = task.taskType;
            }

            let typeSetting = getTaskTypeSetting(this.tasksSettings, mainType);
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