import type {WebClient} from '@slack/web-api';
import {format} from 'date-fns';
import {BlockBuilder, Blocks, bold, Elements, Message, MessageBuilder, user,} from 'slack-block-builder';
import {SlackAction} from '../constants';
import type {IMessageService} from './interfaces';
import type {Nullable} from '../types';
import type {Member} from '../entities';
import {
    getDisplayTextElectricityCondition,
    getDisplayTextFromBool,
    getDisplayTextFromCheckInBoolByMember,
    getDisplayTextSupport,
    getShortLocationStringByMember,
} from '../helpers/client';

export interface MessageServiceParams {
    httpClient: WebClient;
    monitoringChannel: string;
    organizationChannel: string;
    host: string;
}

export class MessageService implements IMessageService {
    private readonly httpClient: WebClient;

    private readonly monitoringChannel: string;

    private readonly organizationChannel: string;

    private readonly host: string;

    constructor(params: MessageServiceParams) {
        this.httpClient = params.httpClient;
        this.monitoringChannel = params.monitoringChannel;
        this.organizationChannel = params.organizationChannel;
        this.host = params.host;
    }

    public async sendCheckInRequestToChannel(): Promise<void> {
        const message = this.getCheckInRequestMessage(null);

        await this.httpClient.chat.postMessage(message.buildToObject());
    }

    public async sendAlertRequestToChannel(): Promise<void> {
        const message = this.getAlertRequestMessage(null);

        await this.httpClient.chat.postMessage(message.buildToObject());
    }

    public async sendCheckInRequestToMember(member: Member): Promise<void> {
        const message = this.getCheckInRequestMessage(member);

        await this.httpClient.chat.postMessage(message.buildToObject());
    }

    public async sendAlertRequestToMember(member: Member): Promise<void> {
        const message = this.getAlertRequestMessage(member);

        await this.httpClient.chat.postMessage(message.buildToObject());
    }

    public async sendMemberAtRiskNotification(member: Member): Promise<void> {
        const message = Message()
            .asUser()
            .channel(this.monitoringChannel)
            .text(`:warning:  A member of your organization may be at risk.`)
            .blocks(
                Blocks.Section({text: `:warning: A member of your organization may be at risk.`}),
                Blocks.Divider(),
                ...MessageService.getCheckInOverviewByMember(member),
            );

        await this.httpClient.chat.postMessage(message.buildToObject());
    }

    public async sendMemberAtRiskNotificationForAlert(member: Member): Promise<void> {
        const message = Message()
            .asUser()
            .channel(this.monitoringChannel)
            .text(`:warning:  A member of your organization may be at risk.`)
            .blocks(
                Blocks.Section({text: `:warning: A member of your organization may be at risk.`}),
                Blocks.Divider(),
                ...MessageService.getAlertOverviewByMember(member),
            );

        await this.httpClient.chat.postMessage(message.buildToObject());
    }

    public async sendCheckInReminderToMember(member: Member): Promise<void> {
        const message = Message()
            .asUser()
            .channel(member.slackId)
            .text(`A kind reminder – please check in with us.`)
            .blocks(
                Blocks.Section({text: `Hi, ${user(member.slackId)}, we noticed you haven't checked in with us in the past couple of days. We hope you're safe. If you are, please let us know by checking in.`}),
                ...MessageService.getCheckInActions(),
            );

        await this.httpClient.chat.postMessage(message.buildToObject());
    }

    public async sendNotificationOfMembersWithLateCheckIn(members: Member[]): Promise<void> {
        const message = Message()
            .asUser()
            .channel(this.monitoringChannel)
            .text(`A quick overview of members not checked in in a while.`)
            .blocks(
                Blocks.Section({text: `Hi, here is an overview of your organization's members who have not checked in a while.`}),
                Blocks.Divider(),
                ...members.length <= 10
                    ? members.map((member) => [
                        ...MessageService.getCheckInOverviewByMember(member),
                        Blocks.Section({text: member.checkIn ? format(member.checkIn.createdAt!, 'MMMM do, y') : 'Never'}),
                        Blocks.Divider(),
                    ])
                    : [
                        Blocks.Divider(),
                        Blocks.Section({text: `At the moment, there are ${bold(`${members.length} members`)} who have overdue check ins.`}),
                    ],
                Blocks.Section({text: `Visit the ${bold('Together App')} dashboard to review them all.`})
                    .accessory(
                        Elements.Button({
                            text: 'Visit Dashboard',
                            actionId: SlackAction.DoNothing,
                            url: `${this.host}/members`,
                        }),
                    ),
            );

        await this.httpClient.chat.postMessage(message.buildToObject());
    }

