import { TaskData } from "@/models/TaskManagerSettings";
import { TaskBase } from "./TaskBase";
import { ChatColor, CloneAndRandomizeList, getCharacterFreeSlots, sendLocalMessage } from "@/utility/utility";
import { addRandomRestrain, addRandomShockDevice, getItemListByGroup, isShockItem } from "@/utility/ItemUtility";
import { WearBondageType } from "@/models/TasksSettings";


export class TaskWearBondage extends TaskBase {
    TICK_PERIOD_MS: number = 5000; // 5sec
    DEFAULT_GRACE_PERIOD_MS: number = 60000; // 60sec

    lastChecked: number = 0;
    isWearingItem: boolean = false;
    lastTimeWearingItem: number = 0;

    constructor(data: TaskData) {
        super(data);
        this.lastTimeWearingItem = Date.now();

        // If player cannot equip it themselve, we handle it at the start of the task
        // TODO: For charUnableToEquipItem, maybe put a chat message with button to ask Player if we should to equip random item
        if (this.data.enforce || this.charUnableToEquipItem(this.data.itemToWear)) {
            let itemToWear = this.data.itemToWear;
            if (!itemToWear) {
                // End the task (error)
                console.warn("TaskWearBondage: Error: itemToWear is undefined.");
                this.triggerTaskCompletion(false, true);
                return;
            }
            this.enforceWear(itemToWear);
        }
    }

    public getDescription(): string {
        return this.data.description;
    }

    protected updateProgress() {
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

        let enforcedStr = this.data.enforce ? " (enforced)" : "";
        this.data.description = `Wear ${this.data.itemToWear} ` + enforcedStr;
    }


    // Main task stuff
    public onTick(currentTime: number): void {
        super.onTick(currentTime);
        if (this.isFinished()) {
            return;
        }
        // Check if the player is wearing the item (this.data.itemToWear) and update progress accordingly
        // If enforce is true and the player is not wearing the item, consider failing the task or applying a penalty
        if (currentTime - this.lastChecked >= this.TICK_PERIOD_MS) { // Check every 5 seconds
            this.updateProgress();
            // Re-validate data just in case
            let itemToWear = this.data.itemToWear;
            let gracePeriodMs = this.data.gracePeriodMs ?? this.DEFAULT_GRACE_PERIOD_MS; // TODO: change for default value (from settings?)
            if (!itemToWear) {
                // End the task (error)
                console.warn("TaskWearBondage: Error: itemToWear is undefined.");
                this.triggerTaskCompletion(false, true);
                return;
            }

            // Update internal variable
            let isWearingBefore = this.isWearingItem;
            this.isWearingItem = TaskWearBondage.checkIfWearingItem(Player, itemToWear);
            this.lastChecked = currentTime;

            // Check if task is finished
            if (this.isFinishConditionComplete()) {
                // End the task (success)
                this.triggerTaskCompletion(true, false);
                return;
            }

            if (this.isWearingItem) {
                this.transgessionOccuring = false;
                this.lastTimeWearingItem = currentTime;
            }
            else {
                // Warning on transgression
                this.transgessionOccuring = true;
                if (this.isWearingItem != isWearingBefore) {
                    sendLocalMessage("You need to wear "+ this.data.itemToWear + " or be punished!", ChatColor.Red);
                }

                // Handle transgression after grace period
                if (currentTime - this.lastTimeWearingItem >= gracePeriodMs) {
                    sendLocalMessage("You need to wear " + this.data.itemToWear + ", you received  " + this.data.badPtsOnFailure + " for transgression.", ChatColor.Red);
                    // Add badPts
                    this.notifyBadPtsChange(this.data.badPtsOnFailure);
                    // Re-start grace period
                    this.lastTimeWearingItem = currentTime;

                    // If player cannot equip it themselve, we handle it after getting badPts
                    if (this.data.enforce || this.charUnableToEquipItem(this.data.itemToWear)) {
                        this.enforceWear(itemToWear);
                    }
                }
            }
        }
    }

