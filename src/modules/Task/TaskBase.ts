import { TaskData } from "@/models/TaskManagerSettings";
import ModuleManager from "@/utility/ModuleManager";
import { ChaoticMistressModule } from "../ChaoticMistressModule";
import { ChatColor, formatTimeMs, sendLocalMessage } from "@/utility/utility";
import StorageManager from "@/utility/StorageManager";

export abstract class TaskBase {
    protected data: TaskData;

    // Internal Task Info
    private isTaskFinished: boolean = false;
    private transgessionOccuring: boolean = false;

    // Main Task Process Variable
    private lastChecked: number = 0;
    private isTaskRespected: boolean = false;
    private lastTimeTaskRespected: number = 0;
    protected TICK_PERIOD_MS: number = 5000; // 5sec

    // Internal variable for settings saving (shared between all task)
    private static lastSaveTime: number = 0;
    private static shouldSave: boolean = false;
    private static SAVE_PERIOD_MS: number = 30 * 1000; // 30sec

    // Internal for duration finish type
    private lastTickTime: number = 0;

    private DEFAULT_GRACE_PERIOD_MS: number = 60000; // 60sec

    /** Initializes a brand new task */
    constructor(data: TaskData) {
        this.data = data;
        this.updateProgress();

        if (this.isFinishConditionComplete()) {
            // End the task (success)
            this.triggerTaskCompletion(true, false);
            return;
        }

        // TODO: move in triggerTask fct ? (so it dont trigger on restore)
        sendLocalMessage("New Rule: " + this.getDescription(), ChatColor.Purple);
        sendLocalMessage(this.getFinishDescription("Rule will finish"), ChatColor.Purple);

        // Internal var init
        this.lastTimeTaskRespected = Date.now();

        // On new task: Force the task if player unable to comply
        if (this.data.enforce || this.isCharUnableToDoTask()) {
            this.enforceTask();
        }
    }


/**
 * Function needed to be implemented per Task class
 */

    /** Returns the dynamic text displayed in the UI */
    public abstract getDescription(): string;

    protected abstract checkTaskIsRespected(): boolean;
    protected abstract isCharUnableToDoTask(): boolean;
    protected abstract enforceTask(): boolean;
    protected abstract handlePeriodicEvent(): void; // Triggered every TICK_PERIOD_MS
    protected abstract handleTaskFinishing(): void;
    protected abstract handleTransgressionWarning(): void;
    protected abstract handleTransgression(): void;


/**
 * Basic Task Status Check
 */

    public getProgress(): number {
        return this.data.progressPerc;
    }
    /*public gettimeLeft(): number {
        return this.data.totalDurationMs - this.data.elapsedtimeMs;
    }*/

    public getData(): TaskData {
        return this.data;
    }

    /** TaskManager will use it to check if the task should be removed */
    public isFinished(): boolean {
        return this.isTaskFinished;
    }
    protected isFinishConditionComplete(): boolean {
        return (this.data.finishCurrentCount >= this.data.finishTotalNeeded);
    }
    public isTransgessionOccuring(): boolean {
        return this.transgessionOccuring;
    }


/**
 * External Trigger for Tasks
 */

    /** Called by the Task when completion conditions is met */
    public triggerTaskCompletion(succes: boolean, skipPts: boolean): void {
        this.handleTaskFinishing();

        this.isTaskFinished = true;
        this.transgessionOccuring = false;
        this.data.progressPerc = 100;

        console.log("ATB: Task is finished: " + this.getDescription());
        sendLocalMessage("Task is finished: " + this.getDescription(), ChatColor.Purple);

        // Don't add good/bad pts on error
        if (!skipPts) {
            if (succes) {
                this.notifyGoodPtsChange(this.data.goodPtsOnSucces);
            } else {
                this.notifyBadPtsChange(this.data.badPtsOnFailure);
            }
        }
    }


/**
 * Save Settings & CharacterUpdate (static, shared for all task for performance)
 */

    // Save settings shared for all task for performance
    private static saveSettingsPeriodic(currentTime) {
        if (TaskBase.shouldSave) {
            // Save settings only every SAVE_PERIOD_MS for performance (mainly needed for duration which want to save on every tick)
            let elpasedTimeSinceLastSave = currentTime - TaskBase.lastSaveTime;
            if (elpasedTimeSinceLastSave > TaskBase.SAVE_PERIOD_MS) {
                StorageManager.saveSettings();
            }
        }
    }

    // Static var shared between all task so we can do only one ChatRoomCharacterUpdate() for all taask.
    // Needed for performance reason, specifically TaskWearBondage can have 7 concurrent task that can all add items in onTick().
    // That way we can do only 1 update instead of 7.
    private static needCharacterUpdate: boolean = false;
    public static setNeedCharacterUpdate(value: boolean) {
        this.needCharacterUpdate = value;
    }
    /** Call by TaskManager */
    public static doPlayerCharacterUpdateIfNeeded() {
        if (this.needCharacterUpdate) {
            ChatRoomCharacterUpdate(Player);
            this.needCharacterUpdate = false;
        }
    }


/**
 * Main Task Process
 */

