import { GuiHelper, GuiFormField } from "./GuiHelper";
import GuiViewBase from "./GuiViewBase";
import { getCharacterOutfitSettings, saveSettings } from "@/utility/CharacterWrapper";
import { allOutfitList, extractOutfitDataFromId, getOutfitSettingsFromId, getRawOutfitFromId, OutfitId, OutfitsSettings, RawOutfit } from "@/models/OutfitSettings";
import { createColorRect, hexToHsl, hslToHex, smartReplaceItemColor } from "@/utility/ColorUtility";
import { isBodyPart, stripNakedCharacterAdv } from "@/utility/utility";
import { GuiCharacterViewer } from "./GuiCharacterViewer";

export class GuiOutfitSettingsView extends GuiViewBase {
    private shouldSaveSetting: boolean = false;
    private settings!: OutfitsSettings;

    private previewChar: Character | undefined;
    private characterViewer: GuiCharacterViewer | undefined;

    private UPDATE_PREVIEW_TIME_MS = 100;
    private updatePreviewInterval: number = 0;


    private INFO_TEXT = `
    All Outfits pre-made, to be used with Task <strong>Wear Outfit</strong>.<br>
    - <strong>Enable:</strong> Enable/Disable this outfit for the task Wear Outfit. Especially usefull to prevent usage on Remote Access.<br>
    - <strong>Enable for Random Task:</strong> Enable/Disable this outfit Random Task / Random Punishement.<br>
    - <strong>Weigth Random:</strong> Weigth that this outfit will be selected when generating a random task. (For Random Task/Random Punishement)<br>
    - <strong>Show:</strong> Preview the outfit on your character.<br>
    <br>
    <strong>Know issue:</strong> If your character is blind, the character model will not appear.
    `;

    private STRINGS = {
        PAGE_TITLE: "Outfit Settings",

        INFO_TITLE: "Outfit Settings Informations",

        BTN_SHOW: "Show"
    };


    constructor(parent: HTMLDivElement, C: OtherCharacter | PlayerCharacter) {
        super(parent, C);

        const settings = getCharacterOutfitSettings(this.character)
        if (!settings) {
            // Build error page
            GuiHelper.buildErrorPage(parent);
            return;
        }
        this.settings = settings;

        let outfitViewer = document.createElement("div");
        let outfitCards = document.createElement("div");
        this.buildOutfitViewer(outfitViewer);
        this.buildOutfitSettingsPage(outfitCards);

        let row = GuiHelper.createTwoElemRow(outfitViewer, outfitCards);
        // We want the card to take more space
        outfitCards.style.flex = "2";

        // Make outfitViewer stick
        outfitViewer.style.position = "sticky";
        outfitViewer.style.top = "1.2em"; // The distance from the top of the scrolling container
        outfitViewer.style.alignSelf = "flex-start";

        this.parent.appendChild(row);
    }

    public update() {
    }

    public unload() {
        if (this.shouldSaveSetting) {
            saveSettings(this.character);
        }
        if (this.updatePreviewInterval) {
            clearInterval(this.updatePreviewInterval);
        }
        if (this.characterViewer) {
            this.characterViewer.unload();
        }
        if (this.previewChar) {
            CharacterDelete(this.previewChar);
        }
    }

    private buildOutfitViewer(container: HTMLElement) {
        this.previewChar = CharacterLoadSimple(`ATB-Outfit-Viewer`);
        // To prevent holding nested ref from this.character
        const appearanceStr = CharacterAppearanceStringify(this.character);
        CharacterAppearanceRestore(this.previewChar, appearanceStr);

        //stripNakedCharacterAdv(this.previewChar, false);
        CharacterReleaseTotal(this.previewChar, false);
        CharacterResetFacialExpression(this.previewChar);
        CharacterRefresh(this.previewChar, false, false);

        this.characterViewer = new GuiCharacterViewer(this.previewChar);

        // Need fast interval for animations
        // Note: We could also just DrawCharacter once if needed, if we don't care about animations
        this.updatePreviewInterval = setInterval(() => {this.characterViewer?.updateCharView()}, this.UPDATE_PREVIEW_TIME_MS);

        container.appendChild(this.characterViewer.getElement());
    }

    private showOutfit(outfitId: OutfitId) {
        let outfitItem = extractOutfitDataFromId(outfitId);
        const canCustomColor = this.settings.enableCustomColor && getRawOutfitFromId(outfitId)?.tags.includes("custom_color");

        if (this.previewChar) {
            CharacterReleaseTotal(this.previewChar, false);
            stripNakedCharacterAdv(this.previewChar, false);
            CharacterResetFacialExpression(this.previewChar);

            for (let i = 0; i < outfitItem.length; i++) {
                let item = outfitItem[i];

                let appliedItem = InventoryWear(this.previewChar, item.Name, item.Group, item.Color, item.Difficulty, undefined, item.Craft, false);
                if (appliedItem) {
                    if (item.Property) {
                        appliedItem.Property = item.Property;
                    }
                    if (canCustomColor && appliedItem.Color && !isBodyPart(appliedItem)) {
                        let customColor = smartReplaceItemColor(this.settings.customColorHex, appliedItem.Color);
                        if (customColor && customColor !== "Default") {
                            appliedItem.Color = customColor;
                        }
                    }
                }
            }
            CharacterRefresh(this.previewChar, false, false);
        }
    }

