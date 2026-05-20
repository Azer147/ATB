import { ModuleBase } from "./ModuleBase";
import { BC_SDK } from "../index";
import StorageManager from "@/utility/StroageManager";
import { getNameOrNickname, sendActionMessage, shouldTriggerFromAveragePerHour, triggerShock } from "@/utility/utility";
import { DeviousShocksSettings } from "@/models/DeviousShocksSettings";

export type TypeShockEvent = "room_exit" | "struggle" | "standing" | "wardrobe" | "remove_item_self" | "equip_item_other";

export class DeviousShocksModule extends ModuleBase {
    TICK_PERIOD_MS: number = 5000; // 5 seconds
    lastTick: number = 0;

    settings: DeviousShocksSettings;

    constructor() {
        super("DeviousShocksModule", "Devious Shocks", "Deliver random shocks");
        this.settings = StorageManager.getDeviousShocksSettings();
        this.load();
    }

    isEnabled(): boolean {
        return StorageManager.getGlobalEnable() && this.settings.enable;
    }

    load(): void {
        // Hook for tick
        this.hook.push(BC_SDK.hookFunction('TimerProcess', 0, (args, next) => {
            next(args);

            const currentTime = Date.now();
            if (currentTime - this.lastTick >= this.TICK_PERIOD_MS) {
                this.processTick();
                this.lastTick = currentTime;
            }
        }));
        // Priority Lower than RandomEvent
        this.hook.push(BC_SDK.hookFunction('ChatRoomAttemptLeave', 0, (args, next) => {
            if (this.checkIfTriggerShockOnEvent("room_exit")) {
                // Cancel leaving the chat room if an event was triggered
                return;
            }
            next(args);
        }));
        // Pose hook (check trying to stand up)
        this.hook.push(BC_SDK.hookFunction('PoseSetActive', 0, (args, next) => {
            if (args.length >= 2) {
                const C: Character = args[0];
                const newPose: AssetPoseName | null = args[1];
                // Not sure if need to check previous Pose as well
                const isCharKneeling = C.Pose.includes("Kneel") || C.Pose.includes("KneelingSpread");
                if (newPose && newPose == "BaseLower" && isCharKneeling) {
                    if (this.checkIfTriggerShockOnEvent("standing")) {
                        // Cancel the event
                        return;
                    }
                }
            }
            next(args);
        }));
        // Open Wardrobe hook
        this.hook.push(BC_SDK.hookFunction('ChatRoomOpenWardrobeScreen', 0, (args, next) => {
            if (this.checkIfTriggerShockOnEvent("wardrobe")) {
                // Cancel leaving the chat room if an event was triggered
                return;
            }
            next(args);
        }));
        // Item interaction (struggle / equip /remove / swap)
        this.hook.push(BC_SDK.hookFunction('DialogStruggleStart', 0, (args, next) => {
            if (args.length >= 2) {
                const C: Character = args[0];
                const action: DialogStruggleActionType = args[1];

                let event: TypeShockEvent | undefined = undefined;
                if (C.IsPlayer() && action == "ActionStruggle" || action == "ActionEscape") {
                    event = "struggle";
                }
                else if (C.IsPlayer() && action == "ActionRemove" || action == "ActionDismount" || action == "ActionUnlockAndRemove") {
                    event = "remove_item_self";
                }
                else if (C.IsPlayer() == false && action == "ActionUse") {
                    event = "equip_item_other";
                }

                if (event) {
                    if (this.checkIfTriggerShockOnEvent(event)) {
                        // Cancel the event
                        return;
                    }
                }
            }
            next(args);
        }));
    }

    unload(): void {
        super.unload();
    }

    private checkIfTriggerShockOnEvent(event: TypeShockEvent): boolean {
        if (this.isEnabled()) {
            let eventChance: number = 0;
            getNameOrNickname
            let msg: string = "Devious Shocks punished " + getNameOrNickname(Player) + " for trying to ";

            switch (event) {
                case "room_exit":
                    eventChance = this.settings.chanceOnRoomExit;
                    msg += "leave the room.";
                    break;
                case "struggle":
                case "remove_item_self":
                    eventChance = this.settings.chanceOnStruggle;
                    msg += "remove a worn item.";
                    break;
                case "standing":
                    eventChance = this.settings.chanceOnStanding;
                    msg += "stand.";
                    break;
                case "wardrobe":
                    eventChance = this.settings.chanceOnWardrobe;
                    msg += "access wardrobe.";
                    break;
                case "equip_item_other":
                    eventChance = this.settings.chanceOnEquipItemOnOthers;
                    msg += "equip an item on others.";
                    break;
            }

            if (eventChance > 0 && Math.floor(Math.random() * 100) < eventChance) {
                // Trigger shock if Player wearing a shock device
                if (triggerShock(Player)) {
                    sendActionMessage(msg);

                    // Cancel StandUp
                    if (event == "standing") {
                        PoseSetActive(Player, "Kneel");
                        ServerSend("ChatRoomCharacterPoseUpdate", { Pose: Player.ActivePose });
                    }

                    // Cancel struggle / Item Dialog
                    if (event == "struggle" || event == "remove_item_self" || event == "equip_item_other") {
                        StruggleProgressStruggleCount = 0;
                        StruggleProgress = 0;
                        DialogLeaveDueToItem = true;
                    }
                    return true;
                }
            }
        }
        return false;
    }

    private processTick() {
        if (this.isEnabled()) {
            const inchatRoom = (window.CurrentScreen == "ChatRoom");

            // Check if should trigger Random Shocks
            if (inchatRoom && this.settings.shockAveragePerHour > 0) {
                if (shouldTriggerFromAveragePerHour(this.settings.shockAveragePerHour, this.TICK_PERIOD_MS)) {
                    // Trigger shock if Player wearing a shock device
                    triggerShock(Player);
                }
            }
        }
    }

}