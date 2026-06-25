import { RemoteModule } from "@/modules/RemoteModule";
import { GuiChaoticMistressView } from "./GuiChaoticMistressView";
import { GuiCreateTaskView } from "./GuiCreateTaskView";
import GuiDashboardView from "./GuiDashboardView";
import { GuiDebugView } from "./GuiDebugView";
import { GuiPunishementsSettingsView } from "./GuiPunishementsSettingsView";
import { GuiRandomEventsView } from "./GuiRandomEventsView";
import { GuiTasksSettingsView } from "./GuiTasksSettingsView";
import GuiViewBase from "./GuiViewBase";
import { GuiOutfitSettingsView } from "./GuiOutfitSettingsView";
import { GuiOutfitEditorView } from "./GuiOutfitEditorView";
import { GuiRemoteAccessSettingsView } from "./GuiRemoteAccessSettingsView";
import { isPlayerHaveRemoteAccess } from "@/models/RemoteAccessSettings";

type TabName = "Dashboard" | "Create Task" | "Chaotic Mistress" | "Random Events" | "Tasks Settings" | "Punishements Settings"
             | "Outfit Settings" | "Outfit Editor" | "Remote Access Settings" | "Debug";

export interface TabConfig {
    render: (parent: HTMLDivElement, C: OtherCharacter | PlayerCharacter) => GuiViewBase | undefined;
    showCondition?: (C: OtherCharacter | PlayerCharacter) => boolean;
}

export class GuiMainView {
    private static updateInterval: number;
    private static container: HTMLDivElement | null = null;
    private static contentArea: HTMLDivElement | null = null;
    private static sideBar: HTMLDivElement | undefined;
    private static currentTab: TabName = "Dashboard";
    private static currentTabView: GuiViewBase | undefined;
    private static currentMemberNumber: number | undefined;

    private static readonly tabRegistry: Record<TabName, TabConfig> = {
        "Dashboard": {render: (parent, C) => { return new GuiDashboardView(parent, C) as GuiViewBase; }},
        "Create Task": {render: (parent, C) => { return new GuiCreateTaskView(parent, C) as GuiViewBase; },
                showCondition: (C) => {
                    return (isPlayerHaveRemoteAccess(C, C.ATB?.RemoteAccessSettings?.createTaskPermission)
                            || isPlayerHaveRemoteAccess(C, C.ATB?.RemoteAccessSettings?.editTaskPermission));
                }},
        "Chaotic Mistress": {render: (parent, C) => { return new GuiChaoticMistressView(parent, C) as GuiViewBase; },
                showCondition: (C) => {
                    return (isPlayerHaveRemoteAccess(C, C.ATB?.RemoteAccessSettings?.chaoticMistressSettingsPermission)
                            || isPlayerHaveRemoteAccess(C, C.ATB?.RemoteAccessSettings?.useEnforcedPermission));
                }},
        "Random Events": {render: (parent, C) => { return new GuiRandomEventsView(parent, C) as GuiViewBase; },
                showCondition: (C) => {return (isPlayerHaveRemoteAccess(C, C.ATB?.RemoteAccessSettings?.randomEventSettingsPermission));}},
        "Tasks Settings": {render: (parent, C) => { return new GuiTasksSettingsView(parent, C) as GuiViewBase; },
                showCondition: (C) => {return (isPlayerHaveRemoteAccess(C, C.ATB?.RemoteAccessSettings?.taskSettingsPermission));}},
        "Punishements Settings": {render: (parent, C) => { return new GuiPunishementsSettingsView(parent, C) as GuiViewBase; },
                showCondition: (C) => {return (isPlayerHaveRemoteAccess(C, C.ATB?.RemoteAccessSettings?.punishementSettingsPermission));}},
        "Outfit Settings": {render: (parent, C) => { return new GuiOutfitSettingsView(parent, C) as GuiViewBase; },
                showCondition: (C) => {return (isPlayerHaveRemoteAccess(C, C.ATB?.RemoteAccessSettings?.outfitSettingsPermission));}},
        "Outfit Editor": {render: (parent, C) => { return new GuiOutfitEditorView(parent, C) as GuiViewBase; },
                showCondition: (C) => { return C.IsPlayer()}},
        "Remote Access Settings": {render: (parent, C) => { return new GuiRemoteAccessSettingsView(parent, C) as GuiViewBase; },
                showCondition: (C) => {return (isPlayerHaveRemoteAccess(C, C.ATB?.RemoteAccessSettings?.remoteAccessSettingsPermission));}},
        "Debug": {render: (parent, C) => { return new GuiDebugView(parent, C) as GuiViewBase; },
                showCondition: (C) => { return C.IsPlayer()}},
    };

    public static toggleUi(C: OtherCharacter | PlayerCharacter) {
        this.container ? this.Hide() : this.Show(C);
    }

    public static Show(C: OtherCharacter | PlayerCharacter) {
        if (this.container) this.Hide();
        this.currentMemberNumber = C.MemberNumber;

        this.currentTab = "Dashboard";
        this.container = document.createElement("div");
        this.container.id = "atb-overlay-container";
        this.container.className = "atb-overlay-container";

        const blockEvent = (e: Event) => e.stopPropagation();
        this.container.addEventListener("mousedown", blockEvent);
        this.container.addEventListener("touchstart", blockEvent);
        this.container.addEventListener("click", blockEvent);

        this.buildTitleBar(C);
        this.buildBody(C);

        document.body.appendChild(this.container);

        this.updateInterval = setInterval(() => {
            if (this.currentTabView) this.currentTabView.update();
        }, 1000);
    }

