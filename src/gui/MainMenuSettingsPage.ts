import SettingPageManager from '@/utility/SettingPageManager';
import GeneralSettingsPage from './GeneralSettingsPage';
import SettingBase from './SettingPageBase';
import SleepControlSettingsPage from './SleepControlSettingsPage';
import TestSettingsPage from './TestSettingsPage';
import RandomEventsSettingsPage from './RandomEventsSettingsPage';

export default class MainMenuSettingsPage extends SettingBase {

    constructor() {
        super("~ ATB Main Menu Settings ~");

        this.startLeft = 700;
        this.startTop = 260;
        this.GRID_MARGIN = 32;
        this.genericElemList = [
            {
                title: 'General',
                type: 'button',
                value: null,
                height_override: 100,
                onChange: () => { SettingPageManager.goToSettingPage(new GeneralSettingsPage()); }
            },
            {
                title: 'Random Events',
                type: 'button',
                value: null,
                height_override: 100,
                onChange: () => { SettingPageManager.goToSettingPage(new RandomEventsSettingsPage()); }
            },
            /*{
                title: 'Sleep Control',
                type: 'button',
                value: null,
                height_override: 100,
                onChange: () => { SettingPageManager.goToSettingPage(new SleepControlSettingsPage()); }
            },*/
            /*{ // TODO: Remove
                title: 'Test Settings GUI',
                type: 'button',
                value: null,
                height_override: 100,
                onChange: () => { SettingPageManager.goToSettingPage(new TestSettingsPage()); }
            }*/ // TODO: Remove
        ];
    }

    Run(): void {
        super.Run();
    }

    Click(): void {
        // cycle selection for demo purposes
        super.Click();
    }

    Exit(): void {
        super.Exit();
    }

    Unload(): void {
        super.Unload();
    }
}