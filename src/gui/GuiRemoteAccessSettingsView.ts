import { GuiHelper, GuiFormField } from "./GuiHelper";
import GuiViewBase from "./GuiViewBase";
import { getCharacterRemoteAccessSettings, saveSettings } from "@/utility/CharacterWrapper";
import { isPlayerHaveRemoteAccess, RemoteAccessSettings } from "@/models/RemoteAccessSettings";
import { getNameOrNickname } from "@/utility/utility";

export class GuiRemoteAccessSettingsView extends GuiViewBase {
    private shouldSaveSetting: boolean = false;
    private settings!: RemoteAccessSettings;


    private HELP_BASE_REMOTE_TEXT = `
        Control how much other people can do using Remote Access.<br>
        <br>
        Higher Roles also have Access to lower roles access.<br>
        Role priority: Public < Friends < Whitelist < Lovers < Mistress < Owner < Player<br>
        <br>
        Note: The BC Owner of the Player is always included in the role Owner.<br>
    `;

    private INFO_DANGEROUS_TEXT = `
        <strong>ALL PERMISSIONS HERE ARE DANGEROUS, Please think carefully before changing them!</strong><br>
        <br>
        - <strong>Remote Access Settings:</strong> Allow Other to FULLY change Remote Access Settings, including adding Owner.<br>
        <br>
        - <strong>Use Harsh Values:</strong> Some Settings values considered too harsh are normally restricted to a maximum. This Permission allow to use unsafe values. For Example, one could set 100% Chance of Random Events or Devious Shocks on Leaving a room, leaving the Player unable to exist a room.<br>
        <br>
        - <strong>Lock Settings:</strong> Allow Other to lock the settings for the Player (Note: that this one exclude Remote Access Settings, for the Player Safety).<br>
        <br>
        - <strong>Full Lock Settings:</strong> Allow Other to FULLY LOCK ALL SETTIINGS for the Player INCLUDING Remote Access Settings. BE WARNED that the Player CAN BE FULLY STUCK and only Peoples with that Role can unlock it.<br>
        <br>
    `;

    private STRINGS = {
        PAGE_TITLE: "Remote Access Settings",

        HELP_BASE_REMOTE_TITLE: "Remote Access Overview/Information",
        INFO_DANGEROUS_TITLE: "Dangerous Permissions Information - PLEASE READ WARNING",

        TITLE_SECTION_OWNER_LIST: "Owner/Mistress list",
        TITLE_SECTION_FEATURE: "Feature Usage Permission",
        TITLE_SECTION_SETTINGS: "Settings Access Permission",
        TITLE_SECTION_DANGEROUS: "Dangerous Permission",

        BTN_ADD_MISTRESS: "Add Mistress",
        BTN_ADD_OWNER: "Add Owner",
        BTN_REMOVE: "Remove",

        ERROR_ADD_ROLE_TITLE: "Cannot Add Role",
        ERROR_ADD_ROLE_ALREADY_EXIST: "MemberNumber Is already in Mistress or Owner List",
        ERROR_ADD_ROLE_CANNOT_FIND_CHAR: "Cannot find Character (can happen if Character left the room)",
    };


    constructor(parent: HTMLDivElement, C: OtherCharacter | PlayerCharacter) {
        super(parent, C);

        const settings = getCharacterRemoteAccessSettings(this.character)
        if (!settings) {
            // Build error page
            GuiHelper.buildErrorPage(parent);
            return;
        }
        this.settings = settings;

        this.buildRemoteAccessSettingsPage();
    }

    public update() {}

    public unload() {
        if (this.shouldSaveSetting) {
            saveSettings(this.character);
        }
    }

    // Helper
    getRemoteAccessRoleSelectOption(): {value: string, label: string}[] {
        // value should always be same as Enum RemoteAccessRole
        return [
            {value: "0", label: "Public (Everyone except blacklist)"},
            {value: "1", label: "Friends (and above)"},
            {value: "2", label: "WhiteList (and above)"},
            {value: "3", label: "Lovers (and above)"},
            {value: "4", label: "Mistress (and above)"},
            {value: "5", label: "Owner (and above)"},
            {value: "6", label: "Player Only"},
        ];
    }

    showErrorDialog(title: string, description: string) {
        GuiHelper.showDialog(
            title,
            description,
            [
                {
                    label: "OK",
                    onClick: () => {},
                    isPrimary: true,
                }
            ]
        );
    }

