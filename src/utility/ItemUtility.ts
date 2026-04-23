import { CloneAndRandomizeList } from "./utility";


	// From AssetGroupItemName
	const restraintSlotList: AssetGroupItemName[] = [
		'ItemHands', 'ItemArms','ItemBoots','ItemBreast','ItemButt','ItemFeet','ItemHead','ItemHood',
		'ItemLegs','ItemMouth','ItemMouth2','ItemMouth3','ItemNeck','ItemNeckAccessories','ItemNeckRestraints',
		'ItemNipples','ItemNipplesPiercings','ItemNose','ItemPelvis','ItemTorso','ItemTorso2','ItemVulva','ItemVulvaPiercings'
	];
	// Excluded: 'ItemEars', 'ItemDevices', 'ItemAddon'

	/*
	// Dump asset list for restraintSlotList
	let itemList = [];
	for (let i = 0; i < restraintSlotList.length; i++) {
		let slot = restraintSlotList[i];
		for (let j = 0; j < Asset.length; j++) {
			let asset = Asset[j];
			if (asset.Group.Name == slot) {
				itemList.push(asset);
			}
		}
	}

	for (let i = 0; i < itemList.length; i++) {
        console.log("{\n\tName: " + itemList[i].Name + ",\n\tGroup: " + itemList[i].Group.Name + ",\n\tFetish: " + itemList[i].Fetish + ",\n\tDescription: " + itemList[i].Description + ",\n}");
	}
	*/

	// FetishName
	/*
	"Bondage" | "Gagged" | "Blindness" | "Deafness" | "Chastity" | "Exhibitionist" | "Masochism" |
	"Sadism" | "Rope" | "Latex" | "Leather" | "Metal" | "Tape" | "Nylon" | "Lingerie" | "Pet" |
	"Pony" | "ABDL" | "Forniphilia"
	;
	// only these good enough (others are too limited)
	"Gagged" | "Rope" | "Latex" | "Leather" | "Metal" | "Tape" | "Nylon" | "Lingerie" | "Pet"
	*/

	// themed restraints idea, but that would need re-building my own asset name list for each theme, so yeah nah
	// "metal" | "leather" | "latex" | "rope" | "cloth" | "wood" | "Cyber" | "Prison" | "Pet" | "Doll" | "Medical" | "Generic"


// Main function
// @param slotList: will only try to use these slot (default to restraintSlotList)
// @param effects: will only use item that match this Effect list (empty => everything allowed)
// @param fetish: will only use item that match this fetish list (empty => everything allowed)
// @return list of added items
// TODO: Should get all items for each slot first, then randomly select items directly.
//    Because we select a random slot first, Issue is, if slot have very few items, these item have a much higher chance of being selected
//    ex: if slot1 have 1 item eligible, and slot2 & slot3 have 50 items, then the 1 item from slot1 have 33% chance to be selected.
// TODO: Global settings to exclude ABDL fetish, cuz for chaste effect, almost half of the items eligible are diapers.
export function addRandomRestrain(C: Character, nbToAdd: number, slotList: AssetGroupItemName[] = restraintSlotList, ignoreRequirement: boolean = false, effects: EffectName[] = [], fetish: FetishName[] = []): Item[] {
    // InventoryWearRandom
    // InventoryGetRandom
    // Full list of item: Asset
    //Asset[0]
    //CharacterFullRandomRestrain(C, "ALL");
    console.log("ATB: addRandomRestrain: nbToAdd=" + nbToAdd + " slotList=", slotList, " effects=", effects, " fetish=", fetish)
    if (slotList.length <= 0) {
        return [];
    }

    // IgnoreRequirements=false will add these checks (not sure the difference between these 2):
    // (!Group || InventoryGroupIsBlocked(C, GroupName) // Check if slot is blocked
    // InventoryAllow(C, AssetList[A], undefined, false) // Check if the item can be added

    let addedItem: Item[] = []
    let randSlotList = CloneAndRandomizeList(slotList);
    for (let i = 0; i < randSlotList.length && addedItem.length < nbToAdd; i++) {
        let slot = randSlotList[i];
        if (!InventoryGet(C, slot)) {
            let item: Item | null = null;

            // Check if slot is blocked by another item
            // Note: ignored with IgnorePrerequisites in InventoryGetRandom()
            // test without InventoryAllow: Can't add toy with chastity already there
            // not blocked by clothes
            if (!ignoreRequirement && InventoryGroupIsBlocked(C, slot)) {
                continue;
            }

            // Get allow/filtered itemList
            let itemList = getItemListByGroup(C, slot, effects, fetish);
            if (itemList.length === 0) {
                continue;
            }
            // Equip an item from itemList
            item = InventoryWearRandom(C, slot, undefined, undefined, false, false, itemList, true);

            // Sometimes InventoryWearRandom() retrun null even if an item was equiped, so we do InventoryGet again
            item = item ?? InventoryGet(C, slot);
            if (item) {
                // Randomize Extended item (InventoryWearRandom only support ExtendedArchetype.TYPED)
                randomizeExtendedItem(C, item, effects);
                console.log("Added restraint: " + item.Asset.Name + " in slot: " + slot);
                addedItem.push(item);
            }
            /*else {
                console.log("Failed to add restraint in slot: " + slot + " item: " + item + " character slot: " + C.Appearance.find(a => a.Asset.Group.Name == slot)?.Asset.Name);
            }*/
        }
        /*else {
            console.log("Slot: " + slot + " is already occupied by item: " + InventoryGet(C, slot)?.Asset.Name);
        }*/
    }

    ChatRoomCharacterUpdate(C);
    return addedItem;
}

