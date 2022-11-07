import {Member} from '../../entities';

export interface IMessageService {
    sendCheckInRequestToChannel(): Promise<void>;

    sendAlertRequestToChannel(): Promise<void>;

    sendCheckInRequestToMember(member: Member): Promise<void>;

    sendAlertRequestToMember(member: Member): Promise<void>;

    sendCheckInReminderToMember(member: Member): Promise<void>;

    sendMemberAtRiskNotification(member: Member): Promise<void>;

    sendMemberAtRiskNotificationForAlert(member: Member): Promise<void>;

    sendNotificationOfMembersWithLateCheckIn(members: Member[]): Promise<void>;
}
