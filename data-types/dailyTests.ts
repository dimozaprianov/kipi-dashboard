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

interface IDailyDevTestsResult extends IBuildResult {
    Project?: string;
    PackageSuccess?: boolean;
    StartTime: Date;
    CriticalError?: string;
    CriticalErrorTrace?: string;
    TestResults: ITestResults;
    MobileTestResults: ICrossPlatformTestResults[];
}