// Main function (helper for addRandomRestrain())
// @param effects: Filter only item that have one of the Effect
// @param fetish:  Filter only item that have one of the Fetish
export function getItemListByGroup(C: Character, groupName: AssetGroupName, effects: EffectName[] = [], fetish: FetishName[] = []): string[] {
    let itemList: string[] = [];
    for (let i = 0; i < Asset.length; i++) {
        let item: Asset = Asset[i];
        if (item.Group.Name == groupName) {
            // Check item is usable
            if (!item.Wear) continue;
            //if (!item.Random) continue;
            //if (!item.Enable) continue;

            // Check Player permission
            if (InventoryIsPermissionBlocked(C, item.Name, item.Group.Name) || InventoryIsPermissionLimited(C, item.Name, item.Group.Name)) {
                continue;
			}

            // Check item prerequisites
            // Note: ignored with IgnorePrerequisites in InventoryGetRandom()
            // Test without InventoryGroupIsBlocked: Only allow not blocked item (may remove other item ??)
            // Also seems to properly block gendered item
            /*if (!InventoryAllow(C, item, undefined, false)) {
                    continue;
            }*/
           if (!checkItemAllow(C, item)) continue;

            let effectMatch: boolean = false;
            if (effects.length > 0) {
                if (item.Effect && item.Effect.length > 0 && item.Effect.some(item => effects.includes(item))) {
                    effectMatch = true;
                }
                // TEST for Extended item
                if (item.AllowEffect && item.AllowEffect.length > 0 && item.AllowEffect.some(item => effects.includes(item))) {
                    effectMatch = true;
                }
            } else {
                effectMatch = true;
            }

            let fetishMatch: boolean = false;
            if (fetish.length > 0) {
                if (item.Fetish && item.Fetish.length > 0 && item.Fetish.some(item => fetish.includes(item))) {
                    fetishMatch = true;
                }
            } else {
                fetishMatch = true;
            }

            if (effectMatch && fetishMatch) {
                itemList.push(item.Name);
                //console.log("ATB: DEBUG: getItemListByGroup: item.Name=" + item.Name + " item.Effect=", item.Effect, " item.AllowEffect=", item.AllowEffect)
            }
        }
    }
    //console.log("ATB: DEBUG: getItemListByGroup: itemList=" + itemList);
    return itemList;
}

// Partial InventoryAllow
export function checkItemAllow(C: Character, item: Asset) {
    for (const prereq of item.Prerequisite) {
        let msg = checkPartialItemPrerequisites(C, prereq, item);
        if (msg != "") {
            console.log("ATB: DEBUG: checkItemAllow => false: ", msg);
            return false;
        }
    }
    return true;
}

