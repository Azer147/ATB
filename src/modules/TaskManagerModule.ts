import { ModuleBase } from "./ModuleBase";
import { BC_SDK } from "../index";
import StorageManager from "@/utility/StroageManager";
import { TaskCannotStartReason, TaskData, TaskManagerSettings } from "@/models/TaskManagerSettings";
import { TaskBase } from "./Task/TaskBase";
import { TaskWearBondage } from "./Task/TaskWearBondage";
import { ChatColor, sendLocalMessage } from "@/utility/utility";
import { GuiMainView } from "@/gui/GuiMainView";
import { FinishType, FullTaskType, WearBondageType } from "@/models/TasksSettings";
import { getCharacterTaskManagerSettings, getCharacterTasksSettings } from "@/utility/CharacterWrapper";

export class TaskManagerModule extends ModuleBase {
    TICK_PERIOD_MS: number = 800; // 0.8sec
    lastTick: number = 0;
    settings: TaskManagerSettings; // Define settings interface

    activeTaskList: TaskBase[] = []; // List of Active tasks

    constructor() {
        super("TaskManagerModule", "Task Manager", "Tracks ongoing player tasks.");
        this.settings = StorageManager.getTaskManagerSettings();
        this.load();
    }

    isEnabled(): boolean {
        return StorageManager.getGlobalEnable();
    }

    load(): void {
        // Check this.settings.activeTasks and start tasks
        this.restoreActiveTaskFromSettings();
        // Hook for tick
        this.hook.push(BC_SDK.hookFunction('TimerProcess', 0, (args, next) => {
            next(args);

            if (window.CurrentScreen == "ChatRoom") {
                // Restrict tick to 1 per seconds to avoid performance issues
                const currentTime = Date.now();
                if (currentTime - this.lastTick >= this.TICK_PERIOD_MS) {
                    this.processTick(currentTime);
                    this.lastTick = currentTime;
                }
            }
        }));
        // Orgasm Event / Orgasm Ruined Event
        this.hook.push(BC_SDK.hookFunction('ActivityOrgasmStart', 0, (args, next) => {
            next(args);

            // Check Orgasm or Ruined (copied from BC)
            if (!ActivityOrgasmRuined) {
                this.dispatchOrgasmEvent();
            } else {
                this.dispatchOrgasmRuinedEvent();
            }
        }));
        // Orgasm Ruined Event (passive)
        this.hook.push(BC_SDK.hookFunction('ActivityOrgasmControl', 0, (args, next) => {
            if (Player.ArousalSettings.OrgasmTimer) {
                // Check copied from BC: function ActivityOrgasmControl()
                if ((ActivityOrgasmGameTimer != null) && (ActivityOrgasmGameTimer > 0) && (CurrentTime < Player.ArousalSettings.OrgasmTimer)) {
                    if (ActivityOrgasmGameProgress >= ActivityOrgasmGameDifficulty - 1 || CurrentTime > Player.ArousalSettings.OrgasmTimer - 500) {
                        // Only for passive denied orgasm
                        this.dispatchOrgasmRuinedEvent();
                    }
                }
            }
            next(args);
        }));
        // Orgasm Resisted Event
        this.hook.push(BC_SDK.hookFunction('ActivityOrgasmGameGenerate', 0, (args, next) => {
            let progress = args[0];
            next(args);
            if (progress >= ActivityOrgasmGameDifficulty) {
                // Note: work, but not triggered with force deny (ruined instead)
                this.dispatchOrgasmResistedEvent();
            }
        }));
        // Generic Activity Event
        this.hook.push(BC_SDK.hookFunction('ActivityRun', 0, (args, next) => {
            next(args);
            //let initiator: Character = args[0];
            let target: Character = args[1];
            //let targetGroup: AssetItemGroup = args[2];
            let ItemActivity: ItemActivity = args[3];

            if (target.IsPlayer() && ItemActivity.Activity.Name === "Spank") {
                this.dispatchSpankedEvent();
            }
        }));
    }

    unload(): void {
        super.unload();
    }

