import { TaskData } from "@/models/TaskManagerSettings";
import { TaskBase } from "./TaskBase";
import { ChatColor, CloneAndRandomizeList, sendLocalMessage, shouldTriggerFromAveragePerHour } from "@/utility/utility";
import { PoseLowerSelection, PoseUpperSelection } from "@/models/TasksSettings";


export class TaskPoseControl extends TaskBase {

    constructor(data: TaskData) {
        super(data);

        // Specifics Task data Validation
        let poseUpper = this.data.selected_upper_pose;
        let poseLower = this.data.selected_lower_pose;
        let avgRandomPose = this.data.averageRandomPosePerHour;
        if (!poseUpper || !poseLower || avgRandomPose === undefined) {
            // End the task (error)
            console.warn("TaskPoseControl: Error: pose is not defined.");
            this.triggerTaskCompletion(false, true);
            return;
        }
    }

/**
 * Specifics strings for UI/User
 */

    private getStringTargetPose() {
        const targetPose = this.getTargetPose();
        let poseStr = "";
        for (const pose of targetPose) {
            if (poseStr.length != 0) {
                // Note: works because targetPose should be maximum 2 elem
                poseStr += " and ";
            }
            poseStr += "\"" + TaskPoseControl.getNameForPose(pose) + "\"";
        }
        return poseStr;
    }

    public getDescription(): string {
        let enforcedStr = this.data.enforce ? " (enforced)" : "";
        this.data.description = `Use Pose ${this.getStringTargetPose()}` + enforcedStr;
        return this.data.description;
    }
    protected handleTransgression() {
        if (TaskPoseControl.checkTaskPrevented(Player)) {
            sendLocalMessage("The task Pose Control is being prevented by a BCX Rule, task will end now.", ChatColor.Orange);
            this.triggerTaskCompletion(false, true);
            return;
        }
        let pose = this.getStringTargetPose();
        sendLocalMessage("Your Pose need to be set to " + pose + ", you received  " + this.data.badPtsOnFailure + " for transgression.", ChatColor.Red);
    }
    protected handleTransgressionWarning() {
        let pose = this.getStringTargetPose();
        sendLocalMessage("Your Pose need to be set to " + pose + " or be punished!", ChatColor.Red);
    }

    protected isCharUnableToDoTask(): boolean {
        // TODO: idk if there is a case of pose available AND Player unable to do it themselve ?
        return false;
    }

    protected handlePeriodicEvent() {
        if (this.data.averageRandomPosePerHour && this.data.averageRandomPosePerHour > 0) {
            if (shouldTriggerFromAveragePerHour(this.data.averageRandomPosePerHour, this.TICK_PERIOD_MS)) {
                // Re-build target pose (same target pose will be generated if selected pose is not random)
                this.selectTargetPose();
            }
        }
    }

    // Nothing todo
    protected handleTaskFinishing() {}

/**
 * Core Task Functions
 */

    protected checkTaskIsRespected(): boolean {
        const targetPose = this.getTargetPose();

        const availPose: (PoseUpperSelection | PoseLowerSelection)[] = [
            ...TaskPoseControl.getAvailableUpperPose(Player, false),
            ...TaskPoseControl.getAvailableLowerPose(Player, false)
        ];

        for (const pose of targetPose) {
            if (availPose.includes(pose) && !Player.Pose.includes(pose)) {
                return false;
            }
        }
        return true;
    }

    protected enforceTask(): boolean {
        const targetPose = this.getTargetPose();

        for (const pose of targetPose) {
            PoseSetActive(Player, pose);
        }
        ServerSend("ChatRoomCharacterPoseUpdate", { Pose: Player.ActivePose });
        return true;
    }


    // Make sure target_pose is filled before using it
    private getTargetPose(): AssetPoseName[] {
        if (!this.data.target_pose || this.data.target_pose.length == 0) {
            return this.selectTargetPose();
        }
        return this.data.target_pose;
    }

