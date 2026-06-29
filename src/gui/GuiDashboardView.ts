import { PenaltySettings } from "@/models/PenaltySettings";
import { TaskData } from "@/models/TaskManagerSettings";
import { GuiHelper } from "./GuiHelper";
import { formatTimeMs } from "@/utility/utility";
import GuiViewBase from "./GuiViewBase";
import { getCharacterActiveTaskById, getCharacterPenaltySettings, getCharacterTaskManagerSettings, skipTaskforCharacter } from "@/utility/CharacterWrapper";
import { isPlayerHaveRemoteAccess } from "@/models/RemoteAccessSettings";
import { GuiMainView } from "./GuiMainView";

export default class GuiDashboardView extends GuiViewBase {
    private STRINGS = {
        POINTS_TITLE: "Points Status",
        TASK_LIST_TITLE: "Active Tasks",
        REWARD_POINTS: "Reward Points (RP)",
        PENALTY_POINTS: "Penalty Points (PP)",
        FINISH_TIME_LEFT: "Time Left",
        FINISH_ORGASMED: "Orgasm Received",
        FINISH_ORGASMED_RUINED: "Orgasm Ruined",
        FINISH_ORGASMED_RESISTED: "Orgasm Resisted",
        FINISH_SPANKED: "Spank Received",
        SKIP: "Skip",
        LOCKED: "LOCKED",
        FINISHED: "Finished",
        PENALTY_WARNING: "Warning: task transgression occurring! Penalty coming soon...",
    }

    // Updatable elem
    private rewardPtsElem: HTMLElement | undefined;
    private penaltyPtsElem: HTMLElement | undefined;
    private penaltyPtsBarElem: HTMLElement | undefined;

    private taskElements: Map<number, {
        cardElement: HTMLDivElement,
        taskDescription: HTMLElement,
        progressBar: HTMLElement,
        timeText: HTMLElement,
        warningText: HTMLElement,
        skipBtn: HTMLButtonElement
    }> = new Map();


