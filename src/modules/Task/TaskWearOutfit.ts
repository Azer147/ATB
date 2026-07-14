import { TaskData } from "@/models/TaskManagerSettings";
import { TaskBase } from "./TaskBase";
import { ChatButton, ChatColor, getBCXActiveCurseSlots, getNameOrNickname, isBodyPart, isClothe, isItem, isLscgCursedItemActive, sendActionMessage, sendLocalMessage, shouldTriggerFromAveragePerHour, stripNakedCharacterAdv } from "@/utility/utility";
import { randomizeExtendedItem } from "@/utility/ItemUtility";
import { allOutfitList, extractOutfitDataFromId, getRawOutfitFromId, OutfitId, OutfitTag } from "@/models/OutfitSettings";
import { smartReplaceItemColor } from "@/utility/ColorUtility";
import StorageManager from "@/utility/StorageManager";
import { GuiMainView } from "@/gui/GuiMainView";


export class TaskWearOutfit extends TaskBase {
    outfitName: string = "";
    outfitItem: ItemBundle[] = [];
    outfitTags: OutfitTag[] = [];
    outfitCannotRandomizeSlot: string[] = []; // AssetGroupName

    firstEquipDone: boolean = false;

    // store it to avoid too many expensive call
    activeBcxCurse: AssetGroupName[] = [];

    constructor(data: TaskData) {
        super(data);

        // Validate data
        if (!this.data.outfitId) {
            // End the task (error)
            console.warn("ATB: TaskWearOutfit: Error: outfitId is undefined.");
            this.triggerTaskCompletion(false, true);
            return;
        }
        if (!this.outfitItem || this.outfitItem.length == 0) {
            if (!this.extractOutfitData()) {
                // End the task (error)
                console.warn("ATB: TaskWearOutfit: Error: outfitId is undefined.");
                this.triggerTaskCompletion(false, true);
                return;
            }
        }

        // Equip the outfit (and strip) for the first time
        if (!this.firstEquipDone) {
            this.firstEquipDone = true;
            stripNakedCharacterAdv(Player, false);
            this.applyOutfit();
            return;
        }
    }

/**
 * Specifics strings for UI/User
 */

    public getDescription(): string {
        let enforcedStr = this.data.enforce ? " (enforced)" : "";
        this.data.description = `Wear Outfit ${this.getOutfitName()} ` + enforcedStr;
        return this.data.description;
    }
    protected handleTransgression() {
        sendLocalMessage("You need to wear outfit \""+ this.getOutfitName() + "\", you received " + this.data.penaltyPtsOnFailure + " Penalty points for transgression.", ChatColor.Red);
        // Equip outfit
        this.applyOutfit();
    }
    protected handleTransgressionWarning() {
        const buttonApplyOutfit: ChatButton = {htmlId: "atb-chatbtn-equip-outfit", label: "Equip Outfit", onClick: () => {
            this.applyOutfit();
        }};

        sendLocalMessage("You need to wear outfit \""+ this.getOutfitName() + "\" or you will get " + this.data.penaltyPtsOnFailure + " Penalty points!", ChatColor.Red, [buttonApplyOutfit]);
    }

    protected isCharUnableToDoTask(): boolean {
        return false;
    }


/**
 * Core Task Functions
 */

    protected checkTaskIsRespected(): boolean {
        return this.checkIfWearingOutfit();
    }

    protected enforceTask(): boolean {
        // Since there is no process difference if enforced or not
        // We just handle it in handleTransgression and do nothing here
        // this.applyOutfit();
        return true;
    }

    // Triggered every this.TICK_PERIOD_MS
    protected handlePeriodicEvent() {
        // Randomize Extended items options
        if (this.data.averageRandomExtPerHour && this.data.averageRandomExtPerHour > 0) {
            if (shouldTriggerFromAveragePerHour(this.data.averageRandomExtPerHour, this.TICK_PERIOD_MS)) {
                this.randomizeOutfitItem();
            }
        }
    }

