import { ModuleBase } from "@/modules/ModuleBase";
import { RandomEventsModule } from "@/modules/RandomEventsModule";
import { SleepModeModule } from "@/modules/SleepModeModule";

export default class ModuleManager {
    static modules: Map<string, ModuleBase> = new Map();

    static registerModule(module: ModuleBase): void {
        this.modules.set(module.getModuleName(), module);
    }

    static getModule<T>(moduleName: string): T | undefined {
        return this.modules.get(moduleName) as T;
    }

    static getAllModules(): ModuleBase[] {
        return Array.from(this.modules.values());
    }

    static getModulesCount(): number {
        return this.modules.size;
    }

    static getRandomEventsModule(): RandomEventsModule | undefined {
        return this.getModule<RandomEventsModule>("RandomEventsModule");
    }

    static getSleepModeModule(): SleepModeModule | undefined {
        return this.getModule("SleepModeModule");
    }
}