    constructor(parent: HTMLDivElement, C: OtherCharacter | PlayerCharacter) {
        super(parent, C);

        // Check first if we have anything we need
        const settings = getCharacterPenaltySettings(this.character);
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
        this.parent.appendChild(this.createPointsPanel(getCharacterPenaltySettings(this.character)));

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
        const penaltySettings = getCharacterPenaltySettings(this.character);
        if (penaltySettings) {
           if (this.rewardPtsElem) this.rewardPtsElem.innerHTML = `${penaltySettings.rewardPts}`;
           if (this.penaltyPtsElem) this.penaltyPtsElem.innerHTML = `${penaltySettings.penaltyPts} / ${penaltySettings.forcedPunishementThreshold}`;
           if (this.penaltyPtsBarElem) {
               const debtPercentage = Math.min(penaltySettings.forcedPunishementThreshold, (penaltySettings.penaltyPts / penaltySettings.forcedPunishementThreshold) * 100);
               this.penaltyPtsBarElem.style.width = `${debtPercentage}%`;
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
                    const progressPercentage = task.progressPerc;

                    elements.taskDescription.innerText = task.description;
                    elements.progressBar.style.width = `${progressPercentage}%`;
                    elements.timeText.innerText = this.getFinishConditionString(task);

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

    private createPointsPanel(settings: PenaltySettings | undefined): HTMLDivElement {
        const panel = document.createElement("div");
        panel.className = "atb-panel";
        if (!settings) return panel;

        const debtPercentage = Math.min(settings.forcedPunishementThreshold, (settings.penaltyPts / settings.forcedPunishementThreshold) * 100);

        panel.innerHTML = `
            <h3 style="margin-bottom: 1rem;">${this.STRINGS.POINTS_TITLE}</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: var(--atb-success);">${this.STRINGS.REWARD_POINTS}: <strong id="atb-points-reward">${settings.rewardPts}</strong></span>
                <span style="color: var(--atb-danger);">${this.STRINGS.PENALTY_POINTS}: <strong id="atb-points-penalty">${settings.penaltyPts} / ${settings.forcedPunishementThreshold}</strong></span>
            </div>
            <div class="atb-progress-bg" style="width: 100%; height: 10px;">
                <div id="atb-points-bar" class="atb-progress-fill danger" style="width: ${debtPercentage}%;"></div>
            </div>
        `;
        // Save for update()
        this.rewardPtsElem = panel.querySelector("#atb-points-reward") as HTMLElement;
        this.penaltyPtsElem = panel.querySelector("#atb-points-penalty") as HTMLElement;
        this.penaltyPtsBarElem = panel.querySelector("#atb-points-bar") as HTMLElement;
        return panel;
    }

    private createTaskCard(task: TaskData): HTMLDivElement {
        const card = document.createElement("div");
        card.className = "atb-task-card";
        card.style.flexDirection = "column";
        card.style.alignItems = "stretch";
        card.style.gap = "10px";

        const progressPercentage = task.progressPerc;
        const finishConditionStr = this.getFinishConditionString(task);

        // Info: Description + progress bar
        const infoDiv = document.createElement("div");
        infoDiv.style.flex = "1";
        infoDiv.innerHTML = `
            <h4 class="atb-task-desc" style="margin: 0 0 8px 0;">${task.description}</h4>
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


        // Expand/Collapse Icon (+/-)
        const expandIcon = document.createElement("span");
        expandIcon.style.cursor = "pointer";
        expandIcon.style.fontWeight = "bold";
        expandIcon.style.fontSize = "1.2em";
        expandIcon.style.color = "var(--atb-text-muted)";
        expandIcon.style.userSelect = "none";
        expandIcon.style.display = "inline-block";
        expandIcon.style.paddingLeft = "5px";
        expandIcon.style.paddingRight = "15px";
        expandIcon.innerText = "+";


        // Top row (info + skip btn)
        const topRow = document.createElement("div");
        topRow.style.display = "flex";
        topRow.style.justifyContent = "space-between";
        topRow.style.alignItems = "center";

        topRow.appendChild(expandIcon);
        topRow.appendChild(infoDiv);
        topRow.appendChild(btnDiv);


        // bottom row (warning + time left)
        const infoBottomDiv = document.createElement("div");
        infoBottomDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; font-size: 0.8em; min-height: 14px;">
                <div class="task-warning">
                </div>
                <div class="task-time-text" style="color: var(--atb-text-muted); white-space: nowrap; text-align: right;">
                    ${finishConditionStr}
                </div>
            </div>
        `;

        const warning = infoBottomDiv.querySelector(".task-warning") as HTMLElement;
        this.updateTaskPenaltyWarning(task, warning);


        // expandedArea (Task detail + optional editBtn)
        let isExpanded = false;
        const expandedArea = document.createElement("div");
        expandedArea.className = "atb-task-card-expended-content";
        //expandedArea.className = "atb-feature-content";
        expandedArea.style.display = isExpanded ? "flex" : "none";

        // Helper to handle visual expansion/collapse
        const updateExpandedState = (expand: boolean) => {
            isExpanded = expand;
            expandedArea.style.display = isExpanded ? "flex" : "none";
            expandIcon.innerText = isExpanded ? " - " : " + ";
        };

        // Manual Expand/Collapse via the +/- icon
        expandIcon.addEventListener("click", () => {
            updateExpandedState(!isExpanded);
        });

        // Add things in expandedArea
        const taskDetail = document.createElement("div");
        taskDetail.style.color = "var(--atb-text-muted)";
        taskDetail.style.fontSize = "0.9em";

        taskDetail.innerHTML = this.getTaskDetailHtmlStr(task);
        expandedArea.appendChild(taskDetail);

        // Edit button (only in RemoteAccess & not enforced task)
        if (!task.enforce && !this.character.IsPlayer() && isPlayerHaveRemoteAccess(this.character, this.character.ATB.RemoteAccessSettings.editTaskPermission)) {
            const editBtn = document.createElement("button");
            editBtn.className = "atb-action-btn";
            editBtn.style.maxWidth = "fit-content";

            editBtn.innerText = `Edit Task`;
            editBtn.addEventListener("click", () => {
                GuiMainView.goToPageEditTask(this.character, task);
            });
            expandedArea.appendChild(editBtn);
        }


        // Save elem for update()
        this.taskElements.set(task.id, {
            cardElement: card,
            taskDescription: infoDiv.querySelector(".atb-task-desc") as HTMLElement,
            progressBar: infoDiv.querySelector(".task-bar-fill") as HTMLElement,
            timeText: infoBottomDiv.querySelector(".task-time-text") as HTMLElement,
            warningText: warning,
            skipBtn: skipBtn
        });

        // Final assembly
        card.appendChild(topRow);
        card.appendChild(infoBottomDiv);
        card.appendChild(expandedArea);

        return card;
    }

    private getFinishConditionString(task: TaskData) {
        if (task.finishType == "duration") {
            const timeLeftMs = task.finishTotalNeeded - task.finishCurrentCount;
            const timeLeftStr = formatTimeMs(timeLeftMs);
            return `${this.STRINGS.FINISH_TIME_LEFT}: ${timeLeftStr}`;
        } else if (task.finishType == "orgasm") {
            return `${this.STRINGS.FINISH_ORGASMED}: ${task.finishCurrentCount} / ${task.finishTotalNeeded}`;
        } else if (task.finishType == "orgasm_ruined") {
            return `${this.STRINGS.FINISH_ORGASMED_RUINED}: ${task.finishCurrentCount} / ${task.finishTotalNeeded}`;
        } else if (task.finishType == "orgasm_resisted") {
            return `${this.STRINGS.FINISH_ORGASMED_RESISTED}: ${task.finishCurrentCount} / ${task.finishTotalNeeded}`;
        } else if (task.finishType == "spank") {
            return `${this.STRINGS.FINISH_SPANKED}: ${task.finishCurrentCount} / ${task.finishTotalNeeded}`;
        }
        return "Unkown";
    }

    private updateSkipBtn(task: TaskData, skipBtn: HTMLButtonElement) {
        if (task.enforce || !isPlayerHaveRemoteAccess(this.character, this.character.ATB.RemoteAccessSettings.editTaskPermission)) {
            skipBtn.disabled = true;
            skipBtn.innerText = `${this.STRINGS.LOCKED}`;
        } else if (task.progressPerc >= 100) {
            skipBtn.disabled = true;
            skipBtn.innerText = `${this.STRINGS.FINISHED}`;
        } else {
            // TODO: skip always free in remote ? if (this.character.isPlayer())
            skipBtn.disabled = false;
            skipBtn.innerText = `${this.STRINGS.SKIP} (-${task.penaltyPtsOnFailure} GP)`;
            skipBtn.onclick = () => {
                skipBtn.innerText = `${this.STRINGS.FINISHED}`;
                skipBtn.disabled = true;

                console.log(`ATB: Skipping task ${task.id}`);
                skipTaskforCharacter(this.character, task.id, false);
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

    // Return a string formatted for Html
    private getTaskDetailHtmlStr(task: TaskData) {
        let str = "";

        // Common
        if (task.enforce) {
            str += "Enforced: <strong>true</strong><br>";
        }
        str += "Grace Period: <strong>" + Math.floor(task.gracePeriodMs / 1000) + "sec</strong><br><br>";

        // Outfit Specifcs
        if (task.removeOnFinish !== undefined) {
            str += "Remove Outfit on Finish: <strong>" + task.removeOnFinish + "</strong><br>";
        }
        if (task.averageRandomExtPerHour !== undefined) {
            str += "Average Item option randomize Per Hour: <strong>" + task.averageRandomExtPerHour + "</strong><br>";
        }

        // Nickname specifics
        if (task.nickname !== undefined) {
            str += "Nickname To Use: <strong>" + task.nickname + "</strong><br>";
        }
        if (task.original_nickname !== undefined) {
            str += "Original Nickname to Restore on Finish: <strong>" + task.original_nickname + "</strong><br>";
        }

        // Pose specifics
        if (task.target_pose !== undefined) {
            str += "Current Pose to be: <strong>" + task.target_pose + "</strong><br>";
        }
        if (task.selected_upper_pose !== undefined) {
            str += "Upper Pose Selected: <strong>" + task.selected_upper_pose + "</strong><br>";
        }
        if (task.selected_lower_pose !== undefined) {
            str += "Lower Pose Selected: <strong>" + task.selected_lower_pose + "</strong><br>";
        }
        if (task.averageRandomPosePerHour !== undefined) {
            str += "Average Pose Change Per Hour (if random selected): <strong>" + task.averageRandomPosePerHour + "</strong><br>";
        }

        // Room Control specifics
        if (task.roomNameReq !== undefined) {
            str += "Room Name need to include word: <strong>" + task.roomNameReq + "</strong><br>";
        }
        if (task.roomNameReqSearchDesc !== undefined) {
            str += "Also search word in description: <strong>" + task.roomNameReqSearchDesc + "</strong><br>";
        }
        if (task.roomTypeReq !== undefined) {
            str += "Room Type allowed: <strong>" + task.roomTypeReq + "</strong><br>";
        }
        if (task.roomUseMaxMinutesReq !== undefined && task.roomUseMaxMinutesReq && task.roomMaxMinutesReq !== undefined) {
            str += "Maximum time allowed in the same room: <strong>" + task.roomMaxMinutesReq + "</strong><br>";
        }

        // Add line break if there is any specifics printed
        if (["wear_outfit", "nickname", "pose", "room_control"].includes(task.type)) {
            str += "<br>";
        }

        str += "Reward Pts on Success: <strong>" + task.rewardPtsOnSucces + "</strong><br>";
        str += "Penalty Pts on Transgression: <strong>" + task.penaltyPtsOnFailure + "</strong><br>";

        return str;
    }
}