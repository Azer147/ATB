import { TaskManagerModule } from "@/modules/TaskManagerModule";
import { getTaskCannotStartReasonToString, TaskCannotStartReason, TaskData } from "@/models/TaskManagerSettings";
import { GuiHelper, GuiFormField } from "./GuiHelper";
import { FinishType, getFinishTypeSetting, getTaskTypeSetting, TasksSettings, TaskType, WearBondageType } from "@/models/TasksSettings";
import { ChaoticMistressModule } from "@/modules/ChaoticMistressModule";
import GuiViewBase from "./GuiViewBase";
import { getCharacterChaoticMistressSettings, getCharacterTasksSettings, saveSettings, startTaskforCharacter } from "@/utility/CharacterWrapper";
import { ChaoticMistressSettings } from "@/models/ChaoticMistressSettings";
import { allOutfitList, OutfitId } from "@/models/OutfitSettings";

export class GuiCreateTaskView extends GuiViewBase {
    //private form: HTMLElement;
    private settings!: ChaoticMistressSettings;
    private tasksSettings!: TasksSettings;

    // Containers for specifics fields ()
    private taskTypeSelect: HTMLElement | undefined;
    private finishCondSelect: HTMLElement | undefined;
    private specificTaskTypeFields: HTMLDivElement | undefined;
    private specificFinishCondFields: HTMLDivElement | undefined;

    // TODO: Use default value from task settings
    // Common fields
    private FIELD_TASK_TYPE: GuiFormField = {
        html_id: "atb-create-task-type",
        label: "Task Type",
        type: "select",
        options: [
            { value: "wear_bondage", label: "Wear Restraint/Bondage" },
            { value: "wear_outfit", label: "Wear Outfit" }
        ]
    };
    private FIELD_FINISH_CONDITION: GuiFormField = {
        html_id: "atb-finish-condition",
        label: "Finish Condition",
        type: "select",
        options: [
            { value: "duration", label: "Duration (connected time)" },
            { value: "orgasm", label: "Orgasm Received" },
            { value: "orgasm_ruined", label: "Orgasm Ruined" },
            { value: "orgasm_resisted", label: "Orgasm Resisted" },
            { value: "spank", label: "Spank Received" }
        ]
    };

    // Fields common to all task
    private FIELD_ENFORCE: GuiFormField = {
        html_id: "atb-create-task-enforce",
        label: "Enforce Task (Unskippable)",
        type: "checkbox",
        useInputPadding: true, // makes it align correctly with input fields on the same row
        default_value: false,
    };
    private FIELD_REWARD_INPUT: GuiFormField = {
        html_id: "atb-create-task-reward",
        label: "Reward (Good Points)",
        type: "number",
        default_value: 10,
        min_value: 0,
        max_value: 1000,
    };
    private FIELD_REWARD_DISPLAY: GuiFormField = {
        html_id: "atb-create-task-reward-display",
        label: "Reward: 0 Good Points",
        type: "display-text",
        usePrimaryColor: true,
    };
    private FIELD_PENALTY: GuiFormField = {
        html_id: "atb-create-task-penalty",
        label: "Penalty (Bad Points)",
        type: "number",
        default_value: 10,
        min_value: 0,
        max_value: 1000,
    };
    private FIELD_GRACE_PERIOD: GuiFormField = {
        html_id: "atb-create-task-grace-period",
        label: "Grace Period (Seconds)",
        type: "number",
        default_value: 15,
        min_value: 5,
        max_value: 60
    };

    // End Condition specifcs fields
    private FIELD_DURATION: GuiFormField = {
        html_id: "atb-create-task-duration",
        label: "Duration (Minutes)",
        type: "number",
        default_value: 3,
        min_value: 1,
        max_value: 24 * 60
    };
    private FIELD_ORGASM_COUNT: GuiFormField = {
        html_id: "atb-create-task-orgasm-count",
        label: "Orgasm needed",
        type: "number",
        default_value: 20,
        min_value: 1,
        max_value: 500
    };
    private FIELD_ORGASM_RUINED_COUNT: GuiFormField = {
        html_id: "atb-create-task-orgasm-ruined-count",
        label: "Orgasm Ruined needed",
        type: "number",
        default_value: 40,
        min_value: 1,
        max_value: 2000
    };
    private FIELD_ORGASM_RESISTED_COUNT: GuiFormField = {
        html_id: "atb-create-task-orgasm-resisted-count",
        label: "Orgasm Resisted needed",
        type: "number",
        default_value: 20,
        min_value: 1,
        max_value: 500
    };
    private FIELD_SPANK_COUNT: GuiFormField = {
        html_id: "atb-create-task-spank-count",
        label: "Spank needed",
        type: "number",
        default_value: 30,
        min_value: 1,
        max_value: 1000
    };

