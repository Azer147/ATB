import { GuiHelper, GuiFormField } from "./GuiHelper";
import StorageManager from "@/utility/StroageManager";
import { TasksSettings } from "@/models/TasksSettings";

export class GuiTasksSettingsView {
    private static settings: TasksSettings


    private static HELP_BASE_TASK_TEXT = `
    Settings Fields Information:<br>
    - <strong>Weight:</strong> Used for random selection, higher weight means higher chance to be selected against other, 0 means this punishements cannot be randomly selected.<br>
    - <strong>Base Duration:</strong> This will be the base duration used for random duration used by Chaotic Mistress. This is also used to calculate the Points Rewards, if selected duration is lower/higher than the base duration, Rewards will be lower/higher.<br>
    - <strong>Base Good/Bad Points: </strong>Will be used as a base value for the punishements and points calculation.<br>
    <br>
    All Tasks list:<br>
    <strong>Wear Bondage/Restraints:</strong> Get penalty if not wearing specified restraints.<br>
    - <strong>Grace Period:</strong> How long the Player have before getting a penalty for not wearing the specified restraint.
    `;

    private static STRINGS = {
        PAGE_TITLE: "Tasks Settings",

        CATEGORY_BONDAGE_ITEMS: "Bondage/Restraint Items",

        HELP_BASE_TASK_TITLE: "Tasks Overview/Information",
    };

    private static loadSettings() {
        this.settings = StorageManager.getTasksSettings();
    }

    public static unload() {
        StorageManager.saveSettings();
    }

    public static buildTasksSettingsPage(parent: HTMLElement) {
        this.loadSettings();
        GuiHelper.createContentTitle(parent, this.STRINGS.PAGE_TITLE, true);

        const form = document.createElement("div");
        form.style.display = "flex";
        form.style.flexDirection = "column";
        form.style.gap = "15px";

        const helpSection = GuiHelper.createHelpSection(this.STRINGS.HELP_BASE_TASK_TITLE, this.HELP_BASE_TASK_TEXT);
        form.appendChild(helpSection);

        const bondageTaskMainCard = this.buildWearBondageTaskCard();

        // Final Assembly
        form.appendChild(bondageTaskMainCard);
        parent.appendChild(form);
    }

    private static buildWearBondageTaskCard(): HTMLElement {
        // Fields
        const FIELD_ENABLE: GuiFormField = {
            html_id: "atb-task-bondage-enable",
            label: "Enable Wear Bondage/Restraints Task",
            type: "checkbox",
            default_value: this.settings.wearBondageTaskSettings.enable,
            onChange: (value: boolean) => { this.settings.wearBondageTaskSettings.enable = value; }
        };
        const FIELD_WEIGHT: GuiFormField = {
            html_id: "atb-task-bondage-weight",
            label: "Weight of Event for random Tasks (0 - 1000)",
            type: "number",
            min_value: 0,
            max_value: 1000,
            default_value: this.settings.wearBondageTaskSettings.randomWeight,
            onChange: (value: number) => { this.settings.wearBondageTaskSettings.randomWeight = value; }
        };
        const FIELD_DURATION: GuiFormField = {
            html_id: "atb-task-bondage-duration",
            label: "Base Duration (minutes)",
            type: "number",
            min_value: 5,
            max_value: 10080, // 7 days
            default_value: Math.floor(this.settings.wearBondageTaskSettings.baseDurationMs / (1000 * 60)),
            onChange: (value: number) => { this.settings.wearBondageTaskSettings.baseDurationMs = value * 1000 * 60; }
        };
        const FIELD_REWARD: GuiFormField = {
            html_id: "atb-task-bondage-reward",
            label: "Base Good Points Reward on task completion",
            type: "number",
            min_value: 0,
            max_value: 100,
            default_value: this.settings.wearBondageTaskSettings.baseGoodPtsReward,
            onChange: (value: number) => { this.settings.wearBondageTaskSettings.baseGoodPtsReward = value; }
        };
        const FIELD_PENALTY: GuiFormField = {
            html_id: "atb-task-bondage-penalty",
            label: "Base Bad Points Penalty on task failure",
            type: "number",
            min_value: 0,
            max_value: 100,
            default_value: this.settings.wearBondageTaskSettings.baseBadPointsPenalty,
            onChange: (value: number) => { this.settings.wearBondageTaskSettings.baseBadPointsPenalty = value; }
        };
        const FIELD_GRACE_PERIOD: GuiFormField = {
            html_id: "atb-task-bondage-grace-period",
            label: "Grace Period before Penalty(seconds)",
            type: "number",
            min_value: 10,
            max_value: 3600, // 1 hour
            default_value: Math.floor(this.settings.wearBondageTaskSettings.baseGracePeriodMs / 1000),
            onChange: (value: number) => { this.settings.wearBondageTaskSettings.baseGracePeriodMs = (value * 1000); }
        };
        const FIELD_ENABLE_HAND: GuiFormField = {
            html_id: "atb-task-bondage-enable-hand",
            label: "Enable Hand Bondage/Restraints",
            type: "checkbox",
            default_value: this.settings.wearBondageTaskSettings.enableHand,
            onChange: (value: boolean) => { this.settings.wearBondageTaskSettings.enableHand = value; }
        };
        const FIELD_ENABLE_LEG: GuiFormField = {
            html_id: "atb-task-bondage-enable-leg",
            label: "Enable Leg Bondage/Restraints",
            type: "checkbox",
            default_value: this.settings.wearBondageTaskSettings.enableLeg,
            onChange: (value: boolean) => { this.settings.wearBondageTaskSettings.enableLeg = value; }
        };
        const FIELD_ENABLE_GAG: GuiFormField = {
            html_id: "atb-task-bondage-enable-gag",
            label: "Enable Gag Bondage/Restraints",
            type: "checkbox",
            default_value: this.settings.wearBondageTaskSettings.enableGag,
            onChange: (value: boolean) => { this.settings.wearBondageTaskSettings.enableGag = value; }
        };
        const FIELD_ENABLE_CHASTITY: GuiFormField = {
            html_id: "atb-task-bondage-enable-chastity",
            label: "Enable Chastity Bondage/Restraints",
            type: "checkbox",
            default_value: this.settings.wearBondageTaskSettings.enableChastity,
            onChange: (value: boolean) => { this.settings.wearBondageTaskSettings.enableChastity = value; }
        };
        const FIELD_ENABLE_TOY: GuiFormField = {
            html_id: "atb-task-bondage-enable-toy",
            label: "Enable Toy Bondage/Restraints",
            type: "checkbox",
            default_value: this.settings.wearBondageTaskSettings.enableToy,
            onChange: (value: boolean) => { this.settings.wearBondageTaskSettings.enableToy = value; }
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