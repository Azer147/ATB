import { GuiHelper, GuiFormField } from "./GuiHelper";
import { RandomEventsSettings } from "@/models/RandomEventsSettings";
import GuiViewBase from "./GuiViewBase";
import { getCharacterRandomEventsSettings, saveSettings } from "@/utility/CharacterWrapper";

export class GuiRandomEventsView extends GuiViewBase {
    private shouldSaveSetting: boolean = false;
    private settings!: RandomEventsSettings;

    // RandomEventsSettings fields
    private FIELD_ENABLE!: GuiFormField;

    private FIELD_CHANCE_EVENT!: GuiFormField;
    private FIELD_CHANCE_HARSH_EVENT!: GuiFormField;

    private FIELD_ENABLE_TRIGGER_ROOM_ENTRY!: GuiFormField;
    private FIELD_ENABLE_TRIGGER_ROOM_EXIT!: GuiFormField

    private FIELD_ENABLE_EVENT_RESTRAINT!: GuiFormField;
    private FIELD_ENABLE_EVENT_LOCKS!: GuiFormField;
    private FIELD_ENABLE_EVENT_RANDOM_PASSWORD_LOCK!: GuiFormField;


    private HELP_BASE_TASK_TEXT = `
    Random Events are one time event that can trigger randomly depending of your settings.<br>
    - <strong>Chance of Events:</strong> the main chance of an events triggering, the chance is used on every trigger enabled.<br>
    - <strong>Chance of Harsh Events:</strong> Only when a random event is triggered, this is a chance that the events will be harsher (ex: more restraints added).<br>
    - <strong>Triggers:</strong> What action/thing can trigger a random event.<br>
    - <strong>Events:</strong> What Events can happen when a random event is triggered.<br>
    `;

    private STRINGS = {
        PAGE_TITLE: "Random Events Settings",

        CATEGORY_CHANCE_TITLE: "Events Chance On Trigger",
        CATEGORY_TRIGGERS_TITLE: "Triggers",
        CATEGORY_EVENTS_TITLE: "Events",

        HELP_BASE_TASK_TITLE: "Random Events Informations",
    };

    constructor(parent: HTMLDivElement, C: OtherCharacter | PlayerCharacter) {
        super(parent, C);

        // Check first if we have anything we need
        const settings = getCharacterRandomEventsSettings(this.character)
        if (!settings) {
            // Build error page
            GuiHelper.buildErrorPage(parent);
            return;
        }
        this.settings = settings;

        this.FIELD_ENABLE = {
            html_id: "atb-random-events-enable",
            label: "Enable Random Events",
            type: "checkbox",
            default_value: this.settings.enable,
            onChange: (value: boolean) => {
                this.settings.enable = value;
                this.shouldSaveSetting = true;
            }
        };

        this.FIELD_CHANCE_EVENT = {
            html_id: "atb-random-events-chance-event",
            label: "Chance of Event (0% - 100%)",
            type: "number",
            min_value: 0,
            max_value: 100,
            default_value: this.settings.chanceEvent,
            onChange: (value: number) => {
                this.settings.chanceEvent = value;
                this.shouldSaveSetting = true;
            }
        };
        this.FIELD_CHANCE_HARSH_EVENT = {
            html_id: "atb-random-events-chance-harsh-event",
            label: "Chance event is a Harsh Event (0% - 100%)",
            type: "number",
            min_value: 0,
            max_value: 100,
            default_value: this.settings.chanceHarshEvent,
            onChange: (value: number) => {
                this.settings.chanceHarshEvent = value;
                this.shouldSaveSetting = true;
            }
        };

        this.FIELD_ENABLE_TRIGGER_ROOM_ENTRY = {
            html_id: "atb-random-events-enable-trigger-room-entry",
            label: "Enable Trigger: On Room Entry",
            type: "checkbox",
            default_value: this.settings.enableTriggerOnRoomEntry,
            onChange: (value: boolean) => {
                this.settings.enableTriggerOnRoomEntry = value;
                this.shouldSaveSetting = true;
            }
        };
        this.FIELD_ENABLE_TRIGGER_ROOM_EXIT = {
            html_id: "atb-random-events-enable-trigger-room-exit",
            label: "Enable Trigger: On Room Exit",
            type: "checkbox",
            default_value: this.settings.enableTriggerOnRoomExit,
            onChange: (value: boolean) => {
                this.settings.enableTriggerOnRoomExit = value;
                this.shouldSaveSetting = true;
            }
        };

        this.FIELD_ENABLE_EVENT_RESTRAINT = {
            html_id: "atb-random-events-enable-event-restraint",
            label: "Enable Event: Add Restraint",
            type: "checkbox",
            default_value: this.settings.enableAddRestraintEvent,
            onChange: (value: boolean) => {
                this.settings.enableAddRestraintEvent = value;
                this.shouldSaveSetting = true;
            }
        };
        this.FIELD_ENABLE_EVENT_LOCKS = {
            html_id: "atb-random-events-enable-event-locks",
            label: "Enable Event: Add Locks",
            type: "checkbox",
            default_value: this.settings.enableAddLocksEvent,
            onChange: (value: boolean) => {
                this.settings.enableAddLocksEvent = value;
                this.shouldSaveSetting = true;
            }
        };
        this.FIELD_ENABLE_EVENT_RANDOM_PASSWORD_LOCK = {
            html_id: "atb-random-events-enable-event-random-password-lock",
            label: "Enable Event: Random Password Lock",
            type: "checkbox",
            default_value: this.settings.enableRandomPasswordLockEvent,
            onChange: (value: boolean) => {
                this.settings.enableRandomPasswordLockEvent = value;
                this.shouldSaveSetting = true;
            }
        };

        this.buildRandomEventsPage();
    }

