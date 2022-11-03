import type {NextApiRequest, NextApiResponse} from 'next';
import {alertMemberService, checkInMemberService} from '../../services';
import {handleAPIErrors, validateHttpMethod, validateMemberAlertToken} from '../../helpers/server';

interface Payload {
    memberId: string;
    alertToken: string;
    isSafe: boolean;
    comment: string;
}

export default async function SubmitAlert(req: NextApiRequest, res: NextApiResponse) {
    try {
        validateHttpMethod('POST', req.method!);

        const {
            memberId,
            alertToken,
            isSafe,
            comment,
        }: Payload = req.body;

        const member = await alertMemberService.getById(memberId);

        validateMemberAlertToken({member, alertToken});

        await alertMemberService.alert({
            member,
            attributes: {
                isSafe,
                comment: !!comment.length ? comment : null,
            },
        });

        res.status(200).json({data: null});
    } catch (error) {
        handleAPIErrors(error, res);
    }
}
