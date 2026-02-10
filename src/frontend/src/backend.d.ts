import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface DailyServiceReport {
    id: string;
    customerName: string;
    issueResolved: boolean;
    issueFoundByEngineer: string;
    nextPlanOfAction?: string;
    machineModel: string;
    date: string;
    createdBy: Principal;
    contactPerson: string;
    mobileNumber: string;
    sparesRequired: string;
    solution: string;
    customerFeedback: string;
    travelingExpensePaid: boolean;
    machineSerialNo: string;
    warrantyStatus: string;
    issueDescribedByCustomer: string;
}
export interface UserProfile {
    username: string;
    name: string;
    role: Role;
    mobileNumber: string;
    email: string;
}
export enum Role {
    admin = "admin",
    engineer = "engineer"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createReport(report: DailyServiceReport): Promise<string>;
    deleteUser(user: Principal): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getPendingSignupsCount(): Promise<bigint>;
    getReportById(id: string): Promise<DailyServiceReport | null>;
    getReportsForDownload(): Promise<Array<DailyServiceReport>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listReports(): Promise<Array<DailyServiceReport>>;
    listUsers(): Promise<Array<[Principal, UserProfile]>>;
    processPendingSignups(): Promise<bigint>;
    purgeLegacyReportsAndUsers(): Promise<void>;
    resetToFreshApp(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    signupAdmin(profile: UserProfile, password: string): Promise<void>;
    signupWithRole(profile: UserProfile, requestedRole: Role): Promise<void>;
    updateUserRole(user: Principal, newRole: Role): Promise<void>;
}
