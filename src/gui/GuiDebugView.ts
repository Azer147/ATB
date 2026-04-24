import { TaskManagerModule } from "@/modules/TaskManagerModule";
import ModuleManager from "@/utility/ModuleManager";
import { GuiHelper } from "./GuiHelper";
import StorageManager from "@/utility/StroageManager";
import { addRandomRestrain } from "@/utility/ItemUtility";
import { RandomEventsModule } from "@/modules/RandomEventsModule";

export class GuiDebugView {
    private static STRINGS = {
        PAGE_TITLE: "Debug Page",
        RESET_GOOD_PTS: "Reset Good Points",
        RESET_BAD_PTS: "Reset Bad Points",
        CLEAR_ALL_TASKS: "Clear All Tasks",
        ADD_RANDOM_ITEM: "Equip Random Item",
        TEST_RANDOM_ITEM: "Test Random Item (Arm or torso)",
        TRIGGER_RANDOM_EVENT: "Trigger Random Event",
        PASSWORD_LOCK_EVENT: "Trigger Password Lock Event",
    };

    private static resetGoodPts() {
        StorageManager.getChaoticMistressSettings().goodPts = 0;
        StorageManager.saveSettings();
    }

    private static resetBadPts() {
        StorageManager.getChaoticMistressSettings().badPts = 0;
        StorageManager.saveSettings();
    }

    private static clearAllTasks() {
        const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;
        tm?.forceFinishAllTask();
    }

    public static buildDebugPage(parent: HTMLElement) {
        GuiHelper.createContentTitle(parent, this.STRINGS.PAGE_TITLE, true);

        const form = document.createElement("div");
        form.style.display = "flex";
        form.style.flexDirection = "column";
        form.style.gap = "25px";

        // Pts debug

        const resetGoodPointsBtn = document.createElement("button");
        resetGoodPointsBtn.className = "atb-main-btn";
        resetGoodPointsBtn.innerText = this.STRINGS.RESET_GOOD_PTS;
        resetGoodPointsBtn.onclick = () => {
            this.resetGoodPts();
        };

        const resetBadPointsBtn = document.createElement("button");
        resetBadPointsBtn.className = "atb-main-btn";
        resetBadPointsBtn.innerText = this.STRINGS.RESET_BAD_PTS;
        resetBadPointsBtn.onclick = () => {
            this.resetBadPts();
        };

        const ptsRow = GuiHelper.createTwoElemRow(resetBadPointsBtn, resetGoodPointsBtn);
        form.appendChild(ptsRow);

        // Clear all task
        const clearAllTasksBtn = document.createElement("button");
        clearAllTasksBtn.className = "atb-main-btn";
        clearAllTasksBtn.innerText = this.STRINGS.CLEAR_ALL_TASKS;
        clearAllTasksBtn.onclick = () => {
            this.clearAllTasks();
        };
        form.appendChild(clearAllTasksBtn);


        // Random item test

        const addRandomBtn = document.createElement("button");
        addRandomBtn.className = "atb-main-btn";
        addRandomBtn.innerText = this.STRINGS.ADD_RANDOM_ITEM;
        addRandomBtn.onclick = () => {
            addRandomRestrain(Player, 1, undefined, true);
        };
        //form.appendChild(addRandomBtn);

        const testRandomBtn = document.createElement("button");
        testRandomBtn.className = "atb-main-btn";
        testRandomBtn.innerText = this.STRINGS.TEST_RANDOM_ITEM;
        testRandomBtn.onclick = () => {
            addRandomRestrain(Player, 1, ["ItemArms", "ItemTorso", "ItemTorso2"], true, ["Block"]);
        };
        //form.appendChild(testRandomBtn);
        const randomItemRow = GuiHelper.createTwoElemRow(addRandomBtn, testRandomBtn);
        form.appendChild(randomItemRow);

        // Random Event debug

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

        parent.appendChild(form);
    }

}