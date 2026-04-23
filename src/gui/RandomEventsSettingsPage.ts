import { DefaultRandomEventsSettings, RandomEventsSettings } from '@/models/RandomEventsSettings';
import SettingBase from './SettingPageBase';
import ModuleManager from "@/utility/ModuleManager";
import StorageManager from '@/utility/StroageManager';

export default class RandomEventsSettingsPage extends SettingBase {
    settings: RandomEventsSettings;

    constructor() {
        super("~ ATB Random Events Settings Page ~");

        this.settings = StorageManager.getRandomEventsSettings();

        this.genericElemList = [
            {
                title: 'Enable Random Events',
                type: 'checkbox',
                value: this.settings.enable,
                onChange: (new_val) => { this.settings.enable = new_val; }
            },
            {
                title: 'Chance of Random Events (%)',
                type: 'number',
                value: this.settings.chanceEvent,
                onChange: (new_val) => {
                    if (new_val < 0) new_val = 0;
                    if (new_val > 100) new_val = 100;
                    this.settings.chanceEvent = new_val;
                }
            },
            {
                title: 'Chance events use harsher variant (%)',
                type: 'number',
                value: this.settings.chanceHarshEvent,
                onChange: (new_val) => {
                    if (new_val < 0) new_val = 0;
                    if (new_val > 100) new_val = 100;
                    this.settings.chanceHarshEvent = new_val;
                }
            },
            {
                title: 'Enable Trigger: On Room Entry',
                type: 'checkbox',
                value: this.settings.enableTriggerOnRoomEntry,
                onChange: (new_val) => { this.settings.enableTriggerOnRoomEntry = new_val; }
            },
            {
                title: 'Enable Trigger: On Room Exit',
                type: 'checkbox',
                value: this.settings.enableTriggerOnRoomExit,
                onChange: (new_val) => { this.settings.enableTriggerOnRoomExit = new_val; }
            },
            {
                title: 'Enable Event: Add Restraint',
                type: 'checkbox',
                value: this.settings.enableAddRestraintEvent,
                onChange: (new_val) => { this.settings.enableAddRestraintEvent = new_val; }
            },
            {
                title: 'Enable Event: Add Locks to your restraints',
                type: 'checkbox',
                value: this.settings.enableAddLocksEvent,
                onChange: (new_val) => { this.settings.enableAddLocksEvent = new_val; }
            },
            {
                title: 'Enable Event: Add locks with a random combination (guessable)',
                type: 'checkbox',
                value: this.settings.enableRandomCombinationLockEvent,
                onChange: (new_val) => { this.settings.enableRandomCombinationLockEvent = new_val; }
            },
        ];
    }

    Load(): void {
        super.Load();
    }

    Run(): void {
        super.Run();
    }

    Click(): void {
        super.Click();
    }

    Exit(): void {
        //ModuleManager.getRandomEventsModule()?.setSettings(this.settings);
        //StorageManager.saveSettings();
        super.Exit();
    }

    Unload(): void {
        super.Unload();
    }
}