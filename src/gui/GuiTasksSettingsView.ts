import { GuiHelper, GuiFormField } from "./GuiHelper";
import { TasksSettings } from "@/models/TasksSettings";
import GuiViewBase from "./GuiViewBase";
import { getCharacterTasksSettings, saveSettings } from "@/utility/CharacterWrapper";

export class GuiTasksSettingsView extends GuiViewBase {
    private shouldSaveSetting: boolean = false;
    private settings!: TasksSettings


    private HELP_BASE_TASK_TEXT = `
    Settings Fields Information:<br>
    - <strong>Weight:</strong> Used for random selection, higher weight means higher chance to be selected against other, 0 means this punishements cannot be randomly selected.<br>
    - <strong>Base Duration:</strong> This will be the base duration used for random duration used by Chaotic Mistress. This is also used to calculate the Points Rewards, if selected duration is lower/higher than the base duration, Rewards will be lower/higher.<br>
    - <strong>Base Good/Bad Points: </strong>Will be used as a base value for the punishements and points calculation.<br>
    <br>
    All Tasks list:<br>
    <strong>Wear Bondage/Restraints:</strong> Get penalty if not wearing specified restraints.<br>
    - <strong>Grace Period:</strong> How long the Player have before getting a penalty for not wearing the specified restraint.
    `;

    private STRINGS = {
        PAGE_TITLE: "Tasks Settings",

        CATEGORY_FINISH_WEIGHT: "Finish Weight for Random Selection",
        CATEGORY_BONDAGE_ITEMS: "Bondage/Restraint Items",

        HELP_BASE_TASK_TITLE: "Tasks Overview/Information",
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

        this.buildTasksSettingsPage();
    }

    public update() {}

    public unload() {
        if (this.shouldSaveSetting) {
            saveSettings(this.character);
        }
    }


    public buildTasksSettingsPage() {
        GuiHelper.createContentTitle(this.parent, this.STRINGS.PAGE_TITLE, true);

        const form = document.createElement("div");
        form.style.display = "flex";
        form.style.flexDirection = "column";
        form.style.gap = "15px";

        const helpSection = GuiHelper.createHelpSection(this.STRINGS.HELP_BASE_TASK_TITLE, this.HELP_BASE_TASK_TEXT);
        form.appendChild(helpSection);

        const finishMainCard = this.buildTaskFinishCard();
        const bondageTaskMainCard = this.buildWearBondageTaskCard();

        // Final Assembly
        form.appendChild(finishMainCard);
        form.appendChild(bondageTaskMainCard);
        this.parent.appendChild(form);
    }

