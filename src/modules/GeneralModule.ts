import { GeneralSettings } from "@/models/GeneralSettings";
import { ModuleBase } from "./ModuleBase";
import StorageManager from "@/utility/StroageManager";
import { BC_SDK } from "..";
import { GuiMainView } from "@/gui/GuiMainView";
import ModuleManager from "@/utility/ModuleManager";
import { TaskManagerModule } from "./TaskManagerModule";
import { CoreSettings } from "@/models/CoreSettings";
import { RemoteModule } from "./RemoteModule";


export class GeneralModule extends ModuleBase {
    TICK_PERIOD_MS: number = 800; // 0.8sec
    lastTick: number = 0;

    settings: GeneralSettings;
    atbBtn: { x: number, y: number, w: number, h: number, label: string } =
        { x: 955, y: 500, w: 45, h: 45, label: "ATB" };
    atbRemoteBtn: { x: number, y: number, w: number, h: number, label: string } =
        { x: 90, y: 130, w: 60, h: 60, label: "ATB" };

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
        this.hook.push(BC_SDK.hookFunction('ChatRoomTopMenuSync', 0, (args, next) => {
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
                    GuiMainView.toggleUi(Player);
                    return;
                }
            }
            next(args);
        }));
        // Draw Remote ATB button
        this.hook.push(BC_SDK.hookFunction('InformationSheetRun', 10, (args, next) => {
            next(args);

            if ((<any>window).bcx?.inBcxSubscreen() || (<any>window).LSCG_REMOTE_WINDOW_OPEN) {
                return;
            }

            if (this.settings.addChatRoomBtn && window.CurrentScreen == "InformationSheet") {
                const C = InformationSheetSelection as OtherCharacter | PlayerCharacter;
                if (!C.IsPlayer() && C.ATB) {
                    DrawButton(this.atbRemoteBtn.x, this.atbRemoteBtn.y, this.atbRemoteBtn.w, this.atbRemoteBtn.h, this.atbRemoteBtn.label, "White", "", "");
                }
            }
        }));
        // Click Remote ATB button
        this.hook.push(BC_SDK.hookFunction('InformationSheetClick', 1, (args, next) => {
            if ((<any>window).bcx?.inBcxSubscreen() || (<any>window).LSCG_REMOTE_WINDOW_OPEN) {
                next(args);
                return;
            }

            if (this.settings.addChatRoomBtn == true) {
                if (MouseIn(this.atbRemoteBtn.x, this.atbRemoteBtn.y, this.atbRemoteBtn.w, this.atbRemoteBtn.h)) {
                    const C = InformationSheetSelection as OtherCharacter | PlayerCharacter;
                    if (C && C.MemberNumber) {
                        InformationSheetExit();
                        if (!C.IsPlayer()) {
                            GuiMainView.toggleUi(C);
                            RemoteModule.requestCharacterAtbSettings(C.MemberNumber).then((char: OtherCharacter) => {
                            }).catch(() => {
                                //console.warn("ATB: After requestCharacterAtbSettings: Rejected!");
                            });
                        } else {
                            GuiMainView.toggleUi(Player);
                        }
                    }
                    return;
                }
            }
            next(args);
        }));

        // Register commands for ATB
        CommandCombine({
            Tag: 'atb',
            Description: ": Toggle Azer Toy Box UI Overlay",
            Action: (args, msg, parsed) => {
                if (parsed.length > 0) {
                    const C: OtherCharacter | undefined = ChatRoomCharacter.find(c => c.Name.toLowerCase() == parsed[0].toLowerCase()) as OtherCharacter;
                    if (C && C.MemberNumber) {
                        if (!C.IsPlayer()) {
                            GuiMainView.toggleUi(C);
                            RemoteModule.requestCharacterAtbSettings(C.MemberNumber).then((char: OtherCharacter) => {
                            }).catch(() => {
                                //console.warn("ATB: After requestCharacterAtbSettings: Rejected!");
                            });
                        } else {
                            GuiMainView.toggleUi(Player);
                        }
                    }
                } else {
                    GuiMainView.toggleUi(Player);
                }
            }
        });
    }


    unload(): void {
        super.unload();
    }
}