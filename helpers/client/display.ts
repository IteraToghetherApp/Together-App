import {format, isAfter, subHours} from 'date-fns';
import {checkInIsCloserPerShortTime, checkInIsCloserPerLongTime, convertDateToUTC} from './date';
import type {CheckInDto, MemberDto, AnyMemberDto} from '../../entities';
import type {Nullable, TagColor} from '../../types';
import {TYPE_APP} from "../../config/custom/app-config";

type NullableStringArray = Array<string | null>;

const unsafeCountries: NullableStringArray = ['Ukraine', 'Russia', 'Belarus'];

export const getLocationStringByMember = (member: AnyMemberDto): string => member.checkIn
    ? `${[member.checkIn.city, member.checkIn.state, member.checkIn.country]
        .filter((data) => Boolean(data))
        .join(', ')}`
    : 'Unknown';

export const getShortLocationStringByMember = (member: AnyMemberDto): string => member.checkIn
    ? `${[member.checkIn.city, member.checkIn.country]
        .filter((data) => Boolean(data))
        .join(', ')}`
    : 'Unknown';

export const getCountryTagColorByMember = (member: AnyMemberDto): TagColor => {
    if (!member.checkIn || member.checkIn.country === null) {
        return 'warning';
    }

    return unsafeCountries.includes(member.checkIn.country)
        ? 'custom'
        : 'primary';
};

export const getTagColorByCriticalBoolean = (bool: Nullable<boolean>): TagColor => Boolean(bool) ? 'primary' : 'warning';

export const getTagColorByWarningBoolean = (bool: Nullable<boolean>): TagColor => Boolean(bool) ? 'primary' : 'custom';

export const getTagColorFromCheckInCriticalBoolByMember = (member: MemberDto, key: keyof CheckInDto): TagColor => {
    return Boolean(member.checkIn && member.checkIn[key]) ? 'primary' : 'warning';
};

export const getTagColorFromCheckInWarningBoolByMember = (member: MemberDto, key: keyof CheckInDto): TagColor => {
    return Boolean(member.checkIn && member.checkIn[key]) ? 'primary' : 'warning';
};

export const getReversedTagColorFromCheckInBoolByMember = (member: MemberDto, key: keyof CheckInDto): TagColor => {
    return Boolean(member.checkIn && member.checkIn[key]) ? 'primary' : 'custom';
};

export const getLastCheckInTagColorByMember = (member: AnyMemberDto): TagColor => {
    if (!member.checkIn === null) {
        return 'warning';
    }

    if (checkInIsCloserPerLongTime(member.checkIn)) {
        return 'custom';
    }

    if (checkInIsCloserPerShortTime(member.checkIn)) {
        return 'primary';
    }

    return 'warning';
};

export const getLastCheckInStringByMember = (member: AnyMemberDto): string => {
    if (member.checkIn === null) {
        return 'Never';
    }

    const date = new Date(member.checkIn.createdAt as unknown as string);

    if (checkInIsCloserPerLongTime(member.checkIn)) {
        switch (TYPE_APP) {
            // @ts-ignore
            case 1:
                return "Past 48 Hours"
            //@ts-ignore
            case 2:
                return 'Last Week';
            //@ts-ignore
            case 3:
                return 'Last Month';
            default:
                break;
        }

    }

    if (checkInIsCloserPerShortTime(member.checkIn)) {
        switch (TYPE_APP) {
            // @ts-ignore
            case 1:
                return "Past 24 Hours";
            //@ts-ignore
            case 2:
                return "Current Week";
            //@ts-ignore
            case 3:
                return "Current Month";
            default:
                break;
        }
    }

    return format(date, 'MMMM do');
};

export const getDisplayTextFromBool = (bool: Nullable<boolean>): string => {
    if (bool === null) {
        return 'Unknown';
    }

    return bool ? 'Yes' : 'No';
};

export const getDisplayTextFromCheckInBoolByMember = (member: MemberDto, key: keyof CheckInDto): string => {
    if (!member.checkIn || !member.checkIn[key] === null) {
        return 'Unknown';
    }

    return member.checkIn[key] ? 'Yes' : 'No';
};