    // Wear bondage task specifics fields
    private FIELD_WEAR_TYPE: GuiFormField = {
        html_id: "atb-create-task-wear-type",
        label: "Wear Type",
        type: "select",
        options: [
            { value: "gag", label: "Gag / Mouth"},
            { value: "hand", label: "Hands / Arms" },
            { value: "leg", label: "Legs / Feet" },
            { value: "chastity", label: "Chastity" },
            { value: "toy", label: "Toys / Vibrator" }
        ]
    };

    // Wear Outfit task specifics fields
    private FIELD_OUTFIT_ID: GuiFormField = {
        html_id: "atb-create-task-outfit-id",
        label: "Outfit",
        type: "select",
        options: [] // Will be filled on build
    };
    private FIELD_REMOVE_ITEM: GuiFormField = {
        html_id: "atb-create-task-remove-item",
        label: "Remove Outfit on Finished",
        type: "checkbox",
        useInputPadding: true, // makes it align correctly with input fields on the same row
        default_value: true,
    };
    private FIELD_RANDOMIZE_EXT: GuiFormField = {
        html_id: "atb-create-task-randomize-ext",
        label: "Randomize Extended item (average per hour)",
        type: "number",
        default_value: 15,
        min_value: 0,
        max_value: 30
    };

    private HELP_BASE_TASK_TEXT = `
    New Tasks can be created freely by the Player or Someone else (based on access settings).<br>
    - Tasks award <strong>Good Points (GP)</strong> on completion and <strong>Bad Points (BP)</strong> on failure or transgression.<br>
    - If the <strong>Point System</strong> is enabled, Points is calculated automatically from the base settings of the task.<br>
    - <strong>Enforce</strong> is a modifier that makes the task harsher and <strong>prevent Skipping the task</strong>.<br>
    - If the same task is already <strong>active</strong> and not enforced, you can overwrite it, this will remove the current active task and create this new task.
    However, the current active task will not yield any reward and the progress will be lost.<br>
    <br>
    Task <strong>Wear Bondage/Restraints:</strong> Player must wear specified restraints or get <strong>Bad Points penalty</strong>.
    `;

    private HELP_WEAR_TASK_TEXT = `
    Task <strong>Wear Bondage/Restraints:</strong> Player must wear specified restraints or get <strong>Bad Points penalty</strong>.<br>
    - <strong>Enforce</strong> modifier will force equip random restraints when the Player is not wearing it.<br>
    - <strong>Grace Period:</strong> How long the Player have before getting <strong>Bad Points penalty</strong> for not wearing the restraints.<br>
    `;

    private HELP_WEAR_OUTFIT_TEXT = `
    <strong>TODO</strong>
    `;


    private STRINGS = {
        PAGE_TITLE: "Assign a New Task",
        CREATE_TASK_BTN: "Create Task",
        CREATE_TASK_BTN_SUCCESS: "Task created!",
        CREATE_TASK_BTN_FAILED: "Task creation failed!",
        HELP_BASE_TASK_TITLE: "Basic Tasks Information",

        // Task Type title
        TASK_TYPE_WEAR_OPTION_TITLE: "Wear Bondage Options",
        HELP_WEAR_TASK_TITLE: "Wear Bondage Task Information",

        TASK_TYPE_WEAR_OUTFIT_TITLE: "Wear Outfit Options",
        HELP_WEAR_OUTFIT_TITLE: "Wear Outfit Task Information",

        // Error dialog
        ERROR_DIALOG_TITLE: "Task Creation Failed",
    };


    constructor(parent: HTMLDivElement, C: OtherCharacter | PlayerCharacter) {
        super(parent, C);

        // Check first if we have anything we need
        const settings = getCharacterChaoticMistressSettings(this.character);
        const tasksSettings = getCharacterTasksSettings(this.character);
        if (!settings || !tasksSettings) {
            GuiHelper.buildErrorPage(parent);
        } else {
            this.settings = settings;
            this.tasksSettings = tasksSettings;
            this.buildCreateTaskPage();
        }
    }

