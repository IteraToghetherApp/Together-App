import {Nullable} from '../../types';
import * as csv from 'async-csv';
import {getDisplayTextElectricityCondition, getDisplayTextFromBool, getDisplayTextSupport} from './display';

import type {MemberDto} from '../../entities';

type ExportableMember = {
    name: string;
    email: string;
    country: Nullable<string>;
    state: Nullable<string>;
    city: Nullable<string>;
    isSafe: Nullable<string>;
    isAbleToWork: Nullable<string>;
    support: Nullable<string>;
    isMobilized: string;
    isAdmin: Nullable<string>;
    isExemptFromCheckIn: Nullable<string>;
    isOptedOutOfMap: Nullable<string>;
    numberOfPeopleToRelocate: Nullable<number>;
    otherSupport: Nullable<string>
    comment: Nullable<string>;
    lastCheckedIn: Nullable<string>;
    alert: Nullable<string>;
    alertComment: Nullable<string>;
    projectManagerEmail: Nullable<string>;
}

const columns: Array<keyof ExportableMember> = [
    'name',
    'email',
    'country',
    'state',
    'city',
    'isSafe',
    'isAbleToWork',
    'support',
    'electricityCondition',
    'isMobilized',
    'isAdmin',
    'isExemptFromCheckIn',
    'isOptedOutOfMap',
    'numberOfPeopleToRelocate',
    'otherSupport',
    'comment',
    'lastCheckedIn',
    'alert',
    'alertComment',
    'projectManagerEmail'
];

export default async (members: MemberDto[]): Promise<string> => {
    if (members.length === 0) {
        return '';
    }

    const flattened: ExportableMember[] = members.map((member) => ({
        name: member.name,
        email: member.email,
        country: member.checkIn ? member.checkIn.country : 'Null',
        state: member.checkIn ? member.checkIn.state : 'Null',
        city: member.checkIn ? member.checkIn.city : 'Null',
        isSafe: member.checkIn ? getDisplayTextFromBool(member.checkIn.isSafe) : 'Null',
        isAbleToWork: member.checkIn ? getDisplayTextFromBool(member.checkIn.isAbleToWork) : 'Null',
        support: member.checkIn ? getDisplayTextSupport(member.checkIn.support) : 'Null',
        electricityCondition: member.checkIn ? getDisplayTextElectricityCondition(member.checkIn.electricityCondition) : 'Null',
        isMobilized: getDisplayTextFromBool(member.isMobilized),
        isAdmin: getDisplayTextFromBool(member.isAdmin),
        isExemptFromCheckIn: getDisplayTextFromBool(member.isExemptFromCheckIn),
        isOptedOutOfMap: getDisplayTextFromBool(member.isOptedOutOfMap),
        numberOfPeopleToRelocate: member.checkIn ? member.checkIn.numberOfPeopleToRelocate : null,
        otherSupport: member.checkIn ? member.checkIn.otherSupport : null,
        comment: member.checkIn ? member.checkIn.comment : 'Null',
        lastCheckedIn: member.checkIn ? member.checkIn.createdAt : 'Null',
        alert: member.alert ? getDisplayTextFromBool(member.alert.isSafe) : 'Null',
        alertComment: member.alert ? member.alert.comment : 'Null',
        projectManagerEmail: member.projectManagerEmail
    }));

    let csvInput = [];

    csvInput.push(columns);

    csvInput.push(
        ...flattened.map(row => columns.map(column => row[column])),
    );

    return await csv.stringify(csvInput);
}
