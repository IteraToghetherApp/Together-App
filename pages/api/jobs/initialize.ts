import type {NextApiRequest, NextApiResponse} from 'next';
import {checkInMemberService} from '../../../services';
import {handleAPIErrors, validateHttpMethod, validateJobsAPIToken} from '../../../helpers/server';
import {logger, TOGETHER_ADMINISTRATOR_SLACK_USER_ID} from '../../../config';
import {MemberNotFoundError} from '../../../exceptions';

interface Payload {
    token: string;
}

export default async function Initialize(req: NextApiRequest, res: NextApiResponse) {
    try {
        validateHttpMethod('GET', req.method!);

        const {token} = req.query as unknown as Payload;

        validateJobsAPIToken(token);
    } catch (error) {
        handleAPIErrors(error, res);

        return;
    }

    try {
        res.status(200).json({});

        await checkInMemberService.syncAllWithSlack();

        const administrator = await checkInMemberService.findBySlackId(TOGETHER_ADMINISTRATOR_SLACK_USER_ID);

        if (!administrator) {
            throw new MemberNotFoundError();
        }

        await checkInMemberService.setIsAttribute({
            member: administrator,
            attribute: 'isAdmin',
            value: true,
        });

        const message = 'The job `initialize` has been completed successfully.';

        logger
            ? logger.info(message)
            : console.log(message);
    } catch (error) {
        const message = 'An error occurred while running the `initialize` job.';

        logger
            ? logger.info(message)
            : console.log(message);

        logger
            ? logger.error(error)
            : console.log(error);
    }
};
