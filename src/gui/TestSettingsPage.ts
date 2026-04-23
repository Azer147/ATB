import SettingBase from './SettingPageBase';

export default class TestSettingsPage extends SettingBase {

    constructor() {
        super("~ ATB Test Settings Page ~");
        console.warn('ATB: TestSettings constructor');

        // TODO: Test changing start pos and default size
        //this.startLeft = 150;
        //this.startTop = 250;
        //this.defaultWidth = 700;
        //this.defaultHeight = 100;

        this.genericElemList = [
            {
                title: 'Simple Checkbox',
                type: 'checkbox',
                value: false,
                onChange: (new_val) => { console.log("checkbox clicked: value=" + new_val); }
            },
            {
                title: 'Simple Text',
                type: 'text',
                value: "this is a test for text",
                onChange: (new_val) => { console.log("Text changed: value=" + new_val); }
            },
            {
                title: 'Simple Number',
                type: 'number',
                value: 69,
                onChange: (new_val) => { console.log("Number changed: value=" + new_val); }
            },
            {
                title: 'Simple Number 2 with a longer title',
                type: 'number',
                value: 33,
                onChange: (new_val) => { console.log("Number 2 changed: value=" + new_val); }
            },
            {
                title: 'Simple Button',
                type: 'button',
                value: null,
                onChange: (new_val) => { console.log("Button clicked: value=" + new_val); }
            },
            {
                title: 'Simple Button 2 with a longer title',
                type: 'button',
                value: null,
                onChange: (new_val) => { console.log("Button 2 clicked: value=" + new_val); }
            },
            {
                title: 'Button with label 1',
                type: 'button_with_label',
                value: null,
                onChange: (new_val) => { console.log("Button with label 1 clicked: value=" + new_val); }
            },
            {
                title: 'Button with label 2',
                type: 'button_with_label',
                value: null,
                onChange: (new_val) => { console.log("Button with label 2 clicked: value=" + new_val); }
            },
            {
                title: 'Simple Checkbox 2',
                type: 'checkbox',
                value: false,
                onChange: (new_val) => { console.log("checkbox 2 clicked: value=" + new_val); }
            },
            {
                title: 'Simple Checkbox 3 with a longer title',
                type: 'checkbox',
                value: false,
                onChange: (new_val) => { console.log("checkbox 3 clicked: value=" + new_val); }
            },
            {
                title: 'Simple Checkbox 4',
                type: 'checkbox',
                value: false,
                onChange: (new_val) => { console.log("checkbox 4 clicked: value=" + new_val); }
            },
            {
                title: 'Simple Text 3',
                type: 'text',
                value: "this is a test for text",
                onChange: (new_val) => { console.log("Text changed: value=" + new_val); }
            },
            {
                title: 'Simple Text 4 longer title',
                type: 'text',
                value: "this is a test for text",
                onChange: (new_val) => { console.log("Text changed: value=" + new_val); }
            },
            {
                title: 'Simple Text 5 longer and longer and longer title',
                type: 'text',
                value: "this is a test for text",
                onChange: (new_val) => { console.log("Text changed: value=" + new_val); }
            },
        ];
    }

    Load(): void {
        console.warn('ATB: TestSettings Load()');
        super.Load();
    }

    Run(): void {
        //console.warn('ATB: TestSettings Run');
        super.Run();
    }

    Click(): void {
        console.warn('ATB: TestSettings Click() X=' + MouseX + " Y=" + MouseY);
        super.Click();
    }

    Exit(): void {
        console.warn('ATB: TestSettings Exit()');
        super.Exit();
    }

    Unload(): void {
        console.warn('ATB: TestSettings Unload()');
        super.Unload();
    }
}