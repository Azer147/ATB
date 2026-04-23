import { TaskData } from "@/models/TaskManagerSettings";
import ModuleManager from "@/utility/ModuleManager";
import { ChaoticMistressModule } from "../ChaoticMistressModule";
import { ChatColor, sendLocalMessage } from "@/utility/utility";
import StorageManager from "@/utility/StroageManager";

export abstract class TaskBase {
    private SAVE_PERIOD_MS: number = 30 * 1000; // 30sec
    private lastTickTime: number = 0;
    private lastSaveTime: number = 0;
    data: TaskData;
    isTaskFinished: boolean = false;
    transgessionOccuring: boolean = false;

    /** Initializes a brand new task */
    constructor(data: TaskData) {
        this.data = data;
    }

    // --- Abstract Methods ---
    /** Returns the dynamic text displayed in the UI */
    public abstract getDescription(): string;

    public getProgress(): number {
        return this.data.progress;
    }
    public gettimeLeft(): number {
        return this.data.totalDurationMs - this.data.elapsedtimeMs;
    }

    protected abstract updateProgress(): void;

    /** Called every tick by the TaskManager. */
    public onTick(currentTime: number): void {
        if (this.data.elapsedtimeMs >= this.data.totalDurationMs || this.isFinished()) {
            return; // Nothing to do
        }

        // Update elapsed time
        if (this.lastTickTime > 0) { // On first tick lastTickTime == 0
            let elpasedTime = currentTime - this.lastTickTime;
            if (elpasedTime > 0) { // should be always true ?
                this.data.elapsedtimeMs += elpasedTime;
                if (this.data.elapsedtimeMs > this.data.totalDurationMs) {
                    this.data.elapsedtimeMs = this.data.totalDurationMs;
                }
            }

            // Save settings every SAVE_PERIOD_MS for performance
            // Note: Since we want to use connected time only we have to backup elapsedtimeMs regularly
            let elpasedTimeSinceLastSave = currentTime - this.lastSaveTime;
            if (elpasedTimeSinceLastSave > this.SAVE_PERIOD_MS) {
                StorageManager.saveSettings();
            }
        } else {
            this.lastSaveTime = currentTime;
        }
        this.lastTickTime = currentTime;
    }

    /** Called by TaskManager */
    public abstract onChatEvent(chatData: any): void;

    /** Called by TaskManager */
    public abstract onOrgasmEvent(character: any): void;

    /** TaskManager will use it to check if the task should be removed */
    public isFinished(): boolean {
        return this.isTaskFinished;
    }

    public getData(): TaskData {
        return this.data;
    }

    /** Checks if the task has run out of time */
    protected isExpired(): boolean {
        return (this.data.elapsedtimeMs >= this.data.totalDurationMs);
    }

    public isTransgessionOccuring(): boolean {
        return this.transgessionOccuring;
    }

    /** Called by the Task when completion conditions is met */
    public triggerTaskCompletion(succes: boolean, skipPts: boolean): void {
        this.isTaskFinished = true;
        this.transgessionOccuring = false;

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