import { GuiHelper, GuiFormField } from "./GuiHelper";
import { SingleTaskSettings, TasksSettings } from "@/models/TasksSettings";
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
        CATEGORY_ADDITIONAL_FOR_RANDOM: "Additional values for Random Task",

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

        const helpSection = GuiHelper.createInfoSection("info", this.STRINGS.HELP_BASE_TASK_TITLE, this.HELP_BASE_TASK_TEXT);
        form.appendChild(helpSection);

        const finishMainCard = this.buildTaskFinishCard();
        const bondageTaskMainCard = this.buildWearBondageTaskCard();
        const outfitTaskMainCard = this.buildWearOutfitTaskCard();
        const nakedTaskMainCard = this.buildNakedTaskCard();
        const nicknameTaskMainCard = this.buildNicknameTaskCard();
        const poseTaskMainCard = this.buildPoseTaskCard();
        const roomControlTaskMainCard = this.buildRoomControlTaskCard();

        // Final Assembly
        form.appendChild(finishMainCard);
        form.appendChild(bondageTaskMainCard);
        form.appendChild(outfitTaskMainCard);
        form.appendChild(nakedTaskMainCard);
        form.appendChild(nicknameTaskMainCard);
        form.appendChild(poseTaskMainCard);
        form.appendChild(roomControlTaskMainCard);
        this.parent.appendChild(form);
    }

    // Handle all fields common to all tasks
    // Namely: randomWeight, baseDurationMs, baseGracePeriodMs,
    //          baseGoodPtsReward, baseBadPointsPenalty
    private appendCommonTaskField(container: HTMLElement, prefixId: string, taskSetting: SingleTaskSettings, disableRandom: boolean = false) {
        const FIELD_WEIGHT: GuiFormField = {
            html_id: prefixId + "-weight",
            label: "Weight of Event for random Tasks (0 - 1000)",
            type: "number",
            min_value: 0,
            max_value: 1000,
            default_value: taskSetting.randomWeight,
            onChange: (value: number) => {
                taskSetting.randomWeight = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_DURATION: GuiFormField = {
            html_id: prefixId + "-duration",
            label: "Base Duration (minutes)",
            type: "number",
            min_value: 5,
            max_value: 10080, // 7 days
            default_value: Math.floor(taskSetting.baseDurationMs / (1000 * 60)),
            onChange: (value: number) => {
                taskSetting.baseDurationMs = value * 1000 * 60;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_REWARD: GuiFormField = {
            html_id: prefixId + "-reward",
            label: "Base Good Points Reward on task completion",
            type: "number",
            min_value: 0,
            max_value: 100,
            default_value: taskSetting.baseGoodPtsReward,
            onChange: (value: number) => {
                taskSetting.baseGoodPtsReward = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_PENALTY: GuiFormField = {
            html_id: prefixId + "-penalty",
            label: "Base Bad Points Penalty on task failure",
            type: "number",
            min_value: 0,
            max_value: 100,
            default_value: taskSetting.baseBadPointsPenalty,
            onChange: (value: number) => {
                taskSetting.baseBadPointsPenalty = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_GRACE_PERIOD: GuiFormField = {
            html_id: prefixId + "-grace-period",
            label: "Grace Period before Penalty(seconds)",
            type: "number",
            min_value: 10,
            max_value: 3600, // 1 hour
            default_value: Math.floor(taskSetting.baseGracePeriodMs / 1000),
            onChange: (value: number) => {
                taskSetting.baseGracePeriodMs = (value * 1000);
                this.shouldSaveSetting = true;
            }
        };

        let bondageTaskWeight: HTMLElement | undefined = undefined;
        if (!disableRandom) {
            bondageTaskWeight = GuiHelper.createFormField(FIELD_WEIGHT);
        }
        const bondageTaskDuration = GuiHelper.createFormField(FIELD_DURATION);
        const bondageTaskReward = GuiHelper.createFormField(FIELD_REWARD);
        const bondageTaskPenalty = GuiHelper.createFormField(FIELD_PENALTY);
        const bondageTaskGracePeriod = GuiHelper.createFormField(FIELD_GRACE_PERIOD);

        let bondageRow1;
        if (disableRandom) {
            bondageRow1 = GuiHelper.createTwoElemRow(bondageTaskDuration, undefined);
        } else {
            bondageRow1 = GuiHelper.createTwoElemRow(bondageTaskWeight, bondageTaskDuration);
        }
        const bondageRowPts = GuiHelper.createTwoElemRow(bondageTaskReward, bondageTaskPenalty);

        container.appendChild(bondageRow1);
        container.appendChild(bondageRowPts);
        container.appendChild(bondageTaskGracePeriod);
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


        // Build Main card for finish
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
        const prefixId = "atb-task-outfit";
        const taskSetting = this.settings.wearBondageTaskSettings;
        // Fields
        const FIELD_ENABLE: GuiFormField = {
            html_id: prefixId + "-enable",
            label: "Enable Wear Bondage/Restraints Task",
            type: "checkbox",
            default_value: taskSetting.enable,
            onChange: (value: boolean) => {
                taskSetting.enable = value;
                this.shouldSaveSetting = true;
            }
        };
        // Specifics fields
        const FIELD_ENABLE_HAND: GuiFormField = {
            html_id: prefixId + "-enable-hand",
            label: "Enable Hand Bondage/Restraints",
            type: "checkbox",
            default_value: taskSetting.enableHand,
            onChange: (value: boolean) => {
                taskSetting.enableHand = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ENABLE_LEG: GuiFormField = {
            html_id: prefixId + "-enable-leg",
            label: "Enable Leg Bondage/Restraints",
            type: "checkbox",
            default_value: taskSetting.enableLeg,
            onChange: (value: boolean) => {
                taskSetting.enableLeg = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ENABLE_GAG: GuiFormField = {
            html_id: prefixId + "-enable-gag",
            label: "Enable Gag Items",
            type: "checkbox",
            default_value: taskSetting.enableGag,
            onChange: (value: boolean) => {
                taskSetting.enableGag = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ENABLE_CHASTITY: GuiFormField = {
            html_id: prefixId + "-enable-chastity",
            label: "Enable Chastity Items",
            type: "checkbox",
            default_value: taskSetting.enableChastity,
            onChange: (value: boolean) => {
                taskSetting.enableChastity = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ENABLE_TOY: GuiFormField = {
            html_id: prefixId + "-enable-toy",
            label: "Enable Toys (vibe)",
            type: "checkbox",
            default_value: taskSetting.enableToy,
            onChange: (value: boolean) => {
                taskSetting.enableToy = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ENABLE_BLINDFOLD: GuiFormField = {
            html_id: prefixId + "-enable-blindfold",
            label: "Enable Blindfolds",
            type: "checkbox",
            default_value: taskSetting.enableBlindfold,
            onChange: (value: boolean) => {
                taskSetting.enableBlindfold = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ENABLE_SHOCK: GuiFormField = {
            html_id: prefixId + "-enable-shock",
            label: "Enable Shock Devices",
            type: "checkbox",
            default_value: taskSetting.enableShock,
            onChange: (value: boolean) => {
                taskSetting.enableShock = value;
                this.shouldSaveSetting = true;
            }
        };

        // Build Main task card
        const tuple = GuiHelper.createFeatureToggleCard(FIELD_ENABLE, true);
        const taskMainCard = tuple.card;
        const taskContent = tuple.contentArea;

        // Append directly to taskContent
        this.appendCommonTaskField(taskContent, prefixId, taskSetting);

        const bondageTaskEnableHand = GuiHelper.createFormField(FIELD_ENABLE_HAND);
        const bondageTaskEnableLeg = GuiHelper.createFormField(FIELD_ENABLE_LEG);
        const bondageTaskEnableGag = GuiHelper.createFormField(FIELD_ENABLE_GAG);
        const bondageTaskEnableChastity = GuiHelper.createFormField(FIELD_ENABLE_CHASTITY);
        const bondageTaskEnableToy = GuiHelper.createFormField(FIELD_ENABLE_TOY);
        const bondageTaskEnableBlindfold = GuiHelper.createFormField(FIELD_ENABLE_BLINDFOLD);
        const bondageTaskEnableShock = GuiHelper.createFormField(FIELD_ENABLE_SHOCK);


        //const bondageRow3 = GuiHelper.createTwoElemRow(bondageTaskGracePeriod, bondageTaskDuration);
        const bondageRowEnable1 = GuiHelper.createTwoElemRow(bondageTaskEnableHand, bondageTaskEnableLeg);
        const bondageRowEnable2 = GuiHelper.createTwoElemRow(bondageTaskEnableGag, bondageTaskEnableChastity);
        const bondageRowEnable3 = GuiHelper.createTwoElemRow(bondageTaskEnableToy, bondageTaskEnableBlindfold);

        GuiHelper.createContentTitle(taskContent, this.STRINGS.CATEGORY_BONDAGE_ITEMS);
        taskContent.appendChild(bondageRowEnable1);
        taskContent.appendChild(bondageRowEnable2);
        taskContent.appendChild(bondageRowEnable3);
        taskContent.appendChild(bondageTaskEnableShock);

        return taskMainCard;
    }

    private buildWearOutfitTaskCard(): HTMLElement {
        const prefixId = "atb-task-outfit";
        const taskSetting = this.settings.wearOutfitTaskSettings;
        // Fields
        const FIELD_ENABLE: GuiFormField = {
            html_id: prefixId + "-enable",
            label: "Enable Wear Outfit Task",
            type: "checkbox",
            default_value: taskSetting.enable,
            onChange: (value: boolean) => {
                taskSetting.enable = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_RANDOM_ITEM_EXT: GuiFormField = {
            html_id: prefixId + "-random-ext",
            label: "Randomize Items Option (Average Per Hour)",
            type: "number",
            min_value: 0,
            max_value: 30,
            default_value: taskSetting.averageRandomExtPerHour,
            onChange: (value: number) => {
                taskSetting.averageRandomExtPerHour = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_REMOVE_ON_FINISH: GuiFormField = {
            html_id: prefixId + "-remove-finish",
            label: "Chance Remove on Finish",
            type: "number",
            min_value: 0,
            max_value: 100,
            default_value: taskSetting.chanceRemoveOnFinish,
            onChange: (value: number) => {
                taskSetting.chanceRemoveOnFinish = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_CAN_USE_HARSH: GuiFormField = {
            html_id: prefixId + "-use-harsh",
            label: "Can Use Harsh Outfit",
            type: "checkbox",
            default_value: taskSetting.randomCanUseHarshOutfit,
            onChange: (value: boolean) => {
                taskSetting.randomCanUseHarshOutfit = value;
                this.shouldSaveSetting = true;
            }
        };

        // Build Main task card
        const tuple = GuiHelper.createFeatureToggleCard(FIELD_ENABLE, true);
        const taskMainCard = tuple.card;
        const taskContent = tuple.contentArea;

        // Append directly to taskContent
        this.appendCommonTaskField(taskContent, prefixId, taskSetting);

        const randomizeItem = GuiHelper.createFormField(FIELD_RANDOM_ITEM_EXT);
        const chanceRemove = GuiHelper.createFormField(FIELD_REMOVE_ON_FINISH);
        const canUseHarsh = GuiHelper.createFormField(FIELD_CAN_USE_HARSH);

        const row = GuiHelper.createTwoElemRow(randomizeItem, chanceRemove);


        GuiHelper.createContentTitle(taskContent, this.STRINGS.CATEGORY_ADDITIONAL_FOR_RANDOM);
        taskContent.appendChild(row);
        taskContent.appendChild(canUseHarsh);

        return taskMainCard;
    }

    private buildNakedTaskCard(): HTMLElement {
        const prefixId = "atb-task-naked";
        const taskSetting = this.settings.nakedTaskSettings;
        // Fields
        const FIELD_ENABLE: GuiFormField = {
            html_id: prefixId + "-enable",
            label: "Enable Naked Task",
            type: "checkbox",
            default_value: taskSetting.enable,
            onChange: (value: boolean) => {
                taskSetting.enable = value;
                this.shouldSaveSetting = true;
            }
        };

        // Build Main task card
        const tuple = GuiHelper.createFeatureToggleCard(FIELD_ENABLE, true);
        const taskMainCard = tuple.card;
        const taskContent = tuple.contentArea;

        // Append directly to taskContent
        this.appendCommonTaskField(taskContent, prefixId, taskSetting);

        return taskMainCard;
    }

    private buildNicknameTaskCard(): HTMLElement {
        const prefixId = "atb-task-nickname";
        const taskSetting = this.settings.nicknameTaskSettings;
        // Fields
        const FIELD_ENABLE: GuiFormField = {
            html_id: prefixId + "-enable",
            label: "Enable Nickname Control Task",
            type: "checkbox",
            default_value: taskSetting.enable,
            onChange: (value: boolean) => {
                taskSetting.enable = value;
                this.shouldSaveSetting = true;
            }
        };

        // Build Main task card
        const tuple = GuiHelper.createFeatureToggleCard(FIELD_ENABLE, true);
        const taskMainCard = tuple.card;
        const taskContent = tuple.contentArea;

        // Append directly to taskContent
        this.appendCommonTaskField(taskContent, prefixId, taskSetting, true);

        return taskMainCard;
    }

    private buildPoseTaskCard(): HTMLElement {
        const prefixId = "atb-task-pose";
        const taskSetting = this.settings.poseTaskSettings;
        // Fields
        const FIELD_ENABLE: GuiFormField = {
            html_id: prefixId + "-enable",
            label: "Enable Pose Control Task",
            type: "checkbox",
            default_value: taskSetting.enable,
            onChange: (value: boolean) => {
                taskSetting.enable = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_AVG_RANDOM_POSE: GuiFormField = {
            html_id: prefixId + "-random-ext",
            label: "Randomize Items Option (Average Per Hour)",
            description: "Average number of random pose change per hour. (0-60) (0 to disable)",
            type: "number",
            min_value: 0,
            max_value: 60,
            default_value: taskSetting.averageRandomPosePerHour,
            onChange: (value: number) => {
                taskSetting.averageRandomPosePerHour = value;
                this.shouldSaveSetting = true;
            }
        };

        // Build Main task card
        const tuple = GuiHelper.createFeatureToggleCard(FIELD_ENABLE, true);
        const taskMainCard = tuple.card;
        const taskContent = tuple.contentArea;

        // Append directly to taskContent
        this.appendCommonTaskField(taskContent, prefixId, taskSetting);

        const avgRandomPerHour = GuiHelper.createFormField(FIELD_AVG_RANDOM_POSE);
        taskContent.appendChild(avgRandomPerHour);

        return taskMainCard;
    }

    private buildRoomControlTaskCard(): HTMLElement {
        const prefixId = "atb-task-room-control";
        const taskSetting = this.settings.roomControlTaskSettings;
        // Fields
        const FIELD_ENABLE: GuiFormField = {
            html_id: prefixId + "-enable",
            label: "Enable Room Control Task",
            type: "checkbox",
            default_value: taskSetting.enable,
            onChange: (value: boolean) => {
                taskSetting.enable = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_AVG_ROOM_CHANGE: GuiFormField = {
            html_id: prefixId + "-change",
            label: "Maximum time in a room (minutes)",
            description: "Player will get a penalty if they stay in the same room for too long. (10-120 minutes)",
            type: "number",
            min_value: 10,
            max_value: 120,
            default_value: taskSetting.roomMaxMinutesReq,
            onChange: (value: number) => {
                taskSetting.roomMaxMinutesReq = value;
                this.shouldSaveSetting = true;
            }
        };

        // Build Main task card
        const tuple = GuiHelper.createFeatureToggleCard(FIELD_ENABLE, true);
        const taskMainCard = tuple.card;
        const taskContent = tuple.contentArea;

        // Append directly to taskContent
        this.appendCommonTaskField(taskContent, prefixId, taskSetting);

        const avgRandomPerHour = GuiHelper.createFormField(FIELD_AVG_ROOM_CHANGE);
        taskContent.appendChild(avgRandomPerHour);

        return taskMainCard;
    }
}