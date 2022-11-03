import type {NextApiRequest, NextApiResponse} from 'next';
import {getSession} from 'next-auth/react';
import {alertMemberService} from '../../services';
import {
    handleAPIErrors,
    normalizeString,
    validateHttpMethod,
    validateRequesterIsAdmin,
    validateSessionIsValid,
} from '../../helpers/server';

export interface Payload {
    memberId: string,
    projectManagerEmail: string
}

export default async function updatePmEmail(req: NextApiRequest, res: NextApiResponse) {
    console.log("update success!");
    try {
        validateHttpMethod('POST', req.method!);

        const session = await getSession({req});

        validateSessionIsValid(session);

        const email = normalizeString(session!.user!.email!);
        const {memberId, projectManagerEmail}: Payload = req.body;

        const [member, requester] = await Promise.all([
            alertMemberService.getById(memberId),
            alertMemberService.getByEmail(email),
        ]);

        member.setProjectManagerEmail(projectManagerEmail);

        validateRequesterIsAdmin(requester);

        const updated = await alertMemberService.update(member);
        console.log(updated);

        res.status(200).json({...updated.toDto()});
    } catch (error) {
        handleAPIErrors(error, res);
    }
}