    private dispatchOrgasmEvent() {
        this.activeTaskList.forEach((task) => {
            task.onPlayerOrgasm();
        });
    }
    private dispatchOrgasmRuinedEvent() {
        this.activeTaskList.forEach((task) => {
            task.onPlayerOrgasmRuined();
        });
    }
    private dispatchOrgasmResistedEvent() {
        this.activeTaskList.forEach((task) => {
            task.onPlayerOrgasmResisted();
        });
    }
    private dispatchSpankedEvent() {
        this.activeTaskList.forEach((task) => {
            task.onPlayerSpanked();
        });
    }

    // Return the first unused id number
    private generateUniqueTaskId(): number {
        const usedIds = new Set<number>();

        for (const task of this.activeTaskList) {
            usedIds.add(task.getData().id);
        }

        if (this.settings && this.settings.activeTasks) {
            for (const taskData of this.settings.activeTasks) {
                usedIds.add(taskData.id);
            }
        }

        let id = 1;
        while (usedIds.has(id)) {
            id++;
        }
        return id;
    }

    // --- LOGIC LOOP ---
    processTick(currentTime: number): void {
        let taskIdToRemove: number[] = [];

        for (let i = 0; i < this.activeTaskList.length; i++) {
            let task = this.activeTaskList[i];

            task.onTick(currentTime);
            if (task.isFinished()) {
                // Can't remove while still looping on the list
                taskIdToRemove.push(task.getData().id);
            }
        }

        // remove task after
        this.removeTasks(taskIdToRemove);
    }

    // --- TASK LIFECYCLE ---

    public startTask(taskData: TaskData, overwrite?: boolean): boolean {
        if (taskData.type == "wear_bondage" && taskData.itemToWear && taskData.gracePeriodMs) {
            return this.startWearBondageTask(taskData.itemToWear,
                taskData.finishType,
                taskData.finishTotalNeeded,
                taskData.enforce,
                taskData.goodPtsOnSucces,
                taskData.badPtsOnFailure,
                taskData.gracePeriodMs,
                overwrite
            );
        }
        return false;
    }

    public skipTask(taskId: number): boolean {
        let task = this.getActiveTaskById(taskId);
        if (task) {
            task.triggerTaskCompletion(false, false);
            return true;
        }
        return false;
    }

    public getActiveTaskById(taskId: number): TaskBase | undefined {
        for (let i = 0; i < this.activeTaskList.length; i++) {
            let task = this.activeTaskList[i];
            if (task.getData().id == taskId) {
                return task;
            }
        }
        return undefined;
    }
    public getActiveTaskByType(type: FullTaskType): TaskBase | undefined {
        for (let i = 0; i < this.activeTaskList.length; i++) {
            let task = this.activeTaskList[i];

            if (TaskManagerModule.isSameTaskType(task.getData(), type)) {
                return task;
            }
        }
        return undefined;
    }

    public static isSameTaskType(taskData: TaskData, type: FullTaskType) {
        if (taskData.type == type.taskType) {
            // Do case that have subType first
            if (type.taskType == "wear_bondage") {
                if (taskData.itemToWear == type.taskSubType) {
                    return true;
                }
            }
            else {
                return true;
            }
        }
        return false;
    }

    public isAnyTaskTransgressionOccuring(): boolean {
        for (let i = 0; i < this.activeTaskList.length; i++) {
            let task = this.activeTaskList[i];
            if (task.isTransgessionOccuring()) {
                return true;
            }
        }
        return false;
    }

    public static isTaskCanStart(C: OtherCharacter | PlayerCharacter, type: FullTaskType): TaskCannotStartReason {
        // If combo task/subType already active, it fall into "overwrite_only",
        // Except if active & enforced => "not_available"
        const tms = getCharacterTaskManagerSettings(C);
        if (tms && tms.activeTasks.length > 0) {
            for (let i = 0; i < tms.activeTasks.length; i++) {
                const taskData = tms.activeTasks[i];
                if (TaskManagerModule.isSameTaskType(taskData, type)) {
                    if (taskData.enforce) {
                        return "not_available";
                    } else {
                        return "overwrite_only";
                    }
                }
            }
        }

        // old non-static way
        /*let task = this.getActiveTaskByType(type);
        if (task) {
            if (task.getData().enforce) {
                return "not_available";
            } else {
                return "overwrite_only";
            }
        }*/

        //const taskSettings = StorageManager.getTasksSettings();
        // Other reason
        if (type.taskType == "wear_bondage" && type.taskSubType) {
            if (!TaskManagerModule.isWearBondageTypeEnabled(C, type.taskSubType)) {
                return "not_enabled";
            } else if (!TaskWearBondage.getItemAvailibility(C).includes(type.taskSubType)) {
                return "not_available";
            } else {
                return "can_start";
            }
        }
        return "unknown";
    }

