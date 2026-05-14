import { GuiHelper, GuiFormField } from "./GuiHelper";
import { SinglePunishmentSettings, TasksSettings } from "@/models/TasksSettings";
import { ChaoticMistressSettings } from "@/models/ChaoticMistressSettings";
import { ChaoticMistressModule } from "@/modules/ChaoticMistressModule";
import GuiViewBase from "./GuiViewBase";
import { getCharacterChaoticMistressSettings, getCharacterTasksSettings, saveSettings, startPunishementforCharacter } from "@/utility/CharacterWrapper";


export interface GuiPunishmentCardConfig {
    name: string;
    setting: SinglePunishmentSettings;
    checkAvailable: () => boolean;
    onStart: (finalDuration: number) => void;
}


export class GuiChaoticMistressView extends GuiViewBase {
    private shouldSaveSetting: boolean = false;
    private settings!: ChaoticMistressSettings;
    private tasksSettings!: TasksSettings;

    private punishementList: GuiPunishmentCardConfig[] = [];

    // id for update points status
    private ID_STATUS_GOOD_PTS = "atb-status-good-pts";
    private ID_STATUS_BAD_PTS = "atb-status-bad-pts";
    private ID_STATUS_PROGRESS_BAR = "atb-status-progress-bar";


    private BASE_HELP_TEXT = `
    Chaotic Mistress have 2 main feature:<br>
    <br>
    <strong>Points system:</strong> A Reward and Punishements game, be a good slave and everything will be alright!<br>
    - Gain <strong>Good Points (GP)</strong> on task completion.<br>
    - Get <strong>Bad Points (BP)</strong> penalty on task failure / transgression.<br>
    - Reduce <strong>Bad Points (BP)</strong> by taking a <strong>Punishements</strong>.<br>
    - Get too much <strong>Bad Points (BP)</strong> and you will get a forced random <strong>Punishements!</strong><br>
    <br>
    <strong>Random Task:</strong> Randomly start a task, for those who want to submit to the Chaos and surrender control.<br>
    `;

    private STRINGS = {
        PAGE_TITLE: "Chaotic Mistress",
        CATEGORY_SELECT_PUNISHEMENT: "Select Punishement",
        BASE_HELP_TITLE: "Chaotic Mistress Overview",

        POINTS_STATUS_TITLE: "Points Status",
        GOOD_POINTS: "Good Points (GP)",
        BAD_POINTS: "Bad Points (BP)",

        START_TASK: "Start Task",
        NOT_AVAILABLE: "Not Available"
    };


    constructor(parent: HTMLDivElement, C: OtherCharacter | PlayerCharacter) {
        super(parent, C);

        // Check first if we have anything we need
        const settings = getCharacterChaoticMistressSettings(this.character);
        const tasksSettings = getCharacterTasksSettings(this.character);
        if (!settings || !tasksSettings) {
            // Build error page
            GuiHelper.buildErrorPage(parent);
        } else {
            this.settings = settings;
            this.tasksSettings = tasksSettings;
            this.buildChaoticMistressPage();
        }
    }

    public update() {}

    public unload() {
        if (this.shouldSaveSetting) {
            saveSettings(this.character);
        }
    }

    private loadPunishementList() {
        this.punishementList = [];
        if (this.tasksSettings) {
            this.punishementList.push({
                name: "Full Bondage",
                setting: this.tasksSettings.fullBondagePunishmentSettings,
                checkAvailable: () => {
                    return ChaoticMistressModule.getAvailablePunishements().includes("full_bondage");
                },
                onStart: (duration: number) => {
                    startPunishementforCharacter(this.character, "full_bondage", duration);
                }
            });
            this.punishementList.push({
                name: "Harsh Outfit",
                setting: this.tasksSettings.harshOutfitPunishmentSettings,
                checkAvailable: () => {
                    return ChaoticMistressModule.getAvailablePunishements().includes("harsh_outfit");
                },
                onStart: (duration: number) => {
                    startPunishementforCharacter(this.character, "harsh_outfit", duration);
                }
            });
        }
    }

    public buildChaoticMistressPage() {
        this.loadPunishementList();
        GuiHelper.createContentTitle(this.parent, this.STRINGS.PAGE_TITLE, true);

        const form = document.createElement("div");
        form.style.display = "flex";
        form.style.flexDirection = "column";
        form.style.gap = "15px";

        const helpSection = GuiHelper.createInfoSection("info", this.STRINGS.BASE_HELP_TITLE, this.BASE_HELP_TEXT);
        form.appendChild(helpSection);

        const pointsSystemCard = this.buildPointsSystemCard(form);
        const randomTaskCard = this.buildRandomTaskCard();

        const pointsPanel = this.createPointsPanel();


        // Final Assembly
        form.appendChild(pointsSystemCard);
        form.appendChild(randomTaskCard);

        form.appendChild(pointsPanel);

        GuiHelper.createContentTitle(form, this.STRINGS.CATEGORY_SELECT_PUNISHEMENT);
        this.createAllPunishementsCards(form);

        this.parent.appendChild(form);
    }

