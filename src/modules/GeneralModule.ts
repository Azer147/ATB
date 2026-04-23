import { GeneralSettings } from "@/models/GeneralSettings";
import { ModuleBase } from "./ModuleBase";
import StorageManager from "@/utility/StroageManager";
import { BC_SDK } from "..";
import { GuiMainView } from "@/gui/GuiMainView";
import ModuleManager from "@/utility/ModuleManager";
import { TaskManagerModule } from "./TaskManagerModule";


export class GeneralModule extends ModuleBase {
    TICK_PERIOD_MS: number = 800; // 0.8sec
    lastTick: number = 0;

    settings: GeneralSettings;
    atbBtn: { x: number, y: number, w: number, h: number, label: string } =
        { x: 955, y: 500, w: 45, h: 45, label: "ATB" };

    constructor() {
        super("GeneralModule", "General", "Manages general settings and behaviors.");
        this.settings = StorageManager.getGeneralSettings();
        this.load();
    }

    isEnabled(): boolean {
        return StorageManager.getGlobalEnable();
    }

    load(): void {
        // Draw ATB button
        this.hook.push(BC_SDK.hookFunction('ChatRoomMenuDraw', 0, (args, next) => {
            next(args);

            let btnColor = "White";
            // Restrict tick to 1 per seconds to avoid performance issues
            //const currentTime = Date.now();
            //if (currentTime - this.lastTick >= this.TICK_PERIOD_MS) {
                const tm = ModuleManager.getModule("TaskManagerModule") as TaskManagerModule;
                if (tm && tm.isAnyTaskTransgressionOccuring()) {
                    btnColor = "Red";
                }

            //    this.lastTick = currentTime;
            //}

            if (this.settings.addChatRoomBtn && window.CurrentScreen == "ChatRoom") {
                DrawButton(this.atbBtn.x, this.atbBtn.y, this.atbBtn.w, this.atbBtn.h, this.atbBtn.label, btnColor, "", "");
            }
        }));
        // Click ATB button
        this.hook.push(BC_SDK.hookFunction('ChatRoomClick', 0, (args, next) => {
            if (this.settings.addChatRoomBtn == true) {
                if (MouseIn(this.atbBtn.x, this.atbBtn.y, this.atbBtn.w, this.atbBtn.h)) {
                    GuiMainView.toggleUi(Player.Name);
                    return;
                }
            }
            next(args);
        }));

        CommandCombine({
            Tag: 'atb',
            Description: ": Toggle Azer Toy Box UI Overlay",
            Action: () => {
                GuiMainView.toggleUi(Player.Name);
            }
        });
    }

    unload(): void {
        super.unload();
    }
}