    // Force Equip a Random items if checkIfWearingItem() return false
    // return true if an item was equiped
    private enforceWear(itemToWear: WearBondageType): boolean {
        if (TaskWearBondage.checkIfWearingItem(Player, itemToWear)) {
            return false;
        }
        let slotFilter: AssetGroupItemName[] = TaskWearBondage.getSlotPerBondageType(itemToWear);
        let effectFilter: EffectName[] = [];

        // Depending of the item, we want it to have at least one of these effects
        switch (itemToWear) {
            case "hand":
                effectFilter.push("Block");
                break;
            case "leg":
                //effectFilter.push("CuffedFeet");
                //effectFilter.push("Freeze");
                effectFilter.push("Slow");
                break;
            case "gag":
                // List from SpeechGagLevelLookup
                //effectFilter.push("GagTotal4");
	            //effectFilter.push("GagTotal3");
	            //effectFilter.push("GagTotal2");
	            effectFilter.push("GagTotal");
	            effectFilter.push("GagVeryHeavy");
	            effectFilter.push("GagHeavy");
	            effectFilter.push("GagMedium");
	            effectFilter.push("GagNormal");
	            effectFilter.push("GagEasy");
	            effectFilter.push("GagLight");
	            effectFilter.push("GagVeryLight");
                break;
            case "chastity":
                effectFilter.push("Chaste");
                break;
            case "toy":
                // Note: No native item has effect "Vibrating",
                // it's only in AllowEffect, and can be applied as Extended options
                effectFilter.push("Vibrating");

                // Vibe item usually have either "UseRemote" or "Egged"
                effectFilter.push("UseRemote");
                effectFilter.push("Egged");
                break;
            case "blindfold":
                effectFilter.push("BlindLight");
                effectFilter.push("BlindNormal");
                effectFilter.push("BlindHeavy");
                effectFilter.push("BlindTotal");
                break;
            //case "shock":
            //    effectFilter.push("TriggerShock");
            //    effectFilter.push("ReceiveShock");
            //    break;
        }

        if (itemToWear == "shock") {
            // Special handling to find Shock device
            const itemAdded = addRandomShockDevice(Player, false);
            if (itemAdded) return true;
            return false;
        }

        // Add 1 item that fit the effect
        let itemAdded = addRandomRestrain(Player, 1, false, slotFilter, true, effectFilter);

        // Then we can fill randomly some other aplicable slot for more fun
        let nbToAdd = Math.floor(Math.random() * slotFilter.length);
        if (nbToAdd > 0) {
            itemAdded = itemAdded.concat(addRandomRestrain(Player, nbToAdd, false, slotFilter, true));
        }

        if (itemAdded.length > 0) {
            TaskBase.setNeedCharacterUpdate(true);
            return true;
        }
        return false;
    }

    // Note: We want only items that have an effect, not just wearing in the slot
    private static checkIfWearingItem(C: OtherCharacter | PlayerCharacter, itemToWear: WearBondageType): boolean {
        // Because other addon like BCX can add effect to player without any item
        // We check individual item effects instead of Player.hasEffect()

        const effects = TaskWearBondage.getAllEffectsPerBondageType(itemToWear);
        for (let i = 0; i < C.Appearance.length; i++) {
            const item = C.Appearance[i];

            if (itemToWear == "shock") {
                // This one have a spicifc way to check as we can't rely on effect only
                if (isShockItem(item)) {
                    return true;
                }
            } else {
                for (const effect of effects) {
                    if (InventoryItemHasEffect(item, effect)) {
                        return true;
                    }
                }
            }
        }

        return false; // Placeholder
    }

    private static getAllEffectsPerBondageType(itemToWear: WearBondageType): EffectName[] {
        let effects: EffectName[] = [];

        switch (itemToWear) {
            case "hand":
                effects.push("Block");
                break;
            case "leg":
                effects.push("Slow");
                effects.push("Freeze");
                effects.push("CuffedFeet");
                break;
            case "gag":
                effects.push("GagTotal4");
                effects.push("GagTotal3");
                effects.push("GagTotal2");
                effects.push("GagTotal");
                effects.push("GagVeryHeavy");
                effects.push("GagHeavy");
                effects.push("GagMedium");
                effects.push("GagNormal");
                effects.push("GagEasy");
                effects.push("GagLight");
                effects.push("GagVeryLight");
                break;
            case "chastity":
                effects.push("Chaste");
                break;
            case "toy":
                effects.push("Vibrating");
                effects.push("UseRemote");
                effects.push("Egged");
                effects.push("Edged");
                effects.push("DenialMode");
                effects.push("RuinOrgasms");
                break;
            case "blindfold":
                effects.push("BlindLight");
                effects.push("BlindNormal");
                effects.push("BlindHeavy");
                effects.push("BlindTotal");
                break;
            case "shock":
                effects.push("TriggerShock");
                effects.push("ReceiveShock");
                break;
            //case "deaf":
                //effects.push("DeafLight");
                //effects.push("DeafNormal");
                //effects.push("DeafHeavy");
                //effects.push("DeafTotal");
                //break;
        }

        return effects;
    }

