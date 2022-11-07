import type {CreatableEntityAttributes, Member, MemberAttributes} from '../../entities';

export interface IMemberManager {
    create(attributes: CreatableEntityAttributes<MemberAttributes>): Promise<Member>;

    update(member: Member): Promise<Member>;

    delete(member: Member): Promise<void>;
}
