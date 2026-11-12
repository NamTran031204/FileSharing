export const PriceFixNumber = 0;
export const HotKeyScope = {
    crudPageBase: "crudPageBaseHotKeyScope",
    moveStockContainer: "moveStockContainerHotKeyScope"
}
export const DefaultAppPrefixUrl = "/app/"; // Bắt buộc có dấu / cuối cùng nha ko sẽ không hiện selected menu và Breadcrumb
export const DefaultHostPrefixUrl = "/admin/"; // Bắt buộc có dấu / cuối cùng nha ko sẽ không hiện selected menu và Breadcrumb
export type SystemCodeType = "shop" | "golf" | "hotel" | "restaurant"
export const AppExtendCode: {
    [key in "golf" | "hotel" | "restaurant" | "proShop"]: SystemCodeType
} = {
    golf: "golf",
    hotel: "hotel",
    restaurant: "restaurant",
    proShop: "shop",

}

export enum UserConst {
    SaLevel = "sa",
    SaUserLevel = "sa_user",
    UserLevel = "user"
}
