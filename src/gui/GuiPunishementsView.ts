import { GuiHelper } from "./GuiHelper";
import { SinglePunishmentSettings, TasksSettings } from "@/models/TasksSettings";
import { PenaltySettings } from "@/models/PenaltySettings";
import { PunishementManagerModule } from "@/modules/PunishementManagerModule";
import GuiViewBase from "./GuiViewBase";
import { getCharacterPenaltySettings, getCharacterTasksSettings, saveSettings, startPunishementforCharacter } from "@/utility/CharacterWrapper";
import { isPlayerHaveRemoteAccess } from "@/models/RemoteAccessSettings";
import { calculatePointsFromFinishCount } from "@/utility/utility";


export interface GuiPunishmentCardConfig {
    name: string;
    setting: SinglePunishmentSettings;
    checkAvailable: () => boolean;
    onStart: (finalDuration: number) => void;
}


export class GuiPunishementsView extends GuiViewBase {
    private shouldSaveSetting: boolean = false;
    private settings!: PenaltySettings;
    private tasksSettings!: TasksSettings;

    private punishementList: GuiPunishmentCardConfig[] = [];

    // id for update points status
    private ID_STATUS_REWARD_PTS = "atb-status-reward-pts";
    private ID_STATUS_PENALTY_PTS = "atb-status-penalty-pts";
    private ID_STATUS_PROGRESS_BAR = "atb-status-progress-bar";


    private STRINGS = {
        PAGE_TITLE: "Punishements",
        CATEGORY_SELECT_PUNISHEMENT: "Select Punishement",
        BASE_HELP_TITLE: "Penalty & Punishements Overview",

        POINTS_STATUS_TITLE: "Points Status",
        REWARD_POINTS: "Reward Points (RP)",
        PENALTY_POINTS: "Penalty Points (PP)",

        START_TASK: "Start Task",
        NOT_AVAILABLE: "Not Available",
        NO_PERMISSION: "No Permission"
    };


