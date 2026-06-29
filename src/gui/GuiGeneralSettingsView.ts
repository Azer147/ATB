import { GuiHelper, GuiFormField } from "./GuiHelper";
import { RandomEventsSettings } from "@/models/RandomEventsSettings";
import GuiViewBase from "./GuiViewBase";
import { getCharacterDeviousShocksSettings, getCharacterPenaltySettings, getCharacterRandomEventsSettings, getCharacterRandomTaskSettings, getCharacterTasksSettings, saveSettings } from "@/utility/CharacterWrapper";
import { DeviousShocksSettings } from "@/models/DeviousShocksSettings";
import StorageManager from "@/utility/StorageManager";
import ModuleManager from "@/utility/ModuleManager";
import { TaskManagerModule } from "@/modules/TaskManagerModule";
import { isPlayerHaveRemoteAccess } from "@/models/RemoteAccessSettings";
import { PenaltySettings } from "@/models/PenaltySettings";
import { GuiMainView } from "./GuiMainView";
import { RandomTaskSettings } from "@/models/RandomTaskSettings";

export class GuiGeneralSettingsView extends GuiViewBase {
    private shouldSaveSetting: boolean = false;
    private penaltySettings!: PenaltySettings;
    private randTaskSettings!: RandomTaskSettings;
    private randEventsettings!: RandomEventsSettings;
    private shocksSettings!: DeviousShocksSettings;


    private INFO_RANDOM_EVENTS = `
    Random Events are one time event that can trigger randomly depending of your settings.<br>
    - <strong>Chance of Events:</strong> the main chance of an events triggering, the chance is used on every trigger enabled.<br>
    - <strong>Chance of Harsh Events:</strong> Only when a random event is triggered, this is a chance that the events will be harsher (ex: more restraints added).<br>
    - <strong>Triggers:</strong> What action/thing can trigger a random event.<br>
    - <strong>Events:</strong> What Events can happen when a random event is triggered.<br>
    `;

    private INFO_PENALTY_SYS = `
    <strong>Penalty system:</strong> A Reward and Punishements game, be a good slave and everything will be alright!<br>
    - Gain <strong>Reward Points (RP)</strong> on task completion.<br>
    - Get <strong>Penalty Points (PP)</strong> penalty on task failure / transgression.<br>
    - Reduce <strong>Penalty Points (PP)</strong> by taking a <strong>Punishements</strong>.<br>
    - Get too much <strong>Penalty Points (PP)</strong> and you will get a forced random <strong>Punishements!</strong><br>
    <br>
    `;

    private INFO_RANDOM_TASK = `
    <strong>Random Task:</strong> Randomly start a task, for those who want to submit to the Chaos and surrender control.<br>
    `;

    private STRINGS = {
        PAGE_TITLE: "General Settings",

        SECTION_MAIN_FEATURE: "Main Features",
        SECTION_ADVANCED: "Advenced Options",

        CATEGORY_CHANCE_TITLE: "Events Chance On Trigger",
        CATEGORY_TRIGGERS_TITLE: "Triggers",
        CATEGORY_EVENTS_TITLE: "Events",
        CATEGORY_SHOCK_ON_ACTION: "Shocks On Action",

        DIALOG_CONFIRM_TITLE: "Are You Sure ?",

        DIALOG_SAFEWORD_DESC: "This will finish any active task and remove Penalty points over 50% of forced Punishement Threshold.",
        DIALOG_RESET_DESC: "This will reset all your settings to default, finish any active task and reset Reward/Penalty points to 0.",

        INFO_RANDOM_EVENTS_TITLE: "Random Events Informations",
        INFO_PENALTY_TITLE: "Penalty System Informations",
        INFO_RANDOM_TASK_TITLE: "Random Task Informations",
    };

