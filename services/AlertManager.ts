import {PrismaService, PrismaServiceParams} from './PrismaService';
import {CreatableEntityAttributes, Member} from '../entities';

import type {IUniqueStringGenerator} from './interfaces';
import {Alert} from "../entities/Alert";
import {IAlertManager} from "./interfaces/IAlertManager";

export interface MemberManagerParams extends PrismaServiceParams {
    uniqueStringGenerator: IUniqueStringGenerator;
}

export class AlertManager extends PrismaService implements IAlertManager {
    private readonly uniqueStringGenerator: IUniqueStringGenerator;

    constructor(params: MemberManagerParams) {
        super(params);

        this.uniqueStringGenerator = params.uniqueStringGenerator;
    }

    public async create(attributes: CreatableEntityAttributes<Alert>): Promise<Alert> {
        const record = await this.connection.alertRecord.create({
            data: {
                ...attributes,
                id: this.uniqueStringGenerator.generate(),
            },
        });

        return new Alert(record);
    }

    public async deleteAllByMember(member: Member): Promise<void> {
        await this.connection.alertRecord.deleteMany({
            where: {memberId: member.id},
        });
    }
}
