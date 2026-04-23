import StorageManager from '@/utility/StroageManager';
import SettingBase from './SettingPageBase';
import { GeneralSettings } from '@/models/GeneralSettings';

export default class GeneralSettingsPage extends SettingBase {
    settings: GeneralSettings;
    globalEnable: boolean = StorageManager.getGlobalEnable();

    constructor() {
        super("ATB General Settings");

        this.settings = StorageManager.getGeneralSettings();

        this.genericElemList = [
            {
                title: 'Global ATB enable',
                type: 'checkbox',
                value: this.globalEnable,
                onChange: (new_val) => { this.globalEnable = new_val; }
            },
            {
                title: 'Add ATB button in chat room',
                type: 'checkbox',
                value: this.settings.addChatRoomBtn,
                onChange: (new_val) => { this.settings.addChatRoomBtn = new_val; }
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
        StorageManager.setGlobalEnable(this.globalEnable);
        super.Exit();
    }

    Unload(): void {
        super.Unload();
    }
}