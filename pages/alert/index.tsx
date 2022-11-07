import React, {useState} from 'react';
import type {Nullable} from '../../types';
import {ObjectLiteral} from '../../types';
import {useRouter} from 'next/router';
import axios from 'axios';
import {Banner, Button, FormRow, Input, Select} from '@macpaw/macpaw-ui';
import {InputValueType} from '@macpaw/macpaw-ui/lib/types';
import {GetServerSideProps} from 'next';
import {alertMemberService} from '../../services';
import {AccountIcon, ErrorIcon,} from '@macpaw/macpaw-ui/lib/Icons/jsx';
import styles from './CheckIn.module.sass';
import {ALLOWED_REFERRER_ID, logger} from '../../config';
import {validateMemberAlertToken} from '../../helpers/server';
import {InvalidCheckInTokenError, MemberNotFoundError} from '../../exceptions';

interface AlertProps {
    name: Nullable<string>;
    email: Nullable<string>;
    error: Nullable<string>;
}

export default function Alert(props: AlertProps) {
    const router = useRouter();
    const [isSafeValue, setIsSafeValue] = useState('');
    const [safeError, setsafeError] = useState<boolean | string>(false);
    const [commentValue, setCommentValue] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const {memberId, alertToken} = router.query;
    console.log(router.query)


    function isValid() {
        const errorMessage = 'This field is required.';

        if (!isSafeValue.length) {
            setsafeError(errorMessage);
        }

        return !Boolean(!isSafeValue.length);
    }

    const submit = (e: React.SyntheticEvent) => {
        e.preventDefault();

        if (isValid()) {
            setIsSubmitting(true);
            axios
                .post('/api/submit-alert', {
                    memberId,
                    alertToken,
                    isSafe: isSafeValue === 'yes',
                    comment: commentValue,
                })
                .then(() => {
                    setIsSubmitting(false);
                    setIsSubmitted(true);

                    return router.push('/success');
                })
                .catch(<T extends Error>(error: T) => {
                    if (axios.isAxiosError(error) && error.response && error.response.data) {
                        setIsSubmitting(false);
                        const errorMessage = error.response.data.message ?? 'Something went wrong.';
                        setGlobalError(errorMessage);
                    } else {
                        setGlobalError('Something went wrong. Please try again.');
                    }
                });
        }
    };

    const isSafeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setsafeError(false);
        setIsSafeValue(event.target.value);
    };


    const commentChange = (value: InputValueType) => {
        setCommentValue(value as string);
    };


    if (!memberId || !alertToken) {
        return (
            <div className={styles.container}>
                <div className={styles.formWrapper}>
                    <Banner icon={<ErrorIcon/>}>Invalid URL. Please try again through the Slack app.</Banner>;
                </div>
            </div>
        );
    }

    if (props.error) {
        const messages: ObjectLiteral = {
            invalidToken: 'Your session has expired. Please try again through the Slack application',
            notAuthed: 'You do not have permission to view this content.',
            unknownError: 'Something unexpectedly went wrong. Please try again.',
        };

        const message = messages[props.error] || messages.unknownError;

        return (
            <div className={styles.container}>
                <div className={styles.formWrapper}>
                    <Banner icon={<ErrorIcon/>}>{message}</Banner>
                </div>
            </div>
        );
    }


    return (
        <div className={styles.container}>
            <div className={styles.formWrapper}>
                {globalError && (
                    <Banner icon={<ErrorIcon/>} style={{margin: '0 0 16px'}}>{globalError}</Banner>
                )}
                <Banner type="secondary" icon={<AccountIcon/>} style={{margin: '0 0 16px'}}>
                    <><strong>Checking In: </strong><span>{props.name} ({props.email})</span></>
                </Banner>
                <form onSubmit={submit}>
                    <FormRow>
                        <Select
                            error={safeError}
                            name='isSafe'
                            label='Are you OK now?'
                            value={isSafeValue}
                            selected=''
                            onChange={isSafeChange}
                        >
                            <option disabled value=''>
                                Select
                            </option>
                            <option value='yes'>Yes</option>
                            <option value='no'>No</option>
                        </Select>
                    </FormRow>
                    <FormRow>
                        <Input
                            value={commentValue}
                            onChange={commentChange}
                            multiline
                            rows={5}
                            name='comment'
                            label='Comment'
                            placeholder='Any additional information we need to know?'
                        />
                    </FormRow>
                    <Button
                        type='submit'
                        color='secondary'
                        style={{width: 200}}
                        disabled={isSubmitting}
                    >
                        Check In
                    </Button>
                </form>
            </div>
        </div>
    );
}

export interface QueryParams {
    referrerId: string;
    memberId: string;
    alertToken: string;
}

export const getServerSideProps: GetServerSideProps = async ({query}) => {
    try {
        const {referrerId, memberId, alertToken} = query as unknown as QueryParams;
        const hasAllParams = Boolean(referrerId && memberId && alertToken);
        const hasValidReferrerId = ALLOWED_REFERRER_ID === referrerId;
        const idIsValidType = typeof memberId === 'string';
        const checkInTokenIsValidType = typeof alertToken === 'string';

        if (!hasAllParams || !hasValidReferrerId || !idIsValidType || !checkInTokenIsValidType) {
            return {props: {error: 'notAuthed'}};
        }

        const member = await alertMemberService.getById(memberId);

        validateMemberAlertToken({member, alertToken});

        const props: AlertProps = {
            name: member.name,
            email: member.email,
            error: null,
        };

        return {props};
    } catch (error) {
        logger
            ? logger.error(error)
            : console.log(error);

        const props: AlertProps = {
            name: null,
            email: null,
            error: 'unknownError',
        };

        if (error instanceof MemberNotFoundError) {
            props.error = 'notAuthed';
        }

        if (error instanceof InvalidCheckInTokenError) {
            props.error = 'invalidToken';
        }

        return {props};
    }
};