    // Build target_pose from selected_*_pose (including random selection)
    private selectTargetPose(): AssetPoseName[] {
        const targetPose: AssetPoseName[] = [];

        // Set upper pose
        if (this.data.selected_upper_pose == "random") {
            let availUpperPose = TaskPoseControl.getAvailableUpperPose(Player, false);
            if (availUpperPose.length > 0) {
                let randUpperPoseList = CloneAndRandomizeList(availUpperPose);
                targetPose.push(randUpperPoseList[0] as AssetPoseName);
            }
            // else fallback to "free" => nothing to add
        } else if (this.data.selected_upper_pose != "free") {
            // If it's not "random" or "free", it's an AssetPoseName, add directly.
            targetPose.push(this.data.selected_upper_pose as AssetPoseName);
        }

        // Set lower pose
        if (this.data.selected_lower_pose == "random") {
            let availLowerPose = TaskPoseControl.getAvailableLowerPose(Player, false);
            if (availLowerPose.length > 0) {
                let randLowerPoseList = CloneAndRandomizeList(availLowerPose);
                targetPose.push(randLowerPoseList[0] as AssetPoseName);
            }
            // else fallback to "free" => nothing to add
        } else if (this.data.selected_lower_pose != "free") {
            // If it's not "random" or "free", it's an AssetPoseName, add directly.
            targetPose.push(this.data.selected_lower_pose as AssetPoseName);
        }

        // fallback to "Kneel" if nothing was choosen / available
        // Note: we just want to avoid empty target_pose, even if not available now.
        //      Because I think it's ok to let the task continue (transgression will be ignored if not avail)
        //      if Player is already restricted to a pose (most likely due to restraint),
        //      but I wouldn't want the task continue without any target pose.
        if (targetPose.length == 0) {
                targetPose.push("Kneel");
        }

        this.data.target_pose = targetPose;
        return targetPose;
    }


/**
 * External/static helpers Functions
 */

    // return null if valid, else return string with reason
    public static isSelectedPoseValid(C: OtherCharacter | PlayerCharacter, poseUpper: PoseUpperSelection, poseLower: PoseLowerSelection): string | null {
        if (poseUpper == "free" && poseLower == "free") {
            return "Both upper and lower pose cannot be free";
        }

        // Check individual pose valid
        if (poseUpper != "free" && poseUpper != "random" && !PoseAvailable(C, "BodyUpper", poseUpper as AssetPoseName)) {
            return "Upper pose not available";
        }
        if (poseLower != "free" && poseLower != "random" && !PoseAvailable(C, "BodyLower", poseLower as AssetPoseName)) {
            return "Lower pose not available";
        }
        return null;
    }

    public static getAvailableUpperPose(C: OtherCharacter | PlayerCharacter, includeFreeRandom: boolean): PoseUpperSelection[] {
        // Warning: Must by synced with PoseUpperSelection
        let availPose: PoseUpperSelection[] = [];
        if (includeFreeRandom) {
            availPose = ["free", "random"];
        }
        const allUpperPose: AssetPoseName[] = ['BaseUpper', 'BackBoxTie', 'BackCuffs', 'BackElbowTouch', 'OverTheHead', 'Yoked'];
        for (const pose of allUpperPose) {
            if (PoseAvailable(C, "BodyUpper", pose)) {
                availPose.push(pose as PoseUpperSelection);
            }
        }
        return availPose;
    }
    public static getAvailableLowerPose(C: OtherCharacter | PlayerCharacter, includeFreeRandom: boolean): PoseLowerSelection[] {
        // Warning: Must by synced with PoseLowerSelection
        let availPose: PoseLowerSelection[] = [];
        if (includeFreeRandom) {
            availPose = ["free", "random"];
        }
        const allLowerPose: AssetPoseName[] = ['BaseLower', 'Kneel', 'KneelingSpread', 'LegsClosed'];
        for (const pose of allLowerPose) {
            if (PoseAvailable(C, "BodyLower", pose)) {
                availPose.push(pose as PoseLowerSelection);
            }
        }
        return availPose;
    }

    public static getNameForPose(pose: PoseUpperSelection | PoseLowerSelection | AssetPoseName): string {
        switch (pose) {
            case "free":
                return "Free";
            case "random":
                return "Random Pose";
            case "BaseUpper":
                return "Hands in Front";
            case "BackBoxTie":
                return "Hands Back Box Tie";
            case "BackCuffs":
                return "Hands Back Cuffs";
            case "BackElbowTouch":
                return "Hands Back Elbow Touch";
            case "OverTheHead":
                return "Hands Over The Head";
            case "Yoked":
                return "Hands Up";
            case "BaseLower":
                return "Standing";
            case "Kneel":
                return "Kneeling";
            case "KneelingSpread":
                return "Kneeling Spread";
            case "LegsClosed":
                return "Standing Legs Closed";
            default:
                return pose;
        }
    }

    public static checkTaskPrevented(C: OtherCharacter | PlayerCharacter): boolean {
        // TODO: Check prevented by BCX rules
        return false;
    }
}