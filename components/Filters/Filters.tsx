import React, {useMemo} from 'react';
import {getCountriesForFilterByMembers} from '../../helpers/client';
import {Button, Select} from '@macpaw/macpaw-ui';
import styles from './Filters.module.sass';
import type {BooleanPropString, CheckInString} from '../../types';
import type {MemberDto} from '../../entities';
import {
    TYPE_APP,
    option_24_hour,
    option_48_hour,
    option_current_week,
    option_last_week,
    option_current_month, option_last_month
} from "../../config/custom/app-config";

export const supportValues = [
    'I don\'t need any help',
    'Help only with a request for accommodation at the time of temporary relocation',
    'Organize temporary relocation (2-4 days), including transportation',
    'Other (provide comment)'
]

interface FiltersProps {
    members: MemberDto[];
    states: string[];
    cities: string[];
    filterByCountry: string;
    handleCountryFilter: (country: string) => void;
    filterByState: string;
    handleStateFilter: (state: string) => void;
    filterByCity: string;
    handleCityFilter: (city: string) => void;
    filterByCheckIn: CheckInString | '';
    handleCheckInFilter: (checkedIn: CheckInString | '') => void;
    filterIsSafe: BooleanPropString;
    handleIsSafeFilter: (isSafe: BooleanPropString) => void;
    filterCanWork: BooleanPropString;
    handleCanWorkFilter: (canWork: BooleanPropString) => void;
    filterIsMobilized: BooleanPropString;
    handleIsMobilizedFilter: (isMobilized: BooleanPropString) => void;
    filterSupport: string;
    handleFilterSupport: (support: string) => void;
    filterIsExemptFromCheckIn: BooleanPropString;
    handleIsExemptFromCheckInFilter: (isExemptFromCheckIn: BooleanPropString) => void;
    handleClearFilters: () => void;
}

const Filters: React.FC<FiltersProps> = ({
                                             members,
                                             states,
                                             cities,
                                             filterByCountry,
                                             handleCountryFilter,
                                             filterByState,
                                             handleStateFilter,
                                             filterByCity,
                                             handleCityFilter,
                                             filterByCheckIn,
                                             handleCheckInFilter,
                                             filterIsSafe,
                                             handleIsSafeFilter,
                                             filterIsMobilized,
                                             handleIsMobilizedFilter,
                                             filterCanWork,
                                             handleCanWorkFilter,
                                             filterSupport,
                                             handleFilterSupport,
                                             filterIsExemptFromCheckIn,
                                             handleIsExemptFromCheckInFilter,
                                             handleClearFilters,
                                         }: FiltersProps) => {
    const memoizedCountries = useMemo(() => getCountriesForFilterByMembers(members), [members]);

    const changeCountryFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedCountry = e.target.value;
        handleCountryFilter(selectedCountry);
    };

    const changeStateFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedState = e.target.value;

        handleStateFilter(selectedState);
    };

    const changeCityFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedCity = e.target.value;

        handleCityFilter(selectedCity);
    };

    const changeCheckedInFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedCheckedIn: any = e.target.value;

        handleCheckInFilter(selectedCheckedIn.toLowerCase());
    };

    const changeIsSafeFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        handleIsSafeFilter(e.target.value as BooleanPropString);
    };

    const changeCanWorkFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        handleCanWorkFilter(e.target.value as BooleanPropString);
    };

    const changeIsMobilizedFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        handleIsMobilizedFilter(e.target.value as BooleanPropString);
    };

    const changeSupportFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        handleFilterSupport(e.target.value as string);
    };

    const changeIsExemptFromCheckInFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        handleIsExemptFromCheckInFilter(e.target.value as BooleanPropString);
    };

    function textForShortCheckInFilter() {
        switch (TYPE_APP) {
            // @ts-ignore
            case 1:
                return option_24_hour;
            // @ts-ignore
            case 2:
                return option_current_week;
            // @ts-ignore
            case 3:
                return option_current_month;
            default:
                return ""
        }
    }

    function textForLongCheckInFilter() {
        switch (TYPE_APP) {
            // @ts-ignore
            case 1:
                return option_48_hour;
            // @ts-ignore
            case 2:
                return option_last_week;
            // @ts-ignore
            case 3:
                return option_last_month;
            default:
                return ""
        }
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.filters}>
                <div className={styles.filtersRow}>
                    <Select
                        scale='small'
                        label='Is Safe'
                        value={filterIsSafe}
                        onChange={changeIsSafeFilter}
                        className={styles.select}
                    >
                        <option value='both'>All</option>
                        <option value='yes'>Yes</option>
                        <option value='no'>No</option>
                    </Select>
                    <Select
                        scale='small'
                        label='Can Work'
                        value={filterCanWork}
                        onChange={changeCanWorkFilter}
                        className={styles.select}
                    >
                        <option value='both'>All</option>
                        <option value='yes'>Yes</option>
                        <option value='no'>No</option>
                    </Select>
                    <Select
                        scale='small'
                        label='Is Mobilized'
                        value={filterIsMobilized}
                        onChange={changeIsMobilizedFilter}
                        className={styles.select}
                    >
                        <option value='both'>All</option>
                        <option value='yes'>Yes</option>
                        <option value='no'>No</option>
                    </Select>
                    <Select
                        scale='small'
                        label='Last Check In'
                        value={filterByCheckIn}
                        onChange={changeCheckedInFilter}
                        className={styles.select}
                    >
                        <option value=''>All</option>
                        <option value="short">{textForShortCheckInFilter()}</option>
                        <option value="long">{textForLongCheckInFilter()}</option>
                        <option value="never">Never</option>
                        <option value="other">Other</option>
                    </Select>
                    <Select
                        scale='small'
                        label='Company support'
                        value={filterSupport}
                        onChange={changeSupportFilter}
                        className={styles.select}
                    >
                        <option value=''>All</option>
                        <option value='1'>{supportValues[0]}</option>
                        <option value='2'>{supportValues[1]}</option>
                        <option value='3'>{supportValues[2]}</option>
                        <option value='4'>{supportValues[3]}</option>
                    </Select>
                    <Select
                        scale='small'
                        label='Exempt From Check In'
                        value={filterIsExemptFromCheckIn}
                        onChange={changeIsExemptFromCheckInFilter}
                        className={styles.select}
                    >
                        <option value='both'>All</option>
                        <option value='yes'>Yes</option>
                        <option value='no'>No</option>
                    </Select>

                    <div className={styles.filtersRow}>
                        <Select
                            scale='small'
                            label='Country'
                            value={filterByCountry}
                            onChange={changeCountryFilter}
                            className={styles.select}
                        >
                            <option value=''>All</option>
                            {memoizedCountries.map((country) => (
                                <option key={country} value={country}>{country}</option>
                            ))}
                        </Select>
                        <Select
                            scale='small'
                            label='State'
                            value={filterByState}
                            onChange={changeStateFilter}
                            disabled={!filterByCountry}
                            className={styles.select}
                        >
                            <option value=''>All</option>
                            {states.map((state) => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </Select>
                        <Select
                            scale='small'
                            label='City'
                            value={filterByCity}
                            onChange={changeCityFilter}
                            disabled={!filterByCountry}
                            className={styles.select}
                        >
                            <option value=''>All</option>
                            {cities.map((city) => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </Select>
                        <div className={styles.clearFilters}>
                            <Button onClick={handleClearFilters} color="warning" outline scale="small">Clear All
                                Filters</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Filters;
