import { TaskData } from "@/models/TaskManagerSettings";
import { TaskBase } from "./TaskBase";
import { ChatColor, CloneAndRandomizeList, formatTimeMs, getNameOrNickname, sendLocalMessage, shouldTriggerFromAveragePerHour } from "@/utility/utility";
import { RoomControlType } from "@/models/TasksSettings";


export class TaskRoomControl extends TaskBase {

    // Last room the Player has been in
    private lastRoomNameUsed = "";
    private inSameRoomSince = Date.now(); // Timer for Max Time ina Room Requirement

    // Used to signal handleTransgressionWarning() that this transgression concern only the Requirement MaxMinutesReq (Max time in a room)
    private isMaxTimeOnlyTransgressionOccuring = false;

    // Hold a description of the last transgession detected by checkTaskIsRespected()
    // It is then printed by handleTransgressionWarning() / handleTransgression()
    private lastTransgressionStr = "";

    constructor(data: TaskData) {
        super(data);

        // Specifics Task data Validation
        let roomName = this.data.roomNameReq;
        let nameReqSearchDesc = this.data.roomNameReqSearchDesc;
        let roomType = this.data.roomTypeReq;
        let roomUseMaxMinutesReq = this.data.roomUseMaxMinutesReq;
        let roomMaxMinutesReq = this.data.roomMaxMinutesReq;
        if (roomName === undefined || nameReqSearchDesc === undefined || !roomType
            || roomUseMaxMinutesReq === undefined || roomMaxMinutesReq === undefined) {
            // End the task (error)
            console.warn("ATB: TaskRoomControl: Error: some data are not defined.");
            this.triggerTaskCompletion(false, true);
            return;
        }
    }

    private getRoomNameReq(): string | undefined {
        if (this.data.roomNameReq && this.data.roomNameReq == "") {
            return undefined;
        }
        return this.data.roomNameReq;
    }

    private getRoomTypeReq(): RoomControlType | undefined {
        return this.data.roomTypeReq;
    }

/**
 * Specifics strings for UI/User
 */

    public getDescription(): string {
        let enforcedStr = this.data.enforce ? " (enforced)" : "";

        let nameReqStr = "";
        if (this.getRoomNameReq()) {
            nameReqStr = "[Name Include \"" + this.getRoomNameReq() + "\"]";
        }

        let typeReqStr = "";
        const roomTypeReq = this.getRoomTypeReq();
        if (roomTypeReq && roomTypeReq == "private_only") {
            typeReqStr = "[Private Room Only]";
        }
        else if (roomTypeReq && roomTypeReq == "public_only") {
            typeReqStr = "[Public Room Only]";
        }

        let maxTimeReqStr = "";
        if (this.data.roomUseMaxMinutesReq) {
           maxTimeReqStr = `[${this.data.roomMaxMinutesReq} minutes Maximum per Room]`;
        }

        // Spacing
        if (nameReqStr.length > 0 && typeReqStr.length > 0) {
            typeReqStr = " " + typeReqStr;
        }
        if (nameReqStr.length > 0 || typeReqStr.length > 0) {
            maxTimeReqStr = " " + maxTimeReqStr;
        }

        // Final requirement string
        let reqStr = `${nameReqStr}${typeReqStr}${maxTimeReqStr}`;

        this.data.description = `Room Requirements: ${reqStr}` + enforcedStr;
        return this.data.description;
    }

    protected handleTransgression() {
        sendLocalMessage(`Room Requirements not respected: ${this.lastTransgressionStr}, you received ${this.data.badPtsOnFailure} penalty points for transgression.`, ChatColor.Red);
    }

    protected handleTransgressionWarning() {
        const timeToComply = formatTimeMs(this.data.gracePeriodMs);

        if (this.isMaxTimeOnlyTransgressionOccuring) {
            // Special case for Max Time Req only: Make sure another allowed Room exist before triggering the warning/transgression process.
            this.findRandAllowedChatRoom(this.getRoomNameReq() ?? "", this.getRoomTypeReq()).then((selectedRoomName) => {
                if (selectedRoomName && selectedRoomName.length > 0) {
                    // Allowed Room found: Go through with the warning as normal
                    sendLocalMessage(`Room Requirements not respected: ${this.lastTransgressionStr}, you have ${timeToComply} to comply or get a penalty!`, ChatColor.Red);
                    return;
                } else {
                    // There is no other allowed Room, so this is pointless to force the player to change room to end up in the same room again.
                    // Reset Max Time Timer + Grace Period Timer and ignore transgression for this time
                    this.resetMaxTimeReqTimer(true);
                }
            }).catch((err) => {
                // As we don't know, to be safe: Reset Max Time Timer + Grace Period Timer and ignore transgression for this time
                this.resetMaxTimeReqTimer(true);
            });
            return; // findRandAllowedChatRoom is Async, so don't do the transgression warning just yet.
        }

        sendLocalMessage(`Room Requirements not respected: ${this.lastTransgressionStr}, you have ${timeToComply} to comply or get a penalty!`, ChatColor.Red);
    }

