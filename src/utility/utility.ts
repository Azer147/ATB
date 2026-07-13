import { allOutfitList, getOutfitSettingsFromId, OutfitId, OutfitTag, RawOutfit } from "@/models/OutfitSettings";
import { isShockItem } from "./ItemUtility";
import { isCharacterHaveEchoItem } from "./CharacterWrapper";
import { FinishType, FullTaskType, getFinishTypeSetting, getTaskTypeSetting, PunishementType, TasksSettings, TaskType } from "@/models/TasksSettings";

export enum ChatColor {
    Red = "#ff5555",
	LightRed = "#ff9999",
    Green = "#55ff55",
    Blue = "#5555ff",
    Yellow = "#ffff55",
    Pink = "#ff99cc",
    Cyan = "#55ffff",
    Orange = "#ffaa00",
    Purple = "#aa00aa",
    White = "#ffffff",
    Gray = "#aaaaaa"
}

export function sendActionMessage(message: string): void {
	ServerSend("ChatRoomChat", {
		Content: "Beep",
		Type: "Action",
		Target: undefined,
		Dictionary: [{ Tag: "Beep", Text: message }]
	});
}


export function sendLocalMessage(message: string, color: ChatColor | undefined = undefined): void {
	// DEBUG: Also send public action (to remove later)
	//sendActionMessage(getNameOrNickname(Player) + " => " + message);

	let formattedMessage = message;
	if (color != undefined) {
		formattedMessage = `<span style="color: ${color};">${message}</span>`;
	}
	ChatRoomSendLocal(formattedMessage);
}

export function CloneAndRandomizeList<T>(originalList: T[]): T[] {
	// Clone the original list
	const shuffled = [...originalList];

    // Fisher-Yates Shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export function formatTimeMs(ms: number): string {
    if (ms <= 0) return "0s"; // Fallback for negative or zero time

    const totalSeconds = Math.floor(ms / 1000);
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    // Helper to pad the second unit with a leading zero (e.g., 5 -> "05")
    const pad = (num: number) => num.toString().padStart(2, '0');

    if (d > 0) {
        return `${d}d${pad(h)}h`;
    } else if (h > 0) {
        return `${h}h${pad(m)}m`;
    } else if (m > 0) {
        return `${m}m${pad(s)}s`;
    } else {
        return `${s}s`; // Only seconds remaining
    }
}

// Based on BC (CharacterIsNaked)
export function isBodyPart(item: Item) {
	if (item.Asset != null && !item.Asset.Group.AllowNone) {
		return true;
	}
	// For Echo's Groups, we can only deduce body part by eliminating other categories.
	else if (item.Asset != null && !isItem(item) && !isCosplay(item) && !isClothe(item)) {
		return true;
	}
	return false;
}
export function isItem(item: Item) {
	if (item.Asset != null && (item.Asset.Group.Category != "Appearance"/* || item.Asset.Group.IsRestraint*/)) {
		return true;
	}
	return false;
}
export function isCosplay(item: Item) {
	if (item.Asset != null && (item.Asset.BodyCosplay || item.Asset.Group.BodyCosplay)) {
		return true;
	}
	return false;
}
export function isClothe(item: Item) {
	//if (!isBodyPart(item) && !isItem(item) && !isCosplay(item)) {
	if (item.Asset != null && item.Asset.Group.Clothing) {
		return true;
	}
	return false;
}

// Same as BC's CharacterIsNaked, but exclude some Echo's body group and BCX Cursed items
export function isCharacterNakedAdv(C: Character) {
	let bcxCursedItems: AssetGroupName[] = [];
	if (C.IsPlayer()) {
		bcxCursedItems = getBCXActiveCurseSlots();
	}

	for (const A of C.Appearance) {
		if (A.Asset == null) {
			continue;
		}
		// Ignore BCX Cursed item (Only for Player for now)
		if (C.IsPlayer()) {
			if (bcxCursedItems.includes(A.Asset.Group.Name)) {
				continue;
			}
		}

		// Ignore Body / Item / Cosplay
		if (isBodyPart(A) || isItem(A) || isCosplay(A)) {
			continue;
		}

		if (isClothe(A)) {
			return false;
		}
	}
	return true;
}

