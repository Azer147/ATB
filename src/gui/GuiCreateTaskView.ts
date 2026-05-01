import { TaskManagerModule } from "@/modules/TaskManagerModule";
import { TaskCannotStartReason, TaskData } from "@/models/TaskManagerSettings";
import { GuiHelper, GuiFormField } from "./GuiHelper";
import { getTaskTypeSetting, TasksSettings, TaskType, WearBondageType } from "@/models/TasksSettings";
import { ChaoticMistressModule } from "@/modules/ChaoticMistressModule";
import GuiViewBase from "./GuiViewBase";
import { getCharacterChaoticMistressSettings, getCharacterTasksSettings, saveSettings, startTaskforCharacter } from "@/utility/CharacterWrapper";
import { ChaoticMistressSettings } from "@/models/ChaoticMistressSettings";

export class GuiCreateTaskView extends GuiViewBase {
    //private form: HTMLElement;
    private settings!: ChaoticMistressSettings;
    private tasksSettings!: TasksSettings;

    // TODO: Use default value from task settings
    // Common fields
    private FIELD_TASK_TYPE: GuiFormField = {
        html_id: "atb-create-task-type",
        label: "Task Type",
        type: "select",
        options: [
            { value: "wear_bondage", label: "Wear Restraint/Bondage" }
        ]
    };
    private FIELD_DURATION: GuiFormField = {
        html_id: "atb-create-task-duration",
        label: "Duration (Minutes)",
        type: "number",
        default_value: 3,
        min_value: 1,
        max_value: 24 * 60
    };
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

