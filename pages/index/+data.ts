import {PageContextServer} from "vike/types";
import {DashboardReport, ReportsClient} from "../../data-types/apiClient";

const reportsClient = new ReportsClient(undefined,{fetch: fetch})
export async function data(pageContext: PageContextServer): Promise<DashboardReport[]> {
    return await reportsClient.getDashboard()
}