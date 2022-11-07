import {v4} from 'uuid';
import {WebClient} from '@slack/web-api';
import {CheckInManager} from './CheckInManager';
import {Uuid4IdGenerator} from './Uuid4IdGenerator';
import {LocationService} from './LocationService';
import {MemberManager} from './MemberManager';
import {MemberProvider} from './MemberProvider';
import {MemberService} from './MemberService';
import {MessageService} from './MessageService';
import {SlackMemberService} from './SlackMemberService';
import {SlackRequestService} from './SlackRequestService';
import {connection, validateAndReturnConnection} from '../db';
import {
    alertRequestRule,
    checkInRequestRule,
    filterSlackMemberRule,
    GOOGLE_GEOCODING_API_TOKEN,
    HOST,
    logger,
    memberIsAtRiskRule,
    notifyIfNotCheckedInWithinRule,
    remindIfNotCheckedInWithinRule,
    SLACK_ALERT_APP_SIGNING_SECRET,
    SLACK_ALERT_APP_TOKEN,
    SLACK_MONITORING_CHANNEL_ID,
    SLACK_ORGANIZATION_CHANNEL_ID,
    SLACK_TOGETHER_APP_SIGNING_SECRET,
    SLACK_TOGETHER_APP_TOKEN,
    SLACK_WORKSPACE_ID,
} from '../config';
import {ModalService} from './ModalService';
import {isWithinShortTimePeriod} from '../helpers/client';

import type {Member} from '../entities';
import {AlertManager} from "./AlertManager";

const slackCheckInClient = new WebClient(SLACK_TOGETHER_APP_TOKEN);
const slackAlertClient = new WebClient(SLACK_ALERT_APP_TOKEN);

export const locationService = new LocationService({
    baseUrl: 'https://maps.googleapis.com/maps/api',
    token: GOOGLE_GEOCODING_API_TOKEN,
    language: 'en',
});

const slackCheckInMemberService = new SlackMemberService({
    httpClient: slackCheckInClient,
    teamId: SLACK_WORKSPACE_ID,
});

const slackAlertMemberService = new SlackMemberService({
    httpClient: slackAlertClient,
    teamId: SLACK_WORKSPACE_ID,
});

const uniqueStringGenerator = new Uuid4IdGenerator({generator: v4});

const checkInManager = new CheckInManager({
    uniqueStringGenerator,
    connection: validateAndReturnConnection(connection),
});

const alertManager = new AlertManager({
    uniqueStringGenerator,
    connection: validateAndReturnConnection(connection),
});

const memberManager = new MemberManager({
    uniqueStringGenerator,
    connection: validateAndReturnConnection(connection),
});

const memberProvider = new MemberProvider({
    connection: validateAndReturnConnection(connection),
    filterRestricted: filterSlackMemberRule
        ? filterSlackMemberRule.filterRestricted
        : true,
    filterUltraRestricted: filterSlackMemberRule
        ? filterSlackMemberRule.filterUltraRestricted
        : true,
});

export const checkInMessageService = new MessageService({
    httpClient: slackCheckInClient,
    organizationChannel: SLACK_ORGANIZATION_CHANNEL_ID,
    monitoringChannel: SLACK_MONITORING_CHANNEL_ID,
    host: HOST,
});

export const alertMessageService = new MessageService({
    httpClient: slackAlertClient,
    organizationChannel: SLACK_ORGANIZATION_CHANNEL_ID,
    monitoringChannel: SLACK_MONITORING_CHANNEL_ID,
    host: HOST,
});

export const checkInMemberService = new MemberService({
    memberManager,
    memberProvider,
    checkInManager,
    alertManager,
    uniqueStringGenerator,
    messageService: checkInMessageService,
    logger,
    slackMemberProvider: slackCheckInMemberService,
    memberIsAtRisk: memberIsAtRiskRule || ((member: Member): boolean => {
        const isSafe = member.checkIn && member.checkIn.isSafe;
        const isNotMobilized = !member.isMobilized;
        const hasCheckedInRecently = member.checkIn && isWithinShortTimePeriod(member.checkIn.createdAt);

        return !Boolean(isSafe && isNotMobilized && hasCheckedInRecently);
    }),
    hoursBeforeReminder: remindIfNotCheckedInWithinRule
        ? remindIfNotCheckedInWithinRule.hours
        : 24,
    hoursBeforeNotification: notifyIfNotCheckedInWithinRule
        ? notifyIfNotCheckedInWithinRule.hours
        : 24,
    requestCheckInDirectMessage: checkInRequestRule
        ? checkInRequestRule.requestCheckInDirectMessage
        : true,
    requestCheckInOrganizationChannel: checkInRequestRule
        ? checkInRequestRule.requestCheckInOrganizationChannel
        : true,
    requestAlertOrganizationChannel: alertRequestRule
        ? alertRequestRule.requestAlertOrganizationChannel
        : true,
    requestAlertDirectMessage: alertRequestRule
        ? alertRequestRule.requestAlertDirectMessage
        : true
});

export const alertMemberService = new MemberService({
    memberManager,
    memberProvider,
    checkInManager,
    alertManager,
    uniqueStringGenerator,
    messageService: alertMessageService,
    logger,
    slackMemberProvider: slackAlertMemberService,
    memberIsAtRisk: memberIsAtRiskRule || ((member: Member): boolean => {
        const isSafe = member.alert && member.alert.isSafe;
        const isNotMobilized = !member.isMobilized;
        const hasCheckedInRecently = member.alert && isWithinShortTimePeriod(member.alert.createdAt);

        return !Boolean(isSafe && isNotMobilized && hasCheckedInRecently);
    }),
    hoursBeforeReminder: remindIfNotCheckedInWithinRule
        ? remindIfNotCheckedInWithinRule.hours
        : 24,
    hoursBeforeNotification: notifyIfNotCheckedInWithinRule
        ? notifyIfNotCheckedInWithinRule.hours
        : 24,
    requestCheckInDirectMessage: checkInRequestRule
        ? checkInRequestRule.requestCheckInDirectMessage
        : true,
    requestCheckInOrganizationChannel: checkInRequestRule
        ? checkInRequestRule.requestCheckInOrganizationChannel
        : true,
    requestAlertOrganizationChannel: alertRequestRule
        ? alertRequestRule.requestAlertOrganizationChannel
        : true,
    requestAlertDirectMessage: alertRequestRule
        ? alertRequestRule.requestAlertDirectMessage
        : true
});

export const checkInModalService = new ModalService({
    httpClient: slackCheckInClient,
    host: HOST,
});

export const alertModalService = new ModalService({
    httpClient: slackAlertClient,
    host: HOST,
});

export const slackCheckInRequestService = new SlackRequestService({
    modalService: checkInModalService,
    memberService: checkInMemberService,
    signingSecret: SLACK_TOGETHER_APP_SIGNING_SECRET,
});

export const slackAlertRequestService = new SlackRequestService({
    modalService: alertModalService,
    memberService: alertMemberService,
    signingSecret: SLACK_ALERT_APP_SIGNING_SECRET,
});