    public update() {}

    public unload() {
        if (this.shouldSaveSetting) {
            saveSettings(this.character);
        }
    }

    public buildRandomEventsPage() {
        GuiHelper.createContentTitle(this.parent, this.STRINGS.PAGE_TITLE, true);

        const form = document.createElement("div");
        form.style.display = "flex";
        form.style.flexDirection = "column";
        form.style.gap = "15px";

        const helpSection = GuiHelper.createInfoSection("info", this.STRINGS.HELP_BASE_TASK_TITLE, this.HELP_BASE_TASK_TEXT);
        form.appendChild(helpSection);

        // Main Enable
        //const mainEnable = GuiHelper.createFormField(this.FIELD_ENABLE);

        const featureTuple = GuiHelper.createFeatureToggleCard(this.FIELD_ENABLE, false);
        const mainEnable = featureTuple.card;
        const enableContent = featureTuple.contentArea;


        // Chance Events
        const chanceEvent = GuiHelper.createFormField(this.FIELD_CHANCE_EVENT);
        const chanceHarshEvent = GuiHelper.createFormField(this.FIELD_CHANCE_HARSH_EVENT);

        // Triggers enable
        const triggerRoomEntry = GuiHelper.createFormField(this.FIELD_ENABLE_TRIGGER_ROOM_ENTRY);
        const triggerRoomExit = GuiHelper.createFormField(this.FIELD_ENABLE_TRIGGER_ROOM_EXIT);

        // Events enable
        const eventAddRestraint = GuiHelper.createFormField(this.FIELD_ENABLE_EVENT_RESTRAINT);
        const eventAddLocks = GuiHelper.createFormField(this.FIELD_ENABLE_EVENT_LOCKS);
        const eventRandomPasswordLock = GuiHelper.createFormField(this.FIELD_ENABLE_EVENT_RANDOM_PASSWORD_LOCK);

        // ROW: Chance Events + Chance Harsh Events
        const chanceRow = GuiHelper.createTwoElemRow(chanceEvent, chanceHarshEvent);
        // ROW: Trigger Rooms
        const triggerRow = GuiHelper.createTwoElemRow(triggerRoomEntry, triggerRoomExit);
        // ROW: Event lokcs
        const eventLocksRow = GuiHelper.createTwoElemRow(eventAddLocks, eventRandomPasswordLock);

        // Final Assembly
        form.appendChild(mainEnable);
        GuiHelper.createContentTitle(form, this.STRINGS.CATEGORY_CHANCE_TITLE);
        form.appendChild(chanceRow);
        GuiHelper.createContentTitle(form, this.STRINGS.CATEGORY_TRIGGERS_TITLE);
        form.appendChild(triggerRow);
        GuiHelper.createContentTitle(form, this.STRINGS.CATEGORY_EVENTS_TITLE);
        form.appendChild(eventAddRestraint);
        form.appendChild(eventLocksRow);

        this.parent.appendChild(form);
    }

}