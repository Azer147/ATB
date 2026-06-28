
export interface ChaoticMistressSettings {
    enableRandomTasks: boolean;
    enablePointsSystem: boolean;

    // For Random Task
    averageNewTaskPerHour: number; // percent
    minRandomFinishNeeded: number; // percent, multiply duration/count of tasks / punishements
    maxRandomFinishNeeded: number; // percent, multiply duration/count of tasks / punishements
    weightUsePunishAsTask: number; // Weight to add with others tasks when choosing randomTask.
    //avoidRandomTaskWhenAfk: boolean;

    // For Points System
    forcedPunishementThreshold: number; // Threshold of bad points after which a punishment task will be forced.

    // Internal variable
    goodPts: number;
    badPts: number;
}

export const DefaultChaoticMistressSettings: ChaoticMistressSettings = {
    enableRandomTasks: false,
    enablePointsSystem: true,

    averageNewTaskPerHour: 2,
    minRandomFinishNeeded: 40, // 40% of base duration/count
    maxRandomFinishNeeded: 250, // 250% of base duration/count
    weightUsePunishAsTask: 1,

    forcedPunishementThreshold: 100,

    goodPts: 0,
    badPts: 0
}

// Internal fields that should not be externally modified
// Needed mainly to prevent remote settings change (apply_settings) to change/apply these (which are likely outdated)
export const ChaoticMistressInternalfields = ["goodPts", "badPts"];