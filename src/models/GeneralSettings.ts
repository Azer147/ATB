
export interface GeneralSettings {
    addChatRoomBtn: boolean;
    textScale: number;
}

export const DefaultGeneralSettings: GeneralSettings = {
    addChatRoomBtn: true,
    textScale: 1,
}

// Internal fields that should not be externally modified
// Needed mainly to prevent remote settings change (apply_settings) to change/apply these (which are likely outdated)
export const GeneralInternalfields = ["addChatRoomBtn"];