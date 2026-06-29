import { ModuleBase } from "./ModuleBase";
import { BC_SDK } from "../index";
import StorageManager from "@/utility/StorageManager";
import ModuleManager from "@/utility/ModuleManager";
import { TaskManagerModule } from "./TaskManagerModule";
import { FullFinishList, FullTaskType, getFinishTypeSetting, getTaskTypeSetting, TasksSettings } from "@/models/TasksSettings";
import { calculatePointsFromFinishCount, selectRandomByWeight, selectRandomOutfit, shouldTriggerFromAveragePerHour } from "@/utility/utility";
import { OutfitTag } from "@/models/OutfitSettings";
import { RandomTaskSettings } from "@/models/RandomTaskSettings";

export class RandomTaskModule extends ModuleBase {
    TICK_PERIOD_MS: number = 1000 * 60; // 1 min
    lastTick: number = 0;

    settings: RandomTaskSettings;
    tasksSettings: TasksSettings;
    isOverPunishThresholdWarningDone: boolean = false;

    constructor() {
        super("RandomTaskModule", "Random Task", "Trigger and select random tasks.");
        this.settings = StorageManager.getRandomTaskSettings();
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
        // Check if should trigger Random Task
        if (this.settings.enableRandomTasks) {
            if (shouldTriggerFromAveragePerHour(this.settings.averageNewTaskPerHour, this.TICK_PERIOD_MS)) {
                console.log("ATB: Random task triggered!");
                this.triggerRandomTask();
            }
        }
    }


    /*
    ********** Tasks related Functions **********
    */

    triggerRandomTask(): void {
        let availTask: FullTaskType[] = TaskManagerModule.getAvailableTasks(Player, false);
        console.warn("ATB: triggerRandomTask: availTask: ", availTask);
        if (availTask.length === 0) {
            return;
        }

        // TODO: Special case (chance use punishment instead of task)

        const selectedTask = selectRandomByWeight(this.tasksSettings, "task", availTask);
        if (selectedTask) {
            const selectedFinish = selectRandomByWeight(this.tasksSettings, "finish", FullFinishList, selectedTask.taskType);
            // TODO: getAvailable finish (after task/outfit)

            const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;
            let taskSetting = getTaskTypeSetting(this.tasksSettings, selectedTask.taskType);

            if (tm && selectedFinish && taskSetting) {
                const finishSetting = getFinishTypeSetting(this.tasksSettings, selectedFinish, selectedTask.taskType);

                const baseFinishNeeded = finishSetting.baseCount;
                const randFinishNeeded = this.getRandomFinishCountOrDuration(baseFinishNeeded);
                const failure = taskSetting.basePenalty;
                const reward = calculatePointsFromFinishCount(randFinishNeeded, baseFinishNeeded, taskSetting.baseReward, false);
                const gracePeriod = taskSetting.baseGracePeriodMs;

                if (selectedTask.taskType === "wear_bondage" && selectedTask.taskSubType) {
                    console.log(`ATB: triggerRandomTask: Selected ${selectedTask.taskType} wearType: ${selectedTask.taskSubType} finish type: ${selectedFinish} count: ${randFinishNeeded}`);
                    tm.startWearBondageTask(selectedTask.taskSubType, selectedFinish, randFinishNeeded, false, reward, failure, gracePeriod);
                }
                else if (selectedTask.taskType === "wear_outfit") {
                    this.startRandomWearOutfitTask(selectedFinish, randFinishNeeded, reward, failure);
                }
                else if (selectedTask.taskType === "naked") {
                    console.log(`ATB: triggerRandomTask: Selected ${selectedTask.taskType} finish type: ${selectedFinish} count: ${randFinishNeeded}`);
                    tm.startNakedTask(selectedFinish, randFinishNeeded, false, reward, failure, gracePeriod);
                }
                else if (selectedTask.taskType === "pose") {
                    console.log(`ATB: triggerRandomTask: Selected ${selectedTask.taskType} finish type: ${selectedFinish} count: ${randFinishNeeded}`);
                    tm.startPoseTask("random", "random", this.tasksSettings.poseTaskSettings.averageRandomPosePerHour, selectedFinish, randFinishNeeded, false, reward, failure, gracePeriod);
                }
                // "room_control" not avaible for random task (todo: make it available for Max Time only?)
                // "nickname" is not available for random task for now (would need something to generate good random nickname)
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

        const selectedOutfit = selectRandomOutfit([], excludeTags); // exclude harsh outfit
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
}

