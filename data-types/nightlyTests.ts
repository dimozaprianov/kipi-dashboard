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
    BuildWarnings?: number,
}

interface ICrossPlatformTestResults extends IBuildResult {
    Preset: string;
}

interface IGitLogEntry {
    TimeStamp: Date;
    Sha: string;
    Message: string;
    Author: string;
}

interface INightlyDevTestsResult extends IBuildResult {
    Project: string;
    TimeStamp: Date;
    CriticalError?: string;
    CriticalErrorTrace?: string;
    TestResults: ITestResults;
    CrossPlatformBuildResults: ICrossPlatformTestResults[];
    CommitInfo: IGitLogEntry;
}