// Copied from InventoryPrerequisiteMessage
// We doing this cause we want to apply most restriction, but still allow items to be equip if it's block by another item
//      ex: Able to equip vibes if chastity belt is worn and closed
export function checkPartialItemPrerequisites(C: Character, Prerequisite: AssetPrerequisite, asset: Asset | undefined): string {
    // Basic prerequisites that can apply to many items
    switch (Prerequisite) {
        case "NoItemFeet": return (InventoryGet(C, "ItemFeet") != null) ? "MustFreeFeetFirst" : "";
        case "NoItemArms": return (InventoryGet(C, "ItemArms") != null) ? "MustFreeArmsFirst" : "";
        case "NoItemLegs": return (InventoryGet(C, "ItemLegs") != null) ? "MustFreeLegsFirst" : "";
        case "NoItemHands": return (InventoryGet(C, "ItemHands") != null) ? "MustFreeHandsFirst" : "";
        /*case "NotKneeling": {
            return (
                PoseAllKneeling.some(p => C.PoseMapping.BodyLower === p)
                && !PoseAllStanding.some(p => PoseAvailable(C, "BodyLower", p))
            ) ? "MustStandUpFirst" : "";
        }*/
        case "NotMounted": return C.Effect.includes("Mounted") ? "CannotBeUsedWhenMounted" : "";
        case "NotSuspended": return C.IsSuspended() ? "RemoveSuspensionForItem" : "";
        case "NotLifted": return C.Effect.includes("Lifted") ? "RemoveSuspensionForItem" : "";
        case "NotChaste": return C.Effect.includes("Chaste") ? "RemoveChastityFirst" : "";
        case "NotChained": return C.Effect.includes("IsChained") ? "RemoveChainForItem" : "";
        case "Collared": return (InventoryGet(C, "ItemNeck") == null) ? "MustCollaredFirst" : "";
        case "CannotBeSuited": return InventoryIsItemInList(C, "ItemArms", ["FullLatexSuit"]) ? "CannotBeSuited" : "";
        case "CannotHaveWand": return InventoryIsItemInList(C, "ItemVulva", ["WandBelt", "HempRopeBelt"]) ? "CannotHaveWand" : "";
        case "OnBed": return !C.Effect.includes("OnBed") ? "MustBeOnBed" : "";
        case "CuffedArms": return  !C.Effect.includes("CuffedArms") ? "MustBeArmCuffedFirst" : "";
        case "CuffedLegs": return !C.Effect.includes("CuffedFeet") ? "MustBeFeetCuffedFirst" : "";
        case "CuffedFeet": return !C.Effect.includes("CuffedFeet") ? "MustBeFeetCuffedFirst" : "";
        case "CuffedArmsOrEmpty": return (InventoryGet(C, "ItemArms") != null && !C.Effect.includes("CuffedArms")) ? "MustFreeArmsFirst" : "";
        case "CuffedLegsOrEmpty": return (InventoryGet(C, "ItemLegs") != null && !C.Effect.includes("CuffedLegs")) ? "MustFreeLegsFirst" : "";
        case "CuffedFeetOrEmpty": return (InventoryGet(C, "ItemFeet") != null && !C.Effect.includes("CuffedFeet")) ? "MustFreeFeetFirst" : "";
        //case "NoOuterClothes": return InventoryHasItemInAnyGroup(C, ["Cloth", "ClothLower"]) ? "RemoveClothesForItem" : "";
        //case "NoClothLower": return InventoryHasItemInAnyGroup(C, ["ClothLower"]) ? "RemoveClothesForItem" : "";
        case "NoMaidTray": return InventoryIsItemInList(C, "ItemMisc", ["WoodenMaidTray", "WoodenMaidTrayFull"]) ? "CannotBeUsedWhileServingDrinks" : "";
        case "CanBeCeilingTethered": return InventoryHasItemInAnyGroup(C, ["ItemArms", "ItemTorso", "ItemTorso2", "ItemPelvis"]) ? "" : "AddItemsToUse";

        // Checks for body
		case "HasBreasts": return !InventoryIsItemInList(C, "BodyUpper", ["XLarge", "Large", "Normal", "Small"]) ? "MustHaveBreasts" : "";
		case "HasFlatChest": return !InventoryIsItemInList(C, "BodyUpper", ["FlatSmall", "FlatMedium"]) ? "MustHaveFlatChest" : "";

		// Checks for genitalia
		case "HasVagina": return !InventoryIsItemInList(C, "Pussy", ["Pussy1", "Pussy2", "Pussy3"]) ? "MustHaveVagina" : "";
		case "HasPenis": return !InventoryIsItemInList(C, "Pussy", ["Penis"]) ? "MustHavePenis" : "";
		case "CanHaveErection": {
			if (!InventoryIsItemInList(C, "Pussy", ["Penis"]))
				return "MustHavePenis";
			if (C.HasEffect("Chaste"))
				return "CantHaveErection";
			return "";
		}
		case "CanBeLimp": {
			if (!InventoryIsItemInList(C, "Pussy", ["Penis"]))
				return "MustHavePenis";
			if (C.HasEffect("ForcedErection"))
				return "CantBeLimp";
			return "";
		}

		// Checks for chastity cages, in case of penis protruding items.
		case "NoChastityCage": return InventoryIsItemInList(C, "ItemVulva", ["TechnoChastityCage", "PlasticChastityCage1", "PlasticChastityCage2", "FlatChastityCage", "ChastityPouch", "Ballspreader"]) ? "MustRemoveChastityCage" : "";
		case  "NoErection": return C.HasEffect("ForcedErection") ? "MustNotHaveForcedErection" : "";

        // Ensure crotch is empty
		case "VulvaEmpty": return (InventoryGet(C, "ItemVulva") != null) ? "MustFreeVulvaFirst" : "";
		case "ClitEmpty": return ((InventoryGet(C, "ItemVulvaPiercings") != null)) ? "MustFreeClitFirst" : "";
		case "ButtEmpty": return ((InventoryGet(C, "ItemButt") != null)) ? "MustFreeButtFirst" : "";

        // Layered Gags, prevent gags from being equipped over other gags they are incompatible with
		case "GagUnique": return InventoryPrerequisiteConflicts.GagPrerequisite(C, ["GagFlat", "GagCorset", "GagUnique"], asset);
		case "GagCorset": return InventoryPrerequisiteConflicts.GagPrerequisite(C, ["GagCorset"], asset);

		// There's something in the mouth that's too large to allow that item on
		case "NotProtrudingFromMouth": return InventoryPrerequisiteConflicts.GagEffect(C, ["ProtrudingMouth"], asset, { errMessage: "CannotBeUsedOverGag" });

        case "NeedsNippleRings": return !InventoryIsItemInList(C, "ItemNipplesPiercings", ["RoundPiercing"]) ? "NeedsNippleRings" : "";
		case "CanAttachMittens": return !CharacterHasItemWithAttribute(C, "CanAttachMittens") ? "CantAttachMittens" : "";
		case "NeedsChestHarness": return !CharacterHasItemWithAttribute(C, "IsChestHarness") ? "NeedsChestHarness" : "";
		case "NeedsHipHarness": return !CharacterHasItemWithAttribute(C, "IsHipHarness") ? "NeedsHipHarness" : "";

		// Returns no message, indicating that all prerequisites are fine
		case "GagFlat": return "";
        default: return "";
    }
}


