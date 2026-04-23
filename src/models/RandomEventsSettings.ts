
export interface RandomEventsSettings {
    enable: boolean;

    // Chance settings
    chanceEvent: number; // Chance (0 to 100) to trigger an event pn each trigger
    chanceHarshEvent: number; // Chance (0 to 100) that the event will use a harsher variant

    // Trigger settings
    enableTriggerOnRoomEntry: boolean;
    enableTriggerOnRoomExit: boolean;

    // Event settings
    enableAddRestraintEvent: boolean;
    enableAddLocksEvent: boolean;
    enableRandomPasswordLockEvent: boolean;
}

export const DefaultRandomEventsSettings: RandomEventsSettings = {
    enable: true,

    chanceEvent: 5,
    chanceHarshEvent: 5,

    enableTriggerOnRoomEntry: true,
    enableTriggerOnRoomExit: true,

    enableAddRestraintEvent: true,
    enableAddLocksEvent: true,
    enableRandomPasswordLockEvent: true
}