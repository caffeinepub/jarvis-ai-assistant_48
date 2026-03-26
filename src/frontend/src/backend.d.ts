import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Preferences {
    preferredAiProvider: string;
}
export interface backendInterface {
    getAllPreferences(): Promise<Array<Preferences>>;
    getMyPreferences(): Promise<Preferences>;
    isRegistered(): Promise<boolean>;
    setPreferences(preferredAiProvider: string): Promise<void>;
}