    private getCheckInRequestMessage(member: Nullable<Member>): MessageBuilder {
        return Message()
            .asUser()
            .channel(member ? member.slackId : this.organizationChannel)
            .text(`Please check in with us.`)
            .blocks(
                Blocks.Section({text: `Hi there, ${member ? user(member.slackId) : 'everyone'}. We hope that you and your loved ones are as safe as possible.`}),
                Blocks.Section({text: `Please check in with us – this is super important for us to be able to provide assistance and make critical decisions for our organization.`}),
                ...MessageService.getCheckInActions(),
            );
    }

    private getAlertRequestMessage(member: Nullable<Member>): MessageBuilder {
        return Message()
            .asUser()
            .channel(member ? member.slackId : this.organizationChannel)
            .text(`Please check in with us.`)
            .blocks(
                Blocks.Section({text: `Hi there, ${member ? user(member.slackId) : 'everyone'}. We hope that you and your loved ones are as safe as possible.`}),
                Blocks.Section({text: `Please check in with us – this is super important for us to be able to provide assistance and make critical decisions for our organization.`}),
                ...MessageService.getAlertActions(),
            );
    }

    private static getCheckInOverviewByMember(member: Member): Array<BlockBuilder> {
        const memberDto = member.toDto();

        return [
            Blocks.Section({text: `${bold('Member:')} ${memberDto.name} (${user(memberDto.slackId)})`}),
            Blocks.Section({text: `${bold('Location:')} ${getShortLocationStringByMember(memberDto)}`})
                .fields(
                    `${bold('Is Safe:')} ${getDisplayTextFromCheckInBoolByMember(memberDto, 'isSafe')}`,
                    `${bold('Can Work:')} ${getDisplayTextFromCheckInBoolByMember(memberDto, 'isAbleToWork')}`,
                    `${bold('Support:')} ${getDisplayTextSupport(member.checkIn ? member.checkIn.support : 'N/A')}`,
                    `${bold('Electricity condition:')} ${getDisplayTextElectricityCondition(member.checkIn ? member.checkIn.electricityCondition : 'N/A')}`,
                ),
            Blocks.Section({text: `${bold('Comment:')} ${memberDto.checkIn && memberDto.checkIn.comment || 'N/A'}`}),
        ];
    }

    private static getAlertOverviewByMember(member: Member): Array<BlockBuilder> {
        const memberDto = member.toDto();

        return [
            Blocks.Section({text: `${bold('Member:')} ${memberDto.name} (${user(memberDto.slackId)})`}),
            Blocks.Section({text: `${bold('Location:')} ${getShortLocationStringByMember(memberDto)}`})
                .fields(
                    `${bold('Are you OK now:')} ${getDisplayTextFromBool(memberDto.alert !== null ? memberDto.alert.isSafe : null)}`,
                    `${bold('PM e-mail:')} ${memberDto.projectManagerEmail !== '' ? memberDto.projectManagerEmail : 'N/A'}`
                ),
            Blocks.Section({text: `${bold('Comment:')} ${memberDto.alert && memberDto.alert.comment || 'N/A'}`}),
        ];
    }

    private static getCheckInActions(): BlockBuilder[] {
        return [
            Blocks.Divider(),
            Blocks.Actions()
                .elements(
                    Elements.Button({
                        text: 'Check In',
                        actionId: SlackAction.RenderCheckInSelfConfirmation,
                    }),
                    Elements.Button({
                        text: 'Repeat Last Check In',
                        actionId: SlackAction.RenderRepeatCheckInConfirmation,
                    }),
                    /*

                    Add if you want to see "check in someone else" button

                    Elements.Button({
                      text: 'Check In Another Employee',
                      actionId: SlackAction.RenderCheckInOtherMemberConfirmation,
                    }),
                     */
                ),
        ]
    }

    private static getAlertActions(): BlockBuilder[] {
        return [
            Blocks.Divider(),
            Blocks.Actions()
                .elements(
                    Elements.Button({
                        text: 'Check In',
                        actionId: SlackAction.RenderAlertConfirmation,
                    }),
                ),
        ]
    }

}
