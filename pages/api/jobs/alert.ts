import type {NextApiRequest, NextApiResponse} from 'next';
import {alertMemberService} from '../../../services';
import {handleAPIErrors, validateHttpMethod, validateJobsAPIToken} from '../../../helpers/server';
import {logger} from '../../../config';

interface Payload {
    token: string;
}

export default async function Alert(req: NextApiRequest, res: NextApiResponse) {
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

        await alertMemberService.requestAlert();

        console.log("Done")
        const message = 'The job `alert` has been completed successfully.';

        logger
            ? logger.info(message)
            : console.log(message);
    } catch (error) {
        const message = 'An error occurred while running the `alert` job.';

        logger
            ? logger.info(message)
            : console.log(message);

        logger
            ? logger.error(error)
            : console.log(error);
    }
};