    constructor(parent: HTMLDivElement, C: OtherCharacter | PlayerCharacter) {
        super(parent, C);

        // Check first if we have anything we need
        const penaltySettings = getCharacterPenaltySettings(this.character);
        const randTaskSettings = getCharacterRandomTaskSettings(this.character);
        const randEventsettings = getCharacterRandomEventsSettings(this.character)
        const shocksSettings = getCharacterDeviousShocksSettings(this.character)
        if (!penaltySettings || !randTaskSettings || !randEventsettings || !shocksSettings) {
            // Build error page
            GuiHelper.buildErrorPage(parent);
            return;
        }
        this.penaltySettings = penaltySettings;
        this.randTaskSettings = randTaskSettings;
        this.randEventsettings = randEventsettings;
        this.shocksSettings = shocksSettings;

        this.buildGeneralPage();
    }

    public update() {}

    public unload() {
        if (this.shouldSaveSetting) {
            saveSettings(this.character);
        }
    }

    public buildGeneralPage() {
        GuiHelper.createContentTitle(this.parent, this.STRINGS.PAGE_TITLE, true);

        const form = document.createElement("div");
        form.style.display = "flex";
        form.style.flexDirection = "column";
        form.style.gap = "15px";

        const penaltyCard = this.buildPenaltyCard();
        const randomTaskCard = this.buildRandomTaskCard();
        const randomEventCard = this.buildRandomEventCard();
        const deviousShockCard = this.buildDeviousShocksCard();
        //const exportCard = this.buildExportImportCard(); // TODO

        GuiHelper.createContentTitle(form, this.STRINGS.SECTION_MAIN_FEATURE, false);
        form.appendChild(penaltyCard);
        form.appendChild(randomTaskCard);
        form.appendChild(randomEventCard);
        form.appendChild(deviousShockCard);
        GuiHelper.createContentTitle(form, this.STRINGS.SECTION_ADVANCED, false);
        //form.appendChild(exportCard); // TODO

        // Only show Emergency for Player
        if (this.character.IsPlayer()) {
            const emergencyCard = this.buildEmergencyCard();
            form.appendChild(emergencyCard);
        }

        this.parent.appendChild(form);
    }

