import { ChaoticMistressSettings } from "@/models/ChaoticMistressSettings";
import { TaskData } from "@/models/TaskManagerSettings";
import { GuiHelper } from "./GuiHelper";
import { formatTimeMs } from "@/utility/utility";
import GuiViewBase from "./GuiViewBase";
import { getCharacterActiveTaskById, getCharacterChaoticMistressSettings, getCharacterTaskManagerSettings, skipTaskforCharacter } from "@/utility/CharacterWrapper";

export default class GuiDashboardView extends GuiViewBase {
    private STRINGS = {
        POINTS_TITLE: "Points Status",
        TASK_LIST_TITLE: "Active Tasks",
        GOOD_POINTS: "Good Points (GP)",
        BAD_POINTS: "Bad Points (BP)",
        TIME_LEFT: "Time Left",
        SKIP: "Skip",
        LOCKED: "LOCKED",
        FINISHED: "Finished",
        PENALTY_WARNING: "Warning: task transgression occurring! Penalty coming soon...",
    }

    // Updatable elem
    private goodPtsElem: HTMLElement | undefined;
    private badPtsElem: HTMLElement | undefined;
    private badPtsBarElem: HTMLElement | undefined;

    private taskElements: Map<number, {
        cardElement: HTMLDivElement,
        progressBar: HTMLElement,
        timeText: HTMLElement,
        warningText: HTMLElement,
        skipBtn: HTMLButtonElement
    }> = new Map();


    constructor(parent: HTMLDivElement, C: OtherCharacter | PlayerCharacter) {
        super(parent, C);

        // Check first if we have anything we need
        const settings = getCharacterChaoticMistressSettings(this.character);
        const tmSettings = getCharacterTaskManagerSettings(this.character);
        if (!settings || !tmSettings) {
            GuiHelper.buildErrorPage(parent);
        } else {
            //this.settings = settings;
            //this.tasksSettings = tasksSettings;
            this.buildDashboardPage();
        }

    }

    public unload() {}


    public buildDashboardPage() {
        this.parent.appendChild(this.createPointsPanel(getCharacterChaoticMistressSettings(this.character)));

        GuiHelper.createContentTitle(this.parent, this.STRINGS.TASK_LIST_TITLE);

        let tmSettings = getCharacterTaskManagerSettings(this.character);
        this.taskElements.clear();
        if (tmSettings) {
            for (let i = 0; i < tmSettings.activeTasks.length; i++) {
                this.parent.appendChild(this.createTaskCard(tmSettings.activeTasks[i]));
            }
        }
    }

    public update() {
        const cmSettings = getCharacterChaoticMistressSettings(this.character);
       if (cmSettings) {
           if (this.goodPtsElem) this.goodPtsElem.innerHTML = `${cmSettings.goodPts}`;
           if (this.badPtsElem) this.badPtsElem.innerHTML = `${cmSettings.badPts}`;
           if (this.badPtsBarElem) {
               const debtPercentage = Math.min(cmSettings.forcedPunishementThreshold, (cmSettings.badPts / cmSettings.forcedPunishementThreshold) * 100);
               this.badPtsBarElem.style.width = `${debtPercentage}%`;
            }
        }


        // Update Active tasks
        const tmSettings = getCharacterTaskManagerSettings(this.character);
        if (tmSettings) {
            const currentTaskIds = new Set(tmSettings.activeTasks.map(t => t.id));
            for (let task of tmSettings.activeTasks) {
                let elements = this.taskElements.get(task.id);

                // Handle new tasks
                if (!elements) {
                    const newCard = this.createTaskCard(task);
                    this.parent.appendChild(newCard);
                    elements = this.taskElements.get(task.id);
                }

                // Update existing task
                if (elements) {
                    const progressPercentage = task.progress;
                    const timeLeftMs = task.totalDurationMs - task.elapsedtimeMs;
                    const timeLeftStr = formatTimeMs(timeLeftMs);

                    elements.progressBar.style.width = `${progressPercentage}%`;
                    elements.timeText.innerText = `${this.STRINGS.TIME_LEFT}: ${timeLeftStr}`;

                    this.updateTaskPenaltyWarning(task, elements.warningText);
                    this.updateSkipBtn(task, elements.skipBtn);
                }
            }

            // Delete removed tasks
            for (let [taskId, elements] of this.taskElements.entries()) {
                if (!currentTaskIds.has(taskId)) {
                    elements.cardElement.remove();
                    this.taskElements.delete(taskId);
                }
            }
        }
    }

