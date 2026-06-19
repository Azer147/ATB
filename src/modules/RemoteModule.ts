import { ModuleBase } from "./ModuleBase";
import StorageManager from "@/utility/StorageManager";
import { BC_SDK } from "..";
import { CoreSettings } from "@/models/CoreSettings";
import { TaskData } from "@/models/TaskManagerSettings";
import { PunishementType } from "@/models/TasksSettings";
import { skipTaskforCharacter, startPunishementforCharacter, startTaskforCharacter } from "@/utility/CharacterWrapper";
import { GuiMainView } from "@/gui/GuiMainView";

export interface AtbDataRequest<T = any> {
    reqId: number;
    resolve: (data: T) => void;
    reject: (reason?: string) => void;
    timeoutId: ReturnType<typeof setTimeout>;
}

export interface MsgSyncSettings {
    type: "sync_settings";
    settings: any;
    reply: boolean;
    req_id?: number;
    target?: number;
}

export interface MsgApplySetting {
    type: "apply_settings";
    target: number;
    newSettings: any;
    //reply: boolean;
    //req_id?: number;
}

export interface MsgRequestSettings {
    type: "request_settings";
    target: number;
    reply: boolean;
    req_id?: number; // Mandatory for requests
}

export interface MsgStartTask {
    type: "start_task";
    target: number;
    taskData: TaskData;
    overwrite: boolean;
}

export interface MsgStartPunishement {
    type: "start_punishement";
    target: number;
    punishtype: PunishementType;
    duration: number;
}

export interface MsgSkipTask {
    type: "skip_task";
    target: number;
    taskId: number;
}

export type AtbMessage = MsgSyncSettings | MsgRequestSettings | MsgApplySetting | MsgStartTask | MsgStartPunishement | MsgSkipTask;

/**
 * Remote Access & Communication with other Character ATB's Addon
 *
 * Disclaimer: This solution is heavily Copied / Inspired from BCX and LSCG.
 */
export class RemoteModule extends ModuleBase {
    private static nextUid = 1;
    private static activeRequestList = new Map<number, AtbDataRequest>();

    constructor() {
        super("RemoteModule", "Remote", "Manages ATB network communication and data syncing.");
        this.load();
    }

    load(): void {
        // Send ATB Settings to other ChatRoomCharacters when entering a room
        this.hook.push(BC_SDK.hookFunction('ChatRoomSync', 10, (args, next) => {
            // Try to not overload the server with everything going on when entering ChatRoom
            setTimeout(() => {
                RemoteModule.boradcastAtbSettings(true);
            }, 5000);
            return next(args);
        }));

        // Receive ATB Data packets
        this.hook.push(BC_SDK.hookFunction('ChatRoomMessage', 10, (args, next) => {
            this.receiveAtbData(args[0]);
            next(args);
        }));
    }


/**
 * ====================
 * Public API to send ATB request/commands to other Characters
 *
 * This allow to have requests return the data requested through promise
 * ====================
 */

    public static requestCharacterAtbSettings(targetMemberNumber: number): Promise<OtherCharacter> {
        let id = this.getUid();
        let promise = this.createNewRequest(id);
        RemoteModule.sendData({
            req_id: id,
            type: "request_settings",
            target: targetMemberNumber,
            reply: true
        }, targetMemberNumber);
        return promise;
    }

    public static boradcastAtbSettings(replyRequested: boolean, req_id?: number) {
        const publicSettings = StorageManager.getPublicSettings();
        RemoteModule.sendData({
            req_id: req_id,
            type: "sync_settings",
            target: undefined,
            settings: publicSettings,
            reply: replyRequested
        }, null);
    }

    public static requestApplyOtherCharacterSettings(targetMemberNumber: number, setting: CoreSettings) {
        //let id = this.getUid();
        //let promise = this.createNewRequest(id);
        RemoteModule.sendData({
            //req_id: id,
            type: "apply_settings",
            target: targetMemberNumber,
            newSettings: setting
            //reply: true
        }, targetMemberNumber);
        //return promise;
    }

    public static requestStartTask(targetMemberNumber: number, taskData: TaskData, overwrite: boolean) {
        //let id = this.getUid();
        //let promise = this.createNewRequest(id);
        RemoteModule.sendData({
            //req_id: id,
            type: "start_task",
            target: targetMemberNumber,
            taskData: taskData,
            overwrite: overwrite
            //reply: true
        }, targetMemberNumber);
        //return promise;
    }

    public static requestStartPunishement(targetMemberNumber: number, punishtype: PunishementType, duration: number) {
        //let id = this.getUid();
        //let promise = this.createNewRequest(id);
        RemoteModule.sendData({
            //req_id: id,
            type: "start_punishement",
            target: targetMemberNumber,
            punishtype: punishtype,
            duration: duration
            //reply: true
        }, targetMemberNumber);
        //return promise;
    }