    // Add Char to Mistress/Owner list
    addCharToRoleList(memberNumberStr: string, role: "mistress" | "owner") {
        // Get Character info
        const memberNumber = parseInt(memberNumberStr);
        const C = ChatRoomGetCharacter(memberNumber) as OtherCharacter;
        if (!C) {
            this.showErrorDialog(this.STRINGS.ERROR_ADD_ROLE_TITLE, this.STRINGS.ERROR_ADD_ROLE_CANNOT_FIND_CHAR);
            return;
        }
        const memberName = getNameOrNickname(C);

        // Check if already in either list
        for (const member of this.settings.mistressList) {
            if (memberNumber == member.memberNumber) {
                this.showErrorDialog(this.STRINGS.ERROR_ADD_ROLE_TITLE, this.STRINGS.ERROR_ADD_ROLE_ALREADY_EXIST);
                return;
            }
        }
        for (const member of this.settings.ownerList) {
            if (memberNumber == member.memberNumber) {
                this.showErrorDialog(this.STRINGS.ERROR_ADD_ROLE_TITLE, this.STRINGS.ERROR_ADD_ROLE_ALREADY_EXIST);
                return;
            }
        }

        if (role == "mistress") {
            this.settings.mistressList.push({memberNumber: memberNumber, memberName: memberName});
        } else if (role == "owner") {
            this.settings.ownerList.push({memberNumber: memberNumber, memberName: memberName});
        }
        this.shouldSaveSetting = true;
    }

    // Remove Char to Mistress/Owner list
    removeCharFromRoleList(memberNumber: number) {
        // Check if already in either list
        for (let i=0 ; i < this.settings.mistressList.length ; i++) {
            const member = this.settings.mistressList[i];
            if (memberNumber == member.memberNumber) {
                this.settings.mistressList.splice(i, 1);
                this.shouldSaveSetting = true;
                return;
            }
        }
        for (let i=0 ; i < this.settings.ownerList.length ; i++) {
            const member = this.settings.ownerList[i];
            if (memberNumber == member.memberNumber) {
                this.settings.ownerList.splice(i, 1);
                this.shouldSaveSetting = true;
                return;
            }
        }
    }

    // Core Funtions
    public buildRemoteAccessSettingsPage() {
        GuiHelper.createContentTitle(this.parent, this.STRINGS.PAGE_TITLE, true);

        const form = document.createElement("div");
        form.style.display = "flex";
        form.style.flexDirection = "column";
        form.style.gap = "0.9em";

        const helpSection = GuiHelper.createInfoSection("info", this.STRINGS.HELP_BASE_REMOTE_TITLE, this.HELP_BASE_REMOTE_TEXT);
        form.appendChild(helpSection);

        // Final Assembly
        GuiHelper.createContentTitle(form, this.STRINGS.TITLE_SECTION_OWNER_LIST);
        this.appendManageOwnerList(form);
        GuiHelper.createContentTitle(form, this.STRINGS.TITLE_SECTION_FEATURE);
        this.appendFeaturePerm(form);
        GuiHelper.createContentTitle(form, this.STRINGS.TITLE_SECTION_SETTINGS);
        this.appendSettingsPerm(form);
        GuiHelper.createContentTitle(form, this.STRINGS.INFO_DANGEROUS_TITLE);
        this.appendDangerousPerm(form);
        this.parent.appendChild(form);
    }

    private updateRoleList(roleList: HTMLElement) {
        roleList.innerHTML = "";

        for (const memberInfo of this.settings.ownerList) {
            const elemText = `Owner: ${memberInfo.memberName} (${memberInfo.memberNumber})`;
            const elem = this.buildSingleRoleListElem(roleList, elemText, memberInfo.memberNumber);
            roleList.appendChild(elem);
        }
        for (const memberInfo of this.settings.mistressList) {
            const elemText = `Mistress: ${memberInfo.memberName} (${memberInfo.memberNumber})`;
            const elem = this.buildSingleRoleListElem(roleList, elemText, memberInfo.memberNumber);
            roleList.appendChild(elem);
        }
    }

