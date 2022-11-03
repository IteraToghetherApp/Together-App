import type {NextApiRequest, NextApiResponse} from 'next';
import type {BlockAction} from '@slack/bolt';
import {handleAPIErrors, validateHttpMethod} from '../../../helpers/server';
import qs from 'querystring';
import {alertMemberService, alertModalService, slackAlertRequestService} from '../../../services';
import {SlackAction} from '../../../constants';
import {logger} from '../../../config';
import type {
    ActionHandlerParams,
    AnyModalServiceMethodParams,
    NonSlashCommandAction,
} from '../../../services/interfaces';

export default async function HandleActions(req: NextApiRequest, res: NextApiResponse) {
    try {
        validateHttpMethod('POST', req.method!);
    } catch (error) {
        handleAPIErrors(error, res);
    }

    try {
        const buffer = await slackAlertRequestService.validateSlackRequestAndReturnBuffer(req);
        const {payload} = qs.parse(buffer.toString());
        const body: NonSlashCommandAction = JSON.parse(payload as string);

        res.status(200).end();

        const slackId = body.user.id;

        const actionId: string = body.type === 'block_actions'
            ? body.actions[0].action_id
            : body.callback_id;

        const triggerId = body.trigger_id || null;

        const viewId = body.type === 'block_actions' ? body.view?.id : null;

        const member = await alertMemberService.findBySlackId(slackId);

        const modalServiceParams: AnyModalServiceMethodParams = viewId
            ? {viewId: viewId!, triggerId: null}
            : {triggerId: triggerId!, viewId: null};

        if (!member) {
            await alertModalService.renderError({
                ...modalServiceParams,
                message: `Sorry, I couldn't find you in Together App. Please get in touch with your administrator.`,
            });

            return;
        }

        const args: ActionHandlerParams<NonSlashCommandAction> = {body, modalServiceParams, member};

        switch (actionId) {
            case SlackAction.DoNothing:
                return;
            case SlackAction.ClickViewCheckIns:
                return;
            case SlackAction.ClickViewOrganizationMap:
                return;
            case SlackAction.RenderAlertMainMenu:
                await slackAlertRequestService.handleRenderAlertMainMenu(args as ActionHandlerParams<BlockAction>);
                return;
            case SlackAction.RenderAlertConfirmation:
                await slackAlertRequestService.handleAlertConfirmation(args);
                return;
        }

        await alertModalService.renderError({
            ...modalServiceParams,
            message: `Sorry, something went wrong.`,
        });
    } catch (error) {
        logger
            ? logger.error(error)
            : console.log(error);

        if (!res.headersSent) {
            res.status(400).end();
        }
    }
}


export const config = {
    api: {
        bodyParser: false,
    },
}