    public static requestSkipTask(targetMemberNumber: number, taskId: number) {
        //let id = this.getUid();
        //let promise = this.createNewRequest(id);
        RemoteModule.sendData({
            //req_id: id,
            type: "skip_task",
            target: targetMemberNumber,
            taskId: taskId,
            //reply: true
        }, targetMemberNumber);
        //return promise;
    }

/**
 * ====================
 * Request related functions (internal)
 *
 * This allow to have requests return the data requested through promise
 * ====================
 */

    private static getUid(): number {
        let ret = this.nextUid;
        this.nextUid += 1;
        return ret;
    }

    private static createNewRequest<T = any>(id: number, timeoutMs: number = 2500): Promise<T> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                if (RemoteModule.activeRequestList.has(id)) {
                    console.warn(`ATB: DEBUG: request id=${id} rejected because of timeout.`);
                    RemoteModule.activeRequestList.delete(id);
                    reject(new Error("Request timed out"));
                }
            }, timeoutMs);

            let reqInfo: AtbDataRequest<T> = {
                reqId: id,
                resolve: resolve,
                reject: reject,
                timeoutId: timeoutId,
            };
            RemoteModule.activeRequestList.set(id, reqInfo);
        });
    }

    private static resolveRequest(id: number | undefined, data: any) {
        if (id && RemoteModule.activeRequestList.has(id)) {
            let reqInfo = RemoteModule.activeRequestList.get(id);
            clearTimeout(reqInfo?.timeoutId);
            RemoteModule.activeRequestList.delete(id);
            reqInfo?.resolve(data);
        }
    }


/**
 * ====================
 * Data Receivers & handlers (internal)
 *
 * receiveAtbData() receive all data from other characters ATB addon
 * sendData() is the lowest level function to send data
 * ====================
 */

    private receiveAtbData(data: ServerChatRoomMessage) {
        if (!!data.Sender && data.Type == "Hidden" && data.Content == "ATBMsg" && !!data.Dictionary && !!data.Dictionary[0]) {
            let C = ChatRoomGetCharacter(data.Sender) as OtherCharacter;
            var msg = (data.Dictionary[0] as any).data as AtbMessage;

            // playerIsTarget is also true if target not specified
            const playerIsTarget = (!msg.target || msg.target == Player.MemberNumber);
            if (data.Sender != Player.MemberNumber && playerIsTarget) {
                switch (msg.type) {
                    case "sync_settings":
                        this.syncSettings(C, msg);
                        break;
                    case "request_settings":
                        // Send back setting with the same req_id
                        // TODO: send back only to req sender ?
                        RemoteModule.boradcastAtbSettings(false, msg.req_id);
                        break;
                    case "apply_settings":
                        StorageManager.applyExternalSettingsToPlayer(msg.newSettings);
                        break;
                    case "start_task":
                        startTaskforCharacter(Player, msg.taskData, msg.overwrite);
                        // TODO: improve boradcastAtbSettings efficiency (maybe only send to target ?)
                        RemoteModule.boradcastAtbSettings(false); // Re-send new settings
                        break;
                    case "start_punishement":
                        startPunishementforCharacter(Player, msg.punishtype, msg.duration);
                        // TODO: improve boradcastAtbSettings efficiency (maybe only send to target ?)
                        RemoteModule.boradcastAtbSettings(false); // Re-send new settings
                        break;
                    case "skip_task":
                        skipTaskforCharacter(Player, msg.taskId);
                        // TODO: improve boradcastAtbSettings efficiency (maybe only send to target ?)
                        RemoteModule.boradcastAtbSettings(false); // Re-send new settings
                        break;
                }
            }
        }
    }

    private syncSettings(Sender: OtherCharacter | null, msg: MsgSyncSettings) {
        if (!Sender) return;

        if (!Sender.ATB) {
            Sender.ATB = StorageManager.cleanSavedData(msg.settings);
        } else {
            // merge settings, so we don't destroy settings reference used.
            StorageManager.mergeSettings(Sender.ATB, msg.settings);
        }
        CharacterLoadCanvas(Sender);

        if (msg.reply) {
            RemoteModule.boradcastAtbSettings(false);
        }
        if (msg.req_id) {
            RemoteModule.resolveRequest(msg.req_id, Sender);
        }
        // Ensure Gui stays up-to-date if showing for this Character
        GuiMainView.doFullUpdate(Sender);
    }


    private static sendData(data: AtbMessage, Target: number | null = null) {
        if (!ServerPlayerIsInChatRoom()) return;

        ServerSend("ChatRoomChat", {
            Content: "ATBMsg",
            Type: "Hidden",
            Target,
            Dictionary: [{ data }],
        } as any);
    }
}