/*
***** Functions to change item's properties (i.e. other options not indentified in data's options) *****
*/

// For randomize extended item
// ModularItemDataLookup[`${item.Asset.Group.Name}${item.Asset.Name}`];
// This contains all possible value in "moodule" as well as applied effect "Effect"
// module[0].Options[0].Property.Effect // Effect applied
// module[0].Options[0].Property.Block  // slot Blocked
// module[0].Options[0].Property.TypeRecord // internal variables

// Main function (also helper for addRandomRestrain())
export function randomizeExtendedItem(C: Character, item: Item, effects: EffectName[] = []) {
    switch (item.Asset.Archetype) {
        case ExtendedArchetype.TYPED:
            return randomizeExtTypedItem(C, item, effects);
        case ExtendedArchetype.MODULAR:
            return randomizeExtModularItem(C, item, effects);
        case ExtendedArchetype.VIBRATING:
            return randomizeExtVibratorItem(C, item, effects);
    }
    return false;
}

// Helper for randomizeExtendedItem()
export function randomizeExtTypedItem(C: Character, item: Item, effects: EffectName[] = []): boolean {
    // Mostly copied from TypedItemSetRandomOption implementation
    const typedData = TypedItemDataLookup[`${item.Asset.Group.Name}${item.Asset.Name}`];
    //console.log("ATB: randomizeExtTypedItem: typedData: ", typedData);

    // Handle special properties if any
    changeEditableProperty(C, item, typedData);

    // Avoid limited options
    let typedAvailableOptions = typedData.options.filter(o => {
        //return (InventoryCheckLimitedPermission(C, item, `${typedData.name}${o.Property.TypeRecord[typedData.name]}`));
        return (!InventoryBlockedOrLimited(C, item, `${typedData.name}${o.Property.TypeRecord[typedData.name]}`));
    });

    // filter to only includes effects if needed
    if (effects.length > 0) {
        typedAvailableOptions = typedAvailableOptions.filter(o => {
            if (o.Property.Effect && o.Property.Effect.length > 0) {
                return o.Property.Effect.some(item => effects.includes(item));
            } else {
                return false;
            }
        });
    }

    if (typedAvailableOptions.length === 0) {
        return false;
    }
    //console.log("ATB: randomizeExtTypedItem: availableOptions: ", typedAvailableOptions);

    // Select next item option
    let typedPreviousOption = TypedItemFindPreviousOption(typedData, item);

    let typedNewOption = CommonRandomItemFromList(typedPreviousOption, typedAvailableOptions);
    if (!typedNewOption) {
        return false;
    }

    // Update item
    ExtendedItemSetOption(typedData, C, item, typedNewOption, typedPreviousOption, false, false);
    return true;
}

