import StorageManager from "@/utility/StorageManager";

export abstract class ModuleBase {
    moduleName: string;
    name: string;
    description: string;
    hook: (() => void)[] = [];


    constructor(moduleName: string, name: string, description: string) {
        this.moduleName = moduleName;
        this.name = name;
        this.description = description;
    }

    getModuleName(): string {
        return this.moduleName;
    }

    getName(): string {
        return this.name;
    }

    getDescription(): string {
        return this.description;
    }

    load(): void {}
    unload(): void {
        this.hook.forEach(hook => hook());
        // TODO: should find a better place to save settings as it will be called for every module (we need it only once)
        StorageManager.saveSettings();
    }
}