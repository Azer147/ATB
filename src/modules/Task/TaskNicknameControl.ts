import { getTaskCannotStartReasonToString, TaskData } from "@/models/TaskManagerSettings";
import { TaskBase } from "./TaskBase";
import { ChatColor, getBCXActiveRules, sendLocalMessage } from "@/utility/utility";


export class TaskNicknameControl extends TaskBase {

    constructor(data: TaskData) {
        super(data);

        // Specifics Task data Validation
        let nickname = this.data.nickname;
        if (!nickname || nickname === "") {
            // End the task (error)
            console.warn("TaskNicknameControl: Error: nickname is undefined.");
            this.triggerTaskCompletion(false, true);
            return;
        }
    }

/**
 * Specifics strings for UI/User
 */

    public getDescription(): string {
        let enforcedStr = this.data.enforce ? " (enforced)" : "";
        let nickname = "\"" + this.data.nickname + "\"";
        this.data.description = `Use Nickname ${nickname}` + enforcedStr;
        return this.data.description;
    }
    protected handleTransgression() {
        let nickname = "\"" + this.data.nickname + "\"";
        sendLocalMessage("Your Nickname need to be set to " + nickname + ", you received " + this.data.penaltyPtsOnFailure + " Penalty points for transgression.", ChatColor.Red);

        // TODO: Maybe move this pre-handleTransgression
        if (TaskNicknameControl.checkTaskPrevented(Player)) {
            sendLocalMessage("The task Nickname Control is being prevented by a BCX Rule, task will end now.", ChatColor.Orange);
            this.triggerTaskCompletion(false, true);
            return;
        }
    }
    protected handleTransgressionWarning() {
        let nickname = "\"" + this.data.nickname + "\"";
        sendLocalMessage("Your Nickname need to be set to " + nickname + " or you will get " + this.data.penaltyPtsOnFailure + " Penalty points!", ChatColor.Red);
    }

    protected isCharUnableToDoTask(): boolean {
        return false; // Nothing can prevent the player from setting nickname
    }

    // Nothing todo
    protected handlePeriodicEvent() {}
    protected handleTaskFinishing() {
        // Restore Original Nickname
        Player.Nickname = this.data.original_nickname;
        ServerAccountUpdate.QueueData({ Nickname: this.data.original_nickname });
    }

    protected handleEditTask(newTaskData: TaskData): boolean {
        // TODO: data validation ?
        if (newTaskData.nickname !== undefined && newTaskData.nickname != "" && this.data.nickname != newTaskData.nickname) {
            this.resetGracePeriod();
            this.data.nickname = newTaskData.nickname;
            this.handleFirstTick(); // trigger enforceTask() if appropriate
        }
        return true;
    }


/**
 * Core Task Functions
 */

    protected checkTaskIsRespected(): boolean {
        return Player.Nickname === this.data.nickname;
    }

    protected enforceTask(): boolean {
        Player.Nickname = this.data.nickname;
        ServerAccountUpdate.QueueData({ Nickname: this.data.nickname });
        return true;
    }

    public static checkTaskPrevented(C: OtherCharacter | PlayerCharacter): boolean {
        // TODO: getBCXData() not available for other player for now.
        if (!C.IsPlayer()) return false;

        // Check prevented by BCX rules
        if (getBCXActiveRules().includes("alt_set_nickname")) {
            return true;
        }
        return false;
    }
}