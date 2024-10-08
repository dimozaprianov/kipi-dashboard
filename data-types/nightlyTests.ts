interface ITestResult {
    Test: string;
    Result: boolean;
}

interface ITestResults {
    Log: string;
    CriticalErrors: boolean;
    TestsTimedOut: boolean;
    Results: ITestResult[];
}

interface IBuildResult {
    BuildSuccess: boolean,
    BuildLog: string,
    BuildWarnings: number,
    entry?: any
}

interface ICrossPlatformTestResults extends IBuildResult {
    Platform: string;
}

interface IGitLogEntry {
    TimeStamp: Date;
    Sha: string;
    Message: string;
    Author: string;
}

interface INightlyDevTestsResult extends IBuildResult {
    Project: string;
    PackageSuccess?: boolean;
    TimeStamp: Date;
    CriticalError?: string;
    CriticalErrorTrace?: string;
    TestResults: ITestResults;
    MobileTestResults: ICrossPlatformTestResults[];
    CommitInfo: IGitLogEntry;
}
