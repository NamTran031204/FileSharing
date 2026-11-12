import React from "react";
import {SearchFilterText} from "./SearchFilterText";
import {SearchIsActived} from "./SearchIsActived";

interface IProps {
    placeHolder?: string;
    filterTextSpan?: number;
    activeSelectSpan?: number;
}

export const SearchFilterAndIsActived: React.FC<IProps> = ({
                                                               placeHolder,
                                                               filterTextSpan = 12,
                                                               activeSelectSpan = 6
                                                           }) => {
    return (<>
        <SearchIsActived span={activeSelectSpan}/>
        <SearchFilterText placeHolder={placeHolder} span={filterTextSpan}/>
    </>);
}