    public buildOutfitSettingsPage(container: HTMLElement) {
        //GuiHelper.createContentTitle(this.parent, this.STRINGS.PAGE_TITLE, true);

        const form = document.createElement("div");
        form.style.display = "flex";
        form.style.flexDirection = "column";
        form.style.gap = "0.9em";

        const helpSection = GuiHelper.createInfoSection("info", this.STRINGS.INFO_TITLE, this.INFO_TEXT);
        form.appendChild(helpSection);

        //GuiHelper.createContentTitle(form, this.STRINGS.PAGE_TITLE, true);

        const customColorCard = this.buildCustomColorCard();
        if (customColorCard) form.appendChild(customColorCard);

        for (let i=0; i < allOutfitList.length; i++) {
            const outfitCard = this.buildOutfitCard(allOutfitList[i]);
            if (outfitCard) form.appendChild(outfitCard);
        }

        container.appendChild(form);
    }

    private buildCustomColorCard(): HTMLElement | undefined {
        const FIELD_COLOR_ENABLE: GuiFormField = {
            html_id: "atb-outfit-custom-color-enable",
            label: "Enable Custom Outfit Color",
            type: "checkbox",
            default_value: this.settings.enableCustomColor,
            onChange: (value: boolean) => {
                this.settings.enableCustomColor = value;
                this.shouldSaveSetting = true;
            }
        };

        const outfitTuple = GuiHelper.createFeatureToggleCard(FIELD_COLOR_ENABLE, true);
        const outfitMainCard = outfitTuple.card;
        const outfitContent = outfitTuple.contentArea;

        //const baseHexValue = hslToHex(this.settings.customColorHue, 1, 0.5);
        const baseHueValue = hexToHsl(this.settings.customColorHex)?.h || 0;

        const colorMain = document.createElement("div");
        const colorMainRect = createColorRect("atb-custom-color-rect", this.settings.customColorHex);
        const colorMainSlider = document.createElement("input");
        colorMainSlider.id = "atb-custom-color-range"; // should be a variable
        colorMainSlider.className = "atb-hue-slider";
        colorMainSlider.type = "range";
        //colorMainSlider.value = this.settings.customColorHue.toString();
        colorMainSlider.min = "0";
        colorMainSlider.max = "360";
        colorMainSlider.value = baseHueValue.toString();
        colorMainSlider.onchange = () => {
            this.settings.customColorHex = hslToHex(parseInt(colorMainSlider.value), 1, 0.5);
            colorMainRect.style.backgroundColor = this.settings.customColorHex;
            this.shouldSaveSetting = true;
        };
        colorMain.appendChild(colorMainSlider);
        outfitContent.appendChild(colorMain);
        outfitContent.appendChild(colorMainRect);

        return outfitMainCard;
    }

    private buildOutfitCard(outfitData: RawOutfit): HTMLElement | undefined {
        const outfitSettings = getOutfitSettingsFromId(this.settings, outfitData.id);

        if (outfitSettings) {
            // Fields
            const FIELD_ENABLE: GuiFormField = {
                html_id: "atb-outfit-enable-" + outfitData.id,
                label: outfitData.name,
                type: "checkbox",
                default_value: outfitSettings.enable,
                onChange: (value: boolean) => {
                    outfitSettings.enable = value;
                    this.shouldSaveSetting = true;
                }
            };
            const FIELD_ENABLE_RANDOM: GuiFormField = {
                html_id: "atb-outfit-enable-random-" + outfitData.id,
                label: "Enable For Random Task",
                description: "Enable this Outfit for Random Task / Random Punishement",
                type: "checkbox",
                default_value: outfitSettings.enableForRandomTask,
                onChange: (value: boolean) => {
                    outfitSettings.enableForRandomTask = value;
                    this.shouldSaveSetting = true;
                }
            };
            const FIELD_WEIGHT_RANDOM: GuiFormField = {
                html_id: "atb-outfit-weight" + outfitData.id,
                label: "Weight For Random Task",
                description: "Weigth for this Outfit to be selected on Random Task or Random Punishement",
                type: "number",
                min_value: 0,
                max_value: 1000,
                default_value: outfitSettings.randomWeight,
                onChange: (value: number) => {
                    outfitSettings.randomWeight = value;
                    this.shouldSaveSetting = true;
                }
            };

            const showOutfitBtn = document.createElement("button");
            showOutfitBtn.className = "atb-main-btn";
            showOutfitBtn.innerText = this.STRINGS.BTN_SHOW;
            showOutfitBtn.onclick = () => {
                this.showOutfit(outfitData.id);
            };

            // Build Main card
            const outfitTuple = GuiHelper.createFeatureToggleCard(FIELD_ENABLE, true, showOutfitBtn);
            const outfitMainCard = outfitTuple.card;
            const outfitContent = outfitTuple.contentArea;

            const enableRandom = GuiHelper.createFormField(FIELD_ENABLE_RANDOM);
            const weightRandom = GuiHelper.createFormField(FIELD_WEIGHT_RANDOM);
            const rowRandom = GuiHelper.createTwoElemRow(enableRandom, weightRandom);
            outfitContent.appendChild(rowRandom);

            return outfitMainCard;
        }

        return undefined;
    }

}