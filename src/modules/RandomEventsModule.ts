import { ModuleBase } from "./ModuleBase";
import { BC_SDK } from "../index";
import { ChatColor, CloneAndRandomizeList, getNbLockableItems, lockAllItems, lockAllItemsWithRandomPassword, sendActionMessage, sendLocalMessage } from "@/utility/utility";
import { addRandomRestrain } from "@/utility/ItemUtility";
import { RandomEventsSettings } from "@/models/RandomEventsSettings";
import StorageManager from "@/utility/StroageManager";

export class RandomEventsModule extends ModuleBase {
    // List of all events that can be triggered
    events: (() => boolean)[] = [
        this.eventAddRestraint,
        this.eventAddLocks,
        this.eventRandomPasswordLock
    ];

    // Chance (temp while no settings)
    CHANCE_EVENT: number = 10; // 10% chance to trigger an event
    CHANCE_HARSH_EVENT: number = 1; // chance that event will use harsher variant

    // AddLock event lock list
    simpleLockList: AssetLockType[] = ["ExclusivePadlock", "MetalPadlock"];

    settings: RandomEventsSettings;

    constructor() {
        super("RandomEventsModule", "Random Events", "Triggers random events in the game.");
        this.settings = StorageManager.getRandomEventsSettings();
        this.load();
    }

    isEnabled(): boolean {
        return StorageManager.getGlobalEnable() && this.settings.enable;
    }

    load(): void {
        // Trigger: Enter a new chat room
        this.hook.push(BC_SDK.hookFunction('ChatRoomSync', 0, (args, next) => {
            if (this.settings.enableTriggerOnRoomEntry) {
                this.checkIfTriggerRandomEvent();
            }
            return next(args);
        }));
        // Trigger: Leaving a chat room
        // Note: Priority Higher than DeviousShock
        this.hook.push(BC_SDK.hookFunction('ChatRoomAttemptLeave', 1, (args, next) => {
            if (this.settings.enableTriggerOnRoomExit) {
                if (this.checkIfTriggerRandomEvent()) {
                    // Cancel leaving the chat room if an event was triggered
                    return;
                }
            }
            next(args);
        }));
    }

    unload(): void {
        super.unload();
    }

    checkIfTriggerRandomEvent() {
        if (!this.isEnabled()) return false;

        if (Math.floor(Math.random() * 100) < this.CHANCE_EVENT) {
            return this.triggerRandomEvent();
        }
        return false;
    }

    triggerRandomEvent(): boolean {
        console.log("RandomEventsModule: A random event has been triggered!");
        sendLocalMessage("You triggered a trap!", ChatColor.Red);
        sendActionMessage(Player.Name + " has triggered a trap!");

        // Randomly select an event to trigger
        let randEventList = CloneAndRandomizeList(this.events);
        for (let eventFunc of randEventList) {
            if (eventFunc.call(this)) {
                // If the event was successfully triggered, break out of the loop
                return true;
            }
        }
        return false;
    }

    eventAddRestraint(): boolean {
        if (!this.settings.enableAddRestraintEvent) return false;

        console.log("RandomEventsModule: Add Restraint event triggered");
        let addedItem: Item[];
        if (Math.floor(Math.random() * 100) < this.CHANCE_HARSH_EVENT) {
            // Special harsh case
            //CharacterFullRandomRestrain(Player, "ALL");
            console.log("RandomEventsModule: Add Restraint event triggered, will add 20 restraints");
            addedItem = addRandomRestrain(Player, 20, true, undefined, true);
        } else {
            //CharacterFullRandomRestrain(Player, "FEW");
            let nbToAdd = 2 + Math.floor(Math.random() * 4); // Add 2 to 5 restraints
            console.log("RandomEventsModule: Add Restraint event triggered, will add " + nbToAdd + " restraints");
            addedItem = addRandomRestrain(Player, nbToAdd, true, undefined, true);
        }
	    //ChatRoomCharacterUpdate(Player);
        console.log("RandomEventsModule: " + addedItem.length + " added!");
        sendLocalMessage("Some restraints has been locked on you!", ChatColor.Red);
        return true;
    }

    eventRandomPasswordLock(): boolean {
        if (!this.settings.enableRandomPasswordLockEvent) return false;

        let nbLockableItems: number = getNbLockableItems(Player);
        console.log("RandomEventsModule: Random Password Lock event nbLockableItems: " + nbLockableItems);

        if (nbLockableItems > 0) {
            lockAllItemsWithRandomPassword(Player);
            sendLocalMessage("Some of your restraints has been locked with a Password padlock!", ChatColor.Red);
            return true;
        }
        return false;
    }

    eventAddLocks(): boolean {
        if (!this.settings.enableAddLocksEvent) return false;

        let nbLockableItems: number = getNbLockableItems(Player);
        console.log("RandomEventsModule: Add Lock event nbLockableItems: " + nbLockableItems);

        // TODO: Also tighten restraints ?
        if (nbLockableItems > 0) {
            let lockType: AssetLockType = "ExclusivePadlock";
            if (Math.random() < this.CHANCE_HARSH_EVENT) {
                // Special harsh case
                lockType = "HighSecurityPadlock";
            } else {
                // Randomly select from simpleLockList
                let shuffledLockList = CloneAndRandomizeList(this.simpleLockList);
                lockType = shuffledLockList[0];
            }

            lockAllItems(Player, lockType);
            sendLocalMessage("Some of your restraints has been locked with a padlock!", ChatColor.Red);
            return true;
        }
        return false;
    }
}