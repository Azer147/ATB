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
				InventoryLock(C, C.Appearance[i], lockType, C.MemberNumber, false);
				changed = true;
			}
		}
	}
	if (changed) {
		CharacterRefresh(C);
		ChatRoomCharacterUpdate(C);
	}
}

export function lockAllItemsWithRandomCombination(C: Character, difficulty: "easy" | "medium" | "hard" | "veryHard"): void {
	if (C.Appearance == undefined) return;
	let changed: boolean = false;
	for (let i = 0; i < C.Appearance.length; i++) {
		const appearanceItem = C.Appearance[i];
		if (appearanceItem.Asset.AllowLock == true) {
			let isAlreadyLocked: boolean = (appearanceItem.Property?.LockedBy != undefined);
			if (!isAlreadyLocked) {
				let randomLock = getRandomCombinationPadlock(C, difficulty);
				console.log("Locking item: ", appearanceItem.Asset.Name, " with random combination padlock: ", randomLock);
				if (randomLock) {
					InventoryLock(C, appearanceItem, randomLock, C.MemberNumber, false);

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
		CharacterRefresh(C);
		ChatRoomCharacterUpdate(C);
	}
}

// Randomly change the lock password with number and put a hint (ex: 13XX)
// TODO: not working, need to find another concept for this
// Issues is:
// - CombinationPadlock use number but don't show hint
// - And PasswordPadlock have hint but it cannot have number (somehow)
export function getRandomCombinationPadlock(C: Character, difficulty: "easy" | "medium" | "hard" | "veryHard"): Item | undefined {
	let item: Item | undefined = getPadlockItem(C, "PasswordPadlock");
	if (item) {
		if (item.Property == null) item.Property = {};
		item.Property.LockedBy = "PasswordPadlock";

		let upperBound: number = 10; // easy by default
		//if (difficulty == "easy") upperBound = 10;
		if (difficulty == "medium") upperBound = 20;
		if (difficulty == "hard") upperBound = 50;
		if (difficulty == "veryHard") upperBound = 100;
		let password: number = Math.floor(Math.random() * upperBound) + 100; // generates a random number between 100 and (upperBound+99)

		// Specific for "CombinationPadlock" (looks like hint cannot be used with this one)
		//item.Property.CombinationNumber = password.toString();

		// Specific for "PasswordPadlock" | "SafewordPadlock" | "TimerPasswordPadlock"
		item.Property.Password = password.toString();
		item.Property.Hint = "Password is a number between: 100 and " + (upperBound + 99).toString();
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