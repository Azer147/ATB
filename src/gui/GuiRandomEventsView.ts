import { GuiHelper, GuiFormField } from "./GuiHelper";
import { RandomEventsSettings } from "@/models/RandomEventsSettings";
import GuiViewBase from "./GuiViewBase";
import { getCharacterDeviousShocksSettings, getCharacterRandomEventsSettings, saveSettings } from "@/utility/CharacterWrapper";
import { DeviousShocksSettings } from "@/models/DeviousShocksSettings";

export class GuiRandomEventsView extends GuiViewBase {
    private shouldSaveSetting: boolean = false;
    private settings!: RandomEventsSettings;
    private shocksSettings!: DeviousShocksSettings;


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
        CATEGORY_SHOCK_ON_ACTION: "Shocks On Action",

        HELP_BASE_TASK_TITLE: "Random Events Informations",
    };

    constructor(parent: HTMLDivElement, C: OtherCharacter | PlayerCharacter) {
        super(parent, C);

        // Check first if we have anything we need
        const settings = getCharacterRandomEventsSettings(this.character)
        const shocksSettings = getCharacterDeviousShocksSettings(this.character)
        if (!settings || !shocksSettings) {
            // Build error page
            GuiHelper.buildErrorPage(parent);
            return;
        }
        this.settings = settings;
        this.shocksSettings = shocksSettings;

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

        const randomEventCard = this.buildRandomEventCard();
        const deviousShockCard = this.buildDeviousShocksCard();

        form.appendChild(randomEventCard);
        form.appendChild(deviousShockCard);
        this.parent.appendChild(form);
    }

    private buildRandomEventCard() {
        const FIELD_ENABLE: GuiFormField = {
            html_id: "atb-random-events-enable",
            label: "Enable Random Events",
            type: "checkbox",
            default_value: this.settings.enable,
            onChange: (value: boolean) => {
                this.settings.enable = value;
                this.shouldSaveSetting = true;
            }
        };

        const FIELD_CHANCE_EVENT: GuiFormField = {
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
        const FIELD_CHANCE_HARSH_EVENT: GuiFormField = {
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

        const FIELD_ENABLE_TRIGGER_ROOM_ENTRY: GuiFormField = {
            html_id: "atb-random-events-enable-trigger-room-entry",
            label: "Enable Trigger: On Room Entry",
            type: "checkbox",
            default_value: this.settings.enableTriggerOnRoomEntry,
            onChange: (value: boolean) => {
                this.settings.enableTriggerOnRoomEntry = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ENABLE_TRIGGER_ROOM_EXIT: GuiFormField = {
            html_id: "atb-random-events-enable-trigger-room-exit",
            label: "Enable Trigger: On Room Exit",
            type: "checkbox",
            default_value: this.settings.enableTriggerOnRoomExit,
            onChange: (value: boolean) => {
                this.settings.enableTriggerOnRoomExit = value;
                this.shouldSaveSetting = true;
            }
        };

        const FIELD_ENABLE_EVENT_RESTRAINT: GuiFormField = {
            html_id: "atb-random-events-enable-event-restraint",
            label: "Enable Event: Add Restraint",
            type: "checkbox",
            default_value: this.settings.enableAddRestraintEvent,
            onChange: (value: boolean) => {
                this.settings.enableAddRestraintEvent = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ENABLE_EVENT_LOCKS: GuiFormField = {
            html_id: "atb-random-events-enable-event-locks",
            label: "Enable Event: Add Locks",
            type: "checkbox",
            default_value: this.settings.enableAddLocksEvent,
            onChange: (value: boolean) => {
                this.settings.enableAddLocksEvent = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ENABLE_EVENT_RANDOM_PASSWORD_LOCK: GuiFormField = {
            html_id: "atb-random-events-enable-event-random-password-lock",
            label: "Enable Event: Random Password Lock",
            type: "checkbox",
            default_value: this.settings.enableRandomPasswordLockEvent,
            onChange: (value: boolean) => {
                this.settings.enableRandomPasswordLockEvent = value;
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
        //mainContent.appendChild(mainEnable);
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
        const FIELD_ENABLE: GuiFormField = {
            html_id: "atb-devious-shocks-enable",
            label: "Enable Devious Shocks",
            type: "checkbox",
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
}