    protected override handleFirstTick(): void {
        // Override handleFirstTick and do nothing
        // This is to avoid handleFirstTick() calling enforceTask(), for this task we want to avoid a sudden auto-change room.
    }

    protected isCharUnableToDoTask(): boolean {
        // Is in ChatRoom & cannot leave
        if (ChatRoomData) {
            return !ChatRoomCanLeave();
        }
        return false;
    }

    // Nothing todo
    protected handlePeriodicEvent() {}
    protected handleTaskFinishing() {}

    protected handleEditTask(newTaskData: TaskData): boolean {
        // TODO: data validation ?
        if (newTaskData.roomNameReq !== undefined && this.data.roomNameReq != newTaskData.roomNameReq) {
            this.data.roomNameReq = newTaskData.roomNameReq;
        }
        if (newTaskData.roomTypeReq !== undefined && this.data.roomTypeReq != newTaskData.roomTypeReq) {
            this.data.roomTypeReq = newTaskData.roomTypeReq;
        }

        if (newTaskData.roomNameReqSearchDesc !== undefined) {
            this.data.roomNameReqSearchDesc = newTaskData.roomNameReqSearchDesc;
        }
        if (newTaskData.roomUseMaxMinutesReq !== undefined) {
            this.data.roomUseMaxMinutesReq = newTaskData.roomUseMaxMinutesReq;
        }
        if (newTaskData.roomMaxMinutesReq !== undefined) {
            this.data.roomMaxMinutesReq = newTaskData.roomMaxMinutesReq;
        }

        // Reset Timer & GracePeriod
        this.resetMaxTimeReqTimer(true);

        return true;
    }


/**
 * Core Task Functions
 */

    private resetMaxTimeReqTimer(resetGracePeriod: boolean) {
        this.inSameRoomSince = Date.now();
        if (resetGracePeriod) {
            this.resetGracePeriod();
        }
    }

    public override onPlayerEnterRoom() {
        // Reset in same room Timer for Room Max Time Req
        // Also Reset Grace period (avoid transgression getting fired directly after joining a room)
        this.resetMaxTimeReqTimer(true);
    }

    protected checkTaskIsRespected(): boolean {
        // Is in ChatRoom
        if (ChatRoomData) {
            // Since checkTaskIsRespected() is called often, it's convenient to update this here
            this.lastRoomNameUsed = ChatRoomData.Name;

            // Check Room Name Req
            const roomNameReq = this.getRoomNameReq();
            if (roomNameReq && roomNameReq.length > 0) {
                let nameReqValid = ChatRoomData.Name.toUpperCase().includes(roomNameReq.toUpperCase().trim());
                if (!nameReqValid && this.data.roomNameReqSearchDesc) {
                    // Check if roomNameReq included in description (if option roomNameReqSearchDesc enabled)
                    nameReqValid = ChatRoomData.Description.toUpperCase().includes(roomNameReq.toUpperCase().trim());
                }

                if (!nameReqValid) {
                    // Have room name Requirement & Room name/desc don't include the Req word
                    let nameOrDesc = "Name";
                    if (this.data.roomNameReqSearchDesc) {
                        nameOrDesc = "Name/Description";
                    }
                    this.lastTransgressionStr = `Room ${nameOrDesc} does not contain the word "${roomNameReq}"`;
                    this.isMaxTimeOnlyTransgressionOccuring = false;
                    return false;
                }
            }

            // Check Room Type Req
            const roomTypeReq = this.getRoomTypeReq();
            if (roomTypeReq && roomTypeReq != "free") {
                // ChatRoomIsPrivate() check for room.Visibility
                // ChatRoomIsLocked() check for room.Access
                const roomIsPrivate = (ChatRoomIsPrivate() || ChatRoomIsLocked());

                if (roomTypeReq == "private_only" && !roomIsPrivate) {
                    this.lastTransgressionStr = `Room is not private`;
                    this.isMaxTimeOnlyTransgressionOccuring = false;
                    return false;
                }
                else if (roomTypeReq == "public_only" && roomIsPrivate) {
                    this.lastTransgressionStr = `Room is not public`;
                    this.isMaxTimeOnlyTransgressionOccuring = false;
                    return false;
                }
            }

            // Check Max Time Exceed / should change room
            if (this.data.roomUseMaxMinutesReq && this.data.roomMaxMinutesReq) {
                if ((Date.now() - this.inSameRoomSince) >= (this.data.roomMaxMinutesReq * 60 * 1000)) {
                    this.lastTransgressionStr = `Maximum Time Allowed (${this.data.roomMaxMinutesReq} minutes) in the same Room Exceeded`;
                    this.isMaxTimeOnlyTransgressionOccuring = true;
                    return false;
                }
            }
        } else {
            // Player not in a ChatRoom: Reset inSameRoomSince & Grace Period
            this.resetMaxTimeReqTimer(true);
        }

        this.isMaxTimeOnlyTransgressionOccuring = false;
        return true;
    }