// Helper for randomizeExtendedItem()
export function randomizeExtVibratorItem(C: Character, item: Item, effects: EffectName[] = []): boolean {
    const vibratorData = VibratorModeDataLookup[`${item.Asset.Group.Name}${item.Asset.Name}`];
    //console.log("ATB: randomizeExtVibratorItem: VIBRATING: vibratorData: ", vibratorData);

    // Handle additional properties if any
    changeEditableProperty(C, item, vibratorData);

    // Avoid limited options
    let vibratorAvailableOptions = vibratorData.options.filter(o => {
        return (!InventoryBlockedOrLimited(C, item, `${vibratorData.name}${o.Property.TypeRecord[vibratorData.name]}`));
    });
    // filter to only includes effects if needed
    if (effects.length > 0) {
        vibratorAvailableOptions = vibratorAvailableOptions.filter(o => {
            if (o.Property.Effect && o.Property.Effect.length > 0) {
                return o.Property.Effect.some(item => effects.includes(item));
            } else {
                return false;
            }
        });
    }
    if (vibratorAvailableOptions.length === 0) {
        return false;
    }
    //console.log("ATB: randomizeExtVibratorItem: availableOptions: ", vibratorAvailableOptions);

    let vibratorOptionIndex = Math.floor(Math.random() * vibratorAvailableOptions.length);
    let vibratorNewOption = vibratorAvailableOptions[vibratorOptionIndex].Name;
    if (!vibratorNewOption) {
        return false;
    }

    // Update item
    //console.log("ATB: randomizeExtVibratorItem: VIBRATING: vibratorNewOption: ", vibratorNewOption);
    VibratorModeSetOptionByName(C, item, vibratorNewOption);
    return true;
}

