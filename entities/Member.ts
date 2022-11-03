import {RecordableEntity, RecordableEntityAttributes, SerializableTimestamps} from './RecordableEntity';

import type {IDtoable, IProtectedDtoable} from './interfaces';
import type {Nullable} from '../types';
import type {CheckIn, CheckInDto, ProtectedCheckInDto} from './CheckIn';
import {Alert, AlertDto, ProtectedAlertDto} from "./Alert";

export interface MemberAttributes extends RecordableEntityAttributes {
    slackId: string;
    name: string;
    email: string;
    projectManagerEmail: string;
    isDeleted: boolean;
    isRestricted: boolean;
    isUltraRestricted: boolean;
    isAdmin: boolean;
    isMobilized: boolean;
    isExemptFromCheckIn: boolean;
    isOptedOutOfMap: boolean;
    checkInToken: Nullable<string>;
    alertToken: Nullable<string>;
    checkIn: Nullable<CheckIn>;
    alert: Nullable<Alert>;
}

export type MemberDto = Omit<MemberAttributes, 'createdAt' | 'updatedAt'>
    & SerializableTimestamps
    & { checkIn: Nullable<CheckInDto> }
    & { alert: Nullable<AlertDto> };

export type ProtectedMemberDto = Omit<MemberAttributes, 'isMobilized'
        | 'isAdmin'
        | 'checkInToken'
        | 'alertToken'
        | 'checkIn'
        | 'alert'
        | 'isExemptFromCheckIn'
        | 'isOptedOutOfMap'>
    & { checkIn: Nullable<ProtectedCheckInDto> }
    & { alert: Nullable<ProtectedAlertDto> }

export type AnyMemberDto = MemberDto | ProtectedMemberDto;

export type MemberIsAttribute = keyof Pick<Member, 'isAdmin'
    | 'isMobilized'
    | 'isExemptFromCheckIn'
    | 'isOptedOutOfMap'>;

export class Member extends RecordableEntity implements IDtoable<MemberDto>, IProtectedDtoable<ProtectedMemberDto> {
    public readonly slackId: string;

    public name: string;

    public email: string;

    public projectManagerEmail: string;

    public isDeleted: boolean;

    public isRestricted: boolean;

    public isUltraRestricted: boolean;

    public isAdmin: boolean;

    public isMobilized: boolean;

    public isExemptFromCheckIn: boolean;

    public isOptedOutOfMap: boolean;

    public checkInToken: Nullable<string>;

    public alertToken: Nullable<string>;

    public readonly checkIn: Nullable<CheckIn>;

    public readonly alert: Nullable<Alert>

    constructor(params: MemberAttributes) {
        super(params);

        this.slackId = params.slackId;
        this.name = params.name;
        this.email = params.email;
        this.projectManagerEmail = params.projectManagerEmail
        this.isDeleted = params.isDeleted;
        this.isRestricted = params.isRestricted;
        this.isUltraRestricted = params.isUltraRestricted;
        this.isAdmin = params.isAdmin;
        this.isMobilized = params.isMobilized;
        this.isExemptFromCheckIn = params.isExemptFromCheckIn;
        this.isOptedOutOfMap = params.isOptedOutOfMap;
        this.checkInToken = params.checkInToken;
        this.checkIn = params.checkIn;
        this.alertToken = params.alertToken;
        this.alert = params.alert;
    }

    public setName(name: string): void {
        this.name = name;
    }

    public setEmail(email: string): void {
        this.email = email;
    }

    public setProjectManagerEmail(projectManagerEmail: string): void {
        this.projectManagerEmail = projectManagerEmail;
    }

    public setIsAdmin(bool: boolean): void {
        this.isAdmin = bool;
    }

    public setIsRestricted(isRestricted: boolean): void {
        this.isRestricted = isRestricted;
    }

    public setIsUltraRestricted(isUltraRestricted: boolean): void {
        this.isUltraRestricted = isUltraRestricted;
    }

    public setIsDeleted(isDeleted: boolean): void {
        this.isDeleted = isDeleted;
    }

    public setIsMobilized(bool: boolean): void {
        this.isMobilized = bool;
    }

    public setIsExemptFromCheckIn(isExemptFromCheckIn: boolean): void {
        this.isExemptFromCheckIn = isExemptFromCheckIn;
    }

    public setIsOptedOutOfMap(isOptedOutOfMap: boolean): void {
        this.isOptedOutOfMap = isOptedOutOfMap;
    }

    public setCheckInToken(checkInToken: Nullable<string>): void {
        this.checkInToken = checkInToken;
    }

    public setAlertToken(alertToken: Nullable<string>): void {
        this.alertToken = alertToken;
    }

    public toDto(): MemberDto {
        const {checkIn, alert, createdAt, updatedAt, ...rest} = this;
        return Object.freeze({
            ...rest,
            ...this.getSerializableTimestamps(),
            checkIn: checkIn ? checkIn.toDto() : null,
            alert: alert ? alert.toDto() : null,
        });
    }

    public toProtectedDto(): ProtectedMemberDto {
        const {
            isAdmin,
            isMobilized,
            isExemptFromCheckIn,
            isOptedOutOfMap,
            checkInToken,
            alertToken,
            checkIn,
            alert,
            ...rest
        } = this;

        return Object.freeze({
            ...rest,
            ...this.getSerializableTimestamps(),
            checkIn: checkIn ? checkIn.toProtectedDto() : null,
            alert: alert ? alert.toProtectedDto() : null,
        });
    }
}