    private buildSingleRoleListElem(roleList: HTMLElement, text: string, memberNumber: number) {
        const textElem = document.createElement("div")
        textElem.innerText = text;
        textElem.style.alignContent = "center";

        const removeBtn = document.createElement("button");
        removeBtn.className = "atb-action-btn";
        removeBtn.innerText = this.STRINGS.BTN_REMOVE;
        removeBtn.style.marginTop = "0.3em";
        removeBtn.style.marginBottom = "0.3em";
        removeBtn.onclick = () => {
            this.removeCharFromRoleList(memberNumber);
            this.updateRoleList(roleList);
        };

        const row = GuiHelper.createTwoElemRow(textElem, removeBtn);
        removeBtn.style.flex = "none"; // Prevent removeBtn being bigger then it need
        row.style.borderBottom = "1px solid var(--atb-border)"

        return row;
    }

    private appendManageOwnerList(container: HTMLElement): void {
        let prefixId = "atb-remote-access";
        // Fields
        const FIELD_CHAR_SELECT: GuiFormField = {
            html_id: prefixId + "-char-select",
            label: "Select Character in the Room to Add",
            description: "Select Character to Add in Mistress/Owner List (List made from the character in the room)",
            type: "select",
            options: [],
        };

        // Mistress / Owner List
        const roleList = document.createElement("div");
        this.updateRoleList(roleList);

        // Fill FIELD_CHAR_SELECT
        for (const C of ChatRoomCharacter) {
            // Exclude TargetPlayer
            if (C.MemberNumber && C.MemberNumber != this.character.MemberNumber) {
                FIELD_CHAR_SELECT.options?.push({value: C.MemberNumber.toString(), label: C.Name});
            }
        }
        const charSelect = GuiHelper.createFormField(FIELD_CHAR_SELECT);

        // Add Mistress Button
        const addMistressBtn = document.createElement("button");
        addMistressBtn.className = "atb-main-btn";
        addMistressBtn.innerText = this.STRINGS.BTN_ADD_MISTRESS;
        addMistressBtn.onclick = () => {
            const memberNumStr = GuiHelper.getFormFieldValue(container, FIELD_CHAR_SELECT) as string;
            this.addCharToRoleList(memberNumStr, "mistress");
            this.updateRoleList(roleList);
        };

        // Add Owner Button
        const addOwnerBtn = document.createElement("button");
        addOwnerBtn.className = "atb-main-btn";
        addOwnerBtn.innerText = this.STRINGS.BTN_ADD_OWNER;
        addOwnerBtn.onclick = () => {
            const memberNumStr = GuiHelper.getFormFieldValue(container, FIELD_CHAR_SELECT) as string;
            this.addCharToRoleList(memberNumStr, "owner");
            this.updateRoleList(roleList);
        };

        const addRoleBtnRow = GuiHelper.createTwoElemRow(addMistressBtn, addOwnerBtn);
        addMistressBtn.style.flex = "none";
        addOwnerBtn.style.flex = "none";


        // Final assembly
        container.append(roleList);
        container.append(charSelect);
        container.append(addRoleBtnRow);
    }

