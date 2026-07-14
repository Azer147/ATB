import { TaskData } from "@/models/TaskManagerSettings";
import { TaskBase } from "./TaskBase";
import { ChatColor, isCharacterNakedAdv, sendLocalMessage, stripNakedCharacterAdv } from "@/utility/utility";


export class TaskNaked extends TaskBase {

    constructor(data: TaskData) {
        super(data);
    }

/**
 * Specifics strings for UI/User
 */

    public getDescription(): string {
        let enforcedStr = this.data.enforce ? " (enforced)" : "";
        this.data.description = `Be naked` + enforcedStr;
        return this.data.description;
    }
    protected handleTransgression() {
        sendLocalMessage("You need to be naked, you received " + this.data.penaltyPtsOnFailure + " Penalty points for transgression.", ChatColor.Red);
    }
    protected handleTransgressionWarning() {
        sendLocalMessage("You need to be naked or you will get " + this.data.penaltyPtsOnFailure + " Penalty points!", ChatColor.Red);
    }

    protected isCharUnableToDoTask(): boolean {
        return Player.HasEffect("BlockWardrobe")
    }

    // Nothing todo
    protected handlePeriodicEvent() {}
    protected handleTaskFinishing() {}
    protected handleEditTask(newTaskData: TaskData): boolean { return true; }

/**
 * Core Task Functions
 */

    protected checkTaskIsRespected(): boolean {
        return isCharacterNakedAdv(Player);
    }

    protected enforceTask(): boolean {
        stripNakedCharacterAdv(Player, false);
        TaskBase.setNeedCharacterUpdate(true);
        return true;
    }
}