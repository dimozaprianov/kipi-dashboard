export interface IWeeklyBuildResult {
    Preset: string;
    Success: boolean;
    DownloadLink?: string; // Optional, equivalent to C# nullable string
    Log: string;
}

export interface IWeeklyBuildResults {
    Project: string;
    TimeStamp: Date; // DateTime maps to Date in TypeScript
    Results: IWeeklyBuildResult[]; // List in C# maps to an array in TypeScript
    CommitInfo: IGitLogEntry; // Assuming GitLogEntry is defined elsewhere
}
