import type {MemberIsAtRiskRule, Nullable} from '../../types';
import {Member} from "../../entities";

export const memberIsAtRiskRule: Nullable<MemberIsAtRiskRule> = (member: Member) => {
    let memberIsAtRisk: boolean = false;

    if (member.checkIn != null) {
        memberIsAtRisk = !(member.checkIn.isSafe && member.checkIn.isAbleToWork && member.checkIn.support === '1')
    }

    return memberIsAtRisk;
};