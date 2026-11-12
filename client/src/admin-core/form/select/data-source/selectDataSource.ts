import {type IOrdSelectOption} from '../OrdSelect';

export interface SelectDataSource {
    data: IOrdSelectOption[],
    isPending: boolean,
    clearValue?: number
}
