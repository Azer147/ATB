import SettingPageBase from "@/gui/SettingPageBase";

export default class SettingPageManager {
    static currentSettingPage: SettingPageBase | undefined = undefined;
	static settingPageStack: SettingPageBase[] = [];

    static goToSettingPage(settingPage: SettingPageBase) {
        if (settingPage != null) {
			if (this.currentSettingPage) {
				this.settingPageStack.push(this.currentSettingPage);
			}
			this.currentSettingPage = settingPage;
            this.currentSettingPage.Load();
		}
    }

    static goBack() {
        if (this.settingPageStack.length > 0) {
			this.currentSettingPage = this.settingPageStack.pop();
		} else {
			this.currentSettingPage = undefined;
			PreferenceSubscreenExtensionsClear();
		}
    }
}