    public update() {}

    public unload() {
        //saveSettings(this.character);
    }


    public buildCreateTaskPage() {
        GuiHelper.createContentTitle(this.parent, this.STRINGS.PAGE_TITLE, true);

        const form = document.createElement("div");
        form.style.display = "flex";
        form.style.flexDirection = "column";
        form.style.gap = "15px";

        const helpSection = GuiHelper.createHelpSection(this.STRINGS.HELP_BASE_TASK_TITLE, this.HELP_BASE_TASK_TEXT);
        form.appendChild(helpSection);

        // TODO: filter out unavailable FIELD_TASK_TYPE

        // Task type select
        this.taskTypeSelect = GuiHelper.createFormField(this.FIELD_TASK_TYPE);
        // Task type: Container for specifics fields
        this.specificTaskTypeFields = document.createElement("div");
        this.specificTaskTypeFields.className = "atb-dynamic-fields";
        // Trigger change when changing the task type select
        this.taskTypeSelect.querySelector("select")!.addEventListener("change", () => { this.changeTaskTypeFields() });
        this.changeTaskTypeFields();

        // Finish condition select
        this.finishCondSelect = GuiHelper.createFormField(this.FIELD_FINISH_CONDITION);
        // End condition: Container for specifics fields
        this.specificFinishCondFields = document.createElement("div");
        //this.specificFinishCondFields.className = "atb-dynamic-fields";
        // Trigger change when changing the End condition select
        this.finishCondSelect.querySelector("select")!.addEventListener("change", () => { this.changeFinishCondFields() });
        this.changeFinishCondFields();


        // Common fields
        const gracePeriodInput = GuiHelper.createFormField(this.FIELD_GRACE_PERIOD);
        const badPtsInput = GuiHelper.createFormField(this.FIELD_PENALTY);

        let rewardDisplay;
        if (this.settings && this.settings.enablePointsSystem) {
            // Build Reward field when Points System enabled
            rewardDisplay = GuiHelper.createFormField(this.FIELD_REWARD_DISPLAY);
        } else {
            // When Points System disabled, reward pts is selectable by user
            rewardDisplay = GuiHelper.createFormField(this.FIELD_REWARD_INPUT);
        }


        // Create Task Button
        const createTaskBtn = document.createElement("button");
        createTaskBtn.className = "atb-main-btn";
        createTaskBtn.style.marginTop = "10px";
        createTaskBtn.innerText = this.STRINGS.CREATE_TASK_BTN;
        createTaskBtn.onclick = () => {
            this.onClickCreateTask(form, createTaskBtn);
        };

        // ROW: Finish select + Grace period
        const finishGraceRow = GuiHelper.createTwoElemRow(this.finishCondSelect, gracePeriodInput);
        // ROW: Reward + Penalty
        const ptsRow = GuiHelper.createTwoElemRow(rewardDisplay, badPtsInput);

        // Final Assembly
        form.appendChild(this.taskTypeSelect);
        form.appendChild(this.specificTaskTypeFields);
        form.appendChild(finishGraceRow);
        form.appendChild(this.specificFinishCondFields);
        form.appendChild(ptsRow);
        form.appendChild(createTaskBtn);
        //this.form = form;

        this.updateRewardPoints(form);
        this.parent.appendChild(form);
    }


/**
 * Dynamic fields for Task Type
 */


    private changeTaskTypeFields() {
        if (this.specificTaskTypeFields && this.taskTypeSelect) {
            this.specificTaskTypeFields.innerHTML = "";
            const currentType = this.taskTypeSelect.querySelector("select")!.value as TaskType;

            if (currentType === "wear_bondage") {
                this.addWearBondageTypeElem(this.specificTaskTypeFields);
            }
            if (currentType === "wear_outfit") {
                this.addWearOutfitTypeElem(this.specificTaskTypeFields);
            }
        }
    };