// Same as BC's CharacterNaked/CharacterAppearanceNaked, but exclude some Echo's body group
export function stripNakedCharacterAdv(C: Character, refresh: boolean = true) {
	const keepCosplay = (C.IsPlayer() || C.IsOnline()) && C.OnlineSharedSettings?.BlockBodyCosplay;
	C.Appearance = C.Appearance.filter((item) => {
		// If it's cosplay, it stays on
		if (keepCosplay && isCosplay(item))
			return true;

		if (isClothe(item)) {
			return false;
		}
		return true;
	});

	// Loads the new character canvas
	CharacterLoadCanvas(C);

	if (refresh) {
		CharacterRefresh(C);
	}
}

// return a random shock device worn by the Character or null if not any.
export function getAnyShockDeviceWorn(C: Character): Item | undefined {
	const availShockItem: Item[] = [];
	for (const item of C.Appearance) {
		if (isShockItem(item)) {
			availShockItem.push(item);
		}
	}

	if (availShockItem.length > 1) {
		const randList = CloneAndRandomizeList(availShockItem);
		if (randList.length > 0) { // Just in case.. but it shouldn't be empty
			return randList[0];
		}
	} else if (availShockItem.length == 1) {
		return availShockItem[0];
	}
	return undefined;
}

// if shockDevice not provided, will try to find one worn by Character.
export function triggerShock(C: Character, shockDevice: Item | undefined = undefined): boolean {
	if (!shockDevice) {
		shockDevice = getAnyShockDeviceWorn(C);
	}

	if (shockDevice) {
		PropertyShockPublishAction(C, shockDevice, true);
		return true;
	}
	return false;
}

export function getNameOrNickname(C: OtherCharacter | PlayerCharacter | Character) {
	if (C.Nickname && C.Nickname.length > 0) {
		return C.Nickname;
	}
	return C.Name;
}

export function getNameOrNicknameByMemberNumber(memNum: number) {
	const C = ChatRoomGetCharacter(memNum);
	if (C) {
		return getNameOrNickname(C);
	}
	return memNum.toString();
}

// Copied from LSCG
export function getBCXData(): any {
	try {
		const parsed = LZString.decompressFromBase64(Player.ExtensionSettings.BCX.split(":")[1]);
		if (parsed) {
			let parsedData = JSON.parse(parsed);
			return parsedData;
		}
		return undefined;
	}
	catch (e) { return undefined; }
}

// Copied from LSCG
export function getBCXActiveCurseSlots(): AssetGroupName[] {
	let bcxCurses = getBCXData()?.conditions?.curses?.conditions;
	if (!bcxCurses) return [];
	return (Object.keys(bcxCurses).filter(key => bcxCurses[key]?.active ?? false)) as AssetGroupName[];
}

export function getBCXActiveRules(): string[] {
	let bcxRules = getBCXData()?.conditions?.rules?.conditions;
	if (!bcxRules) return [];
	return (Object.keys(bcxRules).filter(key => bcxRules[key]?.active ?? false)) as string[];
}

export function isLscgEffectsPreventOutfit(C: OtherCharacter | PlayerCharacter) {
	const lscgEffect = ["cursed-item", "polymorphed", "redressed"];
	return isLscgEffectsActive(C, lscgEffect);
}

export function isLscgCursedItemActive(C: OtherCharacter | PlayerCharacter) {
	const lscgEffect = ["cursed-item"];
	return isLscgEffectsActive(C, lscgEffect);
}

export function isLscgEffectsActive(C: OtherCharacter | PlayerCharacter, lscgEffect: string[]) {
	if (C.LSCG) {
		// I know its ugly, but should work
		try {
			let haveEffect = C.LSCG?.StateModule?.states?.find((state) => {
				return (state && lscgEffect.includes(state.type) && state.active);
			});
			if (haveEffect) {
				return true;
			}
		} catch {
			return false;
		}
	}
	return false;
}

export function shouldTriggerFromAveragePerHour(avgPerHour: number, tickPeriodMs: number): boolean {
	if (avgPerHour) {
		const msPerHour = 60 * 60 * 1000;

		// Example: If tickPeriodMs is 60000 (1 min) and averageTaskPerHour is 2.
		// (60000 / 3600000) * 2 = 0.0333 (A 3.33% chance every minute)
		const chanceRandomTask = (tickPeriodMs / msPerHour) * avgPerHour;

		// Roll the dice
		if (Math.random() < chanceRandomTask) {
			return true;
		}
	}
	return false;
}

