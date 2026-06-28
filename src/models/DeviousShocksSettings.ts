
export interface DeviousShocksSettings {
    enable: boolean;

    // Random Shocks
    shockAveragePerHour: number; // Average Shocks per hour (0 - 120)

    // Shocks Chance on Activity/Event (also stopping Activity/Event)
    // Chance in % (0% to disable)
    chanceOnRoomExit: number;
    chanceOnStruggle: number;
    chanceOnStanding: number;
    chanceOnWardrobe: number;
    chanceOnEquipItemOnOthers: number;
}

export const DefaultDeviousShocksSettings: DeviousShocksSettings = {
    enable: false,

    shockAveragePerHour: 10,

    chanceOnRoomExit: 25,
    chanceOnStruggle: 50,
    chanceOnStanding: 50,
    chanceOnWardrobe: 50,
    chanceOnEquipItemOnOthers: 50
}