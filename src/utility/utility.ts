import { isShockItem } from "./ItemUtility";

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
	sendActionMessage(message);

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

// Copied from BC (CharacterIsNaked)
export function isBodyPart(item: Item) {
	if (item.Asset != null && !item.Asset.Group.AllowNone) {
		return true;
	}
	return false;
}
export function isItem(item: Item) {
	if (item.Asset != null && item.Asset.Group.Category != "Appearance") {
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
	if (!isBodyPart(item) && !isItem(item) && !isCosplay(item)) {
		return true;
	}
	return false;
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

export function getNameOrNickname(C: OtherCharacter | PlayerCharacter) {
	if (C.Nickname && C.Nickname.length > 0) {
		return C.Nickname;
	}
	return C.Name;
}

// Copied from LSCG
export function getBCXData(): any {
	try {
		const parsed = LZString.decompressFromBase64(Player.ExtensionSettings.BCX);
		if (parsed) {
			let parsedData = JSON.parse(parsed);
			return parsedData;
		}
		return (Player.ExtensionSettings.BCX.split(":")[1]);
	}
	catch (e) { return undefined; }
}

// Copied from LSCG
export function getBCXActiveCurseSlots(): AssetGroupName[] {
	let bcxCurses = getBCXData()?.conditions?.curses?.conditions;
	if (!bcxCurses) return [];
	return (Object.keys(bcxCurses).filter(key => bcxCurses[key]?.active ?? false)) as AssetGroupName[];
}

export function isCharacterLscgEffectsPreventOutfit(C: OtherCharacter | PlayerCharacter) {
	const lscgEffect = ["cursed-item", "polymorphed", "redressed"];
	if (C.LSCG) {
		// I know its ugly, but should work
		try {
			let haveEffect = C.LSCG?.StateModule?.states?.find((state) => {
				//return state.type == "cursed-item"
				return (state && lscgEffect.includes(state.type) && state.active);
			});
			//if (cursedstate && cursedstate.active) {
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