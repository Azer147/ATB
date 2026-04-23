import { GuiChaoticMistressView } from "./GuiChaoticMistressView";
import { GuiCreateTaskView } from "./GuiCreateTaskView";
import GuiDashboardView from "./GuiDashboardView";
import { GuiDebugView } from "./GuiDebugView";
import { GuiPunishementsSettingsView } from "./GuiPunishementsSettingsView";
import { GuiRandomEventsView } from "./GuiRandomEventsView";
import { GuiTasksSettingsView } from "./GuiTasksSettingsView";

type TabName = "Dashboard" | "Create Task" | "Chaotic Mistress" | "Random Events" | "Training" | "Tasks Settings" | "Punishements Settings" | "Debug";

export class GuiMainView {
    private static updateInterval: number;
    private static container: HTMLDivElement | null = null;
    private static contentArea: HTMLDivElement | null = null;
    private static currentTab: TabName = "Dashboard";

    private static readonly tabRegistry: Record<TabName, (parent: HTMLDivElement) => void> = {
        "Dashboard": (parent) => GuiDashboardView.buildDashboardPage(parent),
        "Create Task": (parent) => GuiCreateTaskView.buildCreateTaskPage(parent),
        "Chaotic Mistress": (parent) => GuiChaoticMistressView.buildChaoticMistressPage(parent),
        "Random Events": (parent) => GuiRandomEventsView.buildRandomEventsPage(parent),
        "Training": (parent) => {
            const error = document.createElement("h3");
            error.innerText = "Training - Coming soon.";
            parent.appendChild(error);
        },
        "Tasks Settings": (parent) => GuiTasksSettingsView.buildTasksSettingsPage(parent),
        "Punishements Settings": (parent) => GuiPunishementsSettingsView.buildPunishementsSettingsPage(parent),
        "Debug": (parent) => GuiDebugView.buildDebugPage(parent),
    };

    // For page that need cleanning
    private static unLoadPage(tabName: TabName) {
        if (tabName === "Random Events") {
            GuiRandomEventsView.unload();
        }
        if (tabName === "Tasks Settings") {
            GuiTasksSettingsView.unload();
        }
        if (tabName === "Punishements Settings") {
            GuiPunishementsSettingsView.unload();
        }
    }

    public static toggleUi(targetName: string) {
        this.container ? this.Hide() : this.Show(targetName);
    }

    public static Show(targetName: string) {
        if (this.container) this.Hide();

        this.currentTab = "Dashboard";
        this.container = document.createElement("div");
        this.container.id = "atb-overlay-container";
        this.container.className = "atb-overlay-container";

        const blockEvent = (e: Event) => e.stopPropagation();
        this.container.addEventListener("mousedown", blockEvent);
        this.container.addEventListener("touchstart", blockEvent);
        this.container.addEventListener("click", blockEvent);

        this.buildTitleBar(targetName);
        this.buildBody();

        document.body.appendChild(this.container);

        this.updateInterval = setInterval(() => {this.update()}, 1000);
    }

    public static Hide() {
        if (this.container) {
            this.unLoadPage(this.currentTab);
            this.container.remove();
            this.container = null;
            clearInterval(this.updateInterval);
        }
    }

    private static update() {
        if (!this.container) return;

        if (this.currentTab == "Dashboard") {
            GuiDashboardView.update(this.container);
        }
    }

    private static buildTitleBar(targetName: string) {
        if (!this.container) return;

        const titleBar = document.createElement("div");
        titleBar.className = "atb-title-bar";

        const title = document.createElement("h2");
        title.style.margin = "0";
        title.style.fontSize = "1.2em";
        //title.innerHTML = `Azer Toy Box - <span style="color: #2196F3;">${targetName}</span>`;
        title.innerHTML = `Azer Toy Box - ${targetName}`;

        const closeBtn = document.createElement("button");
        closeBtn.className = "atb-close-btn";
        closeBtn.innerText = "✕";
        closeBtn.onclick = () => this.Hide();

        titleBar.appendChild(title);
        titleBar.appendChild(closeBtn);
        this.container.appendChild(titleBar);
    }

    private static buildBody() {
        if (!this.container) return;

        const bodyWrapper = document.createElement("div");
        bodyWrapper.className = "atb-body-wrapper";

        this.contentArea = document.createElement("div");
        this.contentArea.className = "atb-content-area";

        const sidebar = document.createElement("div");
        sidebar.className = "atb-sidebar";

        const tabNames = Object.keys(this.tabRegistry) as TabName[];

        tabNames.forEach(tabName => {
            const btn = document.createElement("button");
            btn.className = "atb-nav-btn";
            btn.innerText = tabName;
            btn.dataset.tabName = tabName;

            btn.onclick = () => {
                let oldTab = this.currentTab;
                this.currentTab = tabName;
                this.renderCurrentPage();
                this.updateSidebarStyles(sidebar);
                this.unLoadPage(oldTab);
            };

            sidebar.appendChild(btn);
        });

        bodyWrapper.appendChild(sidebar);
        bodyWrapper.appendChild(this.contentArea);
        this.container.appendChild(bodyWrapper);

        this.renderCurrentPage();
        this.updateSidebarStyles(sidebar);
    }

    private static renderCurrentPage() {
        if (!this.contentArea) return;
        this.contentArea.innerHTML = "";
        const renderer = this.tabRegistry[this.currentTab];
        if (renderer) renderer(this.contentArea);
    }

    private static updateSidebarStyles(sidebar: HTMLDivElement) {
        const buttons = sidebar.querySelectorAll("button");
        buttons.forEach(btn => {
            if (btn.dataset.tabName === this.currentTab) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });
    }
}