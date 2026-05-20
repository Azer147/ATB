import bcModSdk, { ModSDKModAPI, PatchHook } from "bondage-club-mod-sdk";
//import bcModSdk = require("bondage-club-mod-sdk");
//import setupBcExtensionSetting from "./gui/SettingsBase";
import SettingBase from "./gui/SettingPageBase";
import MainMenuSettings from "./gui/MainMenuSettingsPage";
import ModuleManager from "./utility/ModuleManager";
import { RandomEventsModule } from "./modules/RandomEventsModule";
import { SleepModeModule } from "./modules/SleepModeModule";
import SettingPageManager from "./utility/SettingPageManager";
import StorageManager from "./utility/StroageManager";
import { TaskManagerModule } from "./modules/TaskManagerModule";
import { ChaoticMistressModule } from "./modules/ChaoticMistressModule";
import { uiStyles } from "./gui/GuiStylesCss";
import { GeneralModule } from "./modules/GeneralModule";
import { RemoteModule } from "./modules/RemoteModule";
import { DeviousShocksModule } from "./modules/DeviousShocksModule";


export const BC_SDK: ModSDKModAPI = bcModSdk.registerMod({
    name: "ATB",
    fullName: "Azer Toy Box",
    version: "0.0.1",
    repository: "https://github.com/Azer147"
});

function load() {
    console.log("ATB: Loading...");
    BC_SDK.hookFunction("LoginResponse", 0, (args, next) => {
			console.log("ATB: Init LoginResponse caught", args);
			next(args);
			const response = args[0];
			if (CommonIsObject(response) && typeof response.Name === "string" && typeof response.AccountName === "string") {
				//test();
                loadModules();
                setupBcExtensionSetting();
			}
    });
    console.log("ATB loaded !");
}

function test() {
    console.log("ATB: TEST Player.Name: " + Player.Name);
}

function loadModules() {
    if (ModuleManager.getModulesCount() != 0) {
        console.error("ATB: Modules cannot be loaded more than once!");
        return; // modules already loaded
    }
    StorageManager.loadSettings();
    loadStyles();
    ModuleManager.registerModule(new GeneralModule());
    ModuleManager.registerModule(new RemoteModule());
    ModuleManager.registerModule(new RandomEventsModule());
    ModuleManager.registerModule(new DeviousShocksModule());
    ModuleManager.registerModule(new TaskManagerModule());
    ModuleManager.registerModule(new ChaoticMistressModule());
    //ModuleManager.registerModule(new SleepModeModule());
}

export function hookFunction(functionName: string, priority: number, callback: PatchHook<any>) {
    BC_SDK.hookFunction(functionName, priority, callback);
}

function loadStyles() {
    if (document.getElementById("atb-mod-styles")) return;

    const style = document.createElement("style");
    style.id = "atb-mod-styles";
    // Inject the imported string
    style.innerHTML = uiStyles;

    document.head.appendChild(style);
}

function setupBcExtensionSetting() {
    PreferenceRegisterExtensionSetting({
        Identifier: 'ATB',
        ButtonText: 'Azer Toy Box Settings',
        //Image: ,
        load: () => {
            console.log("ATB: PreferenceRegisterExtensionSetting: load()");
            SettingPageManager.goToSettingPage(new MainMenuSettings());
        },
        run: () => {
            //console.log("ATB: PreferenceRegisterExtensionSetting: run()");
            if (SettingPageManager.currentSettingPage) {
                MainCanvas.textAlign = 'left';
                SettingPageManager.currentSettingPage.Run();
                MainCanvas.textAlign = 'center';
            }
        },
        click: () => {
            console.log("ATB: PreferenceRegisterExtensionSetting: click()");
            if (SettingPageManager.currentSettingPage) {
                SettingPageManager.currentSettingPage.Click();
            }
        },
        exit: () => {
            console.log("ATB: PreferenceRegisterExtensionSetting: exit()");
            if (SettingPageManager.currentSettingPage) {
                SettingPageManager.currentSettingPage.Exit();
            }
        },
        unload: () => {
            console.log("ATB: PreferenceRegisterExtensionSetting: unload()");
            if (SettingPageManager.currentSettingPage) {
                SettingPageManager.currentSettingPage.Unload();
            }
        }
    });
}


load();
