import {HOST_ADMIN_PER} from "@plugin-core/shared/config/permissions/permission-name/admin.permission";
import {
    MASTER_DATA_PER,
    MED_MASTER_DATA_MANAGER_PER,
    MED_ORG_MANAGER_PER
} from "@plugin-core/shared/config/permissions/permission-name/master-data.permission";

export const SURVEYOR_PER_NAME = {
    surveyor: "Surveyor",
};

export const DASHBOARD_PER_NAME = {dashboard: "Dashboard"};
export const SCAN_SESSION_PER_NAME = {scanSession: "ScanSession"};
export const AUDIT_LOG_PER_NAME = {auditLog: "Admin.AuditLog"};
export const MAP_PER_NAME = {map: "Map"};

export const PERMISSION_NAME_APP = {
    admin: HOST_ADMIN_PER,
    masterData: MASTER_DATA_PER,
    medOrg: MED_ORG_MANAGER_PER,
    medMasterData: MED_MASTER_DATA_MANAGER_PER,
    surveyor: SURVEYOR_PER_NAME,
    dashboard: DASHBOARD_PER_NAME,
    report: {survey: "Report.Survey", marketShare: "Report.MarketShare", dataExport: "Report.DataExport"},
    scanSession: SCAN_SESSION_PER_NAME,
    auditLog: AUDIT_LOG_PER_NAME,
    map: MAP_PER_NAME,
}

