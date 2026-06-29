
export interface PenaltySettings {
    enablePenalty: boolean;

    forcedPunishementThreshold: number; // Threshold of Penalty points after which a punishment task will be forced.

    // For Forced Punishement duration/orgasm count/... are choosen randomly between min & max
    minRandomFinishMult: number; // percent, multiply duration/count of tasks / punishements
    maxRandomFinishMult: number; // percent, multiply duration/count of tasks / punishements
    //avoidPunishWhenAfk: boolean;

    // Internal variable
    rewardPts: number; // Note: Reward are always used and is not tied to enablePenalty
    penaltyPts: number;
}

export const DefaultPenaltySettings: PenaltySettings = {
    enablePenalty: false,

    forcedPunishementThreshold: 100,
    minRandomFinishMult: 50, // 50% of base duration/count
    maxRandomFinishMult: 200, // 200% of base duration/count

    rewardPts: 0,
    penaltyPts: 0
}

// Internal fields that should not be externally modified
// Needed mainly to prevent remote settings change (apply_settings) to change/apply these (which are likely outdated)
export const PenaltyInternalfields = ["rewardPts", "penaltyPts"];