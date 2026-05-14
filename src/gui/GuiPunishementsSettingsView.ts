import { GuiHelper, GuiFormField } from "./GuiHelper";
import { SinglePunishmentSettings, TasksSettings } from "@/models/TasksSettings";
import GuiViewBase from "./GuiViewBase";
import { getCharacterTasksSettings, saveSettings } from "@/utility/CharacterWrapper";

export class GuiPunishementsSettingsView extends GuiViewBase {
    private shouldSaveSetting: boolean = false;
    private settings!: TasksSettings


    private HELP_BASE_TASK_TEXT = `
    Settings Fields Information:<br>
    - <strong>Weight:</strong> Used for random selection, higher weight means higher chance to be selected against other, 0 means this punishements cannot be randomly selected.<br>
    - <strong>Base Duration:</strong> This will be the base duration used for random duration used by Chaotic Mistress. This is also used to calculate the Points Rewards, if selected duration is lower/higher than the base duration, Rewards will be lower/higher.<br>
    - <strong>Base Good/Bad Points: </strong>Will be used as a base value for the punishements and points calculation.<br>
    <br>
    All Punishements list:<br>
    - <strong>Full Bondage:</strong> Force equip Random restraints: Hands/Arms, Legs, Gag, Chastity, Toy/vibrator. (does not replace existing items)
    `;

    private STRINGS = {
        PAGE_TITLE: "Punishements Settings",

        HELP_BASE_TASK_TITLE: "Punishements Overview/Information",
    };


    constructor(parent: HTMLDivElement, C: OtherCharacter | PlayerCharacter) {
        super(parent, C);

        const settings = getCharacterTasksSettings(this.character)
        if (!settings) {
            // Build error page
            GuiHelper.buildErrorPage(parent);
            return;
        }
        this.settings = settings;

        this.buildPunishementsSettingsPage();
    }

    public update() {}

    public unload() {
        if (this.shouldSaveSetting) {
            saveSettings(this.character);
        }
    }

    public buildPunishementsSettingsPage() {
        GuiHelper.createContentTitle(this.parent, this.STRINGS.PAGE_TITLE, true);

        const form = document.createElement("div");
        form.style.display = "flex";
        form.style.flexDirection = "column";
        form.style.gap = "15px";

        const helpSection = GuiHelper.createInfoSection("info", this.STRINGS.HELP_BASE_TASK_TITLE, this.HELP_BASE_TASK_TEXT);
        form.appendChild(helpSection);

        const fullBondageCard = this.buildFullBondageCard();
        const harshOutfitCard = this.buildHarshOutfitCard();

        // Final Assembly
        form.appendChild(fullBondageCard);
        form.appendChild(harshOutfitCard);
        this.parent.appendChild(form);
    }

    private buildFullBondageCard(): HTMLElement {
        let prefixId = "atb-punish-full-bondage";
        let punishSettings = this.settings.fullBondagePunishmentSettings;
        // Fields
        const FIELD_ENABLE: GuiFormField = {
            html_id: prefixId + "-enable",
            label: "Enable Full Bondage Punishements",
            type: "checkbox",
            default_value: punishSettings.enable,
            onChange: (value: boolean) => {
                punishSettings.enable = value;
                this.shouldSaveSetting = true;
            }
        };

        // Build Main card
        const bondagePunishTuple = GuiHelper.createFeatureToggleCard(FIELD_ENABLE, true);
        const bondagePunishMainCard = bondagePunishTuple.card;
        const bondagePunishContent = bondagePunishTuple.contentArea;

        this.appendCommonPunishField(bondagePunishContent, prefixId, punishSettings);

        return bondagePunishMainCard;
    }

    private buildHarshOutfitCard(): HTMLElement {
        let prefixId = "atb-punish-harsh-outfit";
        let punishSettings = this.settings.harshOutfitPunishmentSettings;
        // Fields
        const FIELD_ENABLE: GuiFormField = {
            html_id: prefixId + "-enable",
            label: "Enable Harsh Outfit Punishements",
            type: "checkbox",
            default_value: punishSettings.enable,
            onChange: (value: boolean) => {
                punishSettings.enable = value;
                this.shouldSaveSetting = true;
            }
        };

        // Build Main card
        const bondagePunishTuple = GuiHelper.createFeatureToggleCard(FIELD_ENABLE, true);
        const bondagePunishMainCard = bondagePunishTuple.card;
        const bondagePunishContent = bondagePunishTuple.contentArea;

        this.appendCommonPunishField(bondagePunishContent, prefixId, punishSettings);

        return bondagePunishMainCard;
    }


    private appendCommonPunishField(container: HTMLElement, prefixId: string, punishSettings: SinglePunishmentSettings) {
        // Fields
        const FIELD_WEIGHT: GuiFormField = {
            html_id: prefixId + "-weight",
            label: "Weight for random Punishements (0 - 1000)",
            type: "number",
            min_value: 0,
            max_value: 1000,
            default_value: punishSettings.randomWeight,
            onChange: (value: number) => {
                punishSettings.randomWeight = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_DURATION: GuiFormField = {
            html_id: prefixId + "-duration",
            label: "Base Duration (minutes)",
            type: "number",
            min_value: 5,
            max_value: 10080, // 7 days
            default_value: Math.floor(punishSettings.baseDurationMs / (1000 * 60)),
            onChange: (value: number) => {
                punishSettings.baseDurationMs = value * 1000 * 60;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_REWARD: GuiFormField = {
            html_id: prefixId + "-reward",
            label: "Base Good Points Reward on completion",
            type: "number",
            min_value: 0,
            max_value: 100,
            default_value: punishSettings.baseGoodPtsReward,
            onChange: (value: number) => {
                punishSettings.baseGoodPtsReward = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_PENALTY: GuiFormField = {
            html_id: prefixId + "-penalty",
            label: "Base Bad Points Penalty on failure/transgression",
            type: "number",
            min_value: 0,
            max_value: 100,
            default_value: punishSettings.baseBadPointsPenalty,
            onChange: (value: number) => {
                punishSettings.baseBadPointsPenalty = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_PTS_REDUCTION: GuiFormField = {
            html_id: prefixId + "-pts-reduction",
            label: "Base Bad Points Reduction on accepting this Punishement",
            type: "number",
            min_value: 0,
            max_value: 100,
            default_value: punishSettings.baseBadPtsReduction,
            onChange: (value: number) => {
                punishSettings.baseBadPtsReduction = value;
                this.shouldSaveSetting = true;
            }
        };

        const punishWeight = GuiHelper.createFormField(FIELD_WEIGHT);
        const punishDuration = GuiHelper.createFormField(FIELD_DURATION);
        const punishReward = GuiHelper.createFormField(FIELD_REWARD);
        const punishPenalty = GuiHelper.createFormField(FIELD_PENALTY);
        const punishReduction = GuiHelper.createFormField(FIELD_PTS_REDUCTION);

        const punishRow1 = GuiHelper.createTwoElemRow(punishWeight, punishDuration);
        const punishRowPts = GuiHelper.createTwoElemRow(punishReward, punishPenalty);

        container.appendChild(punishRow1);
        container.appendChild(punishRowPts);
        container.appendChild(punishReduction);
    }
}