// Helper for randomizeExtendedItem()
export function randomizeExtModularItem(C: Character, item: Item, effects: EffectName[] = []): boolean {
    let ret = false;
    const modularData = ModularItemDataLookup[`${item.Asset.Group.Name}${item.Asset.Name}`];
    //console.log("ATB: randomizeExtModularItem: modularData: ", modularData);

    // Handle special properties that can be changed
    if (geEditablePropertyInBaseline(modularData.baselineProperty).length > 0) {
        changeEditableProperty(C, item, modularData);
    }

    let randModuleList = modularData.modules;
    // If we need to force an effect, do a first pass until an effect is applied
    // Then we can rnadomize other modules freely
    let moduleToSkip: number = -1;
    if (effects.length > 0) {
        // Needed to prevent that always the same module/option is choosen for an effect
        randModuleList = CloneAndRandomizeList(randModuleList);

        for (let i = 0; i < randModuleList.length; i++) {
            let modularModule = randModuleList[i];
            if (!modularModule) {
                console.warn("ATB: Couldn't find modularModule with randModuleList.length=", randModuleList.length, " i=", i);
                continue;
            }
            if (randomizeModuleOption(C, item, modularData, modularModule, i, effects)) {
                moduleToSkip = i; // Save index to skip later and leave the loop
                break;
            }
        }
    }

    // Randomize everything without effects
    for (let i = 0; i < randModuleList.length; i++) {
        if (moduleToSkip == i) { // Skip if module already handled
            continue;
        }

        let modularModule = randModuleList[i];
        if (!modularModule) {
            console.warn("ATB: Couldn't find modularModule with randModuleList.length=", randModuleList.length, " i=", i);
            continue;
        }
        randomizeModuleOption(C, item, modularData, modularModule, i, []);
    }
    return ret;
}

// Helper for randomizeExtModularItem()
// if effects is not empty, will only select an option that include this effect
export function randomizeModuleOption(C: Character, item: Item, modularData: ModularItemData, modularModule: ModularItemModule, moduleIndex: number, effects: EffectName[] = []): boolean {
    // get previous option
    let itemTypeRecord: TypeRecord | undefined | null = item.Property?.TypeRecord;
    if (!itemTypeRecord)
        itemTypeRecord = null;
    let modularCurrentModuleValues = ModularItemParseCurrent(modularData, itemTypeRecord/*DialogFocusItem.Property.TypeRecord*/);
    let modularPreviousOption = modularModule.Options[modularCurrentModuleValues[moduleIndex]];
    if (!modularPreviousOption) {
        console.warn("ATB: randomizeModuleOption: Couldn't find modularPreviousOption with modularCurrentModuleValues=", modularCurrentModuleValues, " and moduleIndex=", moduleIndex);
        return false;
    }

    // Avoid limited options
    let moduleAvailableOptions = modularModule.Options.filter(o => {
        //return (InventoryCheckLimitedPermission(C, item, o.Name));
        return (!InventoryBlockedOrLimited(C, item, o.Name));
    });
    // filter to only includes effects if needed
    if (effects.length > 0) {
        moduleAvailableOptions = moduleAvailableOptions.filter(o => {
            if (o.Property.Effect && o.Property.Effect.length > 0) {
                return o.Property.Effect.some(item => effects.includes(item));
            } else {
                return false;
            }
        });
    }
    if (moduleAvailableOptions.length === 0) {
        return false;
    }
    //console.log("ATB: randomizeModuleOption: availableOptions: ", moduleAvailableOptions);

    // select a random option
    let randomIndex = Math.floor(Math.random() * moduleAvailableOptions.length);
    let modularNewOption = moduleAvailableOptions[randomIndex];
    if (!modularNewOption) {
        console.warn("ATB: randomizeModuleOption: Couldn't find modularNewOption with moduleAvailableOptions.length=", moduleAvailableOptions.length, " randomIndex=", randomIndex);
        return false;
    }
    //console.log("ATB: randomizeModuleOption: modularNewOption: ", modularNewOption);

    // set new option
    ExtendedItemSetOption(modularData, C, item, modularNewOption, modularPreviousOption, true, true);
    return true;
}