    public charUnableToEquipItem(itemToWear: WearBondageType | undefined): boolean {
        // TODO: improve it
        return Player.HasEffect("Block")
    }

    // Check What wear item is available (also used for taskCanStart check)
    public static getItemAvailibility(C: OtherCharacter | PlayerCharacter = Player): WearBondageType[] {
        let itemAvail: WearBondageType[] = [];

        if (TaskWearBondage.checkIfWearingItem(C, "hand") || getCharacterFreeSlots(C, TaskWearBondage.getSlotPerBondageType("hand")).length > 0) {
            itemAvail.push("hand");
        }
        if (TaskWearBondage.checkIfWearingItem(C, "leg") || getCharacterFreeSlots(C, TaskWearBondage.getSlotPerBondageType("leg")).length > 0) {
            itemAvail.push("leg");
        }
        if (TaskWearBondage.checkIfWearingItem(C, "gag") || getCharacterFreeSlots(C, TaskWearBondage.getSlotPerBondageType("gag")).length > 0) {
            itemAvail.push("gag");
        }
        if (TaskWearBondage.checkIfWearingItem(C, "chastity") || getCharacterFreeSlots(C, TaskWearBondage.getSlotPerBondageType("chastity")).length > 0) {
            itemAvail.push("chastity");
        }
        if (TaskWearBondage.checkIfWearingItem(C, "toy") || getCharacterFreeSlots(C, TaskWearBondage.getSlotPerBondageType("toy")).length > 0) {
            itemAvail.push("toy");
        }
        if (TaskWearBondage.checkIfWearingItem(C, "blindfold") || getCharacterFreeSlots(C, TaskWearBondage.getSlotPerBondageType("blindfold")).length > 0) {
            itemAvail.push("blindfold");
        }
        if (TaskWearBondage.checkIfWearingItem(C, "shock") || getCharacterFreeSlots(C, TaskWearBondage.getSlotPerBondageType("shock")).length > 0) {
            itemAvail.push("shock");
        }

        return itemAvail;
    }

    public static getSlotPerBondageType(itemToWear: WearBondageType): AssetGroupItemName[] {
        // All slot:
        //'ItemHands', 'ItemArms','ItemBoots','ItemBreast','ItemButt','ItemFeet','ItemHead','ItemHood',
		//'ItemLegs','ItemMouth','ItemMouth2','ItemMouth3','ItemNeck','ItemNeckAccessories','ItemNeckRestraints',
		//'ItemNipples','ItemNipplesPiercings','ItemNose','ItemPelvis','ItemTorso','ItemTorso2','ItemVulva','ItemVulvaPiercings'
        switch (itemToWear) {
            case "hand":
                return ["ItemHands", "ItemArms", "ItemTorso", "ItemTorso2"];
            case "leg":
                return ["ItemLegs", "ItemBoots", "ItemFeet"];
            case "gag":
                return ["ItemMouth", "ItemMouth2", "ItemMouth3"];
            case "chastity":
                // TODO: add slot for male
                // Excluded "ItemVulvaPiercings" cuz it's boring
                return ["ItemPelvis"];
            case "toy":
                return ["ItemVulva", "ItemVulvaPiercings", "ItemButt"];
            case "blindfold":
                return ["ItemHead", "ItemHood"];
            case "shock":
                return ["ItemPelvis", "ItemVulva", "ItemButt", "ItemNipples", "ItemBreast", "ItemNeckAccessories", "ItemNeckRestraints"];
        }
    }

}