    private createPointsPanel(settings: ChaoticMistressSettings | undefined): HTMLDivElement {
        const panel = document.createElement("div");
        panel.className = "atb-panel";
        if (!settings) return panel;

        const debtPercentage = Math.min(settings.forcedPunishementThreshold, (settings.badPts / settings.forcedPunishementThreshold) * 100);

        panel.innerHTML = `
            <h3 style="margin-bottom: 1rem;">${this.STRINGS.POINTS_TITLE}</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: var(--atb-success);">${this.STRINGS.GOOD_POINTS}: <strong id="atb-points-good">${settings.goodPts}</strong></span>
                <span style="color: var(--atb-danger);">${this.STRINGS.BAD_POINTS}: <strong id="atb-points-bad">${settings.badPts} / ${settings.forcedPunishementThreshold}</strong></span>
            </div>
            <div class="atb-progress-bg" style="width: 100%; height: 10px;">
                <div id="atb-points-bar" class="atb-progress-fill danger" style="width: ${debtPercentage}%;"></div>
            </div>
        `;
        return panel;
    }

    private createTaskCard(task: TaskData): HTMLDivElement {
        const card = document.createElement("div");
        card.className = "atb-task-card";
        card.style.flexDirection = "column";
        card.style.alignItems = "stretch";
        card.style.gap = "10px";

        const progressPercentage = task.progress;
        const timeLeftMs = task.totalDurationMs - task.elapsedtimeMs;
        const timeLeftStr = formatTimeMs(timeLeftMs);

        // Progress text (html)
        const progressMessage = "1/15 spanks"; // TODO: remove Placeholder to test view
        const progressHtml = progressMessage
            ? `<div class="task-progress-text" style="font-size: 0.85em; color: var(--atb-text-muted); margin-bottom: 8px;">
                    ${progressMessage}
                </div>`
            : ``;

        // Description + progress (optional) + progress bar
        const infoDiv = document.createElement("div");
        infoDiv.style.flex = "1";
        infoDiv.innerHTML = `
            <h4 style="margin: 0 0 2px 0;">${task.description}</h4>
            ${progressHtml}
            <div style="display: flex; flex-direction: column; gap: 6px;">
                <div class="atb-progress-bg">
                    <div class="atb-progress-fill task-bar-fill" style="width: ${progressPercentage}%;"></div>
                </div>
            </div>
        `;

        const btnDiv = document.createElement("div");
        btnDiv.style.marginLeft = "20px";
        const skipBtn = document.createElement("button");
        skipBtn.className = "atb-action-btn";
        this.updateSkipBtn(task, skipBtn);
        btnDiv.appendChild(skipBtn);


        // Top row (info + skip btn)
        const topRow = document.createElement("div");
        topRow.style.display = "flex";
        topRow.style.justifyContent = "space-between";
        topRow.style.alignItems = "center";

        topRow.appendChild(infoDiv);
        topRow.appendChild(btnDiv);

        // bottom row (warning + time left)
        const infoBottomDiv = document.createElement("div");
        infoBottomDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; font-size: 0.8em; min-height: 14px;">
                <div class="task-warning">
                </div>
                <div class="task-time-text" style="color: var(--atb-text-muted); white-space: nowrap; text-align: right;">
                    ${this.STRINGS.TIME_LEFT}: ${timeLeftStr}
                </div>
            </div>
        `;


        const warning = infoBottomDiv.querySelector(".task-warning") as HTMLElement;
        this.updateTaskPenaltyWarning(task, warning);

        // Save elem for update()
        this.taskElements.set(task.id, {
            cardElement: card,
            progressBar: infoDiv.querySelector(".task-bar-fill") as HTMLElement,
            timeText: infoBottomDiv.querySelector(".task-time-text") as HTMLElement,
            warningText: warning,
            skipBtn: skipBtn
        });

        // Final assembly
        card.appendChild(topRow);
        card.appendChild(infoBottomDiv);

        return card;
    }

    private updateSkipBtn(task: TaskData, skipBtn: HTMLButtonElement) {
        if (task.enforce) {
            skipBtn.disabled = true;
            skipBtn.innerText = `${this.STRINGS.LOCKED}`;
        } else if (task.progress >= 100) {
            skipBtn.disabled = true;
            skipBtn.innerText = `${this.STRINGS.FINISHED}`;
        } else {
            skipBtn.disabled = false;
            skipBtn.innerText = `${this.STRINGS.SKIP} (-${task.badPtsOnFailure} GP)`;
            skipBtn.onclick = () => {
                skipBtn.innerText = `${this.STRINGS.FINISHED}`;
                skipBtn.disabled = true;

                console.log(`ATB: Skipping task ${task.id}`);
                skipTaskforCharacter(this.character, task.id);
            };
        }
    }

    private updateTaskPenaltyWarning(task: TaskData, warningElem: HTMLElement) {
        const activeTask = getCharacterActiveTaskById(this.character, task.id);

        // Warning text
        let isTaskTrangressing = activeTask?.isTransgessionOccuring() || false;

        warningElem.innerHTML = isTaskTrangressing
            ? `<span style="color: var(--atb-danger);">${this.STRINGS.PENALTY_WARNING}</span>`
            : ``;
            //: `<span></span>`;
    }
}