    constructor(parent: HTMLDivElement, C: OtherCharacter | PlayerCharacter) {
        super(parent, C);

        // Check first if we have anything we need
        const settings = getCharacterPenaltySettings(this.character);
        const tasksSettings = getCharacterTasksSettings(this.character);
        if (!settings || !tasksSettings) {
            // Build error page
            GuiHelper.buildErrorPage(parent);
        } else {
            this.settings = settings;
            this.tasksSettings = tasksSettings;
            this.buildPunishementsPage();
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
                    return PunishementManagerModule.getAvailablePunishements().includes("full_bondage");
                },
                onStart: (duration: number) => {
                    startPunishementforCharacter(this.character, "full_bondage", duration);
                }
            });
            this.punishementList.push({
                name: "Harsh Outfit",
                setting: this.tasksSettings.harshOutfitPunishmentSettings,
                checkAvailable: () => {
                    return PunishementManagerModule.getAvailablePunishements().includes("harsh_outfit");
                },
                onStart: (duration: number) => {
                    startPunishementforCharacter(this.character, "harsh_outfit", duration);
                }
            });
            this.punishementList.push({
                name: "Doll Play",
                setting: this.tasksSettings.dollPunishmentSettings,
                checkAvailable: () => {
                    return PunishementManagerModule.getAvailablePunishements().includes("doll");
                },
                onStart: (duration: number) => {
                    startPunishementforCharacter(this.character, "doll", duration);
                }
            });
            this.punishementList.push({
                name: "Drone Play",
                setting: this.tasksSettings.dronePunishmentSettings,
                checkAvailable: () => {
                    return PunishementManagerModule.getAvailablePunishements().includes("drone");
                },
                onStart: (duration: number) => {
                    startPunishementforCharacter(this.character, "drone", duration);
                }
            });
        }
    }

    public buildPunishementsPage() {
        this.loadPunishementList();
        GuiHelper.createContentTitle(this.parent, this.STRINGS.PAGE_TITLE, true);

        const form = document.createElement("div");
        form.style.display = "flex";
        form.style.flexDirection = "column";
        form.style.gap = "15px";

        const pointsPanel = this.createPointsPanel();

        // Final Assembly
        form.appendChild(pointsPanel);

        GuiHelper.createContentTitle(form, this.STRINGS.CATEGORY_SELECT_PUNISHEMENT);
        this.createAllPunishementsCards(form);

        this.parent.appendChild(form);
    }

    private createPointsPanel(): HTMLDivElement {
        const panel = document.createElement("div");
        panel.className = "atb-panel";

        const debtPercentage = Math.min(this.settings.forcedPunishementThreshold, (this.settings.penaltyPts / this.settings.forcedPunishementThreshold) * 100);

        panel.innerHTML = `
            <h3 style="margin-bottom: 1rem;">${this.STRINGS.POINTS_STATUS_TITLE}</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: var(--atb-success);">${this.STRINGS.REWARD_POINTS}: <strong id="${this.ID_STATUS_REWARD_PTS}">${this.settings.rewardPts}</strong></span>
                <span style="color: var(--atb-danger);">${this.STRINGS.PENALTY_POINTS}: <strong id="${this.ID_STATUS_PENALTY_PTS}">${this.settings.penaltyPts} / ${this.settings.forcedPunishementThreshold}</strong></span>
            </div>
            <div class="atb-progress-bg" style="width: 100%; height: 10px;">
                <div id="${this.ID_STATUS_PROGRESS_BAR}" class="atb-progress-fill danger" style="width: ${debtPercentage}%;"></div> 
            </div>
        `;
        return panel;
    }

    private updatePointsPanel(content: HTMLElement) {
        const rewardPts = content.querySelector(`#${this.ID_STATUS_REWARD_PTS}`);
        const penaltyPts = content.querySelector(`#${this.ID_STATUS_PENALTY_PTS}`);
        const progressBar: HTMLElement | null = content.querySelector(`#${this.ID_STATUS_PROGRESS_BAR}`);

        if (rewardPts) {
            rewardPts.innerHTML = `${this.settings.rewardPts}`;
        }
        if (penaltyPts) {
            penaltyPts.innerHTML = `${this.settings.penaltyPts} / ${this.settings.forcedPunishementThreshold}`;
        }
        if (progressBar) {
            const debtPercentage = Math.min(this.settings.forcedPunishementThreshold, (this.settings.penaltyPts / this.settings.forcedPunishementThreshold) * 100);
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
        const havePunishAccess = isPlayerHaveRemoteAccess(this.character, this.character.ATB.RemoteAccessSettings?.useEnforcedPermission);

        // Main Card Container
        const card = GuiHelper.createGenericCard(config.name, "small", true);
        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.gap = "12px";

        const pointsDisplay = document.createElement("div");
        pointsDisplay.style.fontSize = "0.9em";
        pointsDisplay.style.color = "var(--atb-primary)";
        pointsDisplay.style.fontWeight = "bold";
        pointsDisplay.style.textAlign = "right";


        // Helper to update the text when the input changes
        const updatePointsText = (durationMinutes: number) => {
            const durationMs = durationMinutes * 1000 * 60;
            const pts = calculatePointsFromFinishCount(
                durationMs,
                config.setting.baseDurationMs,
                config.setting.basePenaltyReduction,
                true
            );
            pointsDisplay.innerText = `Reward: ${pts} Penalty Points`;
        };

        // Duration Input
        let currentDurationMinutes = Math.floor(config.setting.baseDurationMs / (1000 * 60));
        // Generate a simple ID removing spaces from the name
        const htmlId = `atb-punishment-${config.name.replace(/\s+/g, '-').toLowerCase()}`;
        const durationInput = GuiHelper.createNumberInput(
            htmlId,
            "Duration (Minutes)",
            undefined,
            Math.floor(config.setting.baseDurationMs / (1000 * 60)),
            5,
            10000,
            !havePunishAccess,
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
        if (!havePunishAccess || !config.checkAvailable()) {
            startBtn.disabled = true;
            startBtn.style.opacity = "0.5";
            startBtn.style.cursor = "not-allowed";
            if (!havePunishAccess) {
                startBtn.innerText = this.STRINGS.NO_PERMISSION;
            } else {
                startBtn.innerText = this.STRINGS.NOT_AVAILABLE;
            }
        }

        startBtn.onclick = () => {
            if (!startBtn.disabled) {
                const durationMs = currentDurationMinutes * 1000 * 60;
                config.onStart(durationMs);
            }
        };

        // Final Assembly
        card.appendChild(durationInput);
        card.appendChild(pointsDisplay);
        card.appendChild(startBtn);

        return card;
    }
}