import {PERMISSION_NAME_APP} from "@plugin-core/shared/config/permissions/permission-name";
import {
    CRUD_ACTIONS,
    DASHBOARD_ACTIONS,
    SCAN_SESSION_ACTIONS,
    SURVEY_DEVICE_ACTIONS,
    WORK_ORDER_ACTIONS
} from "../const";
import {type PERMISSION_TREE_TYPE} from "@plugin-core/shared/config/permissions/types";

export const HOST_PERMISSION_TREE: PERMISSION_TREE_TYPE[] = [
    {
        groupName: 'group-surveyor',
        items: [
            {name: PERMISSION_NAME_APP.surveyor.surveyor, actions: ['Workspace']},
        ],
    },
    {
        groupName: 'group-dashboard-report',
        items: [
            {name: PERMISSION_NAME_APP.dashboard.dashboard, actions: [...DASHBOARD_ACTIONS]},
            {name: PERMISSION_NAME_APP.report.survey, actions: ['View', 'Export']},
            {name: PERMISSION_NAME_APP.report.marketShare, actions: ['View', 'Export']},
            {name: PERMISSION_NAME_APP.report.dataExport, actions: ['View', 'Export', 'ExportRaw']},
            {name: PERMISSION_NAME_APP.scanSession.scanSession, actions: [...SCAN_SESSION_ACTIONS]},
            {name: PERMISSION_NAME_APP.auditLog.auditLog, actions: ['GetPaged', 'Export']},
        ],
    },
    {
        groupName: 'group-infrastructure',
        items: [
            {name: PERMISSION_NAME_APP.masterData.btsStation, actions: [...CRUD_ACTIONS]},
            {name: PERMISSION_NAME_APP.masterData.cableCabinet, actions: [...CRUD_ACTIONS]},
            {name: PERMISSION_NAME_APP.masterData.workOrder, actions: [...WORK_ORDER_ACTIONS]},
            {name: PERMISSION_NAME_APP.map.map, actions: ['View', 'Infrastructure', 'WorkOrder']},
        ],
    },
    {
        groupName: 'group-master-data',
        items: [
            {name: PERMISSION_NAME_APP.masterData.province, actions: ['GetPaged', 'GetDetail', 'Create', 'Update', 'Delete', 'Export']},
            {name: PERMISSION_NAME_APP.masterData.ward, actions: ['GetPaged', 'GetDetail', 'Create', 'Update', 'Delete', 'Export']},
            {name: PERMISSION_NAME_APP.masterData.ispProvider, actions: ['GetPaged', 'GetDetail', 'Create', 'Update', 'Delete', 'Export']},
            {name: PERMISSION_NAME_APP.masterData.bssidRule, actions: [...CRUD_ACTIONS]},
            {name: PERMISSION_NAME_APP.masterData.surveyDevice, actions: [...SURVEY_DEVICE_ACTIONS]},
            {name: PERMISSION_NAME_APP.masterData.sequence, actions: ['GetPaged', 'GetDetail', 'Create', 'Update', 'Delete', 'Export']},
        ],
    },
    {
        groupName: 'group-human',
        items: [
            {name: PERMISSION_NAME_APP.masterData.department, actions: [...CRUD_ACTIONS]},
            {name: PERMISSION_NAME_APP.masterData.employee, actions: [...CRUD_ACTIONS, 'ManageAccount']},
        ],
    },
    {
        groupName: 'group-system',
        items: [
            {name: PERMISSION_NAME_APP.admin.role, actions: ['GetPaged', 'GetDetail', 'Create', 'Update', 'Delete', 'SetPermission', 'Export']},
            {name: PERMISSION_NAME_APP.admin.user, actions: ['GetPaged', 'GetDetail', 'Create', 'Update', 'Delete', 'SetPermission', 'ResetPassword', 'AssignRole', 'Export']},
            {name: PERMISSION_NAME_APP.admin.userToken, actions: ['GetPaged', 'Revoke']},
            {name: PERMISSION_NAME_APP.admin.setting, actions: ['GetPaged', 'SetValue']},
        ],
    },
]