// Helper for other randomizeExt*Item() func
// Change specific properties that are part of the options of an item
// This is based on itemData.baselineProperty that provide us all special proerties of an item
// change only one Property for now
export function changeEditableProperty(C: Character, item: Item, itemData: TypedItemData | ModularItemData | VibratingItemData): boolean {
    let newProperty: ItemProperties | undefined = CommonCloneDeep(item.Property);;
    let propertyChanged: boolean = false;
    if (!item.Property || !newProperty) {
        console.warn("ATB: changeEditableProperty: item.Property or newProperty is undefined !");
        return false;
    }

    // Get all the item's property that we can modify
    // EditableProperty is our handcrafted list of specific properties that we can modifiy
    let existingProperty: string[] = geEditablePropertyInBaseline(itemData.baselineProperty);
    if (existingProperty.length <= 0) {
        return false;
    }

    let selectedProperty: string | undefined = undefined;
    let newValuestr: any = undefined;
    if (existingProperty.length > 0) {
        //console.log("ATB: changeEditableProperty: existingProperty: ", existingProperty);
        let maxRandom = existingProperty.length;
        let propertyIndex = Math.floor(Math.random() * maxRandom);
        selectedProperty = existingProperty[propertyIndex];

        // References of the variable types of all editable properties
        //PunishActivity: [false, true],
        //PunishOrgasm: [false, true],
        //PunishStandup: [false, true],
        //PunishStruggle: [false, true],
        //PunishStruggleOther: [false, true],
        //AutoPunish: [0, 1, 2, 3],
        //PunishSpeech: [0, 1, 2, 3],
        //PunishProhibitedSpeech: [0, 1, 2, 3],
        //PunishRequiredSpeech: [0, 1, 2, 3],
        //TriggerValues: [""], // DISABLED for now
        //PunishProhibitedSpeechWords: [""], // DISABLED for now
        //PunishRequiredSpeechWord: [""] // DISABLED for now

        // boolean properties
        if (["PunishActivity", "PunishOrgasm", "PunishStandup", "PunishStruggle", "PunishStruggleOther"].includes(selectedProperty)) {
            if (selectedProperty in item.Property && getItemPropertyValueFromObject(item.Property, selectedProperty)) {
                newProperty = setItemPropertyValue(newProperty, selectedProperty, false);
                newValuestr = "false";
            }
            else {
                newProperty = setItemPropertyValue(newProperty, selectedProperty, true);
                newValuestr = "true";
            }
            propertyChanged = true;
        }
        // 0 | 1 | 2 | 3 properties
        else if (["AutoPunish", "PunishSpeech", "PunishProhibitedSpeech", "PunishRequiredSpeech"].includes(selectedProperty)) {
            let maxRandom = 4;
            let randNumber = Math.floor(Math.random() * maxRandom);
            newProperty = setItemPropertyValue(newProperty, selectedProperty, randNumber);
            newValuestr = randNumber.toString();
            // Special case when enabling the speech features (only used for the Futuristic Training belt afaik)
            // In that case we just make sure the default word list is included in the item's properties
            /*if (selectedProperty == "PunishProhibitedSpeech" &&  itemData.baselineProperty?.PunishProhibitedSpeechWords) {
                newProperty = this.setItemPropertyValue(newProperty, "PunishProhibitedSpeechWords", itemData.baselineProperty.PunishProhibitedSpeechWords);
            }
            else if (selectedProperty == "PunishRequiredSpeech" &&  itemData.baselineProperty?.PunishRequiredSpeechWord) {
                newProperty = this.setItemPropertyValue(newProperty, "PunishRequiredSpeechWord", itemData.baselineProperty.PunishRequiredSpeechWord);
            }*/
            propertyChanged = true;
        }
        /*else if (selectedProperty == "TriggerValues" &&  itemData.baselineProperty?.TriggerValues) {
            let newTriggerValues = this.randomizeTriggerValues(itemData.baselineProperty.TriggerValues);
            if (newTriggerValues) {
                newProperty = this.setItemPropertyValue(newProperty, "TriggerValues", newTriggerValues);
            }
            else {
                newProperty = this.setItemPropertyValue(newProperty, "TriggerValues", itemData.baselineProperty.TriggerValues);
            }
            newValuestr = "<hidden>";
            selectedProperty = "voice trigger words";
            propertyChanged = true;
        }*/
    }
    else {
        console.warn("ATB: changeEditableProperty: existingProperty is empty: ", existingProperty);
    }

    if (propertyChanged) {
        // Update item
        ExtendedItemSetProperty(C, item, item.Property, newProperty, true, true);
        // Idk why but this AssetTextGet almost always fail to retreive the correct text.
        // And because the string to retreive the asset's text don't follow any logics, we probably cannot do better
        let propertyName = AssetTextGet(item.Asset.Name + selectedProperty) ?? selectedProperty;
        if (propertyName.includes("MISSING")) {
            propertyName = selectedProperty ?? "unknown property";
        }
        return true;
    }
    return false;
}

