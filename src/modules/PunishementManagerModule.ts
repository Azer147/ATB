import { ModuleBase } from "./ModuleBase";
import { BC_SDK } from "../index";
import StorageManager from "@/utility/StorageManager";
import { PenaltySettings } from "@/models/PenaltySettings";
import ModuleManager from "@/utility/ModuleManager";
import { TaskManagerModule } from "./TaskManagerModule";
import { FullPunishementList, FullTaskType, getTaskTypeConstant, PunishementType, RoomControlType, TasksSettings } from "@/models/TasksSettings";
import { calculatePointsFromFinishCount, ChatColor, selectRandomByWeight, selectRandomOutfit, sendLocalMessage } from "@/utility/utility";

export class PunishementManagerModule extends ModuleBase {
    TICK_PERIOD_MS: number = 1000 * 60; // 1 min
    lastTick: number = 0;

    settings: PenaltySettings;
    tasksSettings: TasksSettings;
    isOverPunishThresholdWarningDone: boolean = false;

    constructor() {
        super("PunishementManagerModule", "Punishement Manager", "Trigger Punishement & trigger forced punishement.");
        this.settings = StorageManager.getPenaltySettings();
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
        if (this.settings.enablePenalty) {
            let isOverPunishThreshold = (this.settings.forcedPunishementThreshold > 0 && this.settings.penaltyPts > this.settings.forcedPunishementThreshold);
            if (isOverPunishThreshold && !this.isOverPunishThresholdWarningDone) {
                sendLocalMessage("Your have exceeded Penalty Points threshold.", ChatColor.Red);
                this.isOverPunishThresholdWarningDone = true;
                return;
            } else if (isOverPunishThreshold && this.isOverPunishThresholdWarningDone) {
                if (this.triggerRandomPunishment()) {
                    // success
                    this.isOverPunishThresholdWarningDone = false;
                }
            } else {
                this.isOverPunishThresholdWarningDone = false;
            }
        }
    }


    // To add/remove pts
    public modifyRewardPts(amount: number): void {
        this.settings.rewardPts += amount;

        if (this.settings.rewardPts < 0) this.settings.rewardPts = 0;

        console.log(`ATB: Reward Points changed: ${this.settings.rewardPts}`);
        StorageManager.saveSettings();
    }

    // To add/remove pts
    public modifyPenaltyPts(amount: number): void {
        this.settings.penaltyPts += amount;

        if (this.settings.penaltyPts < 0) this.settings.penaltyPts = 0;

        console.log(`ATB: Penalty Points changed: ${this.settings.penaltyPts}`);
        StorageManager.saveSettings();
    }


    /*
    ********** Punishements related Functions **********
    */

    triggerRandomPunishment(): boolean {
        let availPunish: PunishementType[] = PunishementManagerModule.getAvailablePunishements(Player);
        if (availPunish.length === 0) {
            return false;
        }

        const selectedPunish = selectRandomByWeight(this.tasksSettings, "punish", availPunish);

        if (selectedPunish) {
            const duration = this.getRandomFinishCountOrDuration(this.tasksSettings.fullBondagePunishmentSettings.baseDurationMs);
            return PunishementManagerModule.startPunishementByType(selectedPunish, duration);
        }
        return false;
    }