    public static Hide() {
        if (this.container) {
            this.currentMemberNumber = undefined;
            if (this.currentTabView) this.currentTabView.unload();
            this.currentTabView = undefined;
            this.container.remove();
            this.container = null;
            clearInterval(this.updateInterval);
        }
    }

    // Re-build the current page (needed to update correctly settings fields if C.ATB has been updated)
    // Only do something if Gui is showing and Character match current Character
    public static doFullUpdate(C: OtherCharacter | PlayerCharacter) {
        if (this.sideBar) {
            this.updateSideBarContent(C, this.sideBar);
        }
        if (this.container && C.MemberNumber == this.currentMemberNumber) {
            this.changeCurrentPage(C, this.currentTab);
        }
    }

    private static changeCurrentPage(C: OtherCharacter | PlayerCharacter, tabName: TabName) {
        // Unload old tab
        if (this.currentTabView) this.currentTabView.unload();
        this.currentTabView = undefined;

        // Check C have Access to tabName (needed in case of update)
        const tab = this.tabRegistry[tabName];
        if (tab && tab.showCondition && tab.showCondition(C)) {
            this.currentTab = tabName;
        } else {
            this.currentTab = "Dashboard"; // Default to Dashboard else
        }
        // Render new page
        this.renderCurrentPage(C);
    }

    private static renderCurrentPage(C: OtherCharacter | PlayerCharacter) {
        if (!this.contentArea) return;
        this.contentArea.innerHTML = "";
        const renderer = this.tabRegistry[this.currentTab];
        if (renderer) {
            this.currentTabView = this.tabRegistry[this.currentTab].render(this.contentArea, C);
        }
        if (this.sideBar) {
            this.updateSidebarStyles(this.sideBar);
        }
    }

    private static buildTitleBar(C: OtherCharacter | PlayerCharacter) {
        if (!this.container) return;

        const titleBar = document.createElement("div");
        titleBar.className = "atb-title-bar";

        const title = document.createElement("h2");
        title.style.margin = "0";
        title.style.fontSize = "1.2em";
        //title.innerHTML = `Azer Toy Box - <span style="color: #2196F3;">${targetName}</span>`;
        title.innerHTML = `Azer Toy Box - ${C.Name}`;

        const closeBtn = document.createElement("button");
        closeBtn.className = "atb-close-btn";
        closeBtn.innerText = "✕";
        closeBtn.onclick = () => this.Hide();


        const btnGroup = document.createElement("div");
        btnGroup.style.display = "flex";
        btnGroup.style.gap = "20px";

        // Only add refresh button for other character
        if (C.MemberNumber && !C.IsPlayer()) {
            const refreshBtn = document.createElement("button");
            //refreshBtn.className = "atb-refresh-btn";
            refreshBtn.className = "atb-close-btn";
            refreshBtn.innerText = "↻";
            refreshBtn.onclick = () => {
                // Disable button to prevent request abuse
                refreshBtn.disabled = true;
                refreshBtn.style.opacity = "0.5";

                // Ask for setting update
                if (C.MemberNumber) {
                    RemoteModule.requestCharacterAtbSettings(C.MemberNumber).then(() => {
                        // Not needed anymore: doFullUpdate is auto called when we receive new settings from OtherChar
                        //GuiMainView.doFullUpdate(C);
                    }).catch(() => {
                    });
                }

                // Re-enable button after 5sec
                setTimeout(() => {
                    refreshBtn.disabled = false;
                    refreshBtn.style.opacity = "1";
                }, 5000);
            };
            btnGroup.appendChild(refreshBtn);
        }
        btnGroup.appendChild(closeBtn);

        titleBar.appendChild(title);
        titleBar.appendChild(btnGroup);
        this.container.appendChild(titleBar);
    }

    private static buildBody(C: OtherCharacter | PlayerCharacter) {
        if (!this.container) return;

        const bodyWrapper = document.createElement("div");
        bodyWrapper.className = "atb-body-wrapper";

        this.contentArea = document.createElement("div");
        this.contentArea.className = "atb-content-area";

        this.sideBar = document.createElement("div");
        this.sideBar.className = "atb-sidebar";
        this.updateSideBarContent(C, this?.sideBar);

        bodyWrapper.appendChild(this.sideBar);
        bodyWrapper.appendChild(this.contentArea);
        this.container.appendChild(bodyWrapper);

        this.renderCurrentPage(C);
    }

    private static updateSideBarContent(C: OtherCharacter | PlayerCharacter, sidebar: HTMLDivElement) {
        const tabNames = Object.keys(this.tabRegistry) as TabName[];

        sidebar.innerHTML = "";
        tabNames.forEach(tabName => {
            // Hide tab depending of showCondition
            const tabConfig = this.tabRegistry[tabName];
            if (tabConfig.showCondition && !tabConfig.showCondition(C)) {
                return;
            }

            const btn = document.createElement("button");
            btn.className = "atb-nav-btn";
            btn.innerText = tabName;
            btn.dataset.tabName = tabName;

            btn.onclick = () => {
                this.changeCurrentPage(C, tabName);
             };

            sidebar.appendChild(btn);
        });
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