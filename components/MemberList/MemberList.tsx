import React, {useMemo, useState} from 'react';
import {
    Accordion,
    AccordionCollapsible,
    AccordionTrigger,
    Banner,
    FormRow,
    Grid,
    GridCell,
    GridRow,
    Input,
    Label,
    Tag,
    Tooltip,
} from '@macpaw/macpaw-ui';
import {useRouter} from 'next/router';
import {InfoIcon} from '@macpaw/macpaw-ui/lib/Icons/jsx';
import {
    filterMembersByLastCheckInString,
    findMembersByQuery,
    getAlertStringByMember,
    getAlertTagColorByMember,
    getCountryTagColorByMember,
    getDisplayTextFromBool,
    getDisplayTextFromCheckInBoolByMember,
    getLastCheckInStringByMember,
    getLastCheckInTagColorByMember,
    getLocationStringByMember,
    getTagColorFromCheckInCriticalBoolByMember,
} from '../../helpers/client';
import MemberActions from './MemberActions/MemberActions';
import styles from './MemberList.module.sass';
import DownloadCSV from '../DownloadCSV/DownloadCSV';
import type {MemberDto} from '../../entities';
import {Nullable} from "../../types";
import {supportValues} from "../Filters/Filters";
import {Button} from "@macpaw/macpaw-ui/lib/ui";
import {InputValueType} from "@macpaw/macpaw-ui/lib/types";
import axios from "axios";

interface MemberListProps {
    teamId: string;
    members: MemberDto[];
    total: number;
    replaceMember: (member: MemberDto) => void;
}

