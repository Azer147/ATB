import { TaskManagerModule } from "@/modules/TaskManagerModule";
import ModuleManager from "@/utility/ModuleManager";
import { GuiHelper } from "./GuiHelper";
import StorageManager from "@/utility/StroageManager";

export class GuiDebugView {
    private static STRINGS = {
        PAGE_TITLE: "Debug Page",
        RESET_GOOD_PTS: "Reset Good Points",
        RESET_BAD_PTS: "Reset Bad Points",
        CLEAR_ALL_TASKS: "Clear All Tasks",
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

        const clearAllTasksBtn = document.createElement("button");
        clearAllTasksBtn.className = "atb-main-btn";
        clearAllTasksBtn.innerText = this.STRINGS.CLEAR_ALL_TASKS;
        clearAllTasksBtn.onclick = () => {
            this.clearAllTasks();
        };
        form.appendChild(clearAllTasksBtn);


        parent.appendChild(form);
    }

}