    private buildTaskFinishCard(): HTMLElement {
        // Fields
        const FIELD_FINISH_TITLE: GuiFormField = {
            html_id: "atb-finish-card-title",
            label: "Alternative Task Finish Activity",
            type: "display-text",
            default_value: true
        };
        const FIELD_DURATION_WEIGHT: GuiFormField = {
            html_id: "atb-finish-duration-weight",
            label: "Weight for Duration (for Random Task)",
            type: "number",
            min_value: 0,
            max_value: 1000,
            default_value: this.settings.taskFinishSettings.randWeightDuration,
            onChange: (value: number) => {
                this.settings.taskFinishSettings.randWeightDuration = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ORGASM_ENABLE: GuiFormField = {
            html_id: "atb-finish-orgasm-enable",
            label: "Enable Orgasm as Task Finish requierment",
            type: "checkbox",
            default_value: this.settings.taskFinishSettings.orgasm.enable,
            onChange: (value: boolean) => {
                this.settings.taskFinishSettings.orgasm.enable = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ORGASM_BASE: GuiFormField = {
            html_id: "atb-finish-orgasm-base",
            label: "Base Orgasm Needed",
            type: "number",
            min_value: 1,
            max_value: 500,
            default_value: this.settings.taskFinishSettings.orgasm.baseCount,
            onChange: (value: number) => {
                this.settings.taskFinishSettings.orgasm.baseCount = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ORGASM_WEIGHT: GuiFormField = {
            html_id: "atb-finish-orgasm-weight",
            label: "Weight for Orgasm (for Random Task)",
            type: "number",
            min_value: 0,
            max_value: 1000,
            default_value: this.settings.taskFinishSettings.orgasm.randomWeight,
            onChange: (value: number) => {
                this.settings.taskFinishSettings.orgasm.randomWeight = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ORGASM_RUINED_ENABLE: GuiFormField = {
            html_id: "atb-finish-orgasm-ruined-enable",
            label: "Enable Orgasm Ruined",
            type: "checkbox",
            default_value: this.settings.taskFinishSettings.orgasmRuined.enable,
            onChange: (value: boolean) => {
                this.settings.taskFinishSettings.orgasmRuined.enable = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ORGASM_RUINED_BASE: GuiFormField = {
            html_id: "atb-finish-orgasm-ruined-base",
            label: "Base Orgasm Ruined Needed",
            type: "number",
            min_value: 1,
            max_value: 500,
            default_value: this.settings.taskFinishSettings.orgasmRuined.baseCount,
            onChange: (value: number) => {
                this.settings.taskFinishSettings.orgasmRuined.baseCount = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ORGASM_RUINED_WEIGHT: GuiFormField = {
            html_id: "atb-finish-orgasm-ruined-weight",
            label: "Weight for Orgasm Ruined (for Random Task)",
            type: "number",
            min_value: 0,
            max_value: 1000,
            default_value: this.settings.taskFinishSettings.orgasmRuined.randomWeight,
            onChange: (value: number) => {
                this.settings.taskFinishSettings.orgasmRuined.randomWeight = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ORGASM_RESISTED_ENABLE: GuiFormField = {
            html_id: "atb-finish-orgasm-resisted-enable",
            label: "Enable Orgasm Resisted",
            type: "checkbox",
            default_value: this.settings.taskFinishSettings.orgasmResisted.enable,
            onChange: (value: boolean) => {
                this.settings.taskFinishSettings.orgasmResisted.enable = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ORGASM_RESISTED_BASE: GuiFormField = {
            html_id: "atb-finish-orgasm-resisted-base",
            label: "Base Orgasm Resisted Needed",
            type: "number",
            min_value: 1,
            max_value: 500,
            default_value: this.settings.taskFinishSettings.orgasmResisted.baseCount,
            onChange: (value: number) => {
                this.settings.taskFinishSettings.orgasmResisted.baseCount = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ORGASM_RESISTED_WEIGHT: GuiFormField = {
            html_id: "atb-finish-orgasm-resisted-weight",
            label: "Weight for Orgasm Resisted (for Random Task)",
            type: "number",
            min_value: 0,
            max_value: 1000,
            default_value: this.settings.taskFinishSettings.orgasmResisted.randomWeight,
            onChange: (value: number) => {
                this.settings.taskFinishSettings.orgasmResisted.randomWeight = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_SPANK_ENABLE: GuiFormField = {
            html_id: "atb-finish-spank-enable",
            label: "Enable Spank",
            type: "checkbox",
            default_value: this.settings.taskFinishSettings.spank.enable,
            onChange: (value: boolean) => {
                this.settings.taskFinishSettings.spank.enable = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_SPANK_BASE: GuiFormField = {
            html_id: "atb-finish-spank-base",
            label: "Base Spank Needed",
            type: "number",
            min_value: 1,
            max_value: 500,
            default_value: this.settings.taskFinishSettings.spank.baseCount,
            onChange: (value: number) => {
                this.settings.taskFinishSettings.spank.baseCount = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_SPANK_WEIGHT: GuiFormField = {
            html_id: "atb-finish-spank-weight",
            label: "Weight for Spank (for Random Task)",
            type: "number",
            min_value: 0,
            max_value: 1000,
            default_value: this.settings.taskFinishSettings.spank.randomWeight,
            onChange: (value: number) => {
                this.settings.taskFinishSettings.spank.randomWeight = value;
                this.shouldSaveSetting = true;
            }
        };


        // Build Main card for bondage tasks
        const finishTuple = GuiHelper.createFeatureToggleCard(FIELD_FINISH_TITLE, true);
        const finishMainCard = finishTuple.card;
        const finishContent = finishTuple.contentArea;

        const finishOrgasmEnable = GuiHelper.createFormField(FIELD_ORGASM_ENABLE);
        const finishOrgasmBase = GuiHelper.createFormField(FIELD_ORGASM_BASE);
        const finishOrgasmRuinedEnable = GuiHelper.createFormField(FIELD_ORGASM_RUINED_ENABLE);
        const finishOrgasmRuinedBase = GuiHelper.createFormField(FIELD_ORGASM_RUINED_BASE);
        const finishOrgasmResistedEnable = GuiHelper.createFormField(FIELD_ORGASM_RESISTED_ENABLE);
        const finishOrgasmResistedBase = GuiHelper.createFormField(FIELD_ORGASM_RESISTED_BASE);
        const finishSpankEnable = GuiHelper.createFormField(FIELD_SPANK_ENABLE);
        const finishSpankBase = GuiHelper.createFormField(FIELD_SPANK_BASE);

        const finishDurationWeight = GuiHelper.createFormField(FIELD_DURATION_WEIGHT);
        const finishOrgasmWeight = GuiHelper.createFormField(FIELD_ORGASM_WEIGHT);
        const finishOrgasmRuinedWeight = GuiHelper.createFormField(FIELD_ORGASM_RUINED_WEIGHT);
        const finishOrgasmResistedWeight = GuiHelper.createFormField(FIELD_ORGASM_RESISTED_WEIGHT);
        const finishSpankWeight = GuiHelper.createFormField(FIELD_SPANK_WEIGHT);


        const finishOrgasmRow = GuiHelper.createTwoElemRow(finishOrgasmEnable, finishOrgasmBase);
        const finishOrgasmRuinedRow = GuiHelper.createTwoElemRow(finishOrgasmRuinedEnable, finishOrgasmRuinedBase);
        const finishOrgasmResistedRow = GuiHelper.createTwoElemRow(finishOrgasmResistedEnable, finishOrgasmResistedBase);
        const finishSpankRow = GuiHelper.createTwoElemRow(finishSpankEnable, finishSpankBase);

        // Put all weight together to not waste too much space
        const finishWeightRow1 = GuiHelper.createTwoElemRow(finishDurationWeight, finishOrgasmWeight);
        const finishWeightRow2 = GuiHelper.createTwoElemRow(finishOrgasmRuinedWeight, finishOrgasmResistedWeight);

        finishContent.appendChild(finishOrgasmRow);
        finishContent.appendChild(finishOrgasmRuinedRow);
        finishContent.appendChild(finishOrgasmResistedRow);
        finishContent.appendChild(finishSpankRow);
        GuiHelper.createContentTitle(finishContent, this.STRINGS.CATEGORY_FINISH_WEIGHT);
        finishContent.appendChild(finishWeightRow1);
        finishContent.appendChild(finishWeightRow2);
        finishContent.appendChild(finishSpankWeight);

        return finishMainCard;
    }

    private buildWearBondageTaskCard(): HTMLElement {
        // Fields
        const FIELD_ENABLE: GuiFormField = {
            html_id: "atb-task-bondage-enable",
            label: "Enable Wear Bondage/Restraints Task",
            type: "checkbox",
            default_value: this.settings.wearBondageTaskSettings.enable,
            onChange: (value: boolean) => {
                this.settings.wearBondageTaskSettings.enable = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_WEIGHT: GuiFormField = {
            html_id: "atb-task-bondage-weight",
            label: "Weight of Event for random Tasks (0 - 1000)",
            type: "number",
            min_value: 0,
            max_value: 1000,
            default_value: this.settings.wearBondageTaskSettings.randomWeight,
            onChange: (value: number) => {
                this.settings.wearBondageTaskSettings.randomWeight = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_DURATION: GuiFormField = {
            html_id: "atb-task-bondage-duration",
            label: "Base Duration (minutes)",
            type: "number",
            min_value: 5,
            max_value: 10080, // 7 days
            default_value: Math.floor(this.settings.wearBondageTaskSettings.baseDurationMs / (1000 * 60)),
            onChange: (value: number) => {
                this.settings.wearBondageTaskSettings.baseDurationMs = value * 1000 * 60;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_REWARD: GuiFormField = {
            html_id: "atb-task-bondage-reward",
            label: "Base Good Points Reward on task completion",
            type: "number",
            min_value: 0,
            max_value: 100,
            default_value: this.settings.wearBondageTaskSettings.baseGoodPtsReward,
            onChange: (value: number) => {
                this.settings.wearBondageTaskSettings.baseGoodPtsReward = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_PENALTY: GuiFormField = {
            html_id: "atb-task-bondage-penalty",
            label: "Base Bad Points Penalty on task failure",
            type: "number",
            min_value: 0,
            max_value: 100,
            default_value: this.settings.wearBondageTaskSettings.baseBadPointsPenalty,
            onChange: (value: number) => {
                this.settings.wearBondageTaskSettings.baseBadPointsPenalty = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_GRACE_PERIOD: GuiFormField = {
            html_id: "atb-task-bondage-grace-period",
            label: "Grace Period before Penalty(seconds)",
            type: "number",
            min_value: 10,
            max_value: 3600, // 1 hour
            default_value: Math.floor(this.settings.wearBondageTaskSettings.baseGracePeriodMs / 1000),
            onChange: (value: number) => {
                this.settings.wearBondageTaskSettings.baseGracePeriodMs = (value * 1000);
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ENABLE_HAND: GuiFormField = {
            html_id: "atb-task-bondage-enable-hand",
            label: "Enable Hand Bondage/Restraints",
            type: "checkbox",
            default_value: this.settings.wearBondageTaskSettings.enableHand,
            onChange: (value: boolean) => {
                this.settings.wearBondageTaskSettings.enableHand = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ENABLE_LEG: GuiFormField = {
            html_id: "atb-task-bondage-enable-leg",
            label: "Enable Leg Bondage/Restraints",
            type: "checkbox",
            default_value: this.settings.wearBondageTaskSettings.enableLeg,
            onChange: (value: boolean) => {
                this.settings.wearBondageTaskSettings.enableLeg = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ENABLE_GAG: GuiFormField = {
            html_id: "atb-task-bondage-enable-gag",
            label: "Enable Gag Bondage/Restraints",
            type: "checkbox",
            default_value: this.settings.wearBondageTaskSettings.enableGag,
            onChange: (value: boolean) => {
                this.settings.wearBondageTaskSettings.enableGag = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ENABLE_CHASTITY: GuiFormField = {
            html_id: "atb-task-bondage-enable-chastity",
            label: "Enable Chastity Bondage/Restraints",
            type: "checkbox",
            default_value: this.settings.wearBondageTaskSettings.enableChastity,
            onChange: (value: boolean) => {
                this.settings.wearBondageTaskSettings.enableChastity = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ENABLE_TOY: GuiFormField = {
            html_id: "atb-task-bondage-enable-toy",
            label: "Enable Toy Bondage/Restraints",
            type: "checkbox",
            default_value: this.settings.wearBondageTaskSettings.enableToy,
            onChange: (value: boolean) => {
                this.settings.wearBondageTaskSettings.enableToy = value;
                this.shouldSaveSetting = true;
            }
        };

        // Build Main card for bondage tasks
        const bondageTaskTuple = GuiHelper.createFeatureToggleCard(FIELD_ENABLE, true);
        const bondageTaskMainCard = bondageTaskTuple.card;
        const bondageTaskContent = bondageTaskTuple.contentArea;

        const bondageTaskWeight = GuiHelper.createFormField(FIELD_WEIGHT);
        const bondageTaskDuration = GuiHelper.createFormField(FIELD_DURATION);
        const bondageTaskReward = GuiHelper.createFormField(FIELD_REWARD);
        const bondageTaskPenalty = GuiHelper.createFormField(FIELD_PENALTY);
        const bondageTaskGracePeriod = GuiHelper.createFormField(FIELD_GRACE_PERIOD);
        const bondageTaskEnableHand = GuiHelper.createFormField(FIELD_ENABLE_HAND);
        const bondageTaskEnableLeg = GuiHelper.createFormField(FIELD_ENABLE_LEG);
        const bondageTaskEnableGag = GuiHelper.createFormField(FIELD_ENABLE_GAG);
        const bondageTaskEnableChastity = GuiHelper.createFormField(FIELD_ENABLE_CHASTITY);
        const bondageTaskEnableToy = GuiHelper.createFormField(FIELD_ENABLE_TOY);


        const bondageRow1 = GuiHelper.createTwoElemRow(bondageTaskWeight, bondageTaskDuration);
        const bondageRowPts = GuiHelper.createTwoElemRow(bondageTaskReward, bondageTaskPenalty);
        //const bondageRow3 = GuiHelper.createTwoElemRow(bondageTaskGracePeriod, bondageTaskDuration);
        const bondageRowEnable1 = GuiHelper.createTwoElemRow(bondageTaskEnableHand, bondageTaskEnableLeg);
        const bondageRowEnable2 = GuiHelper.createTwoElemRow(bondageTaskEnableGag, bondageTaskEnableChastity);
        //const bondageRowEnable3 = GuiHelper.createTwoElemRow(bondageRowEnable1, );

        bondageTaskContent.appendChild(bondageRow1);
        bondageTaskContent.appendChild(bondageRowPts);
        bondageTaskContent.appendChild(bondageTaskGracePeriod);
        GuiHelper.createContentTitle(bondageTaskContent, this.STRINGS.CATEGORY_BONDAGE_ITEMS);
        bondageTaskContent.appendChild(bondageRowEnable1);
        bondageTaskContent.appendChild(bondageRowEnable2);
        bondageTaskContent.appendChild(bondageTaskEnableToy);

        return bondageTaskMainCard;
    }

}