    protected handleTaskFinishing() {
        if (this.data.removeOnFinish) {
            this.removeOutfit();
        }
    }

    protected handleEditTask(newTaskData: TaskData): boolean {
        // TODO: data validation ?
        if (newTaskData.removeOnFinish !== undefined) {
            this.data.removeOnFinish = newTaskData.removeOnFinish;
        }
        if (newTaskData.averageRandomExtPerHour !== undefined) {
            this.data.averageRandomExtPerHour = newTaskData.averageRandomExtPerHour;
        }
        return true;
    }


/**
 * Specifcs Task Functions
 */

    // to be used whenever outfitName or outfitItems are empty
    private extractOutfitData(): boolean {
        if (this.data.outfitId) {
            const rawOutfit = getRawOutfitFromId(this.data.outfitId);
            if (rawOutfit) {
                this.outfitName = rawOutfit.name;
                this.outfitTags = rawOutfit.tags;
                this.outfitCannotRandomizeSlot = rawOutfit.cannotRandomize ?? [];
                this.outfitItem = extractOutfitDataFromId(this.data.outfitId);
                if (this.outfitItem.length > 0) {
                    return true;
                } else {
                    return false;
                }
            }
        }
         else {
            this.outfitName = "Unknown Outfit";
        }
        return false;
    }

    private getOutfitName(): string {
        // Exctract outfit name from id
        if (!this.outfitName || this.outfitName.length == 0) {
            this.extractOutfitData();
        }
        return this.outfitName;
    }

    // Force Equip a Random items if checkIfWearingOutfit() return false
    // return true if an item was equiped
    private applyOutfit(): void {
        // Try to reduce this call (probably expensive)
        this.activeBcxCurse = getBCXActiveCurseSlots();

        // Special case: remove LSCG cursed-item if active
        // Note: Task cannot start with cursed-item active,
        //      so this is only necessary when cursed-item have been applied during the task.
        if (isLscgCursedItemActive(Player)) {
            stripNakedCharacterAdv(Player, false);
            CharacterReleaseTotal(Player, false);
        }

        const enableCustomColor = StorageManager.getOutfitSettings().enableCustomColor && this.outfitTags.includes("custom_color");
        const customColorHex = StorageManager.getOutfitSettings().customColorHex;
        for (let i = 0; i < this.outfitItem.length; i++) {
            let item = this.outfitItem[i];

            // Check Player is wearing item
            let worn = InventoryGet(Player, item.Group);
            if (worn && worn.Asset.Name == item.Name) {
                continue;
            } else if (worn && this.activeBcxCurse.includes(worn.Asset.Group.Name)) {
                continue;
            } else { // Player Not wearing it
                // If item is not allowed, ignore it.
                if (!TaskWearOutfit.isItemAllowed(Player, item)) {
                    continue;
                }

                // Apply outfit item
                let appliedItem = InventoryWear(Player, item.Name, item.Group, item.Color, item.Difficulty, undefined, item.Craft, false);
                if (appliedItem) {
                    if (item.Property) {
                        appliedItem.Property = item.Property;
                    }
                    // Use Custom Color if needed
                    if (enableCustomColor && appliedItem.Color && !isBodyPart(appliedItem)) {
                        let customColor = smartReplaceItemColor(customColorHex, appliedItem.Color);
                        if (customColor && customColor !== "Default") {
                            appliedItem.Color = customColor;
                        }
                    }
                }

                // Maybe keep for debug
                /*if (!appliedItem) {
                    console.warn("ATB: applyOutfit: cannot apply item: ", item);
                }*/
            }
        }
        TaskBase.setNeedCharacterUpdate(true);
    }

