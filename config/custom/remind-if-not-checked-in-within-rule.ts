import type {Nullable, RemindMemberOfLateCheckInRule} from '../../types';
import {remind_day, remind_month, remind_week, TYPE_APP} from "./app-config";

export const remindIfNotCheckedInWithinRule: Nullable<RemindMemberOfLateCheckInRule> = {
    hours: getRemindHour()
};

function getRemindHour() {
    switch (TYPE_APP) {
        // @ts-ignore
        case 1:
            return remind_day;
        // @ts-ignore
        case 2:
            return remind_week;
        // @ts-ignore
        case 3:
            return remind_month;
        default:
            return 24;
    }
}