    private addWearBondageTypeElem(container: HTMLElement) {
        this.addGroupTitleAndHelp(container,
            this.STRINGS.TASK_TYPE_WEAR_OPTION_TITLE,
            this.STRINGS.HELP_WEAR_TASK_TITLE,
            this.HELP_WEAR_TASK_TEXT
        );

        // TODO: filter unavailable FIELD_WEAR_TYPE

        // ROW: Wear type + (future option)
        const weartaskTypeSelect = GuiHelper.createFormField(this.FIELD_WEAR_TYPE);
        const row = GuiHelper.createTwoElemRow(weartaskTypeSelect, undefined);
        container.appendChild(row);
    }

    private addWearOutfitTypeElem(container: HTMLElement) {
        this.addGroupTitleAndHelp(container,
            this.STRINGS.TASK_TYPE_WEAR_OUTFIT_TITLE,
            this.STRINGS.HELP_WEAR_OUTFIT_TITLE,
            this.HELP_WEAR_OUTFIT_TEXT
        );

        // Populate Outfit Select
        this.FIELD_OUTFIT_ID.options = [];
        for (let i = 0; i < allOutfitList.length; i++) {
            let outfitData = allOutfitList[i];
            // TODO: check available
            this.FIELD_OUTFIT_ID.options.push({value: outfitData.id, label: outfitData.name})
        }

        // Final assembly
        const outfitIdSelect = GuiHelper.createFormField(this.FIELD_OUTFIT_ID);
        const randomExtItem = GuiHelper.createFormField(this.FIELD_RANDOMIZE_EXT);
        const removeOnFinish = GuiHelper.createFormField(this.FIELD_REMOVE_ITEM);
        const row = GuiHelper.createTwoElemRow(randomExtItem, removeOnFinish);
        container.appendChild(row);
        container.appendChild(outfitIdSelect);
    }


/**
 * Dynamic fields for Finish Condition
 */

    private changeFinishCondFields() {
        if (this.specificFinishCondFields && this.finishCondSelect) {
            this.specificFinishCondFields.innerHTML = "";
            const currentType = this.finishCondSelect.querySelector("select")!.value as FinishType;

            // if there is only one specific field, we put it in row with enforce to save space
            let inputForTwoElemRow;
            if (currentType === "duration") {
                inputForTwoElemRow = GuiHelper.createFormField(this.FIELD_DURATION);
            }
            else if (currentType === "orgasm") {
                inputForTwoElemRow = GuiHelper.createFormField(this.FIELD_ORGASM_COUNT);
            }
            else if (currentType === "orgasm_ruined") {
                inputForTwoElemRow = GuiHelper.createFormField(this.FIELD_ORGASM_RUINED_COUNT);
            }
            else if (currentType === "orgasm_resisted") {
                inputForTwoElemRow = GuiHelper.createFormField(this.FIELD_ORGASM_RESISTED_COUNT);
            }
            else if (currentType === "spank") {
                inputForTwoElemRow = GuiHelper.createFormField(this.FIELD_SPANK_COUNT);
            }

            if (inputForTwoElemRow) {
                const enforce = GuiHelper.createFormField(this.FIELD_ENFORCE);
                const row = GuiHelper.createTwoElemRow(inputForTwoElemRow, enforce);
                this.specificFinishCondFields.appendChild(row);

                // Elem that influence Reward pts if pts system enabled
                inputForTwoElemRow.querySelector("input")!.addEventListener("change", () => {
                    this.updateRewardPoints(this.parent);
                });
                enforce.querySelector("input")!.addEventListener("change", () => {
                    this.updateRewardPoints(this.parent);
                });
            }

            this.updateRewardPoints(this.parent);
        }
    };


/**
 * Create task click
 */


