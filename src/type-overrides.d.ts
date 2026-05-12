
/*
* This file has been copied from LSCG.
*/

interface PlayerCharacter extends Character {
    ATB: import("./models/CoreSettings").CoreSettings;
    LSCG: any
}

interface OtherCharacter extends Character {
    ATB: import("./models/CoreSettings").CoreSettings;
    LSCG: any
}

interface ExtensionSettings {
    ATB: string;
}
