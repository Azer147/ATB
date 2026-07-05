
export interface RandomTaskSettings {
    enableRandomTasks: boolean;

    // For Random Task
    averageNewTaskPerHour: number; // percent
    minRandomFinishNeeded: number; // percent, multiply duration/count of tasks / punishements
    maxRandomFinishNeeded: number; // percent, multiply duration/count of tasks / punishements
    weightUsePunishAsTask: number; // Weight to add with others tasks when choosing randomTask.
    //avoidRandomTaskWhenAfk: boolean;
}

export const DefaultRandomTaskSettings: RandomTaskSettings = {
    enableRandomTasks: false,

    averageNewTaskPerHour: 2,
    minRandomFinishNeeded: 40, // 40% of base duration/count
    maxRandomFinishNeeded: 250, // 250% of base duration/count
    weightUsePunishAsTask: 0,
}
