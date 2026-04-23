import { TaskManagerModule } from "@/modules/TaskManagerModule";
import { ChaoticMistressSettings } from "@/models/ChaoticMistressSettings";
import { TaskData } from "@/models/TaskManagerSettings";
import ModuleManager from "@/utility/ModuleManager";
import StorageManager from "@/utility/StroageManager";
import { GuiHelper } from "./GuiHelper";
import { formatTimeMs } from "@/utility/utility";

export default class GuiDashboardView {
    private static STRINGS = {
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
    private static taskElements: Map<number, {
        cardElement: HTMLDivElement,
        progressBar: HTMLElement,
        timeText: HTMLElement,
        warningText: HTMLElement,
        skipBtn: HTMLButtonElement
    }> = new Map();

    public static buildDashboardPage(parent: HTMLDivElement) {
        parent.appendChild(this.createPointsPanel(StorageManager.getChaoticMistressSettings()));

        GuiHelper.createContentTitle(parent, this.STRINGS.TASK_LIST_TITLE);

        let tmSettings = StorageManager.getTaskManagerSettings();
        this.taskElements.clear();
        for (let i = 0; i < tmSettings.activeTasks.length; i++) {
            parent.appendChild(this.createTaskCard(tmSettings.activeTasks[i]));
        }
    }

    public static update(content: HTMLElement) {
        let cmSettings = StorageManager.getChaoticMistressSettings();
        let pointsGoodPtsHtml = content.querySelector("#atb-points-good");
        if (pointsGoodPtsHtml) pointsGoodPtsHtml.innerHTML = `${cmSettings.goodPts}`;
        let pointsBadPtsHtml = content.querySelector("#atb-points-bad");
        if (pointsBadPtsHtml) pointsBadPtsHtml.innerHTML = `${cmSettings.badPts} / ${cmSettings.forcedPunishementThreshold}`;
        let pointsBadBarHtml: HTMLElement | null = content.querySelector("#atb-points-bar");
        if (pointsBadBarHtml) {
            const debtPercentage = Math.min(cmSettings.forcedPunishementThreshold, (cmSettings.badPts / cmSettings.forcedPunishementThreshold) * 100);
            pointsBadBarHtml.style.width = `${debtPercentage}%`;
        }

        let tmSettings = StorageManager.getTaskManagerSettings();

        const currentTaskIds = new Set(tmSettings.activeTasks.map(t => t.id));

        // Update Active tasks
        for (let task of tmSettings.activeTasks) {
            let elements = this.taskElements.get(task.id);

            // Handle new tasks
            if (!elements) {
                const newCard = this.createTaskCard(task);
                content.appendChild(newCard);
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

    private static createPointsPanel(settings: ChaoticMistressSettings): HTMLDivElement {
        const panel = document.createElement("div");
        panel.className = "atb-panel";

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

    private static createTaskCard(task: TaskData): HTMLDivElement {
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

    private static updateSkipBtn(task: TaskData, skipBtn: HTMLButtonElement) {
        const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;
        if (task.enforce) {
            skipBtn.disabled = true;
            skipBtn.innerText = `${this.STRINGS.LOCKED}`;
        } else if (tm && tm.getActiveTaskById(task.id)?.isFinished()) {
            skipBtn.disabled = true;
            skipBtn.innerText = `${this.STRINGS.FINISHED}`;
        } else {
            skipBtn.disabled = false;
            skipBtn.innerText = `${this.STRINGS.SKIP} (-${task.badPtsOnFailure} GP)`;
            skipBtn.onclick = () => {
                skipBtn.innerText = `${this.STRINGS.FINISHED}`;
                skipBtn.disabled = true;

                console.log(`ATB: Skipping task ${task.id}`);
                tm?.skipTask(task.id);
            };
        }
    }

    private static updateTaskPenaltyWarning(task: TaskData, warningElem: HTMLElement) {
        const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;

        // Warning text
        let isTaskTrangressing = tm?.getActiveTaskById(task.id)?.isTransgessionOccuring();

        warningElem.innerHTML = isTaskTrangressing
            ? `<span style="color: var(--atb-danger);">${this.STRINGS.PENALTY_WARNING}</span>`
            : ``;
            //: `<span></span>`;
    }
}