import { TaskData } from "@/models/TaskManagerSettings";
import { TaskBase } from "./TaskBase";
import { ChatColor, sendLocalMessage } from "@/utility/utility";


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
        sendLocalMessage("You need to naked, you received  " + this.data.badPtsOnFailure + " for transgression.", ChatColor.Red);
    }
    protected handleTransgressionWarning() {
        sendLocalMessage("You need to be naked or be punished!", ChatColor.Red);
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
        return CharacterIsNaked(Player);
    }

    protected enforceTask(): boolean {
        CharacterNaked(Player, false);
        TaskBase.setNeedCharacterUpdate(true);
        return true;
    }
}