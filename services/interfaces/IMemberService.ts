import type {CheckInAttributes, CreatableEntityAttributes, Member} from '../../entities';
import type {IMemberManager} from './IMemberManager';
import type {IMemberProvider} from './IMemberProvider';
import {AlertAttributes} from "../../entities/Alert";

export interface SetIsAttributeParams {
    member: Member;
    attribute: keyof Member;
    value: boolean;
}

export interface CheckInParams {
    member: Member;
    attributes: Omit<CreatableEntityAttributes<CheckInAttributes>, 'memberId'>;
}

export interface AlertParams {
    member: Member;
    attributes: Omit<CreatableEntityAttributes<AlertAttributes>, 'memberId'>
}

export interface IMemberService extends IMemberProvider, IMemberManager {
    checkIn(params: CheckInParams): Promise<Member>;

    repeatCheckIn(member: Member): Promise<Member>;

    setIsAttribute(params: SetIsAttributeParams): Promise<Member>;

    issueCheckInToken(member: Member): Promise<Member>;

    issueAlertToken(member: Member): Promise<Member>;

    syncAllWithSlack(): Promise<void>;

    notifyOfLateCheckIns(): Promise<void>;

    remindMembersOfLateCheckIn(): Promise<void>;

    requestCheckIns(): Promise<void>;

    requestAlert(): Promise<void>;
}