// return a list of properties applicable to this item
export function geEditablePropertyInBaseline(baselineProperty: PropertiesNoArray.Item | null | undefined): string[] {
    if (!baselineProperty) {
        return [];
    }
    // editableProperty are others options that are not part of an extended item's options such as chechbox / voice command trigger word
    let editableProperty = [
        "AutoPunish",
        "PunishActivity",
        "PunishOrgasm",
        "PunishSpeech",
        "PunishStandup",
        "PunishStruggle",
        "PunishStruggleOther",
    //    "TriggerValues",
        "PunishProhibitedSpeech",
        "PunishRequiredSpeech",
    //    "PunishProhibitedSpeechWords",
    //    "PunishRequiredSpeechWord"
    ]

    let existingProperty: string[] = [];
    if (baselineProperty) {
        for (let property of editableProperty) {
            if (property in baselineProperty) {
                existingProperty.push(property);
            }
        }
    }
    return existingProperty;
}

// Workaround to bypass TS custom type
export function getItemPropertyValueFromObject(obj: PropertiesNoArray | ItemProperties, property: string) {
    switch (property) {
        case "AutoPunish":
            return obj.AutoPunish;
        case "PunishActivity":
            return obj.PunishActivity;
        case "PunishOrgasm":
            return obj.PunishOrgasm;
        case "PunishSpeech":
            return obj.PunishSpeech;
        case "PunishStandup":
            return obj.PunishStandup;
        case "PunishStruggle":
            return obj.PunishStruggle;
        case "PunishStruggleOther":
            return obj.PunishStruggleOther;
        case "TriggerValues":
            return obj.TriggerValues;
        case "PunishProhibitedSpeech":
            return obj.PunishProhibitedSpeech;
        case "PunishRequiredSpeech":
            return obj.PunishRequiredSpeech;
        case "PunishProhibitedSpeechWords":
            return obj.PunishProhibitedSpeechWords;
        case "PunishRequiredSpeechWord":
            return obj.PunishRequiredSpeechWord;
        default:
            return undefined;
    };
}

// Workaround to bypass TS custom type
export function setItemPropertyValue(obj: ItemProperties, property: string, value: any) {
    switch (property) {
        case "AutoPunish":
            obj.AutoPunish = value;
            break;
        case "PunishActivity":
            obj.PunishActivity = value;
            break;
        case "PunishOrgasm":
            obj.PunishOrgasm = value;
            break;
        case "PunishSpeech":
            obj.PunishSpeech = value;
            break;
        case "PunishStandup":
            obj.PunishStandup = value;
            break;
        case "PunishStruggle":
            obj.PunishStruggle = value;
            break;
        case "PunishStruggleOther":
            obj.PunishStruggleOther = value;
            break;
        case "TriggerValues":
            obj.TriggerValues = value;
            break;
        case "PunishProhibitedSpeech":
            obj.PunishProhibitedSpeech = value;
            break;
        case "PunishRequiredSpeech":
            obj.PunishRequiredSpeech = value;
            break;
        case "PunishProhibitedSpeechWords":
            obj.PunishProhibitedSpeechWords = value;
            break;
        case "PunishRequiredSpeechWord":
            obj.PunishRequiredSpeechWord = value;
            break;
    };
    return obj;
}