    private appendFeaturePerm(container: HTMLElement): void {
        let prefixId = "atb-remote-access";
        // Fields
        const FIELD_CREATE_TASK: GuiFormField = {
            html_id: prefixId + "-create-task",
            label: "Create Task Permission",
            description: "Who can create a new task.",
            type: "select",
            disable: !isPlayerHaveRemoteAccess(this.character, this.character.ATB.RemoteAccessSettings?.createTaskPermission),
            default_value: this.settings.createTaskPermission.toString(),
            options: this.getRemoteAccessRoleSelectOption(),
            onChange: (value: string) => {
                this.settings.createTaskPermission = parseInt(value);
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_EDIT_TASK: GuiFormField = {
            html_id: prefixId + "-edit-task",
            label: "Edit/Skip Task Permission",
            description: "Who can edit, overwrite and skip an active task.",
            type: "select",
            disable: !isPlayerHaveRemoteAccess(this.character, this.character.ATB.RemoteAccessSettings?.editTaskPermission),
            default_value: this.settings.editTaskPermission.toString(),
            options: this.getRemoteAccessRoleSelectOption(),
            onChange: (value: string) => {
                this.settings.editTaskPermission = parseInt(value);
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_ENFORCE_TASK: GuiFormField = {
            html_id: prefixId + "-use-enforce",
            label: "Use Enforced Task / Punishement Permission",
            description: "Who can start Enforced Task and Punishement.",
            type: "select",
            disable: !isPlayerHaveRemoteAccess(this.character, this.character.ATB.RemoteAccessSettings?.useEnforcedPermission),
            default_value: this.settings.useEnforcedPermission.toString(),
            options: this.getRemoteAccessRoleSelectOption(),
            onChange: (value: string) => {
                this.settings.useEnforcedPermission = parseInt(value);
                this.shouldSaveSetting = true;
            }
        };

        // Create Fields
        const createTask = GuiHelper.createFormField(FIELD_CREATE_TASK);
        const editTask = GuiHelper.createFormField(FIELD_EDIT_TASK);
        const useEnforced = GuiHelper.createFormField(FIELD_ENFORCE_TASK);
        const taskRow = GuiHelper.createTwoElemRow(createTask, editTask);
        const enforceRow = GuiHelper.createTwoElemRow(useEnforced, undefined);

        // Append to container
        container.appendChild(taskRow);
        container.appendChild(enforceRow);
    }

    private appendSettingsPerm(container: HTMLElement): void {
        let prefixId = "atb-remote-access-settings";
        // Fields
        const FIELD_TASK: GuiFormField = {
            html_id: prefixId + "-task",
            label: "Access/Edit Task Settings",
            description: "Who can edit Task Settings.",
            type: "select",
            disable: !isPlayerHaveRemoteAccess(this.character, this.character.ATB.RemoteAccessSettings?.taskSettingsPermission),
            default_value: this.settings.taskSettingsPermission.toString(),
            options: this.getRemoteAccessRoleSelectOption(),
            onChange: (value: string) => {
                this.settings.taskSettingsPermission = parseInt(value);
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_PUNISH: GuiFormField = {
            html_id: prefixId + "-punish",
            label: "Access/Edit Punishement Settings",
            description: "Who can edit Punishement Settings.",
            type: "select",
            disable: !isPlayerHaveRemoteAccess(this.character, this.character.ATB.RemoteAccessSettings?.punishementSettingsPermission),
            default_value: this.settings.punishementSettingsPermission.toString(),
            options: this.getRemoteAccessRoleSelectOption(),
            onChange: (value: string) => {
                this.settings.punishementSettingsPermission = parseInt(value);
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_PENALTY: GuiFormField = {
            html_id: prefixId + "-penalty",
            label: "Access/Edit Penalty Settings",
            description: "Who can edit Penalty Settings.",
            type: "select",
            disable: !isPlayerHaveRemoteAccess(this.character, this.character.ATB.RemoteAccessSettings?.PenaltySettingsPermission),
            default_value: this.settings.PenaltySettingsPermission.toString(),
            options: this.getRemoteAccessRoleSelectOption(),
            onChange: (value: string) => {
                this.settings.PenaltySettingsPermission = parseInt(value);
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_RAND_TASK: GuiFormField = {
            html_id: prefixId + "-penalty",
            label: "Access/Edit Random Task Settings",
            description: "Who can edit Random Task Settings.",
            type: "select",
            disable: !isPlayerHaveRemoteAccess(this.character, this.character.ATB.RemoteAccessSettings?.RandomTaskSettingsPermission),
            default_value: this.settings.RandomTaskSettingsPermission.toString(),
            options: this.getRemoteAccessRoleSelectOption(),
            onChange: (value: string) => {
                this.settings.RandomTaskSettingsPermission = parseInt(value);
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_RAND_EVENT: GuiFormField = {
            html_id: prefixId + "-rand-event",
            label: "Access/Edit Random Events Settings",
            description: "Who can edit Random Events Settings.",
            type: "select",
            disable: !isPlayerHaveRemoteAccess(this.character, this.character.ATB.RemoteAccessSettings?.randomEventSettingsPermission),
            default_value: this.settings.randomEventSettingsPermission.toString(),
            options: this.getRemoteAccessRoleSelectOption(),
            onChange: (value: string) => {
                this.settings.randomEventSettingsPermission = parseInt(value);
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_OUTFIT: GuiFormField = {
            html_id: prefixId + "-outfit",
            label: "Access/Edit Outfits Settings",
            description: "Who can edit Outfits Settings.",
            type: "select",
            disable: !isPlayerHaveRemoteAccess(this.character, this.character.ATB.RemoteAccessSettings?.outfitSettingsPermission),
            default_value: this.settings.outfitSettingsPermission.toString(),
            options: this.getRemoteAccessRoleSelectOption(),
            onChange: (value: string) => {
                this.settings.outfitSettingsPermission = parseInt(value);
                this.shouldSaveSetting = true;
            }
        };

        // Create Fields
        const task = GuiHelper.createFormField(FIELD_TASK);
        const punish = GuiHelper.createFormField(FIELD_PUNISH);
        const penalty = GuiHelper.createFormField(FIELD_PENALTY);
        const randTask = GuiHelper.createFormField(FIELD_RAND_TASK);
        const event = GuiHelper.createFormField(FIELD_RAND_EVENT);
        const outfit = GuiHelper.createFormField(FIELD_OUTFIT);
        // Rows
        const row1 = GuiHelper.createTwoElemRow(task, punish);
        const row2 = GuiHelper.createTwoElemRow(penalty, randTask);
        const row3 = GuiHelper.createTwoElemRow(event, outfit);

        // Append to container
        container.appendChild(row1);
        container.appendChild(row2);
        container.appendChild(row3);
    }

    private appendDangerousPerm(container: HTMLElement): void {
        let prefixId = "atb-remote-access";
        // Fields
        const FIELD_REMOTE: GuiFormField = {
            html_id: prefixId + "-remote-settings",
            label: "Access/Edit Remote Access Settings",
            description: "Who can edit Remote Access Settings.",
            type: "select",
            disable: !isPlayerHaveRemoteAccess(this.character, this.character.ATB.RemoteAccessSettings?.remoteAccessSettingsPermission),
            default_value: this.settings.remoteAccessSettingsPermission.toString(),
            options: this.getRemoteAccessRoleSelectOption(),
            onChange: (value: string) => {
                this.settings.remoteAccessSettingsPermission = parseInt(value);
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_HARSH: GuiFormField = {
            html_id: prefixId + "-use-harsh",
            label: "Use Harsh settings/value (NOT IMPLEMENTED)",
            description: "Who can use harsh value for some settings. (Without this permission some high value considered too harsh can be restricted)",
            type: "select",
            disable: !isPlayerHaveRemoteAccess(this.character, this.character.ATB.RemoteAccessSettings?.harshSettingsPermission),
            default_value: this.settings.harshSettingsPermission.toString(),
            options: this.getRemoteAccessRoleSelectOption(),
            onChange: (value: string) => {
                this.settings.harshSettingsPermission = parseInt(value);
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_LOCK: GuiFormField = {
            html_id: prefixId + "-lock-setting",
            label: "Lock Settings for Player (NOT IMPLEMENTED)",
            description: "Who can Lock the settings for the Player. Lock all settings excluding Remote Access Settings",
            type: "select",
            disable: !isPlayerHaveRemoteAccess(this.character, this.character.ATB.RemoteAccessSettings?.lockSettingsPermission),
            default_value: this.settings.lockSettingsPermission.toString(),
            options: this.getRemoteAccessRoleSelectOption(),
            onChange: (value: string) => {
                this.settings.lockSettingsPermission = parseInt(value);
                this.shouldSaveSetting = true;
            }
        };
        const FIELD_FULL_LOCK: GuiFormField = {
            html_id: prefixId + "-full-lock-settings",
            label: "Full Lock Settings for Player (WARNING) (NOT IMPLEMENTED)",
            description: "Permission to Lock all settings INCLUDING Remote Access Settings. Be warned that only people with that Role can unlock a Full Lock and YOU CAN BE STUCK.",
            type: "select",
            disable: !isPlayerHaveRemoteAccess(this.character, this.character.ATB.RemoteAccessSettings?.fullLockSettingsPermission),
            default_value: this.settings.fullLockSettingsPermission.toString(),
            options: this.getRemoteAccessRoleSelectOption(),
            onChange: (value: string) => {
                this.settings.fullLockSettingsPermission = parseInt(value);
                this.shouldSaveSetting = true;
            }
        };

        // Create Fields
        const remote = GuiHelper.createFormField(FIELD_REMOTE);
        const harsh = GuiHelper.createFormField(FIELD_HARSH);
        const lock = GuiHelper.createFormField(FIELD_LOCK);
        const fullLock = GuiHelper.createFormField(FIELD_FULL_LOCK);
        const row1 = GuiHelper.createTwoElemRow(remote, harsh);
        const row2 = GuiHelper.createTwoElemRow(lock, fullLock);

        // Append to container
        const infoSection = GuiHelper.createInfoSection("warning", this.STRINGS.INFO_DANGEROUS_TITLE, this.INFO_DANGEROUS_TEXT);
        container.appendChild(infoSection);

        container.appendChild(row1);
        container.appendChild(row2);
    }
}