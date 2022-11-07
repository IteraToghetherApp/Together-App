import {RecordableEntity, RecordableEntityAttributes, SerializableTimestamps} from './RecordableEntity';

import type {IDtoable, IProtectedDtoable} from './interfaces';
import type {Nullable} from '../types';

export interface AlertAttributes extends RecordableEntityAttributes {
    isSafe: boolean;
    comment: Nullable<string>;
    memberId: string;
}

export type AlertDto = Omit<AlertAttributes, 'createdAt' | 'updatedAt'> & SerializableTimestamps;

export type ProtectedAlertDto = Omit<AlertDto, 'isSafe' | 'comment'>;

export class Alert extends RecordableEntity implements IDtoable<AlertDto>, IProtectedDtoable<ProtectedAlertDto> {
    public readonly isSafe: boolean;
    public readonly comment: Nullable<string>;
    public readonly memberId: string;

    constructor(params: AlertAttributes) {
        super(params);

        this.isSafe = params.isSafe;
        this.comment = params.comment;
        this.memberId = params.memberId
    }

    public toDto(): AlertDto {
        return Object.freeze({
            ...this,
            ...this.getSerializableTimestamps(),
        });
    }

    public toProtectedDto(): ProtectedAlertDto {
        const {
            isSafe,
            comment,
            ...rest
        } = this;

        return Object.freeze({
            ...rest,
            ...this.getSerializableTimestamps(),
        });
    }
}