    private onClickCreateTask(container: HTMLElement, createBtn: HTMLButtonElement) {
        // Get all common value
        const taskType = GuiHelper.getFormFieldValue(container, this.FIELD_TASK_TYPE) as TaskType;
        const finishCondType = GuiHelper.getFormFieldValue(container, this.FIELD_FINISH_CONDITION) as FinishType;
        const enforce = GuiHelper.getFormFieldValue(container, this.FIELD_ENFORCE) as boolean;
        const goodPtsOnSucces = this.getRewardPoints(container);
        const badPtsOnFailure = Math.floor(GuiHelper.getFormFieldValue(container, this.FIELD_PENALTY) as number ?? 0);
        const graceSec = Math.floor(GuiHelper.getFormFieldValue(container, this.FIELD_GRACE_PERIOD) as number || 5);
        const gracePeriodMs = graceSec * 1000;

        // Finish Condition
        let finishTotalNeeded = 0;
        if (finishCondType === "duration") {
            const durationMinutes = Math.floor(GuiHelper.getFormFieldValue(container, this.FIELD_DURATION) as number ?? 0);
            finishTotalNeeded = durationMinutes * 60 * 1000; // totalDurationMs
        }
        else if (finishCondType === "orgasm") {
            finishTotalNeeded = Math.floor(GuiHelper.getFormFieldValue(container, this.FIELD_ORGASM_COUNT) as number ?? 0);
        }
        else if (finishCondType === "orgasm_ruined") {
            finishTotalNeeded = Math.floor(GuiHelper.getFormFieldValue(container, this.FIELD_ORGASM_RUINED_COUNT) as number ?? 0);
        }
        else if (finishCondType === "orgasm_resisted") {
            finishTotalNeeded = Math.floor(GuiHelper.getFormFieldValue(container, this.FIELD_ORGASM_RESISTED_COUNT) as number ?? 0);
        }
        else if (finishCondType === "spank") {
            finishTotalNeeded = Math.floor(GuiHelper.getFormFieldValue(container, this.FIELD_SPANK_COUNT) as number ?? 0);
        } else {
            this.showErrorDialog("unknown", () => {});
            return;
        }

        // Start to Build TaskData
        let taskData: TaskData = {
            id: 0, // placeholder
            type: taskType, // placeholder
            finishType: finishCondType,
            description: "",
            finishCurrentCount: 0,
            finishTotalNeeded: finishTotalNeeded,
            progressPerc: 0,
            enforce: enforce,
            goodPtsOnSucces: goodPtsOnSucces,
            badPtsOnFailure: badPtsOnFailure,
            gracePeriodMs: gracePeriodMs
        }

        // Get the last specifics fields
        let created = false;
        let cannotStartReason: TaskCannotStartReason = "unknown";
        let retryFunction;
        if (taskType === "wear_bondage") {
            // Complete task's specific value
            const itemToWear = GuiHelper.getFormFieldValue(container, this.FIELD_WEAR_TYPE) as WearBondageType;
            taskData.itemToWear = itemToWear;
            // Pre-check
            cannotStartReason = TaskManagerModule.isTaskCanStart(this.character, {taskType: taskType, taskSubType: itemToWear});
        }
       else if (taskType === "wear_outfit") {
            // Complete task's specific value
            const outfitId = GuiHelper.getFormFieldValue(container, this.FIELD_OUTFIT_ID) as OutfitId;
            const randomExtItem = GuiHelper.getFormFieldValue(container, this.FIELD_RANDOMIZE_EXT) as number;
            const removeOnFinish = GuiHelper.getFormFieldValue(container, this.FIELD_REMOVE_ITEM) as boolean;

            taskData.outfitId = outfitId;
            taskData.averageRandomExtPerHour = randomExtItem;
            taskData.removeOnFinish = removeOnFinish;
            // Pre-check
            cannotStartReason = TaskManagerModule.isTaskCanStart(this.character, {taskType: taskType});
        }

        // Try to start task
        if (cannotStartReason === "can_start") {
            created = startTaskforCharacter(this.character, taskData, false);
        } else if (cannotStartReason === "overwrite_only") {
            // retryFunction is set so it can be triggered in the dialog button click
            retryFunction = () => {
                startTaskforCharacter(this.character, taskData, true);
            }
        }

        // Possible Errors
        // - Task not enabled in settings
        // - Task/SubType not avaible or blocked
        // - Task already active (=> dialog to confirm override)

        // Update button style
        if (created) {
            createBtn.innerText = this.STRINGS.CREATE_TASK_BTN_SUCCESS;
            createBtn.classList.add("success");
        } else {
            createBtn.innerText = this.STRINGS.CREATE_TASK_BTN_FAILED;
            createBtn.classList.add("failed");
            this.showErrorDialog(cannotStartReason, retryFunction);
        }
        createBtn.disabled = true;
        setTimeout(() => {
            // Revert button style to normal
            createBtn.innerText = this.STRINGS.CREATE_TASK_BTN;
            createBtn.classList.remove("success");
            createBtn.classList.remove("failed");
            createBtn.disabled = false;
        }, 2000);
    }


/**
 * Helpers
 */

