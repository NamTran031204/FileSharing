import {type ICommonInputAnyProp, type RenderNode} from "./ICommonInputProp";

export interface ICommonSelectInputProp extends Omit<ICommonInputAnyProp, "allowClear"> {
    allowClear?: boolean | {
        clearIcon?: RenderNode;
    };
}