const MemberList: React.FC<MemberListProps> = ({members, total, teamId, replaceMember}: MemberListProps) => {
    const [activeSection, setActiveSection] = useState('');
    const [projectManagerEmailForUpdate, setProjectManagerEmailForUpdate] = useState('');
    const [projectManagerEmailForView, setProjectManagerEmailForView] = useState('');
    const [showResults, setShowResults] = React.useState(false);

    const router = useRouter();
    const query = router?.query?.search as string;
    const filteredList = query ? findMembersByQuery(query, members) : members;

    const checkedInWithin24Hours = useMemo(() => {
        return filterMembersByLastCheckInString('short', filteredList);
    }, [filteredList]);

    function displayTextSupport(support: Nullable<string>) {
        if (support == null) {
            return false;
        }
        switch (support) {
            case "1":
                return supportValues[0];
            case "2":
                return supportValues[1];
            case "3":
                return supportValues[2];
            case "4":
                return supportValues[3];
            default:
                return false;
        }
    }

    const projectManagerEmailChange = (value: InputValueType) => {
        setProjectManagerEmailForUpdate(value as string);
    };


    const submit = async (e: React.SyntheticEvent, memberDto: MemberDto) => {
        e.preventDefault();

        axios
            .post('/api/update-pm-email', {
                memberId: memberDto.id,
                projectManagerEmail: projectManagerEmailForUpdate
            }).then((result) => {
            setShowResults(false);
            setProjectManagerEmailForView(result.data.projectManagerEmail)
        })
            .catch(<T extends Error>(error: T) => {
                console.log("Error with update PM!")
            });
    };

    return (
        <>
            <div className={styles.statistics}>
                <p><strong>Showing:</strong> {filteredList.length} of {total}</p>
                <p><strong>Checked-In Current Week :</strong> {checkedInWithin24Hours.length} of {filteredList.length}
                </p>
                <div className={styles.downloadCSV}>
                    <DownloadCSV members={members}/>
                </div>
            </div>
            {
                filteredList.length === 0
                    ? <Banner>
                        <b>No members found.</b> Please try your query again. If you haven&apos;t used the search or
                        filters, you
                        probably don&apos;t have administrator permissions.
                    </Banner>
                    : <Accordion onChange={(key: any) => setActiveSection(key)}>
                        {filteredList.map(member => {
                            return (
                                <Grid
                                    key={member.slackId}
                                    className={styles.panel}
                                    action={<MemberActions teamId={teamId} member={member} replaceMember={replaceMember}/>}
                                >
                                    <AccordionTrigger
                                        sectionKey={member.id}
                                        style={{cursor: 'pointer'}}
                                    >
                                        <GridRow>
                                            <GridCell type='primary'>
                                                <Label>Email</Label>
                                                <b>{member.email}</b>
                                            </GridCell>
                                            <GridCell type='primary'>
                                                <Label className={styles.labelWrapper}>
                                                    <div>Location</div>
                                                    <Tooltip
                                                        maxWidth={260}
                                                        position='top'
                                                        content={getLocationStringByMember(member)}
                                                    >
                                                        <InfoIcon className={styles.tooltipIcon}/>
                                                    </Tooltip>
                                                </Label>
                                                <Tag
                                                    color={getCountryTagColorByMember(member)}
                                                    borderRadius={20}
                                                >
                                                    {getLocationStringByMember(member)}
                                                </Tag>
                                            </GridCell>
                                            <GridCell type='secondary'>
                                                <Label>Alert status</Label>
                                                <Tag
                                                    color={getAlertTagColorByMember(member)}
                                                    borderRadius={20}
                                                >
                                                    {getAlertStringByMember(member)}
                                                </Tag>
                                            </GridCell>
                                            <GridCell type='secondary'>
                                                <Label>Last Check In</Label>
                                                <Tag
                                                    color={getLastCheckInTagColorByMember(member)}
                                                    borderRadius={20}
                                                >
                                                    {getLastCheckInStringByMember(member)}
                                                </Tag>
                                            </GridCell>
                                            <GridCell type='secondary'>
                                                <Label>Safe</Label>
                                                <Tag
                                                    color={getTagColorFromCheckInCriticalBoolByMember(member, 'isSafe')}
                                                    borderRadius={20}
                                                >
                                                    {getDisplayTextFromCheckInBoolByMember(member, 'isSafe')}
                                                </Tag>
                                            </GridCell>
                                            <GridCell type='secondary'>
                                                <Label>Able To Work</Label>
                                                <Tag
                                                    color={getTagColorFromCheckInCriticalBoolByMember(member, 'isAbleToWork')}
                                                    borderRadius={20}
                                                >
                                                    {getDisplayTextFromCheckInBoolByMember(member, 'isAbleToWork')}
                                                </Tag>
                                            </GridCell>
                                        </GridRow>
                                    </AccordionTrigger>
                                    <AccordionCollapsible sectionKey={member.id}>
                                        <GridCell type='primary'>
                                            <div style={{cursor: 'pointer'}} onClick={() => setShowResults(!showResults)}>
                                                <Label>PM e-mail</Label>
                                                <b>{projectManagerEmailForView != '' ? projectManagerEmailForView : member.projectManagerEmail}</b>
                                            </div>

                                            {!showResults ? null :
                                                <form
                                                    onSubmit={(e) => submit(e, member)}
                                                    style={{marginTop: 20}}
                                                >
                                                    <Label>Change Project Manager e-mail</Label>
                                                    <div style={{width: 450}}>
                                                        <FormRow split>
                                                            <Input
                                                                id="email_changer"
                                                                type="text"
                                                                name="email"
                                                                placeholder="PM E-mail"
                                                                style={{width: 350}}
                                                                scale="medium"
                                                                onChange={projectManagerEmailChange}
                                                            />
                                                            <Button
                                                                type='submit'
                                                                color='secondary'
                                                                style={{width: 100}}
                                                                scale="medium"
                                                            >
                                                                Update
                                                            </Button>
                                                        </FormRow>
                                                    </div>

                                                </form>
                                            }
                                        </GridCell>
                                        <GridRow>
                                            <GridCell type='primary'></GridCell>
                                            <GridCell type='primary'></GridCell>
                                            <GridCell type='primary'></GridCell>
                                            <GridCell type='primary'></GridCell>
                                        </GridRow>
                                        <GridRow>
                                            <GridCell type='primary'>
                                            </GridCell>
                                            <GridCell type='primary'>
                                            </GridCell>
                                            <GridCell type='secondary'>
                                                <Label>Company support</Label>
                                                <span>{member.checkIn && displayTextSupport(member.checkIn.support) || 'N/A'}</span>
                                            </GridCell>
                                            <GridCell type='secondary'>
                                                <Label>Other (provide comment)</Label>
                                                <span>{member.checkIn && member.checkIn.otherSupport || 'N/A'}</span>
                                            </GridCell>
                                            <GridCell type='secondary'>
                                                <Label>Number Of People To Relocate</Label>
                                                <span>{member.checkIn && member.checkIn.numberOfPeopleToRelocate || 0}</span>
                                            </GridCell>
                                        </GridRow>
                                        <GridRow>
                                            <GridCell type='primary'>
                                                <Label>Name</Label>
                                                <b>{member.name}</b>
                                            </GridCell>
                                            <GridCell type='primary'>
                                            </GridCell>
                                            <GridCell type='secondary'>
                                                <Label>Comment</Label>
                                                <span>{member.checkIn && member.checkIn.comment || 'N/A'}</span>
                                            </GridCell>
                                            <GridCell type='secondary'>
                                                <Label>Mobilized</Label>
                                                {getDisplayTextFromBool(member.isMobilized)}
                                            </GridCell>
                                            <GridCell type='secondary'>
                                            </GridCell>
                                        </GridRow>
                                        <GridRow>
                                            <GridCell type='primary'>
                                            </GridCell>
                                            <GridCell type='primary'>
                                            </GridCell>
                                            <GridCell type='secondary'>
                                                <Label>Admin</Label>
                                                {getDisplayTextFromBool(member.isAdmin)}
                                            </GridCell>
                                            <GridCell type='secondary'>
                                                <Label>Displayed On Map</Label>
                                                {getDisplayTextFromBool(member.isOptedOutOfMap)}
                                            </GridCell>
                                            <GridCell type='secondary'>
                                                <Label>Exempt From Check Ins</Label>
                                                {getDisplayTextFromBool(member.isExemptFromCheckIn)}
                                            </GridCell>
                                        </GridRow>
                                        <GridRow>
                                            <GridCell type='primary'>
                                            </GridCell>
                                            <GridCell type='primary'>
                                            </GridCell>
                                            <GridCell type='secondary'>
                                                <Label>Alert comment</Label>
                                                <span>{member.alert && member.alert.comment || 'N/A'}</span>
                                            </GridCell>
                                            <GridCell type='secondary'>
                                            </GridCell>
                                            <GridCell type='secondary'>
                                            </GridCell>
                                        </GridRow>
                                    </AccordionCollapsible>
                                </Grid>
                            );
                        })}
                    </Accordion>
            }
        </>
    );
};

export default MemberList;