    private buildPenaltyCard(): HTMLElement {
        const haveSettingsAccess = isPlayerHaveRemoteAccess(this.character, this.character.ATB.RemoteAccessSettings?.PenaltySettingsPermission);
        // Fields
        const FIELD_ENABLE: GuiFormField = {
            html_id: "atb-penalty-enable",
            label: "Enable Penalty System (Recommended)",
            type: "checkbox",
            disable: !haveSettingsAccess,
            default_value: this.penaltySettings.enablePenalty,
            onChange: (value: boolean) => {
                this.penaltySettings.enablePenalty = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_THRESHOLD: GuiFormField = {
            html_id: "atb-penalty-punish-threshold",
            label: "Threshold before forced punishement (0 to disable)",
            type: "number",
            min_value: 0,
            max_value: 1000,
            disable: !haveSettingsAccess,
            default_value: this.penaltySettings.forcedPunishementThreshold,
            onChange: (value: number) => {
                this.penaltySettings.forcedPunishementThreshold = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_MIN_FINISH_COUNT: GuiFormField = {
            html_id: "atb-penalty-min-finish-count",
            label: "Minimum random Punishement finish count (% of the base finish count) (5% - 1000%)",
            type: "number",
            min_value: 5,
            max_value: 1000,
            disable: !haveSettingsAccess,
            default_value: this.penaltySettings.minRandomFinishMult,
            onChange: (value: number) => {
                this.penaltySettings.minRandomFinishMult = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_MAX_FINISH_COUNT: GuiFormField = {
            html_id: "atb-penalty-max-finish-count",
            label: "Maximum random Punishement finish count (% of the base finish count) (5% - 1000%)",
            type: "number",
            min_value: 5,
            max_value: 1000,
            disable: !haveSettingsAccess,
            default_value: this.penaltySettings.maxRandomFinishMult,
            onChange: (value: number) => {
                this.penaltySettings.maxRandomFinishMult = value;
                this.shouldSaveSetting = true;
            }
        };

        // Build Main card
        const penaltyTuple = GuiHelper.createFeatureToggleCard(FIELD_ENABLE, true);
        const penaltyMainCard = penaltyTuple.card;
        const penaltyContent = penaltyTuple.contentArea;

        const penaltyThreshold = GuiHelper.createFormField(FIELD_THRESHOLD);
        const penaltyMinFinish = GuiHelper.createFormField(FIELD_MIN_FINISH_COUNT);
        const penaltyMaxFinish = GuiHelper.createFormField(FIELD_MAX_FINISH_COUNT);

        const infoSection = GuiHelper.createInfoSection("info", this.STRINGS.INFO_PENALTY_TITLE, this.INFO_PENALTY_SYS);
        penaltyContent.appendChild(infoSection);
        penaltyContent.appendChild(penaltyThreshold);
        const row = GuiHelper.createTwoElemRow(penaltyMinFinish, penaltyMaxFinish);
        penaltyContent.appendChild(row);
        return penaltyMainCard;
    }

    private buildRandomTaskCard(): HTMLElement {
        const haveSettingsAccess = isPlayerHaveRemoteAccess(this.character, this.character.ATB.RemoteAccessSettings?.PenaltySettingsPermission);
        // Fields
        const FIELD_ENABLE: GuiFormField = {
            html_id: "atb-random-task-enable",
            label: "Enable Random Tasks",
            type: "checkbox",
            disable: !haveSettingsAccess,
            default_value: this.randTaskSettings.enableRandomTasks,
            onChange: (value: boolean) => {
                this.randTaskSettings.enableRandomTasks = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_AVERAGE_TASKS: GuiFormField = {
            html_id: "atb-random-task-average",
            label: "Average number of Tasks per Hour (0.1 - 15)",
            type: "number",
            min_value: 0.1,
            max_value: 15.0,
            disable: !haveSettingsAccess,
            default_value: this.randTaskSettings.averageNewTaskPerHour,
            onChange: (value: number) => {
                this.randTaskSettings.averageNewTaskPerHour = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_MIN_FINISH_COUNT: GuiFormField = {
            html_id: "atb-min-finish-count",
            label: "Minimum random task finish count (% of the base finish count) (5% - 1000%)",
            type: "number",
            min_value: 5,
            max_value: 1000,
            disable: !haveSettingsAccess,
            default_value: this.randTaskSettings.minRandomFinishNeeded,
            onChange: (value: number) => {
                this.randTaskSettings.minRandomFinishNeeded = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_MAX_FINISH_COUNT: GuiFormField = {
            html_id: "atb-max-finish-count",
            label: "Maximum random task finish count (% of the base finish count) (5% - 1000%)",
            type: "number",
            min_value: 5,
            max_value: 1000,
            disable: !haveSettingsAccess,
            default_value: this.randTaskSettings.maxRandomFinishNeeded,
            onChange: (value: number) => {
                this.randTaskSettings.maxRandomFinishNeeded = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_WEIGHT_USE_PUNISH: GuiFormField = {
            html_id: "atb-weight-use-punish",
            label: "Weight of random tasks choosing a punishement instead (0 to disable)",
            type: "number",
            min_value: 0,
            max_value: 100,
            disable: !haveSettingsAccess,
            default_value: this.randTaskSettings.weightUsePunishAsTask,
            onChange: (value: number) => {
                this.randTaskSettings.weightUsePunishAsTask = value;
                this.shouldSaveSetting = true;
            }
        };

        // Build Main card
        const randTaskTuple = GuiHelper.createFeatureToggleCard(FIELD_ENABLE, true);
        const randTaskMainCard = randTaskTuple.card;
        const randTaskContent = randTaskTuple.contentArea;

        const randTaskAverage = GuiHelper.createFormField(FIELD_AVERAGE_TASKS);
        const randTaskUsePunish = GuiHelper.createFormField(FIELD_WEIGHT_USE_PUNISH);
        const randTaskMinDuration = GuiHelper.createFormField(FIELD_MIN_FINISH_COUNT);
        const randTaskMaxDuration = GuiHelper.createFormField(FIELD_MAX_FINISH_COUNT);

        const randTaskRow1 = GuiHelper.createTwoElemRow(randTaskAverage, randTaskUsePunish);
        const randTaskDurationRow = GuiHelper.createTwoElemRow(randTaskMinDuration, randTaskMaxDuration);

        const infoSection = GuiHelper.createInfoSection("info", this.STRINGS.INFO_RANDOM_TASK_TITLE, this.INFO_RANDOM_TASK);
        randTaskContent.appendChild(infoSection);
        randTaskContent.appendChild(randTaskRow1);
        randTaskContent.appendChild(randTaskDurationRow);
        return randTaskMainCard;
    }

    private buildRandomEventCard() {
        const haveSettingsAccess = isPlayerHaveRemoteAccess(this.character, this.character.ATB.RemoteAccessSettings?.randomEventSettingsPermission);

        const FIELD_ENABLE: GuiFormField = {
            html_id: "atb-random-events-enable",
            label: "Enable Random Events",
            type: "checkbox",
            disable: !haveSettingsAccess,
            default_value: this.randEventsettings.enable,
            onChange: (value: boolean) => {
                this.randEventsettings.enable = value;
                this.shouldSaveSetting = true;
            }
        };

        const FIELD_CHANCE_EVENT: GuiFormField = {
            html_id: "atb-random-events-chance-event",
            label: "Chance of Event (0% - 100%)",
            type: "number",
            disable: !haveSettingsAccess,
            min_value: 0,
            max_value: 100,
            default_value: this.randEventsettings.chanceEvent,
            onChange: (value: number) => {
                this.randEventsettings.chanceEvent = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_CHANCE_HARSH_EVENT: GuiFormField = {
            html_id: "atb-random-events-chance-harsh-event",
            label: "Chance event is a Harsh Event (0% - 100%)",
            type: "number",
            disable: !haveSettingsAccess,
            min_value: 0,
            max_value: 100,
            default_value: this.randEventsettings.chanceHarshEvent,
            onChange: (value: number) => {
                this.randEventsettings.chanceHarshEvent = value;
                this.shouldSaveSetting = true;
            }
        };

        const FIELD_ENABLE_TRIGGER_ROOM_ENTRY: GuiFormField = {
            html_id: "atb-random-events-enable-trigger-room-entry",
            label: "Enable Trigger: On Room Entry",
            type: "checkbox",
            disable: !haveSettingsAccess,
            default_value: this.randEventsettings.enableTriggerOnRoomEntry,
            onChange: (value: boolean) => {
                this.randEventsettings.enableTriggerOnRoomEntry = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ENABLE_TRIGGER_ROOM_EXIT: GuiFormField = {
            html_id: "atb-random-events-enable-trigger-room-exit",
            label: "Enable Trigger: On Room Exit",
            type: "checkbox",
            disable: !haveSettingsAccess,
            default_value: this.randEventsettings.enableTriggerOnRoomExit,
            onChange: (value: boolean) => {
                this.randEventsettings.enableTriggerOnRoomExit = value;
                this.shouldSaveSetting = true;
            }
        };

        const FIELD_ENABLE_EVENT_RESTRAINT: GuiFormField = {
            html_id: "atb-random-events-enable-event-restraint",
            label: "Enable Event: Add Restraint",
            type: "checkbox",
            disable: !haveSettingsAccess,
            default_value: this.randEventsettings.enableAddRestraintEvent,
            onChange: (value: boolean) => {
                this.randEventsettings.enableAddRestraintEvent = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ENABLE_EVENT_LOCKS: GuiFormField = {
            html_id: "atb-random-events-enable-event-locks",
            label: "Enable Event: Add Locks",
            type: "checkbox",
            disable: !haveSettingsAccess,
            default_value: this.randEventsettings.enableAddLocksEvent,
            onChange: (value: boolean) => {
                this.randEventsettings.enableAddLocksEvent = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ENABLE_EVENT_RANDOM_PASSWORD_LOCK: GuiFormField = {
            html_id: "atb-random-events-enable-event-random-password-lock",
            label: "Enable Event: Random Password Lock",
            type: "checkbox",
            disable: !haveSettingsAccess,
            default_value: this.randEventsettings.enableRandomPasswordLockEvent,
            onChange: (value: boolean) => {
                this.randEventsettings.enableRandomPasswordLockEvent = value;
                this.shouldSaveSetting = true;
            }
        };

        const featureTuple = GuiHelper.createFeatureToggleCard(FIELD_ENABLE, true);
        const mainCard = featureTuple.card;
        const mainContent = featureTuple.contentArea;

        // Chance Events
        const chanceEvent = GuiHelper.createFormField(FIELD_CHANCE_EVENT);
        const chanceHarshEvent = GuiHelper.createFormField(FIELD_CHANCE_HARSH_EVENT);

        // Triggers enable
        const triggerRoomEntry = GuiHelper.createFormField(FIELD_ENABLE_TRIGGER_ROOM_ENTRY);
        const triggerRoomExit = GuiHelper.createFormField(FIELD_ENABLE_TRIGGER_ROOM_EXIT);

        // Events enable
        const eventAddRestraint = GuiHelper.createFormField(FIELD_ENABLE_EVENT_RESTRAINT);
        const eventAddLocks = GuiHelper.createFormField(FIELD_ENABLE_EVENT_LOCKS);
        const eventRandomPasswordLock = GuiHelper.createFormField(FIELD_ENABLE_EVENT_RANDOM_PASSWORD_LOCK);

        // ROW: Chance Events + Chance Harsh Events
        const chanceRow = GuiHelper.createTwoElemRow(chanceEvent, chanceHarshEvent);
        // ROW: Trigger Rooms
        const triggerRow = GuiHelper.createTwoElemRow(triggerRoomEntry, triggerRoomExit);
        // ROW: Event lokcs
        const eventLocksRow = GuiHelper.createTwoElemRow(eventAddLocks, eventRandomPasswordLock);


        // Final Assembly
        const infoSection = GuiHelper.createInfoSection("info", this.STRINGS.INFO_RANDOM_EVENTS_TITLE, this.INFO_RANDOM_EVENTS);
        mainContent.appendChild(infoSection);
        GuiHelper.createContentTitle(mainContent, this.STRINGS.CATEGORY_CHANCE_TITLE);
        mainContent.appendChild(chanceRow);
        GuiHelper.createContentTitle(mainContent, this.STRINGS.CATEGORY_TRIGGERS_TITLE);
        mainContent.appendChild(triggerRow);
        GuiHelper.createContentTitle(mainContent, this.STRINGS.CATEGORY_EVENTS_TITLE);
        mainContent.appendChild(eventAddRestraint);
        mainContent.appendChild(eventLocksRow);

        return mainCard;
    }

    private buildDeviousShocksCard() {
        const haveSettingsAccess = isPlayerHaveRemoteAccess(this.character, this.character.ATB.RemoteAccessSettings?.randomEventSettingsPermission);

        const FIELD_ENABLE: GuiFormField = {
            html_id: "atb-devious-shocks-enable",
            label: "Enable Devious Shocks",
            type: "checkbox",
            disable: !haveSettingsAccess,
            default_value: this.shocksSettings.enable,
            onChange: (value: boolean) => {
                this.shocksSettings.enable = value;
                this.shouldSaveSetting = true;
            }
        };

        const FIELD_RANDOM_SHOCK: GuiFormField = {
            html_id: "atb-devious-shocks-chance-event",
            label: "Automatic Shocks (Average Per Hour)",
            description: "Trigger shocks randomly. Higher Value will trigger shocks more often (0 to disable)",
            type: "number",
            disable: !haveSettingsAccess,
            min_value: 0,
            max_value: 120,
            default_value: this.shocksSettings.shockAveragePerHour,
            onChange: (value: number) => {
                this.shocksSettings.shockAveragePerHour = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_CHANCE_ROOM_EXIT: GuiFormField = {
            html_id: "atb-devious-shocks-chance-room-exit",
            label: "Chance of shocks on Leaving Room (0% - 100%)",
            description: "Warning: Shocks will also cancel the action when triggered. 100% will prevent you to leave the room completly.",
            type: "number",
            disable: !haveSettingsAccess,
            min_value: 0,
            max_value: 100,
            default_value: this.shocksSettings.chanceOnRoomExit,
            onChange: (value: number) => {
                this.shocksSettings.chanceOnRoomExit = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_CHANCE_STRUGGLE: GuiFormField = {
            html_id: "atb-devious-shocks-chance-struggle",
            label: "Chance of shocks on Struggle (0% - 100%)",
            description: "Warning: Shocks will also cancel the action when triggered. 100% will prevent you to struggle completly.",
            type: "number",
            disable: !haveSettingsAccess,
            min_value: 0,
            max_value: 100,
            default_value: this.shocksSettings.chanceOnStruggle,
            onChange: (value: number) => {
                this.shocksSettings.chanceOnStruggle = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_CHANCE_STANDING: GuiFormField = {
            html_id: "atb-devious-shocks-chance-standing",
            label: "Chance of shocks on Standing (0% - 100%)",
            description: "Warning: Shocks will also cancel the action when triggered. 100% will prevent you to standing completly.",
            type: "number",
            disable: !haveSettingsAccess,
            min_value: 0,
            max_value: 100,
            default_value: this.shocksSettings.chanceOnStanding,
            onChange: (value: number) => {
                this.shocksSettings.chanceOnStanding = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_CHANCE_WARDROBE: GuiFormField = {
            html_id: "atb-devious-shocks-chance-wardrobe",
            label: "Chance of shocks on Wardrobe Access (0% - 100%)",
            description: "Warning: Shocks will also cancel the action when triggered. 100% will prevent you to access wardrobe completly.",
            type: "number",
            disable: !haveSettingsAccess,
            min_value: 0,
            max_value: 100,
            default_value: this.shocksSettings.chanceOnWardrobe,
            onChange: (value: number) => {
                this.shocksSettings.chanceOnWardrobe = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_CHANCE_EQUIP_OTHER: GuiFormField = {
            html_id: "atb-devious-shocks-chance-equip-other",
            label: "Chance of shocks on Equiping item on others (0% - 100%)",
            description: "Warning: Shocks will also cancel the action when triggered.",
            type: "number",
            disable: !haveSettingsAccess,
            min_value: 0,
            max_value: 100,
            default_value: this.shocksSettings.chanceOnEquipItemOnOthers,
            onChange: (value: number) => {
                this.shocksSettings.chanceOnEquipItemOnOthers = value;
                this.shouldSaveSetting = true;
            }
        };

        const featureTuple = GuiHelper.createFeatureToggleCard(FIELD_ENABLE, true);
        const mainCard = featureTuple.card;
        const mainContent = featureTuple.contentArea;

        // Random Shock
        const chanceRandomShock = GuiHelper.createFormField(FIELD_RANDOM_SHOCK);

        // Shock on Action
        const chanceRoomExit = GuiHelper.createFormField(FIELD_CHANCE_ROOM_EXIT);
        const chanceStruggle = GuiHelper.createFormField(FIELD_CHANCE_STRUGGLE);
        const chanceStanding = GuiHelper.createFormField(FIELD_CHANCE_STANDING);
        const chanceWardrobe = GuiHelper.createFormField(FIELD_CHANCE_WARDROBE);
        const chanceEqupOther = GuiHelper.createFormField(FIELD_CHANCE_EQUIP_OTHER);

        const actionRow1 = GuiHelper.createTwoElemRow(chanceRoomExit, chanceStruggle);
        const actionRow2 = GuiHelper.createTwoElemRow(chanceStanding, chanceWardrobe);
        const actionRow3 = GuiHelper.createTwoElemRow(chanceEqupOther, undefined);

        // Final Assembly
        mainContent.appendChild(chanceRandomShock);
        GuiHelper.createContentTitle(mainContent, this.STRINGS.CATEGORY_SHOCK_ON_ACTION);
        mainContent.appendChild(actionRow1);
        mainContent.appendChild(actionRow2);
        mainContent.appendChild(actionRow3);

        return mainCard;
    }

    private buildEmergencyCard() {
        const FIELD_TITLE: GuiFormField = {
            html_id: "atb-emergency-title",
            label: "Emergency Options",
            type: "display-text",
            default_value: false
        };

        const featureTuple = GuiHelper.createFeatureToggleCard(FIELD_TITLE, true);
        const mainCard = featureTuple.card;
        const mainContent = featureTuple.contentArea;

        const safewordBtn = document.createElement("button");
        safewordBtn.className = "atb-main-btn";
        //safewordBtn.style.maxWidth = "fit-content";
        safewordBtn.style.background = "var(--atb-success)";
        safewordBtn.innerText = `SAFEWORD`;
        safewordBtn.addEventListener("click", () => {
            this.showConfirmDialog(this.STRINGS.DIALOG_CONFIRM_TITLE, this.STRINGS.DIALOG_SAFEWORD_DESC, () => {
                const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;
                tm?.forceFinishAllTask();

                // Remove some Penalty Points if 50% over threshold
                this.penaltySettings.penaltyPts = Math.min(this.penaltySettings.penaltyPts, Math.floor(this.penaltySettings.forcedPunishementThreshold / 2));
                StorageManager.saveSettings();
            });
        });

        const resetBtn = document.createElement("button");
        resetBtn.className = "atb-main-btn";
        //resetBtn.style.maxWidth = "fit-content";
        resetBtn.style.background = "var(--atb-danger)";
        resetBtn.innerText = `RESET TO DEFAULT SETTINGS`;
        resetBtn.addEventListener("click", () => {
            this.showConfirmDialog(this.STRINGS.DIALOG_CONFIRM_TITLE, this.STRINGS.DIALOG_RESET_DESC, () => {
                StorageManager.resetSettings();
                GuiMainView.doFullUpdate(this.character); // Update the page with new default value
            });
        });

        const row = GuiHelper.createTwoElemRow(safewordBtn, resetBtn);
        mainContent.appendChild(row);

        return mainCard;
    }

    private buildExportImportCard() {
        const FIELD_TITLE: GuiFormField = {
            html_id: "atb-export-import-title",
            label: "Export / Import settings",
            type: "display-text",
            default_value: false
        };

        const featureTuple = GuiHelper.createFeatureToggleCard(FIELD_TITLE, true);
        const mainCard = featureTuple.card;
        const mainContent = featureTuple.contentArea;

        const exportBtn = document.createElement("button");
        exportBtn.className = "atb-main-btn";
        //exportBtn.style.maxWidth = "fit-content";
        exportBtn.style.background = "var(--atb-success)";
        exportBtn.innerText = `Export Settings`;
        exportBtn.addEventListener("click", () => {
            // TODO impl
        });

        const importBtn = document.createElement("button");
        importBtn.className = "atb-main-btn";
        //importBtn.style.maxWidth = "fit-content";
        importBtn.style.background = "var(--atb-danger)";
        importBtn.innerText = `Import Settings`;
        importBtn.addEventListener("click", () => {
            // TODO dialog confirm
            // TODO impl
        });

        const row = GuiHelper.createTwoElemRow(exportBtn, importBtn);
        mainContent.appendChild(row);

        return mainCard;
    }

    // Helper
    showConfirmDialog(title: string, description: string, onConfirmed: () => void) {
        const mainContainer = document.getElementById("atb-overlay-container")!;
        GuiHelper.showDialog(
            mainContainer,
            title,
            description,
            [
                {
                    label: "YES",
                    onClick: () => { onConfirmed(); },
                    isPrimary: true,
                },
                {
                    label: "NO",
                    onClick: () => {},
                    isPrimary: false,
                }
            ]
        );
    }
}