
export interface GeneralSettings {
    addChatRoomBtn: boolean;
}

export const DefaultGeneralSettings: GeneralSettings = {
    addChatRoomBtn: true,
}

// Internal fields that should not be externally modified
// Needed mainly to prevent remote settings change (apply_settings) to change/apply these (which are likely outdated)
export const GeneralInternalfields = ["addChatRoomBtn"];