import {CreatableEntityAttributes, Member, MemberAttributes} from '../entities';
import {MemberCannotRepeatCheckInError} from '../exceptions';
import {isWithinNHours} from '../helpers/client';
import type {Logger} from '@slack/logger';

import type {
    AlertParams,
    CheckInParams,
    ICheckInManager,
    IMemberManager,
    IMemberProvider,
    IMemberService,
    IMessageService,
    ISlackMemberProvider,
    IUniqueStringGenerator,
    SetIsAttributeParams,
} from './interfaces';
import type {MemberIsAtRiskRule, Nullable} from '../types';
import {logger} from '../config';
import {IAlertManager} from "./interfaces/IAlertManager";
import {alertMemberService} from "./index";

export interface MemberServiceParams {
    memberManager: IMemberManager;
    memberProvider: IMemberProvider;
    checkInManager: ICheckInManager;
    alertManager: IAlertManager;
    slackMemberProvider: ISlackMemberProvider;
    uniqueStringGenerator: IUniqueStringGenerator;
    memberIsAtRisk: MemberIsAtRiskRule;
    messageService: IMessageService;
    logger: Nullable<Logger>;
    hoursBeforeReminder: number;
    hoursBeforeNotification: number;
    requestCheckInOrganizationChannel: boolean;
    requestCheckInDirectMessage: boolean;
    requestAlertOrganizationChannel: boolean;
    requestAlertDirectMessage: boolean
}

export class MemberService implements IMemberService {
    private readonly memberManager: IMemberManager;

    private readonly memberProvider: IMemberProvider;

    private readonly checkInManager: ICheckInManager;

    private readonly alertManager: IAlertManager;

    private readonly slackMemberProvider: ISlackMemberProvider;

    private readonly uniqueStringGenerator: IUniqueStringGenerator;

    private readonly memberIsAtRisk: MemberIsAtRiskRule;

    private readonly messageService: IMessageService;

    private readonly logger: Nullable<Logger>;

    private readonly hoursBeforeReminder: number;

    private readonly hoursBeforeNotification: number;

    private readonly requestCheckInOrganizationChannel: boolean;

    private readonly requestCheckInDirectMessage: boolean;

    private readonly requestAlertInOrganizationChannel: boolean;

    private readonly requestAlertDirectMessage: boolean;


    constructor(params: MemberServiceParams) {
        this.memberManager = params.memberManager;
        this.memberProvider = params.memberProvider;
        this.checkInManager = params.checkInManager;
        this.alertManager = params.alertManager;
        this.slackMemberProvider = params.slackMemberProvider;
        this.uniqueStringGenerator = params.uniqueStringGenerator;
        this.memberIsAtRisk = params.memberIsAtRisk;
        this.messageService = params.messageService;
        this.logger = params.logger;
        this.hoursBeforeReminder = params.hoursBeforeReminder;
        this.hoursBeforeNotification = params.hoursBeforeNotification;
        this.requestCheckInOrganizationChannel = params.requestCheckInOrganizationChannel;
        this.requestCheckInDirectMessage = params.requestCheckInDirectMessage;
        this.requestAlertInOrganizationChannel = params.requestAlertOrganizationChannel;
        this.requestAlertDirectMessage = params.requestAlertDirectMessage;
    }

    public getById(id: string): Promise<Member> {
        return this.memberProvider.getById(id);
    }

    public getByEmail(email: string): Promise<Member> {
        return this.memberProvider.getByEmail(email);
    }

    public findBySlackId(slackId: string): Promise<Nullable<Member>> {
        return this.memberProvider.findBySlackId(slackId);
    }

    public findAnyInSystemBySlackId(slackId: string): Promise<Nullable<Member>> {
        return this.memberProvider.findAnyInSystemBySlackId(slackId);
    }

    public getAll(): Promise<Member[]> {
        return this.memberProvider.getAll();
    }

    public getAllCheckInNonNull(): Promise<Member[]> {
        return this.memberProvider.getAllCheckInNonNull();
    }

    public create(attributes: CreatableEntityAttributes<MemberAttributes>): Promise<Member> {
        return this.memberManager.create(attributes);
    }

    public update(member: Member): Promise<Member> {
        return this.memberManager.update(member);
    }

    public delete(member: Member): Promise<void> {
        return this.memberManager.delete(member);
    }

    public async checkIn(params: CheckInParams): Promise<Member> {
        const {member, attributes} = params;

        await this.checkInManager.create({
            ...attributes,
            memberId: member.id,
        });

        member.setCheckInToken(null);

        const updated = await this.memberManager.update(member);

        await this.sendMemberAtRiskNotificationIfNeededCheckIn(updated);

        return updated;
    }

    public async alert(params: AlertParams): Promise<Member> {
        const {member, attributes} = params;

        await this.alertManager.create({
            ...attributes,
            memberId: member.id
        })

        member.setAlertToken(null);

        const updated = await this.memberManager.update(member);

        await this.sendMemberAtRiskNotificationIfNeededForAlert(updated);

        return updated;
    }

    public async repeatCheckIn(member: Member): Promise<Member> {
        if (!member.checkIn) {
            throw new MemberCannotRepeatCheckInError();
        }

        const {checkIn} = member;
        const {createdAt, updatedAt, memberId, ...rest} = checkIn;

        return this.checkIn({
            member,
            attributes: {...rest},
        });
    }