export function getPadlockItem(C: Character, lockType: AssetLockType): Item | undefined {
	let asset: Asset | null = AssetGet(C.AssetFamily, "ItemMisc", lockType);
	if (asset == null) {
		return undefined;
	}
	let lock: Item = { Asset: asset };
	return lock;
}

export function getNbLockableItems(C: Character): number {
	let nbLockableItems: number = 0;
	for (let i = 0; i < C.Appearance.length; i++) {
		if (C.Appearance[i].Asset.AllowLock == true) {
			nbLockableItems++;
		}
	}
	return nbLockableItems;
}

// return all Free slot from the param list
export function getCharacterFreeSlots(C: Character, slots: AssetGroupItemName[]): AssetGroupItemName[] {
	let freeSlots: AssetGroupItemName[] = [];

	for (let i = 0; i < slots.length; i++) {
		if (InventoryGet(C, slots[i]) == null) {
			freeSlots.push(slots[i]);
		}
	}

	return freeSlots;
}


export function lockAllItems(C: Character, lockType: AssetLockType = "ExclusivePadlock"): void {
	// dogs padlock: "DeviousPadlock"
	//target.Appearance[A].Property.LockedBy = "ExclusivePadlock";
	//target.Appearance[A].Property.Name = "DeviousPadlock";

	if (C.Appearance == undefined) return;
	let changed: boolean = false;
	for (let i = 0; i < C.Appearance.length; i++) {
		if (C.Appearance[i].Asset.AllowLock == true) {
			let isAlreadyLocked: boolean = (C.Appearance[i].Property?.LockedBy != undefined);
			if (!isAlreadyLocked) {
				InventoryLock(C, C.Appearance[i], lockType, C, false);
				changed = true;
			}
		}
	}
	if (changed) {
		CharacterRefresh(C, false);
		ChatRoomCharacterUpdate(C);
	}
}

export function lockAllItemsWithRandomPassword(C: Character): void {
	if (C.Appearance == undefined) return;

	const randomLock = getRandomPasswordPadlock(C);
	let changed: boolean = false;
	for (let i = 0; i < C.Appearance.length; i++) {
		const appearanceItem = C.Appearance[i];
		if (appearanceItem.Asset.AllowLock == true) {
			let isAlreadyLocked: boolean = (appearanceItem.Property?.LockedBy != undefined);
			if (!isAlreadyLocked) {
				console.log("Locking item: ", appearanceItem.Asset.Name, " with random Password padlock: ", randomLock);
				if (randomLock) {
					InventoryLock(C, appearanceItem, randomLock, null, false);

					if (appearanceItem != undefined && appearanceItem.Property != undefined) {
						appearanceItem.Property.Password = randomLock.Property?.Password;
						appearanceItem.Property.Hint = randomLock.Property?.Hint;
						appearanceItem.Property.LockSet = randomLock.Property?.LockSet;
						appearanceItem.Property.RemoveOnUnlock = randomLock.Property?.RemoveOnUnlock;
					}
					changed = true;
				}
			}
		}
	}
	if (changed) {
		CharacterRefresh(C, false);
		ChatRoomCharacterUpdate(C);
	}
}

// Randomly change the lock password with 1 random letter
export function getRandomPasswordPadlock(C: Character): Item | undefined {
	let item: Item | undefined = getPadlockItem(C, "PasswordPadlock");
	if (item) {
		if (item.Property == null) item.Property = {};
		item.Property.LockedBy = "PasswordPadlock";

		// Gen random letter (uppercase)
		const randomLetter: string = String.fromCharCode(65 + Math.floor(Math.random() * 26));

		// Specific for "PasswordPadlock" | "SafewordPadlock" | "TimerPasswordPadlock"
		item.Property.Password = randomLetter;
		item.Property.Hint = "Password is 1 random letter (uppercase)";
		item.Property.LockSet = true;

		// Specific for "PasswordPadlock" only
		item.Property.RemoveOnUnlock = true;
	}
	return item;
}

/*
export function setItemDifficulty(C: Character, difficulty: number) {
	// Change difficulty of all item
	for (let A = 0; A < Player.Appearance.length; A++)
		if (Player.Appearance[A].Asset.Group.Name != null) {
			if (Player.Appearance[A].Asset.Group.Name.startsWith("Item")) {
				Player.Appearance[A].Difficulty = difficulty;
			}
		}
	ChatRoomCharacterUpdate(Player);
}
*/