    private randomizeOutfitItem(): void {
        if (this.outfitTags.includes("can_randomize")) {
            for (let i = 0; i < this.outfitItem.length; i++) {
                let item = this.outfitItem[i];

                if (this.outfitCannotRandomizeSlot.includes(item.Group)) {
                    continue;
                }

                // Check Player is wearing item (and not clothes/body part)
                let worn = InventoryGet(Player, item.Group);
                if (worn && worn.Asset.Name == item.Name && isItem(worn)) {
                    // TODO: only randomize some items (not all)
                    randomizeExtendedItem(Player, worn);
                }
            }
            TaskBase.setNeedCharacterUpdate(true);
            sendActionMessage(getNameOrNickname(Player) + "'s restraints configuration has been changed!");
        }
    }

    private removeOutfit(): void {
        for (let i = 0; i < this.outfitItem.length; i++) {
            let item = this.outfitItem[i];

            let worn = InventoryGet(Player, item.Group);
            if (worn && worn.Asset.Name == item.Name) {
                // Remove item if Player is wearing item
                InventoryRemove(Player, item.Group, false);
            }
        }
        TaskBase.setNeedCharacterUpdate(true);
    }

    private checkIfWearingOutfit(): boolean {
        for (let i = 0; i < this.outfitItem.length; i++) {
            let item = this.outfitItem[i];

            // If item is not allowed, ignore it.
            if (!TaskWearOutfit.isItemAllowed(Player, item)) {
                continue;
            }

            let worn = InventoryGet(Player, item.Group);
            if (worn && worn.Asset.Name == item.Name) {
                // item is worn
                continue;
            } else {
                // item not worn or different
                //console.warn("ATB: checkIfWearingOutfit: item not worn: ", item);
                return false;
            }
        }

        return true;
    }

    private static isItemAllowed(C: OtherCharacter | PlayerCharacter, item: ItemBundle): boolean {
        // check Player Permission
        if (InventoryIsPermissionBlocked(C, item.Name, item.Group) || InventoryIsPermissionLimited(C, item.Name, item.Group)) {
            return false;
        }

        // Unequipable item
        if (item.Name == "SlaveCollar") {
            return false;
        }

        let worn = InventoryGet(C, item.Group);
        if (worn) {
            // Don't replace collar
            if (item.Group == "ItemNeck") {
                return false;
            }
            // Don't replace Owner, Lover and DOGS padlocks
            if (worn.Property && worn.Property.LockedBy) {
                const lockToAvoid: AssetLockType[] = ["OwnerPadlock", "OwnerTimerPadlock", "LoversPadlock", "LoversTimerPadlock"];
                if (lockToAvoid.includes(worn.Property.LockedBy)) {
                    return false;
                }
                // DOGS padlock
                if (worn.Property.LockedBy == "ExclusivePadlock" && (worn.Property as any).Name == "DeviousPadlock") {
                    return false;
                }
            }
        }

        return true;
    }

    public static getAvailableOutfit(C: OtherCharacter | PlayerCharacter): OutfitId[] {
        let availOutfit: OutfitId[] = [];
        for (let i = 0; i < allOutfitList.length; i++) {
            let id = allOutfitList[i].id;
            if (TaskWearOutfit.canOutfitApply(C, id)) {
                availOutfit.push(id);
            }
        }
        return availOutfit;
    }

    // return true if outfit can be applied
    public static canOutfitApply(C: OtherCharacter | PlayerCharacter, outfitId: OutfitId): boolean {
        let nbAllowed = 0;
        const outfitItem = extractOutfitDataFromId(outfitId);
        for (let i = 0; i < outfitItem.length; i++) {
            let item = outfitItem[i];

            // If item is not allowed, ignore it.
            if (!TaskWearOutfit.isItemAllowed(C, item)) {
                continue;
            }

            nbAllowed += 1;
        }

        // Return true if more than 75% of items can be applied
        const allowedPercentage = nbAllowed / outfitItem.length;
        return (allowedPercentage >= 0.75);
    }
}