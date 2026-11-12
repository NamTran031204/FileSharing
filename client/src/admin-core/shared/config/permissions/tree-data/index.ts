import {AppBootstrapDto} from "@plugin-core/auth/service/session/dto";
import {type PERMISSION_TREE_TYPE} from "@plugin-core/shared/config/permissions/types";
import {HOST_PERMISSION_TREE} from "@plugin-core/shared/config/permissions/tree-data/host-user";

export type IUserLevelType = 'host';

export const getFullPermissionTreeDataForUser = (session?: AppBootstrapDto | null): PERMISSION_TREE_TYPE[] => {
    if (!session) {
        return [];
    }
    if (!session?.user) {
        return [];
    }
    return getFullPermissionByUserType('host');
}


export const getFullPermissionByUserType = (userType: IUserLevelType) => {
    if (userType == 'host') {
        return [...HOST_PERMISSION_TREE];
    }
    return [];
}