    protected enforceTask(): boolean {
        // Check Player is in ChatRoom
        if (ChatRoomData) {
            const roomNameInclude = this.getRoomNameReq() ?? "";
            const roomType = this.getRoomTypeReq();
            this.findRandAllowedChatRoom(roomNameInclude, roomType).then((selectedRoomName) => {
                if (selectedRoomName && selectedRoomName.length > 0) {
                    console.log("ATB: enforceTask: Will join room: ", selectedRoomName);
                    // Delay a bit to let the player get the message from handleTransgression()
                    setTimeout(() => {
                        this.joinChatRoom(selectedRoomName);
                    }, 2000);
                    return;
                } else {                    
                    // No room allowed/found
                    // => Create and join new room that satisfy Req
                    let roomName = getNameOrNickname(Player) + " " + roomNameInclude + " room";

                    // TODO: Maybe need to handle that better...
                    if (roomName == this.lastRoomNameUsed) {
                        roomName += " 2";
                    }

                    console.log("ATB: enforceTask: No room found! Will create room: ", roomName);
                    setTimeout(() => {
                        this.createChatRoom(roomName, roomType);
                    }, 2000);

                    return;
                }
            }).catch((err) => {
                console.error("ATB: Error during findRandAllowedChatRoom: ", err);
            });
        }
        return true;
    }

    private findRandAllowedChatRoom(roomNameInclude: string, roomType: RoomControlType | undefined): Promise<string | undefined> {
        // search room
        // Based on user room search setting, so can yield no result
        // ChatSearchQuery()
        // Then Response should be in ChatSearchResult
        // ChatSearchResult

        /*
        interface ServerChatRoomSearchRequest {
            Query: string;
            Space?: ServerChatRoomSpace[] | ServerChatRoomSpace;
            Game?: ServerChatRoomGame;
            FullRooms?: boolean;
            Ignore?: string[];
            Language: "" | ServerChatRoomLanguage | ServerChatRoomLanguage[];
            SearchDescs?: boolean;
            ShowLocked?: boolean;
            MapTypes?: ChatRoomMapType[];
        }
        */

        //console.log("ATB: findRandAllowedChatRoom: searching with roomNameInclude: ", roomNameInclude, " roomType: ", roomType);

        const SearchData: ServerChatRoomSearchRequest = {
            Query: roomNameInclude.toUpperCase().trim(),
            Language: "",
            Space: ChatSearchGetSpace() ?? ChatRoomSpaceType.MIXED,
            ShowLocked: true,
            MapTypes: ["Hybrid", "Never"],
            SearchDescs: this.data.roomNameReqSearchDesc ? true : false,
        };
        // Async
        return ServerRoomSearch(roomNameInclude.toUpperCase().trim(), SearchData).then((result) => {
            if (result.err) {
                return Promise.reject(result.err);
            } else {
                let resultRoomList: ServerChatRoomSearchResultResponse = result.value;

                //console.log("ATB: findRandAllowedChatRoom: search result RoomList: ", resultRoomList);

                const preferedRoomList: ServerChatRoomSearchData[] = [];
                const allowedRoomList: ServerChatRoomSearchData[] = [];
                for (const room of resultRoomList) {
                    // Basic check
                    if (!room.CanJoin) {
                        continue;
                    }
                    const roomIsPublic = (!ChatRoomDataIsPrivate(room) && !ChatRoomDataIsLocked(room));

                    // Avoid room if not many space left  4 space left for public or 2 for private)
                    const spaceLeftMini = roomIsPublic ? 4 : 2;
                    if (room.MemberCount > (room.MemberLimit - spaceLeftMini)) {
                        continue;
                    }

                    // Exclude public room if req private_only
                    if (roomType && roomType == "private_only" && roomIsPublic) {
                        continue;
                    }
                    // Exclude private room if req public_only
                    else if (roomType && roomType == "public_only" && !roomIsPublic) {
                        continue;
                    }

                    // Exclude the last/current room
                    if (room.Name == this.lastRoomNameUsed) {
                        continue;
                    }

                    // Room is allowed based on req
                    allowedRoomList.push(room);

                    // Additional check to see if room is prefered over allowedRoomList
                    // - Have a friend in the room
                    // - Room have more than 2 people
                    if (room.MemberCount > 2 || room.Friends.length > 0) {
                        preferedRoomList.push(room);
                    }
                }

                //console.log("ATB: findRandAllowedChatRoom: allowedRoomList: ", allowedRoomList);
                //console.log("ATB: findRandAllowedChatRoom: preferedRoomList: ", preferedRoomList);

                // Select room randomly
                let randRoomList: ServerChatRoomSearchData[] = [];
                if (preferedRoomList.length > 0) {
                    randRoomList = CloneAndRandomizeList(preferedRoomList);
                } else if (allowedRoomList.length > 0) {
                    randRoomList = CloneAndRandomizeList(allowedRoomList);
                }

                let selectedRoomName: string | undefined = undefined;
                if (randRoomList.length > 0) {
                    selectedRoomName = randRoomList[0].Name;
                }

                return selectedRoomName;
            }
        });
    }

