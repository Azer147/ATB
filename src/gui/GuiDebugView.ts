import { TaskManagerModule } from "@/modules/TaskManagerModule";
import ModuleManager from "@/utility/ModuleManager";
import { GuiHelper } from "./GuiHelper";
import { addRandomRestrain } from "@/utility/ItemUtility";
import { RandomEventsModule } from "@/modules/RandomEventsModule";
import GuiViewBase from "./GuiViewBase";
import { getCharacterPenaltySettings, saveSettings } from "@/utility/CharacterWrapper";
import { PunishementManagerModule } from "@/modules/PunishementManagerModule";
import { RandomTaskModule } from "@/modules/RandomTaskModule";

export class GuiDebugView extends GuiViewBase {
    private STRINGS = {
        PAGE_TITLE: "Debug Page",
        ADD_REWARD_PTS: "Add 50 Reward Points",
        RESET_PENALTY_PTS: "Reset Penalty Points",
        CLEAR_ALL_TASKS: "Clear All Tasks",
        RANDOM_TASK: "Trigger Random Task",
        RANDOM_PUNISH: "Trigger Random Punishement",
        ADD_RANDOM_ITEM: "Equip Random Item",
        TEST_RANDOM_ITEM: "Equip 10 Random Item",
        TRIGGER_RANDOM_EVENT: "Trigger Random Event",
        PASSWORD_LOCK_EVENT: "Trigger Password Lock Event",
    };

    constructor(parent: HTMLDivElement, C: OtherCharacter | PlayerCharacter) {
        super(parent, C);

        this.buildDebugPage();
    }

    public update() {}

    public unload() {
    }

    private addRewardPts(pts: number) {
        const setting = getCharacterPenaltySettings(this.character)
        if (setting) {
            setting.rewardPts += pts;
            saveSettings(this.character);
        }
    }

    private resetPenaltyPts() {
        const setting = getCharacterPenaltySettings(this.character)
        if (setting) {
            setting.penaltyPts = 0;
            saveSettings(this.character);
        }
    }

    private clearAllTasks() {
        const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;
        tm?.forceFinishAllTask();
    }

    public buildDebugPage() {
        GuiHelper.createContentTitle(this.parent, this.STRINGS.PAGE_TITLE, true);

        const form = document.createElement("div");
        form.style.display = "flex";
        form.style.flexDirection = "column";
        form.style.gap = "25px";

        // Pts debug
        //GuiHelper.createContentTitle(form, "Task/Points Debug");

        const resetRewardPointsBtn = document.createElement("button");
        resetRewardPointsBtn.className = "atb-main-btn";
        resetRewardPointsBtn.innerText = this.STRINGS.ADD_REWARD_PTS;
        resetRewardPointsBtn.onclick = () => {
            this.addRewardPts(50);
        };

        const resetPenaltyPointsBtn = document.createElement("button");
        resetPenaltyPointsBtn.className = "atb-main-btn";
        resetPenaltyPointsBtn.innerText = this.STRINGS.RESET_PENALTY_PTS;
        resetPenaltyPointsBtn.onclick = () => {
            this.resetPenaltyPts();
        };

        const ptsRow = GuiHelper.createTwoElemRow(resetPenaltyPointsBtn, resetRewardPointsBtn);
        form.appendChild(ptsRow);


        // Random Task test

        GuiHelper.createContentTitle(form, "Random Task Debug");

        const randomTaskBtn = document.createElement("button");
        randomTaskBtn.className = "atb-main-btn";
        randomTaskBtn.innerText = this.STRINGS.RANDOM_TASK;
        randomTaskBtn.onclick = () => {
            const rtm = ModuleManager.getModule("RandomTaskModule") as RandomTaskModule;
            if (rtm) rtm.triggerRandomTask();
        };
        //form.appendChild(randomTaskBtn);

        const randomPunishBtn = document.createElement("button");
        randomPunishBtn.className = "atb-main-btn";
        randomPunishBtn.innerText = this.STRINGS.RANDOM_PUNISH;
        randomPunishBtn.onclick = () => {
            const pmm = ModuleManager.getModule("PunishementManagerModule") as PunishementManagerModule;
            if (pmm) pmm.triggerRandomPunishment();
        };
        //form.appendChild(randomPunishBtn);
        const randomTaskRow = GuiHelper.createTwoElemRow(randomTaskBtn, randomPunishBtn);
        form.appendChild(randomTaskRow);


        // Clear all task
        const clearAllTasksBtn = document.createElement("button");
        clearAllTasksBtn.className = "atb-main-btn";
        clearAllTasksBtn.innerText = this.STRINGS.CLEAR_ALL_TASKS;
        clearAllTasksBtn.onclick = () => {
            this.clearAllTasks();
        };
        form.appendChild(clearAllTasksBtn);


        // Random item test
        GuiHelper.createContentTitle(form, "Random Items Test");

        const addRandomBtn = document.createElement("button");
        addRandomBtn.className = "atb-main-btn";
        addRandomBtn.innerText = this.STRINGS.ADD_RANDOM_ITEM;
        addRandomBtn.onclick = () => {
            addRandomRestrain(Player, 1, true, undefined, true);
        };
        //form.appendChild(addRandomBtn);

        const testRandomBtn = document.createElement("button");
        testRandomBtn.className = "atb-main-btn";
        testRandomBtn.innerText = this.STRINGS.TEST_RANDOM_ITEM;
        testRandomBtn.onclick = () => {
            addRandomRestrain(Player, 10, true);
        };
        //form.appendChild(testRandomBtn);
        const randomItemRow = GuiHelper.createTwoElemRow(addRandomBtn, testRandomBtn);
        form.appendChild(randomItemRow);

        // Random Event debug
        GuiHelper.createContentTitle(form, "Random Event Test");

        const randomEventBtn = document.createElement("button");
        randomEventBtn.className = "atb-main-btn";
        randomEventBtn.innerText = this.STRINGS.TRIGGER_RANDOM_EVENT;
        randomEventBtn.onclick = () => {
            const rem = ModuleManager.getModule("RandomEventsModule") as RandomEventsModule;
            rem?.triggerRandomEvent();
        };

        const randomPassBtn = document.createElement("button");
        randomPassBtn.className = "atb-main-btn";
        randomPassBtn.innerText = this.STRINGS.PASSWORD_LOCK_EVENT;
        randomPassBtn.onclick = () => {
            const rem = ModuleManager.getModule("RandomEventsModule") as RandomEventsModule;
            rem?.eventRandomPasswordLock();
        };

        const randomEventRow = GuiHelper.createTwoElemRow(randomEventBtn, randomPassBtn);
        form.appendChild(randomEventRow);

        this.parent.appendChild(form);
    }

}