    public static getAvailablePunishements(C: OtherCharacter | PlayerCharacter = Player): PunishementType[] {
        let availPunish: PunishementType[] = [];

        const availTask: FullTaskType[] = TaskManagerModule.getAvailableTasks(C, true);

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

    public static startPunishementByType(type: PunishementType, duration: number, initiatorName?: string): boolean {
        const pmm = ModuleManager.getModule("PunishementManagerModule") as PunishementManagerModule;
        if (pmm) {
            if (initiatorName) {
                sendLocalMessage("New Punishement started by " + initiatorName, ChatColor.Orange);
            }
            if (type === "full_bondage") {
                return pmm.startFullBondagePunishment(duration);
            }
            if (type === "harsh_outfit") {
                return pmm.startHarshOutfitPunishment(duration);
            }
            if (type === "doll") {
                return pmm.startDollPunishment(duration);
            }
            if (type === "drone") {
                return pmm.startDronePunishment(duration);
            }
        }
        return false;
    }

    startFullBondagePunishment(duration: number): boolean {
        const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;
        if (tm) {
            const punishSetting = this.tasksSettings.fullBondagePunishmentSettings;
            const penaltyPtsReduction = calculatePointsFromFinishCount(duration, punishSetting.baseDurationMs, punishSetting.basePenaltyReduction, true);
            const penalty = punishSetting.basePenalty;
            const reward = punishSetting.baseReward;
            const grace = punishSetting.baseGracePeriodMs;

            console.log(`ATB: startFullBondagePunishment: Starting with duration: ${duration}`);
            sendLocalMessage("Starting Full Bondage Punishement", ChatColor.Purple);

            tm.startWearBondageTask("hand", "duration", duration, true, reward, penalty, grace, true);
            tm.startWearBondageTask("leg", "duration", duration, true, reward, penalty, grace, true);
            tm.startWearBondageTask("gag", "duration", duration, true, reward, penalty, grace, true);
            tm.startWearBondageTask("chastity", "duration", duration, true, reward, penalty, grace, true);
            tm.startWearBondageTask("toy", "duration", duration, true, reward, penalty, grace, true);
            tm.startWearBondageTask("blindfold", "duration", duration, true, reward, penalty, grace, true);
            tm.startWearBondageTask("shock", "duration", duration, true, reward, penalty, grace, true);

            // TODO: check retrun and return false if needed
            this.modifyPenaltyPts(-penaltyPtsReduction);

            return true;
        }
        return false;
    }

    startHarshOutfitPunishment(duration: number): boolean {
        const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;
        if (tm) {
            const punishSetting = this.tasksSettings.harshOutfitPunishmentSettings;
            const penaltyPtsReduction = calculatePointsFromFinishCount(duration, punishSetting.baseDurationMs, punishSetting.basePenaltyReduction, true);
            const penalty = punishSetting.basePenalty;
            const reward = punishSetting.baseReward;
            const grace = punishSetting.baseGracePeriodMs;
            const avgRandomExt = this.tasksSettings.wearOutfitTaskSettings.averageRandomExtPerHour;

            const selectedOutfit = selectRandomOutfit(["harsh"], []); // only harsh outfit
            if (!selectedOutfit) {
                return false;
            }

            console.log(`ATB: startHarshOutfitPunishment: Starting with duration: ${duration} and outfit: ${selectedOutfit}`);
            sendLocalMessage("Starting Harsh Outfit Punishement", ChatColor.Purple);

            tm.startWearOutfitTask(selectedOutfit, "duration", duration, true, reward, penalty, grace, true, avgRandomExt, true);

            // TODO: check retrun and return false if needed
            this.modifyPenaltyPts(-penaltyPtsReduction);

            return true;
        }
        return false;
    }

    startDollPunishment(duration: number): boolean {
        const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;
        if (tm) {
            const punishSetting = this.tasksSettings.dollPunishmentSettings;
            const penaltyPtsReduction = calculatePointsFromFinishCount(duration, punishSetting.baseDurationMs, punishSetting.basePenaltyReduction, true);
            const penalty = punishSetting.basePenalty;
            const reward = punishSetting.baseReward;
            const grace = punishSetting.baseGracePeriodMs;
            // Outfit variable
            const outfitAvgRandomExt = this.tasksSettings.wearOutfitTaskSettings.averageRandomExtPerHour;

            // Nickname varible
            const newNickname = "DOLL-" + Player.MemberNumber;

            // Room Control variable
            const roomNameReq = "doll";
            const roomNameReqUseSearch = true;
            const roomtypeReq: RoomControlType = "free";
            let roomMaxMinutesReq = this.tasksSettings.roomControlTaskSettings.roomMaxMinutesReq;
            let roomUseMaxMinutesReq = true;
            if (roomMaxMinutesReq < 15) {
                roomMaxMinutesReq = 15;
            }

            const selectedOutfit = selectRandomOutfit(["doll"], []); // only doll outfit
            if (!selectedOutfit) {
                return false;
            }

            console.log(`ATB: startDollPunishment: Starting with duration: ${duration} and outfit: ${selectedOutfit}`);
            sendLocalMessage("Starting Doll Punishement", ChatColor.Purple);

            tm.startWearOutfitTask(selectedOutfit, "duration", duration, true, reward, penalty, grace, true, outfitAvgRandomExt, true);
            tm.startNicknameTask(newNickname, "duration", duration, true, reward, penalty, grace, true);
            tm.startRoomControlTask(roomNameReq, roomNameReqUseSearch, roomtypeReq, roomUseMaxMinutesReq, roomMaxMinutesReq, "duration", duration, true, reward, penalty, grace, true);

            // TODO: check retrun and return false if needed
            this.modifyPenaltyPts(-penaltyPtsReduction);

            return true;
        }
        return false;
    }

    startDronePunishment(duration: number): boolean {
        const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;
        if (tm) {
            const punishSetting = this.tasksSettings.dronePunishmentSettings;
            const penaltyPtsReduction = calculatePointsFromFinishCount(duration, punishSetting.baseDurationMs, punishSetting.basePenaltyReduction, true);
            const penalty = punishSetting.basePenalty;
            const reward = punishSetting.baseReward;
            const grace = punishSetting.baseGracePeriodMs;
            // Outfit variable
            const outfitAvgRandomExt = this.tasksSettings.wearOutfitTaskSettings.averageRandomExtPerHour;

            // Nickname varible
            const newNickname = "DRONE-" + Player.MemberNumber;

            // Pose variable
            const poseAvgRandom = this.tasksSettings.poseTaskSettings.averageRandomPosePerHour;

            // Room Control variable
            const roomNameReq = "";
            const roomNameReqUseSearch = true;
            const roomtypeReq: RoomControlType = "public_only";
            let roomMaxMinutesReq = this.tasksSettings.roomControlTaskSettings.roomMaxMinutesReq;
            let roomUseMaxMinutesReq = true;
            if (roomMaxMinutesReq < 10 || roomMaxMinutesReq > 20) {
                roomMaxMinutesReq = 10;
            }

            const selectedOutfit = selectRandomOutfit(["drone"], []); // only drone outfit
            if (!selectedOutfit) {
                return false;
            }

            console.log(`ATB: startDronePunishment: Starting with duration: ${duration} and outfit: ${selectedOutfit}`);
            sendLocalMessage("Starting Drone Punishement", ChatColor.Purple);

            tm.startWearOutfitTask(selectedOutfit, "duration", duration, true, reward, penalty, grace, true, outfitAvgRandomExt, true);
            tm.startNicknameTask(newNickname, "duration", duration, true, reward, penalty, grace, true);
            tm.startPoseTask("random", "random", poseAvgRandom, "duration", duration, true, reward, penalty, grace, true);
            tm.startRoomControlTask(roomNameReq, roomNameReqUseSearch, roomtypeReq, roomUseMaxMinutesReq, roomMaxMinutesReq, "duration", duration, true, reward, penalty, grace, true);

            // TODO: check retrun and return false if needed
            this.modifyPenaltyPts(-penaltyPtsReduction);

            return true;
        }
        return false;
    }


    /*
    ********** Helper Functions **********
    */

    getRandomFinishCountOrDuration(baseCount: number): number {
        // Duration will multiplied be between Min and Max
        const baseRandMultMin = (this.settings.minRandomFinishMult / 100);
        const baseRandMultMax = (this.settings.maxRandomFinishMult / 100);

        let randMult = (Math.random() * baseRandMultMax) + baseRandMultMin;
        return Math.floor(baseCount * randMult);
    }

}