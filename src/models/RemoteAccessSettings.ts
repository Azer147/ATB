

export enum RemoteAccessRole {
    BlackList = -1,
    Public = 0,
    Friends = 1,
    WhiteList = 2,
    Lovers = 3,
    Mistress = 4,
    Owner = 5,
    Player = 6,
}

export interface RemoteAccessSettings {
    enable: boolean;

    mistressList: {memberNumber: number, memberName: string}[]; // List MemberNumber with Role of Mistress added manually
    ownerList:  {memberNumber: number, memberName: string}[]; // List MemberNumber with Role of Owner added manually

    // Standard Feature Access Permissions
    createTaskPermission: RemoteAccessRole;
    editTaskPermission: RemoteAccessRole; // edit/skip task permission
    useEnforcedPermission: RemoteAccessRole; // Start Enforced task (needed to start punishement)

    // Settings Access Permissions
    taskSettingsPermission: RemoteAccessRole;
    punishementSettingsPermission: RemoteAccessRole;
    chaoticMistressSettingsPermission: RemoteAccessRole;
    randomEventSettingsPermission: RemoteAccessRole;
    outfitSettingsPermission: RemoteAccessRole;

    // Dangerous Permissions
    remoteAccessSettingsPermission: RemoteAccessRole;
    // Some Settings value will be restricted by harshSettingsPermission (for example high chance value for DeviousShock/RandomEvent)
    harshSettingsPermission: RemoteAccessRole;
    // lock settings for target (excluding remote access)
    lockSettingsPermission: RemoteAccessRole;
    // Lock ALL settings for target (including remote access)
    fullLockSettingsPermission: RemoteAccessRole;
}

export const DefaultRemoteAccessSettings: RemoteAccessSettings = {
    enable: true,

    mistressList: [],
    ownerList: [],

    createTaskPermission: RemoteAccessRole.Owner,
    editTaskPermission: RemoteAccessRole.Owner,
    useEnforcedPermission: RemoteAccessRole.Owner,

    taskSettingsPermission: RemoteAccessRole.Owner,
    punishementSettingsPermission: RemoteAccessRole.Owner,
    chaoticMistressSettingsPermission: RemoteAccessRole.Owner,
    randomEventSettingsPermission: RemoteAccessRole.Owner,
    outfitSettingsPermission: RemoteAccessRole.Owner,

    remoteAccessSettingsPermission: RemoteAccessRole.Player,
    harshSettingsPermission: RemoteAccessRole.Player,
    lockSettingsPermission: RemoteAccessRole.Player,
    fullLockSettingsPermission: RemoteAccessRole.Player,
}

/**
 * Helper Function
 */

export function getATBAccessRoleOnTargetChar(senderMemberNumber: number, targetChar: OtherCharacter | PlayerCharacter): RemoteAccessRole {
    if (targetChar.IsPlayer()) return RemoteAccessRole.Player;

    if (targetChar.BlackList.includes(senderMemberNumber)) {
        return RemoteAccessRole.BlackList;
    }

    if (targetChar.IsOwnedByMemberNumber(senderMemberNumber)) {
        return RemoteAccessRole.Owner;
    }
    let haveOwnerRole = targetChar.ATB?.RemoteAccessSettings?.ownerList?.some((value) => { return (value.memberNumber == senderMemberNumber) });
    if (haveOwnerRole) return RemoteAccessRole.Owner;

    let haveMistressRole = targetChar.ATB?.RemoteAccessSettings?.mistressList?.some((value) => { return (value.memberNumber == senderMemberNumber) });
    if (haveMistressRole) return RemoteAccessRole.Mistress;

    if (targetChar.IsLoverOfMemberNumber(senderMemberNumber)) {
        return RemoteAccessRole.Lovers;
    }
    if (targetChar.WhiteList.includes(senderMemberNumber)) {
        return RemoteAccessRole.WhiteList;
    }
    if (targetChar.IsFriend() || (targetChar.MemberNumber && Player.FriendList.includes(targetChar.MemberNumber))) {
        return RemoteAccessRole.Friends;
    }

    // Default
    return RemoteAccessRole.Public;
}

export function isPlayerHaveRemoteAccess(C: OtherCharacter | PlayerCharacter, roleRequired: RemoteAccessRole | undefined): boolean {
    return isCharHaveRemoteAccessOnTarget(Player.MemberNumber, C, roleRequired);
}

export function isCharHaveRemoteAccessOnTarget(senderMemberNumber: number, targetChar: OtherCharacter | PlayerCharacter, roleRequired: RemoteAccessRole | undefined): boolean {
    // Get Player role
    const role = getATBAccessRoleOnTargetChar(senderMemberNumber, targetChar);

    if (role == RemoteAccessRole.BlackList) {
        // Blacklisted don't have any access
        return false;
    }
    else if (role == RemoteAccessRole.Player) {
        // Player have access to everything
        // TODO: return false if locked?
        return true;
    }
    else if (roleRequired == undefined) {
        return false;
    }
    else {
        // All other roles follow the value system
        // Public < Friends < WhiteList < Lovers < Mistress < Owner
        // TODO: return false if locked?
        return (role >= roleRequired);
    }

    return false;
}