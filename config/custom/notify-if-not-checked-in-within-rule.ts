import type {Nullable, NotifyOfLateCheckInRule} from '../../types';
import {notify_day, notify_month, notify_week, TYPE_APP} from "./app-config";

export const notifyIfNotCheckedInWithinRule: Nullable<NotifyOfLateCheckInRule> = {
    hours: getNotifyHour(),
};

function getNotifyHour() {
    switch (TYPE_APP) {
        // @ts-ignore
        case 1:
            return notify_day;
        // @ts-ignore
        case 2:
            return notify_week;
        // @ts-ignore
        case 3:
            return notify_month;
        default:
            return 24;
    }
}
