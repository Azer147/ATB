
export interface ChaoticMistressSettings {
    enableRandomTasks: boolean;
    enablePointsSystem: boolean;

    // For Random Task
    averageNewTaskPerHour: number; // percent
    minRandomDuration: number; // percent, multiply duration of tasks / punishements
    maxRandomDuration: number; // percent, multiply duration of tasks / punishements
    weightUsePunishAsTask: number; // Weight to add with others tasks when choosing randomTask.
    //avoidRandomTaskWhenAfk: boolean;

    // For Points System
    forcedPunishementThreshold: number; // Threshold of bad points after which a punishment task will be forced.

    // Internal variable
    goodPts: number;
    badPts: number;
}

export const DefaultChaoticMistressSettings: ChaoticMistressSettings = {
    enableRandomTasks: true,
    enablePointsSystem: true,

    averageNewTaskPerHour: 2,
    minRandomDuration: 40, // 40% of base duration
    maxRandomDuration: 250, // 250% of base duration
    weightUsePunishAsTask: 1,

    forcedPunishementThreshold: 100,

    goodPts: 0,
    badPts: 0
}

// Internal fields that should not be externally modified
// Needed mainly to prevent remote settings change (apply_settings) to change/apply these (which are likely outdated)
export const ChaoticMistressInternalfields = ["goodPts", "badPts"];