
/*
* This file has been copied from LSCG.
*/

interface PlayerCharacter extends Character {
    ATB: import("./models/CoreSettings").CoreSettings;
    //ATB: CoreSettings;
}

interface OtherCharacter extends Character {
    ATB: import("./models/CoreSettings").CoreSettings;
    //ATB: CoreSettings;
}

interface ExtensionSettings {
    ATB: string;
}
