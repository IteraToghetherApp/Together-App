import { Nullable } from '../../types';
import * as csv from 'async-csv';
import { getDisplayTextFromBool } from './display';

import type { MemberDto } from '../../entities';

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
  'isMobilized',
  'isAdmin',
  'isExemptFromCheckIn',
  'isOptedOutOfMap',
  'numberOfPeopleToRelocate',
  'comment',
  'lastCheckedIn',
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
    support: member.checkIn ? member.checkIn.support : 'Null',
    isMobilized: getDisplayTextFromBool(member.isMobilized),
    isAdmin: getDisplayTextFromBool(member.isAdmin),
    isExemptFromCheckIn: getDisplayTextFromBool(member.isExemptFromCheckIn),
    isOptedOutOfMap: getDisplayTextFromBool(member.isOptedOutOfMap),
    numberOfPeopleToRelocate: member.checkIn ? member.checkIn.numberOfPeopleToRelocate : null,
    otherSupport: member.checkIn ? member.checkIn.otherSupport : null,
    comment: member.checkIn ? member.checkIn.comment : 'Null',
    lastCheckedIn: member.checkIn ? member.checkIn.createdAt : 'Null',
  }));

  let csvInput = [];

  csvInput.push(columns);

  csvInput.push(
    ...flattened.map(row => columns.map(column => row[column])),
  );

  return await csv.stringify(csvInput);
}
