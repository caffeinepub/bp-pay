import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface DepositRecord {
    timestamp: bigint;
    utrNumber: string;
    amount: number;
}
export interface UPIEntry {
    status: UPIStatus;
    totalCommission: number;
    todayCommission: number;
    upiId: string;
}
export interface DashboardStats {
    todayCommission: number;
    transferOut: number;
    transferIn: number;
    totalCurrentBalance: number;
    lockedDeposit: number;
}
export enum UPIStatus {
    running = "running",
    online = "online"
}
export interface backendInterface {
    addDeposit(amount: number, utrNumber: string): Promise<void>;
    addUpiEntry(upiId: string): Promise<void>;
    deleteUpiEntry(upiId: string): Promise<void>;
    getAllUpiEntries(): Promise<Array<UPIEntry>>;
    getDashboardStats(): Promise<DashboardStats>;
    getDepositHistory(): Promise<Array<DepositRecord>>;
    updateDashboardStats(stats: DashboardStats): Promise<void>;
}