    private buildPointsSystemCard(container: HTMLElement): HTMLElement {
        // Fields
        const FIELD_ENABLE: GuiFormField = {
            html_id: "atb-chaotic-pts-system-enable",
            label: "Enable Points System (Recommended)",
            type: "checkbox",
            default_value: this.settings.enablePointsSystem,
            onChange: (value: boolean) => {
                this.settings.enablePointsSystem = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_THRESHOLD: GuiFormField = {
            html_id: "atb-chaotic-pts-system-punish-threshold",
            label: "Threshold before forced punishement (0 to disable)",
            type: "number",
            min_value: 0,
            max_value: 1000,
            default_value: this.settings.forcedPunishementThreshold,
            onChange: (value: number) => {
                this.settings.forcedPunishementThreshold = value;
                this.shouldSaveSetting = true;
                this.updatePointsPanel(container);
            }
        };

        // Build Main card
        const ptsSystemTuple = GuiHelper.createFeatureToggleCard(FIELD_ENABLE, true);
        const ptsSystemMainCard = ptsSystemTuple.card;
        const ptsSystemContent = ptsSystemTuple.contentArea;

        const ptsSystemThreshold = GuiHelper.createFormField(FIELD_THRESHOLD);

        ptsSystemContent.appendChild(ptsSystemThreshold);
        return ptsSystemMainCard;
    }

    private buildRandomTaskCard(): HTMLElement {
        // Fields
        const FIELD_ENABLE: GuiFormField = {
            html_id: "atb-chaotic-random-task-enable",
            label: "Enable Random Tasks",
            type: "checkbox",
            default_value: this.settings.enableRandomTasks,
            onChange: (value: boolean) => {
                this.settings.enableRandomTasks = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_AVERAGE_TASKS: GuiFormField = {
            html_id: "atb-chaotic-random-task-average",
            label: "Average number of Tasks per Hour (0.1 - 15)",
            type: "number",
            min_value: 0.1,
            max_value: 15.0,
            default_value: this.settings.averageNewTaskPerHour,
            onChange: (value: number) => {
                this.settings.averageNewTaskPerHour = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_MIN_FINISH_COUNT: GuiFormField = {
            html_id: "atb-chaotic-min-finish-count",
            label: "Minimum random task finish count (% of the base finish count) (5% - 1000%)",
            type: "number",
            min_value: 5,
            max_value: 1000,
            default_value: this.settings.minRandomFinishNeeded,
            onChange: (value: number) => {
                this.settings.minRandomFinishNeeded = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_MAX_FINISH_COUNT: GuiFormField = {
            html_id: "atb-chaotic-max-finish-count",
            label: "Maximum random task finish count (% of the base finish count) (5% - 1000%)",
            type: "number",
            min_value: 5,
            max_value: 1000,
            default_value: this.settings.maxRandomFinishNeeded,
            onChange: (value: number) => {
                this.settings.maxRandomFinishNeeded = value;
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_WEIGHT_USE_PUNISH: GuiFormField = {
            html_id: "atb-chaotic-weight-use-punish",
            label: "Weight of random tasks choosing a punishement instead (0 to disable)",
            type: "number",
            min_value: 0,
            max_value: 100,
            default_value: this.settings.weightUsePunishAsTask,
            onChange: (value: number) => {
                this.settings.weightUsePunishAsTask = value;
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

        randTaskContent.appendChild(randTaskRow1);
        randTaskContent.appendChild(randTaskDurationRow);
        return randTaskMainCard;
    }

    private createPointsPanel(): HTMLDivElement {
        const panel = document.createElement("div");
        panel.className = "atb-panel";

        const debtPercentage = Math.min(this.settings.forcedPunishementThreshold, (this.settings.badPts / this.settings.forcedPunishementThreshold) * 100);

        panel.innerHTML = `
            <h3 style="margin-bottom: 1rem;">${this.STRINGS.POINTS_STATUS_TITLE}</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: var(--atb-success);">${this.STRINGS.GOOD_POINTS}: <strong id="${this.ID_STATUS_GOOD_PTS}">${this.settings.goodPts}</strong></span>
                <span style="color: var(--atb-danger);">${this.STRINGS.BAD_POINTS}: <strong id="${this.ID_STATUS_BAD_PTS}">${this.settings.badPts} / ${this.settings.forcedPunishementThreshold}</strong></span>
            </div>
            <div class="atb-progress-bg" style="width: 100%; height: 10px;">
                <div id="${this.ID_STATUS_PROGRESS_BAR}" class="atb-progress-fill danger" style="width: ${debtPercentage}%;"></div> 
            </div>
        `;
        return panel;
    }

    private updatePointsPanel(content: HTMLElement) {
        const goodPts = content.querySelector(`#${this.ID_STATUS_GOOD_PTS}`);
        const badPts = content.querySelector(`#${this.ID_STATUS_BAD_PTS}`);
        const progressBar: HTMLElement | null = content.querySelector(`#${this.ID_STATUS_PROGRESS_BAR}`);

        if (goodPts) {
            goodPts.innerHTML = `${this.settings.goodPts}`;
        }
        if (badPts) {
            badPts.innerHTML = `${this.settings.badPts} / ${this.settings.forcedPunishementThreshold}`;
        }
        if (progressBar) {
            const debtPercentage = Math.min(this.settings.forcedPunishementThreshold, (this.settings.badPts / this.settings.forcedPunishementThreshold) * 100);
            progressBar.style.width = `${debtPercentage}%`;
        }
    }

    private createAllPunishementsCards(container: HTMLElement) {
        for (let i = 0; i < this.punishementList.length; i += 2) {
            const card1 = this.createPunishmentCard(this.punishementList[i]);

            // Check if there is a second card for this row
            if (i + 1 < this.punishementList.length) {
                const card2 = this.createPunishmentCard(this.punishementList[i + 1]);
                const row = GuiHelper.createTwoElemRow(card1, card2);
                container.appendChild(row);
            } else {
                // Odd number of cards: put the last one in a row with an empty div so it stays half-width
                const row = GuiHelper.createTwoElemRow(card1, undefined);
                container.appendChild(row);
            }
        }
    }

    public createPunishmentCard(config: GuiPunishmentCardConfig): HTMLDivElement {
        // Main Card Container
        // TODO: Make generic function for cards
        const card = document.createElement("div");
        card.className = "atb-panel";
        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.gap = "12px";

        const title = document.createElement("h4");
        title.style.margin = "0";
        title.style.color = "var(--atb-text)";
        title.style.borderBottom = "1px solid var(--atb-border)";
        title.style.paddingBottom = "5px";
        title.innerText = config.name;

        const pointsDisplay = document.createElement("div");
        pointsDisplay.style.fontSize = "0.9em";
        pointsDisplay.style.color = "var(--atb-primary)";
        pointsDisplay.style.fontWeight = "bold";
        pointsDisplay.style.textAlign = "right";


        // Helper to update the text when the input changes
        const updatePointsText = (durationMinutes: number) => {
            const durationMs = durationMinutes * 1000 * 60;
            const pts = ChaoticMistressModule.calculatePointsFromFinishCount(
                durationMs,
                config.setting.baseDurationMs,
                config.setting.baseBadPtsReduction,
                true
            );
            pointsDisplay.innerText = `Reward: ${pts} Bad Points`;
        };

        // Duration Input
        let currentDurationMinutes = Math.floor(config.setting.baseDurationMs / (1000 * 60));
        // Generate a simple ID removing spaces from the name
        const htmlId = `atb-punishment-${config.name.replace(/\s+/g, '-').toLowerCase()}`;
        const durationInput = GuiHelper.createNumberInput(
            htmlId,
            "Duration (Minutes)",
            Math.floor(config.setting.baseDurationMs / (1000 * 60)),
            5,
            10000,
            (newVal) => {
                currentDurationMinutes = newVal;
                updatePointsText(currentDurationMinutes); // Update points immediately
            }
        );

        // Initialize points text for the default value
        updatePointsText(currentDurationMinutes);

        const startBtn = document.createElement("button");
        startBtn.className = "atb-main-btn";
        startBtn.style.marginTop = "auto"; // Pushes button to the bottom if cards have different heights
        startBtn.innerText = this.STRINGS.START_TASK;

        // Handle Disabled State
        if (!config.checkAvailable()) {
            startBtn.disabled = true;
            startBtn.style.opacity = "0.5";
            startBtn.style.cursor = "not-allowed";
            startBtn.innerText = this.STRINGS.NOT_AVAILABLE;
        }

        startBtn.onclick = () => {
            if (!startBtn.disabled) {
                const durationMs = currentDurationMinutes * 1000 * 60;
                config.onStart(durationMs);
            }
        };

        // Final Assembly
        card.appendChild(title);
        card.appendChild(durationInput);
        card.appendChild(pointsDisplay);
        card.appendChild(startBtn);

        return card;
    }
}