export function checkNicknameValidity(C: Character, nickname: string): string | null {
	// Based on BC's
	//type NicknameStatus = "NicknameTooLong" | "NicknameTooShort" | "NicknameInvalidChars" | "NicknameLocked";

	const nickValidity = CharacterValidateNickname(C, nickname);
	switch (nickValidity) {
		case "NicknameTooLong":
			return "Nickname is too long. Maximum length is 20 characters.";
		case "NicknameTooShort":
			return "Nickname is too short. Minimum length is 1 characters.";
		case "NicknameInvalidChars":
			return "Nickname contains invalid characters.";
		default:
			return null; // Valid nickname
	}
	return null; // Valid nickname
}

export function selectRandomOutfit(includeTags: OutfitTag[] = [], excludeTags: OutfitTag[] = []): OutfitId | undefined {
	// build weighted list
	let totalWeight = 0;
	const weightedList = allOutfitList.map(outfit => {
		let weight = 0;

		let outfitSetting = getOutfitSettingsFromId(Player.ATB.OutfitsSettings, outfit.id);
		if (isOutfitAvailable(outfit, includeTags, excludeTags) && outfitSetting.enableForRandomTask) {
			weight = outfitSetting.randomWeight
		}

		if (weight < 0) weight = 0;
		totalWeight += weight;
		return { outfit, weight };
	});
	if (totalWeight === 0) {
		return undefined;
	}

	let randomRoll = Math.random() * totalWeight;

	// Select task based on weight
	let selected: OutfitId | undefined = undefined;
	for (let item of weightedList) {
		randomRoll -= item.weight;
		if (randomRoll <= 0) {
			selected = item.outfit.id;
			break;
		}
	}
	return selected;
}

export function isOutfitAvailable(outfit: RawOutfit, includeTags: OutfitTag[] = [], excludeTags: OutfitTag[] = []): boolean {
	let includeCond: boolean = false;
	let excludeCond: boolean = false;

	let outfitSetting = getOutfitSettingsFromId(Player.ATB.OutfitsSettings, outfit.id);
	if (!outfitSetting.enable) {
		return false;
	}

	// Ignore outfit using echo addon if player don't have it
	if (outfit.tags.includes("use_echo") && isCharacterHaveEchoItem(Player) == false) {
		return false;
	}

	if (includeTags.length > 0) {
		includeCond = outfit.tags.some((tag) => { return includeTags.includes(tag); });
	} else {
		includeCond = true;
	}

	if (excludeTags.length > 0) {
		excludeCond = (outfit.tags.some((tag) => { return excludeTags.includes(tag); }) == false);
	} else {
		excludeCond = true;
	}

	return (includeCond && excludeCond);
}

// Work for FullTaskType, PunishementType and FinishType
export function selectRandomByWeight<T extends FullTaskType | PunishementType | FinishType>(settings: TasksSettings, type: "task" | "punish" | "finish", availList: T[], taskType: TaskType | undefined = undefined): T | undefined {
	// build task+weight list
	let totalWeight = 0;
	const weightedTasks = availList.map(task => {
		let weight = 0;
		let mainType;

		// FullTaskType is object, others are string
		if (type == "task" && typeof task != "string") {
			mainType = task.taskType;
		} else {
			mainType = task;
		}

		let typeSetting;
		if (type == "finish") {
			typeSetting = getFinishTypeSetting(settings, mainType, taskType);
		} else {
			typeSetting = getTaskTypeSetting(settings, mainType);
		}
		if (typeSetting) {
			weight = typeSetting.randomWeight;
		}

		if (weight < 0) weight = 0;
		totalWeight += weight;
		return { task, weight };
	});
	if (totalWeight === 0) {
		return;
	}

	let randomRoll = Math.random() * totalWeight;

	// Select task based on weight
	let selectedTask: T | undefined = undefined;
	for (let item of weightedTasks) {
		randomRoll -= item.weight;
		if (randomRoll <= 0) {
			selectedTask = item.task;
			break;
		}
	}
	return selectedTask;
}

// increase / decrease basePts from the difference between duration and baseDuration
export function calculatePointsFromFinishCount(selectedFinishCount: number, baseFinishCount: number, basePts: number, enforced: boolean): number {
	if (selectedFinishCount == 0) return 0;
	let durDiffPerc = selectedFinishCount / baseFinishCount;
	let bonusMult = 1;
	if (enforced) bonusMult = 1.2; // 20% bonus if enforced
	return Math.floor(basePts * durDiffPerc * bonusMult);
}