    public async setIsAttribute(params: SetIsAttributeParams): Promise<Member> {
        const {member, attribute, value} = params;
        const isPotentiallyAtRisk = attribute === 'isMobilized';

        switch (attribute) {
            case 'isAdmin':
                member.setIsAdmin(value);
                break;
            case 'isMobilized':
                member.setIsMobilized(value);
                break;
            case 'isExemptFromCheckIn':
                member.setIsExemptFromCheckIn(value);
                break;
            case 'isOptedOutOfMap':
                member.setIsOptedOutOfMap(value);
                break;
        }

        const updated = await this.memberManager.update(member);

        if (isPotentiallyAtRisk) {
            await this.sendMemberAtRiskNotificationIfNeededCheckIn(updated);
        }

        return updated;
    }

    public issueCheckInToken(member: Member): Promise<Member> {
        const token = this.uniqueStringGenerator.generate();

        member.setCheckInToken(token);

        return this.memberManager.update(member);
    }

    public issueAlertToken(member: Member): Promise<Member> {
        const token = this.uniqueStringGenerator.generate();

        member.setAlertToken(token);

        return this.memberManager.update(member);
    }

    public async syncAllWithSlack(): Promise<void> {
        const slackMembers = await this.slackMemberProvider.getAll();

        for (const member of slackMembers) {
            const existing = await this.findAnyInSystemBySlackId(member.id);

            if (existing) {
                existing.setName(member.name);
                existing.setEmail(member.email);
                existing.setIsDeleted(member.isDeleted);
                existing.setIsRestricted(member.isRestricted);
                existing.setIsUltraRestricted(member.isUltraRestricted);
            }

            existing
                ? await this.update(existing)
                : await this.create({
                    name: member.name,
                    slackId: member.id,
                    email: member.email,
                    projectManagerEmail: '',
                    isDeleted: member.isDeleted,
                    isRestricted: member.isRestricted,
                    isUltraRestricted: member.isUltraRestricted,
                    isAdmin: false,
                    isMobilized: false,
                    isExemptFromCheckIn: true,
                    isOptedOutOfMap: false,
                    checkInToken: null,
                    alertToken: null,
                    checkIn: null,
                    alert: null
                });
        }
    }

    public async notifyOfLateCheckIns(): Promise<void> {
        const members = await this.memberProvider.getAll()
            .then((results) => results.filter((member) => {
                const isExempt = member.isExemptFromCheckIn;
                const hasCheckIn = Boolean(member.checkIn);
                const hasCheckedInRecently = hasCheckIn && isWithinNHours(member.checkIn!.createdAt, this.hoursBeforeNotification);

                return !Boolean((hasCheckIn && hasCheckedInRecently) || isExempt);
            }));

        await this.messageService.sendNotificationOfMembersWithLateCheckIn(members);
    }

    public async remindMembersOfLateCheckIn(): Promise<void> {
        const members = await this.memberProvider.getAll()
            .then((results) => results.filter((member) => {
                const isExempt = member.isExemptFromCheckIn;
                const hasCheckIn = Boolean(member.checkIn);
                const hasCheckedInRecently = hasCheckIn && isWithinNHours(member.checkIn!.createdAt, this.hoursBeforeReminder);

                return !Boolean((hasCheckIn && hasCheckedInRecently) || isExempt);
            }));

        members.map((member) => this.messageService.sendCheckInReminderToMember(member)
            .catch((error) => logger
                ? logger.error(error)
                : console.log(error),
            ));
    }

    public async requestCheckIns(): Promise<void> {
        if (this.requestCheckInOrganizationChannel) {
            await this.messageService.sendCheckInRequestToChannel();
        }

        if (this.requestCheckInDirectMessage) {
            const members = await this.memberProvider.getAll()
                .then((results) => results.filter((member) => {
                    const isExempt = member.isExemptFromCheckIn;

                    return !isExempt;
                }));

            members.map((member) => this.messageService.sendCheckInRequestToMember(member)
                .catch((error) => logger
                    ? logger.error(error)
                    : console.log(error),
                ));
        }
    }

    public async requestAlert(): Promise<void> {
        await this.memberProvider.getAll()
            .then((results) => results.filter((member) => {
                return member.alert?.isSafe !== null;
            }).forEach(member => alertMemberService.alertManager.deleteAllByMember(member)));

        if (this.requestAlertInOrganizationChannel) {
            await this.messageService.sendAlertRequestToChannel();
        }

        if (this.requestAlertDirectMessage) {
            const members = await this.memberProvider.getAll()
                .then((results) => results.filter((member) => {
                    const isExempt = member.isExemptFromCheckIn;

                    return !isExempt;
                }));

            members.map((member) => this.messageService.sendAlertRequestToMember(member)
                .catch((error) => logger
                    ? logger.error(error)
                    : console.log(error),
                ));
        }
    }

    private async sendMemberAtRiskNotificationIfNeededCheckIn(member: Member): Promise<void> {
        if (this.memberIsAtRisk(member)) {
            await this.messageService.sendMemberAtRiskNotification(member);
        }
    }

    private async sendMemberAtRiskNotificationIfNeededForAlert(member: Member): Promise<void> {
        if (this.memberIsAtRisk(member)) {
            await this.messageService.sendMemberAtRiskNotificationForAlert(member);
        }
    }
}