    private joinChatRoom(roomName: string) {
        sendLocalMessage(`(Enforce Room Control) Will auto-join room "${roomName}" in a few seconds...`, ChatColor.Orange);
        // Message & Delay just to avoid it being too sudden for the player
        setTimeout(() => {
            // Leave the room if needed
            if (ChatRoomData) {
                ChatRoomLeave();
                CommonSetScreen("Online", "ChatSearch");
            }
            // Join the selected room (delay a little bit after leaving to not upset the game too much)
            setTimeout(() => {
                ChatSearchJoin(roomName);
            }, 1500);
        }, 4000);
    }

    private createChatRoom(roomName: string, roomTypeReq: RoomControlType | undefined) {
        sendLocalMessage(`(Enforce Room Control) No room found match Room Control requirements, Will auto-create room "${roomName}" in a few seconds...`, ChatColor.Orange);

        // Message & Delay just to avoid it being too sudden for the player
        setTimeout(() => {
            // Leave the room if needed
            if (ChatRoomData) {
                ChatRoomLeave();
                CommonSetScreen("Online", "ChatSearch");
            }

            setTimeout(() => {
                // Copied from ChatSearchAutoJoinRoom()
                const NewRoom: ServerChatRoomCreateRequest = {
                    Name: roomName,
                    Description: "",
                    Admin: [Player.MemberNumber],
                    Whitelist: Player.FriendList,
                    Ban: Player.BlackList,
                    Background: Player.OnlineSettings.DefaultChatRoomBackground,
                    Limit: 10,
                    Game: "",
                    Visibility: (roomTypeReq == "private_only") ? ["Whitelist"] : ["All"],
                    Access: (roomTypeReq == "private_only") ? ChatRoomAccessMode.ADMIN_WHITELIST : ChatRoomAccessMode.PUBLIC,
                    BlockCategory: [],
                    Language: "EN",
                    Space: ChatRoomSpaceType.MIXED
                    //Custom: Player.LastChatRoom.Custom,
                    //MapData: Player.LastChatRoom.MapData,
                };
                console.log("ATB: createChatRoom: Will request for create room request: ", NewRoom);
                ServerSend("ChatRoomCreate", NewRoom);
                ChatAdminMessage = "CreatingRoom";

                // Server Response will be in ChatAdminMessage (short string)
            }, 1500);
        }, 4000);
    }


/**
 * External static Functions
 */

    // return null if valid, return String with reason if not valid
    public static dataValidation(roomName: string | undefined, roomType: RoomControlType | undefined,
            roomUseMaxMinutesReq: boolean, roomMaxMinutesReq: number, gracePeriodMs: number): string | null
    {
        let haveAtLeastOneReq: boolean = false;
        if (roomName && roomName.length > 0) {
            haveAtLeastOneReq = true;
        }
        else if (roomType && roomType != "free") {
            haveAtLeastOneReq = true;
        }
        else if (roomUseMaxMinutesReq) {
            haveAtLeastOneReq = true;

            if (roomMaxMinutesReq < 10 || roomMaxMinutesReq > 120) {
                return "Max Minutes should be between 10 and 120";
            }
        }
        if (!haveAtLeastOneReq) {
            return "Room Control Task should have at least one requirement";
        }

        // Check gracePeriodMs is at least 120 seconds
        if (gracePeriodMs < (120 * 1000)) {
            return "Grace Period should not be below 30 seconds for Room Control";
        }

        return null;
    }
}