import type {CreatableEntityAttributes, Member} from '../../entities';
import {Alert, AlertAttributes} from "../../entities/Alert";

export interface IAlertManager {
    create(attributes: CreatableEntityAttributes<AlertAttributes>): Promise<Alert>;

    deleteAllByMember(member: Member): Promise<void>;
}