    // Restore (start) all the task from settings
    // Warning: Should be only called once at the begining
    private restoreActiveTaskFromSettings() {
        for (let i = 0; i < this.settings.activeTasks.length; i++) {
            let taskData = this.settings.activeTasks[i];

            // Check task not already started
            if (!this.getActiveTaskById(taskData.id)) {
                // Start corresonding task
                let task: TaskBase | undefined = undefined;

                if (taskData.type == "wear_bondage") {
                    task = new TaskWearBondage(taskData);
                }
                // TODO: Add other task type

                if (task) {
                    this.startNewTask(task, undefined);
                }
            }
        }
    }

    // If taskData is not defined, only start task without updating settings
    private startNewTask(task: TaskBase, taskData: TaskData | undefined) {
        this.activeTaskList.push(task);
        if (taskData) {
            this.settings.activeTasks.push(taskData);
            StorageManager.saveSettings();
        }
    }

    private removeTasks(taskIdToRemove: number[]) {
        for (let i = 0; i < taskIdToRemove.length; i++) {
            let taskId = taskIdToRemove[i];
            // Remove from internal list
            this.activeTaskList = this.activeTaskList.filter(task => task.getData().id !== taskId);

            // Remove from settings
            if (this.settings && this.settings.activeTasks) {
                this.settings.activeTasks = this.settings.activeTasks.filter(data => data.id !== taskId);
            }
        }

        StorageManager.saveSettings();
    }

    // Force stop and delete all tasks
    public forceFinishAllTask() {
        for (let i = 0; i < this.activeTaskList.length; i++) {
            let task = this.activeTaskList[i];
            task.triggerTaskCompletion(false, true);
        }
    }

    startWearBondageTask(item: WearBondageType, finishType: FinishType, finishTotal: number,
                        enforce: boolean, successPts: number, failurePts: number,
                        gracePeriod: number, overwrite: boolean = false): boolean {
        // Case where the same task with same item already exist
        const sameTask = this.getActiveTaskByType({taskType: "wear_bondage", taskSubType: item});
        if (sameTask) {
            if (overwrite) {
                // on overwrite, force finish the same already active task with no pts reward
                sameTask.triggerTaskCompletion(false, true);
            } else {
                console.warn("ATB: startWearBondageTask: Cannot start task: task requirement not met or already running.");
                return false;
            }
        }

        let taskData: TaskData = {
            id: this.generateUniqueTaskId(),
            type: "wear_bondage",
            description: "", // Will be updated by TaskWearBondage
            finishType: finishType,
            finishCurrentCount: 0,
            finishTotalNeeded: finishTotal,
            progressPerc: 0,
            enforce: enforce,
            goodPtsOnSucces: successPts,
            badPtsOnFailure: failurePts,
            itemToWear: item,
            gracePeriodMs: gracePeriod // in millisec
        }
        let task = new TaskWearBondage(taskData);
        this.startNewTask(task, taskData);
        return true;
    }
    public static isWearBondageTypeEnabled(C: OtherCharacter | PlayerCharacter, itemToWear: WearBondageType) {
        //const taskSettings = StorageManager.getTasksSettings();
        const taskSettings = getCharacterTasksSettings(C);

        if (taskSettings && taskSettings.wearBondageTaskSettings.enable) {
            if (itemToWear == "hand" && taskSettings.wearBondageTaskSettings.enableHand) {
                return true;
            }
            if (itemToWear == "leg" && taskSettings.wearBondageTaskSettings.enableLeg) {
                return true;
            }
            if (itemToWear == "gag" && taskSettings.wearBondageTaskSettings.enableGag) {
                return true;
            }
            if (itemToWear == "chastity" && taskSettings.wearBondageTaskSettings.enableChastity) {
                return true;
            }
            if (itemToWear == "toy" && taskSettings.wearBondageTaskSettings.enableToy) {
                return true;
            }
        }
        return false;
    }

}