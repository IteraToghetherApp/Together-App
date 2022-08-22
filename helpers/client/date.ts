import {ProtectedCheckInDto} from '../../entities';
import {isAfter, isBefore, subHours, addDays, subDays} from 'date-fns';
import {TYPE_APP} from "../../config/custom/app-config";

import type {Nullable} from '../../types';

export const checkInIsCloserPerShortTime = <T extends ProtectedCheckInDto>(checkIn: Nullable<T>): boolean => {
    if (!checkIn) {
        return false;
    }

    const date = new Date(checkIn.createdAt as unknown as string);

    return isWithinShortTimePeriod(date);
};

export const isWithinShortTimePeriod = (date: Nullable<Date>): boolean => {
    switch (TYPE_APP) {
        // @ts-ignore
        case 1:
            return isWithinNHours(date, 24);
        //@ts-ignore
        case 2:
            return isWithinNHours(date, 168);
        //@ts-ignore
        case 3:
            return isWithinNHours(date, 0);
        default:
            return false;
    }
}

export const isWithinNHours = (date: Nullable<Date>, hours: number): boolean => {
    if (!date) {
        return false;
    }

    const dateLocal = new Date();
    const dateUTCType = convertDateToUTC(date);

    switch (TYPE_APP) {
        // @ts-ignore
        case 1:
            const now = convertDateToUTC(dateLocal);
            const dateNHoursAgoType1 = subHours(now, hours);

            return isAfter(dateUTCType, dateNHoursAgoType1);
        //@ts-ignore
        case 2:
            dateLocal.setHours(0, 0, 0, 0);

            const firstDay = dateLocal.getDate() - dateLocal.getDay() + 1;
            const lastDayWeek = new Date(dateLocal.setDate(firstDay + 6));
            const dateNHoursAgoType2 = convertDateToUTC(subHours(lastDayWeek, hours));

            return isAfter(dateUTCType, dateNHoursAgoType2);
        //@ts-ignore
        case 3:
            const firstDayMonth = convertDateToUTC(new Date(
                dateLocal.getFullYear(),
                dateLocal.getMonth(),
                1,
                0,
                0,
                0,
                0
            ));

            return isAfter(dateUTCType, firstDayMonth)
        default:
            return false;
    }
}

export const checkInIsCloserPerLongTime = <T extends ProtectedCheckInDto>(checkIn: Nullable<T>): boolean => {
    if (!checkIn) {
        return false;
    }

    const date = new Date(checkIn.createdAt as unknown as string);
    const dateLocal = new Date();

    switch (TYPE_APP) {
        // @ts-ignore
        case 1:
            const dateUTC = convertDateToUTC(dateLocal);

            const date48HoursAgo = subDays(dateUTC, 2);
            const date24HoursAgo = subDays(dateUTC, 1);

            return Boolean(isAfter(date, date48HoursAgo) && isBefore(date, date24HoursAgo));
        // @ts-ignore
        case 2:
            dateLocal.setHours(0, 0, 0, 0);

            const firstDayWeek = dateLocal.getDate() - dateLocal.getDay() - 6;
            const lastWeekFirstDay = new Date(dateLocal.setDate(firstDayWeek));
            const lastWeekLastDay = addDays(lastWeekFirstDay, 7);

            return Boolean(isAfter(date, lastWeekFirstDay) && isBefore(date, lastWeekLastDay));
        // @ts-ignore
        case 3:
            const firstDayLastMonth = convertDateToUTC(
                new Date(
                    dateLocal.getFullYear(),
                    dateLocal.getMonth() - 1,
                    1,
                    0,
                    0,
                    0,
                    0
                )
            );

            const lastDayLastMonth = convertDateToUTC(
                new Date(
                    dateLocal.getFullYear(),
                    dateLocal.getMonth(),
                    1,
                    0,
                    0,
                    0,
                    0
                )
            );

            return Boolean(isAfter(date, firstDayLastMonth) && isBefore(date, lastDayLastMonth));
        default:
            return false;
    }


};

export const convertDateToUTC = (date: Date) => Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
);
