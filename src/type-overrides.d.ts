
interface PlayerCharacter extends Character {
    ATB: import("Settings/Models/settings").SettingsModel;
}

/*interface OtherCharacter extends Character {
    ATB: import("Settings/Models/settings").IPublicSettingsModel;
}*/

/*interface PlayerOnlineSettings {
	ATB: import("Settings/Models/settings").SettingsModel | string;
}*/

interface ExtensionSettings {
    ATB: string;
}