    // Helper for specifcs type/end condition Card group
    private addGroupTitleAndHelp(container: HTMLElement, title: string, helptitle: string, helpContent: string) {
        // Sub-type options Title
        const h4 = document.createElement("h4");
        h4.innerText = title;
        container.appendChild(h4);

        // Specifics help/info
        const taskHelpSection = GuiHelper.createHelpSection(helptitle, helpContent);
        container.appendChild(taskHelpSection);
    }

    private getRewardPoints(container: HTMLElement) {
        if (this.settings.enablePointsSystem) {
            return this.calculateRewardPoints(container);
        } else {
            return Math.floor(GuiHelper.getFormFieldValue(container, this.FIELD_REWARD_INPUT) as number ?? 0);
        }
    }

    private calculateRewardPoints(container: HTMLElement): number {
        const taskType = GuiHelper.getFormFieldValue(container, this.FIELD_TASK_TYPE) as TaskType;
        if (!taskType) return 0;
        const finishType = GuiHelper.getFormFieldValue(container, this.FIELD_FINISH_CONDITION) as FinishType;
        if (!finishType) return 0;
        const setting = getTaskTypeSetting(this.tasksSettings, taskType);
        if (!setting) return 0;

        // Get Finish count/duration
        let finishCurrentTotal = 0;
        let finishBaseTotal: number = getFinishTypeSetting(this.tasksSettings, finishType, taskType).baseCount ?? 0;
        if (finishType === "duration") {
            let durationMinutes = Math.floor(GuiHelper.getFormFieldValue(container, this.FIELD_DURATION) as number ?? 0);
            if (durationMinutes < 0) durationMinutes = 0;
            finishCurrentTotal = durationMinutes * 60 * 1000;
        }
        else if (finishType === "orgasm") {
            finishCurrentTotal = Math.floor(GuiHelper.getFormFieldValue(container, this.FIELD_ORGASM_COUNT) as number ?? 0);
        }
        else if (finishType === "orgasm_ruined") {
            finishCurrentTotal = Math.floor(GuiHelper.getFormFieldValue(container, this.FIELD_ORGASM_RUINED_COUNT) as number ?? 0);
        }
        else if (finishType === "orgasm_resisted") {
            finishCurrentTotal = Math.floor(GuiHelper.getFormFieldValue(container, this.FIELD_ORGASM_RESISTED_COUNT) as number ?? 0);
        }
        else if (finishType === "spank") {
            finishCurrentTotal = Math.floor(GuiHelper.getFormFieldValue(container, this.FIELD_SPANK_COUNT) as number ?? 0);
        } else {
            return 0;
        }

        const enforced = GuiHelper.getFormFieldValue(container, this.FIELD_ENFORCE) as boolean;
        const pts = ChaoticMistressModule.calculatePointsFromFinishCount(
            finishCurrentTotal,
            finishBaseTotal,
            setting.baseGoodPtsReward,
            enforced
        );
        return pts;
    }

    // Helper to update the text when the input changes
    // TODO: html id should be a class variable
    private updateRewardPoints(container: HTMLElement) {
        const elem: HTMLElement | null = container.querySelector(`#atb-create-task-reward-display`);
        if (!elem) return;

        const pts = this.calculateRewardPoints(container);
        elem.innerText = `Reward: ${pts} Good Points`;
    }

    // TODO: html id should be a static (const) variable
    private showErrorDialog(cannotStartReason: TaskCannotStartReason, onOverwrite: () => void) {
        const mainContainer = document.getElementById("atb-overlay-container")!;
        const errorString = getTaskCannotStartReasonToString(cannotStartReason);

        if (cannotStartReason === "overwrite_only") {
            GuiHelper.showDialog(
                mainContainer,
                this.STRINGS.ERROR_DIALOG_TITLE,
                errorString,
                [
                    {
                        label: "NO",
                        onClick: () => {}
                    },
                    {
                        label: "YES",
                        isPrimary: true,
                        onClick: () => {
                            if (onOverwrite) onOverwrite();
                        }
                    }
                ]
            );
        } else {
            GuiHelper.showDialog(
                mainContainer,
                this.STRINGS.ERROR_DIALOG_TITLE,
                errorString,
                [
                    {
                        label: "OK",
                        onClick: () => {},
                        isPrimary: true,
                    }
                ]
            );
        }
    }
}