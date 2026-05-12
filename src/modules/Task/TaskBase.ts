import { TaskData } from "@/models/TaskManagerSettings";
import ModuleManager from "@/utility/ModuleManager";
import { ChaoticMistressModule } from "../ChaoticMistressModule";
import { ChatColor, formatTimeMs, sendLocalMessage } from "@/utility/utility";
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
        this.updateProgress();

        if (this.isFinishConditionComplete()) {
            // End the task (success)
            this.triggerTaskCompletion(true, false);
            return;
        }

        // TODO: move in triggerTask fct ? (so it dont trigger on restore)
        sendLocalMessage("New Rule: " + this.getDescription(), ChatColor.Purple);
        sendLocalMessage(this.getFinishDescription("Rule will finish"), ChatColor.Purple);
    }

    /** Returns the dynamic text displayed in the UI */
    public abstract getDescription(): string;

    public getProgress(): number {
        return this.data.progressPerc;
    }
    /*public gettimeLeft(): number {
        return this.data.totalDurationMs - this.data.elapsedtimeMs;
    }*/

    public getData(): TaskData {
        return this.data;
    }

    protected abstract updateProgress(): void;


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


    /** Called every tick by the TaskManager. */
    public onTick(currentTime: number): void {
        if (this.isFinishConditionComplete() || this.isFinished()) {
            return; // Nothing to do
        }

        if (this.lastTickTime > 0) { // On first tick lastTickTime == 0
            // Update elapsed time for "duration" FinishType
            if (this.data.finishType == "duration") {
                let elpasedTime = currentTime - this.lastTickTime;
                if (elpasedTime > 0) { // should be always true ?
                    this.data.finishCurrentCount += elpasedTime;
                    if (this.data.finishCurrentCount > this.data.finishTotalNeeded) {
                        this.data.finishCurrentCount = this.data.finishTotalNeeded;
                    }
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
    public onPlayerOrgasm() {
        if (this.data.finishType == "orgasm") {
            this.data.finishCurrentCount += 1;
        }
    }
    public onPlayerOrgasmRuined() {
        if (this.data.finishType == "orgasm_ruined") {
            this.data.finishCurrentCount += 1;
        }
    }
    public onPlayerOrgasmResisted() {
        if (this.data.finishType == "orgasm_resisted") {
            this.data.finishCurrentCount += 1;
        }
    }
    public onPlayerSpanked() {
        if (this.data.finishType == "spank") {
            this.data.finishCurrentCount += 1;
        }
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

    /** Called by the Task when completion conditions is met */
    public triggerTaskCompletion(succes: boolean, skipPts: boolean): void {
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