    // Wear specific fields
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
    private FIELD_GRACE_PERIOD: GuiFormField = {
        html_id: "atb-create-task-grace-period",
        label: "Grace Period (Seconds)",
        type: "number",
        default_value: 15,
        min_value: 5,
        max_value: 60
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

    private STRINGS = {
        PAGE_TITLE: "Assign a New Task",
        CREATE_TASK_BTN: "Create Task",
        CREATE_TASK_BTN_SUCCESS: "Task created!",
        CREATE_TASK_BTN_FAILED: "Task creation failed!",
        HELP_BASE_TASK_TITLE: "Basic Tasks Information",

        // Task Type title
        TASK_TYPE_WEAR_OPTION_TITLE: "Wear Bondage Options",
        HELP_WEAR_TASK_TITLE: "Wear Bondage Task Information",

        // Error dialog
        ERROR_DIALOG_TITLE: "Task Creation Failed",
        ERROR_TASK_NOT_AVAILABLE: "The selected task cannot be started now or not meeting pre-requirements.",
        ERROR_TASK_NOT_ENABLED: "The selected task is disabled in settings.",
        ERROR_TASK_ALREADY_ACTIVE: "The same task type is already active.<br>Do you want to overwrite the existing task with the new parameters?<br>(this will restart the timer)",
        ERROR_TASK_UNKNOWN: "An unknown error occurred!",
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

        // Task type select
        const typeSelect = GuiHelper.createFormField(this.FIELD_TASK_TYPE);

        // Container for specifics fields based on task type
        const dynamicFieldsContainer = document.createElement("div");
        dynamicFieldsContainer.className = "atb-dynamic-fields";

        const updateDynamicFields = () => {
            dynamicFieldsContainer.innerHTML = "";
            const currentType = typeSelect.querySelector("select")!.value as TaskType;

            if (currentType === "wear_bondage") {
                // Sub-type options Title
                const h4 = document.createElement("h4");
                h4.innerText = this.STRINGS.TASK_TYPE_WEAR_OPTION_TITLE;
                dynamicFieldsContainer.appendChild(h4);

                // Specifics tasks help/info
                const taskHelpSection = GuiHelper.createHelpSection(this.STRINGS.HELP_WEAR_TASK_TITLE, this.HELP_WEAR_TASK_TEXT);
                dynamicFieldsContainer.appendChild(taskHelpSection);

                const wearOptions = this.createWearOptionsElem();
                dynamicFieldsContainer.appendChild(wearOptions);
            }
        };

        // Trigger change when changing the task type select
        typeSelect.querySelector("select")!.addEventListener("change", updateDynamicFields);
        updateDynamicFields();

        // Common fields
        const durationInput = GuiHelper.createFormField(this.FIELD_DURATION);
        const badPtsInput = GuiHelper.createFormField(this.FIELD_PENALTY);
        const enforceCheckbox = GuiHelper.createFormField(this.FIELD_ENFORCE);

        let rewardDisplay;
        if (this.settings && this.settings.enablePointsSystem) {
            // Build Reward field when Points System enabled
            rewardDisplay = GuiHelper.createFormField(this.FIELD_REWARD_DISPLAY);

            durationInput.querySelector("input")!.addEventListener("change", () => {
                this.updateRewardPoints(form);
            });
            enforceCheckbox.querySelector("input")!.addEventListener("change", () => {
                this.updateRewardPoints(form);
            });
        } else {
            // When Points System disabled, reward pts is selectable by user
            rewardDisplay = GuiHelper.createFormField(this.FIELD_REWARD_INPUT);
        }


        // Create Task Button
        const createTaskBtn = document.createElement("button");
        createTaskBtn.className = "atb-main-btn";
        createTaskBtn.innerText = this.STRINGS.CREATE_TASK_BTN;
        createTaskBtn.onclick = () => {
            this.onClickCreateTask(form, createTaskBtn);
        };

        // ROW: Duration + Enforce
        const baseRow = GuiHelper.createTwoElemRow(durationInput, enforceCheckbox);
        // ROW: Reward + Penalty
        const baseRow2 = GuiHelper.createTwoElemRow(rewardDisplay, badPtsInput);

        // Final Assembly
        form.appendChild(typeSelect);
        form.appendChild(dynamicFieldsContainer);
        form.appendChild(baseRow);
        form.appendChild(baseRow2);
        form.appendChild(createTaskBtn);
        //this.form = form;

        this.updateRewardPoints(form);
        this.parent.appendChild(form);
    }

    private createWearOptionsElem(): HTMLElement {
        // Select for bondage type
        const wearTypeSelect = GuiHelper.createFormField(this.FIELD_WEAR_TYPE);

        // Grace period input
        const gracePeriodInput = GuiHelper.createFormField(this.FIELD_GRACE_PERIOD);

        // ROW: Wear type + Grace Period
        return GuiHelper.createTwoElemRow(wearTypeSelect, gracePeriodInput);
    }

    private onClickCreateTask(container: HTMLElement, createBtn: HTMLButtonElement) {
        // Get all common value
        const durationMinutes = Math.floor(GuiHelper.getFormFieldValue(container, this.FIELD_DURATION) as number ?? -1);
        const totalDurationMs = durationMinutes * 60 * 1000;
        const taskType = GuiHelper.getFormFieldValue(container, this.FIELD_TASK_TYPE) as TaskType;
        const enforce = GuiHelper.getFormFieldValue(container, this.FIELD_ENFORCE) as boolean;
        const goodPtsOnSucces = this.getRewardPoints(container);
        const badPtsOnFailure = Math.floor(GuiHelper.getFormFieldValue(container, this.FIELD_PENALTY) as number ?? 0);


        // Start to Build TaskData
        let taskData: TaskData = {
            id: 0, // placeholder
            type: "wear_bondage", // placeholder
            description: "",
            elapsedtimeMs: 0,
            totalDurationMs: totalDurationMs, // in millisec
            progress: 0,
            enforce: enforce,
            goodPtsOnSucces: goodPtsOnSucces,
            badPtsOnFailure: badPtsOnFailure,
        }

        //const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;
        let created = false;
        let cannotStartReason: TaskCannotStartReason = "unknown";
        let retryFunction;
        if (taskType === "wear_bondage") {
            // Get value specific for that task
            const itemToWear = GuiHelper.getFormFieldValue(container, this.FIELD_WEAR_TYPE) as WearBondageType;
            const graceSec = Math.floor(GuiHelper.getFormFieldValue(container, this.FIELD_GRACE_PERIOD) as number || 5);
            const gracePeriodMs = graceSec * 1000;

            // Complete taskData
            taskData.itemToWear = itemToWear;
            taskData.gracePeriodMs = gracePeriodMs;

            // Pre-check
            cannotStartReason = TaskManagerModule.isTaskCanStart(this.character, {taskType: taskType, taskSubType: itemToWear});
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
        const setting = getTaskTypeSetting(this.tasksSettings, taskType);
        if (!setting) return 0;

        let durationMinutes = Math.floor(GuiHelper.getFormFieldValue(container, this.FIELD_DURATION) as number);
        if (durationMinutes < 0) durationMinutes = 0;

        const enforced = GuiHelper.getFormFieldValue(container, this.FIELD_ENFORCE) as boolean;

        const durationMs = durationMinutes * 1000 * 60;
        const pts = ChaoticMistressModule.calculatePointsFromDuration(
            durationMs,
            setting.baseDurationMs,
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

        let errorString = this.STRINGS.ERROR_TASK_UNKNOWN;
        switch (cannotStartReason) {
            case "overwrite_only":
                errorString = this.STRINGS.ERROR_TASK_ALREADY_ACTIVE;
            case "not_available":
                errorString = this.STRINGS.ERROR_TASK_NOT_AVAILABLE;
            case "not_enabled":
                errorString = this.STRINGS.ERROR_TASK_NOT_ENABLED;
        }

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