    /** Called every tick by the TaskManager. */
    public onTick(currentTime: number): void {
        this.handleDurationFinishType(currentTime);
        if (this.isFinished()) {
            return; // Nothing to do
        }

        if (currentTime - this.lastChecked >= this.TICK_PERIOD_MS) { // Check every 5 seconds
            this.updateProgress();
            this.mainTaskProcess(currentTime);
        }
    }

    private updateProgress() {
        let progress = Math.floor((this.data.finishCurrentCount / this.data.finishTotalNeeded) * 100);
        if (progress > 100) {
            progress = 100;
        }
        else if (progress < 0) {
            progress = 0;
        }
        if (this.isFinished()) {
            this.data.progressPerc = 100;
        } else {
            this.data.progressPerc = progress;
        }
    }

    // Called every onTick.
    // Check if the player complying with the taks and update progress accordingly.
    // If enforce is true and the player is not complying, applying a penalty and force the task rule on the player.
    protected mainTaskProcess(currentTime: number) {
        // Update internal variable
        let isTaskRespectedBefore = this.isTaskRespected;
        this.isTaskRespected = this.checkTaskIsRespected();
        this.lastChecked = currentTime;

        // Check if task is finished
        if (this.isFinishConditionComplete()) {
            // End the task (success)
            this.triggerTaskCompletion(true, false);
            return;
        }

        if (this.isTaskRespected) {
            this.transgessionOccuring = false;
            this.lastTimeTaskRespected = currentTime;
        }
        else {
            // Warning on transgression
            this.transgessionOccuring = true;
            if (this.isTaskRespected != isTaskRespectedBefore) {
                this.handleTransgressionWarning();
            }

            // Handle transgression after grace period
            let gracePeriodMs = this.data.gracePeriodMs ?? this.DEFAULT_GRACE_PERIOD_MS;
            if (currentTime - this.lastTimeTaskRespected >= gracePeriodMs) {
                // Add badPts
                this.notifyBadPtsChange(this.data.badPtsOnFailure);
                // Re-start grace period
                this.lastTimeTaskRespected = currentTime;

                // If player cannot equip it themselve, we handle it after getting badPts
                if (this.data.enforce || this.isCharUnableToDoTask()) {
                    this.enforceTask();
                }
                this.handleTransgression();
            }
        }

        this.handlePeriodicEvent();
    }


/**
 * Finish Task Handlers
 */

    private handleDurationFinishType(currentTime) {
        if (this.lastTickTime > 0) { // On first tick lastTickTime == 0
            // Update elapsed time for "duration" FinishType
            if (this.data.finishType == "duration") {
                let elpasedTime = currentTime - this.lastTickTime;
                if (elpasedTime > 0) { // should be always true ?
                    this.data.finishCurrentCount += elpasedTime;
                    if (this.data.finishCurrentCount > this.data.finishTotalNeeded) {
                        this.data.finishCurrentCount = this.data.finishTotalNeeded;
                    }
                    TaskBase.shouldSave = true;
                }
            }

            TaskBase.saveSettingsPeriodic(currentTime);
        } else {
            // Init on first tick
            TaskBase.lastSaveTime = currentTime;
        }
        this.lastTickTime = currentTime;
    }

    /** Called by TaskManager */
    public onPlayerOrgasm() {
        if (this.data.finishType == "orgasm") {
            this.data.finishCurrentCount += 1;
            TaskBase.shouldSave = true;
        }
    }
    public onPlayerOrgasmRuined() {
        if (this.data.finishType == "orgasm_ruined") {
            this.data.finishCurrentCount += 1;
            TaskBase.shouldSave = true;
        }
    }
    public onPlayerOrgasmResisted() {
        if (this.data.finishType == "orgasm_resisted") {
            this.data.finishCurrentCount += 1;
            TaskBase.shouldSave = true;
        }
    }
    public onPlayerSpanked() {
        if (this.data.finishType == "spank") {
            this.data.finishCurrentCount += 1;
            TaskBase.shouldSave = true;
        }
    }

    public getFinishDescription(prefixStr: string): string {
        const finishCountLeftToDo = this.data.finishTotalNeeded - this.data.finishCurrentCount;
        switch (this.data.finishType) {
            case "duration":
                return prefixStr + " in " + formatTimeMs(finishCountLeftToDo) + ".";
            case "orgasm":
                return prefixStr + " after you Orgasmed " + finishCountLeftToDo + " times.";
            case "orgasm_resisted":
                return prefixStr + " after you Resisted orgasm " + finishCountLeftToDo + " times.";
            case "orgasm_ruined":
                return prefixStr + " after " + finishCountLeftToDo + " Ruined orgasm.";
            case "spank":
                return prefixStr + " after you've been Spanked " + finishCountLeftToDo + " times.";
        }
    }


/**
 * Notify to Extern Module
 */

    protected notifyGoodPtsChange(pts: number): void {
        if (pts == 0) return;
        const cm = ModuleManager.getModule("ChaoticMistressModule") as ChaoticMistressModule;
        if (cm) {
            cm.modifyGoodPts(pts);
        }
    }

    protected notifyBadPtsChange(pts: number): void {
        if (pts == 0) return;
        const cm = ModuleManager.getModule("ChaoticMistressModule") as ChaoticMistressModule;
        if (cm) {
            cm.modifyBadPts(pts);
        }
    }
}