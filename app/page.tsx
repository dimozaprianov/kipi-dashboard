import {readdir, readFile} from 'fs/promises';
import path from 'path';
import {AndroidIcon, GearIcon, IOSIcon, TestIcon, WinIcon} from "@/components/icons";
import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';
import flatten from "lodash/flatten";
import map from "lodash/map";
import find from 'lodash/find';
import {format} from 'date-fns';
import {CommitInfo} from "@/components/commitInfo";
import {IWeeklyBuildResult, IWeeklyBuildResults} from "@/data-types/weeklyBuilds";
import {SectionDetails} from "@/components/sectionDetails";

async function readTestsData<T>(folderPath: string): Promise<T[]> {
    // Replace with your folder path
    const result = [];

    try {
        // Read all files in the directory
        const files = await readdir(folderPath);

        // Filter JSON files
        const jsonFiles = files.filter(file => path.extname(file) === '.json');

        // Loop through each JSON file and parse its content
        for (const file of jsonFiles) {
            const filePath = path.join(folderPath, file);
            try {
                const data = await readFile(filePath, 'utf8');
                const jsonData = JSON.parse(data);
                result.push(jsonData)
            } catch (err) {
                console.error(`Error processing file ${file}:`, err);
            }
        }
    } catch (err) {
        console.error('Unable to scan directory:', err);
    }
    return result
}

enum EVisualStatus {
    Success,
    Error,
    Skipped,
    Warning
}

interface StatEntryProps {
    title?: string,
    result?: string,
    icon?: JSX.Element,
    status: EVisualStatus | boolean | undefined,
    detailsTitle?: string,
    log?: string,
    download?: string,
    testResults?: ITestResults,
}

function StatEntry({title, result, icon, status, detailsTitle, log, download, testResults}: StatEntryProps) {
    const classes = ["text-success", "text-error", "text-gray-300", "text-warning"]
    if (status === true)
        status = EVisualStatus.Success
    if (status === false)
        status = EVisualStatus.Error
    if (status === undefined)
        status = EVisualStatus.Skipped

    return <div className="stat relative">
        <div className={"stat-figure " + classes[status]}>
            {icon}
        </div>
        <div className="flex flex-row stat-title">{title}</div>
        <div className="stat-desc">{result}</div>
        {(log || download || testResults) && <SectionDetails desc={detailsTitle!} log={log} download={download} testResults={testResults}/>}
    </div>;
}

type PlatformBuildResultProps = {
    entry?: IWeeklyBuildResult;
    icon: JSX.Element;
    caption: string;
    detailsTitle: string;
}

function PlatformBuildResult({entry, icon, caption, detailsTitle}: PlatformBuildResultProps) {
    const common = {
        icon,
        title: caption,
        detailsTitle,
        log: entry?.Log,
        download: entry?.DownloadLink
    }
    if (!entry)
        return <StatEntry result="-" status={EVisualStatus.Skipped} {...common}/>

    return entry.Success
        ? <StatEntry result={`Success`} status={EVisualStatus.Success} {...common}/>
        : <StatEntry result="Failed" status={EVisualStatus.Error} {...common}/>
}

type BuildResultEntryProps = {
    entry?: IBuildResult;
    caption: string;
    icon: JSX.Element;
    detailsTitle: string;
}


function BuildResultEntry({entry, caption, icon, detailsTitle}: BuildResultEntryProps) {
    const common = {
        icon,
        title: caption,
        detailsTitle,
        log: entry?.BuildLog
    }

    if (!entry)
        return <StatEntry result="-" status={EVisualStatus.Skipped} {...common}/>

    return entry.BuildSuccess
        ? <StatEntry result={`Success, ${entry.BuildWarnings} warnings`} status={EVisualStatus.Success} {...common}/>
        : <StatEntry result="Failed" status={EVisualStatus.Error} {...common}/>
}

function PassedTestsEntry({icon, title, detailsTitle, rawResult}: {
    icon: JSX.Element,
    title: string,
    rawResult: ITestResults,
    detailsTitle?: string,
}) {
    const common = {
        icon,
        title,
        detailsTitle,
        log: rawResult.Log,
        testResults: rawResult,
    }
    if (rawResult.CriticalErrors)
        return <StatEntry {...common} result="Crash" status={EVisualStatus.Error}/>;
    if (rawResult.TestsTimedOut)
        return <StatEntry {...common} result="Timed Out" status={EVisualStatus.Error}/>;

    let num = 0
    const results = rawResult.Results ?? []
    for (const r of results) {
        if (r.Result)
            num++;
    }

    return <StatEntry {...common} result={`${num}/${results.length} passed`} status={
        num == results.length
            ? EVisualStatus.Success
            : num == 0
                ? EVisualStatus.Error
                : EVisualStatus.Warning
    }/>;
}


const getSuccessText = (value: true | false | undefined) => {
    switch (value) {
        case false:
            return "Failed"
        case undefined:
            return "Skipped"
        default:
            return "Success"
    }
}

function groupAndSortData<T extends {Project: string, TimeStamp: Date}>(data: T[]): T[] {
    const groupedData = groupBy(data, item => item.Project || 'NoProject');
    const sortedGroupedData = map(groupedData, group => {
            const sorted = sortBy(group, item => new Date(item.TimeStamp))
            return sorted.slice(sorted.length-1, sorted.length)
        });
    return sortBy(flatten(sortedGroupedData), item => -new Date(item.TimeStamp).getTime());
}

export default async function Home() {
    const nightlyRaw = await readTestsData<INightlyDevTestsResult>('./public/data/nightly-tests')
    const nightly = groupAndSortData(nightlyRaw)
    const weeklyRaw = await readTestsData<IWeeklyBuildResults>('./public/data/weekly-builds')
    const weekly = groupAndSortData(weeklyRaw)

    return (
        <main className="flex min-h-screen flex-col items-start justify-start p-24 prose">
            <h2>Nightly Tests</h2>
            {nightly.map((data, i) => (<div key={i}>
                    <h3 className="pl-1">{data.Project}</h3>
                    <div className="pl-1 grid grid-cols-[auto_1fr] items-center">
                        <div className="stat-desc p-1">{format(new Date(data.TimeStamp), 'EEE MMM dd yyyy HH:mm')}</div>
                        <CommitInfo commit={data.CommitInfo}/>
                    </div>

                    <div className="stats stats-vertical md:stats-horizontal shadow">
                        <BuildResultEntry
                            detailsTitle="Windows Compilation"
                            caption="Compilation"
                            entry={data}
                            icon={<GearIcon/>}/>
                        <BuildResultEntry
                            detailsTitle="iOS Compilation"
                            caption="iOS"
                            entry={find(data.MobileTestResults, e => e.Platform == "iOS")}
                            icon={<IOSIcon/>}/>
                        <BuildResultEntry
                            caption="Android"
                            detailsTitle="Android Compilation"
                            entry={find(data.MobileTestResults, e => e.Platform == "Android")}
                            icon={<AndroidIcon/>}/>
                        <StatEntry
                            title="Packaging"
                            result={getSuccessText(data.PackageSuccess)}
                            icon={<WinIcon/>}
                            status={data.PackageSuccess}/>
                        <PassedTestsEntry
                            title="Tests"
                            detailsTitle="Test Results"
                            rawResult={data.TestResults}
                            icon={<TestIcon/>}/>
                    </div>
                </div>
            ))}
            <h2>Weekly Builds</h2>
            {weekly.map((data, i) => (<div key={i}>
                    <h3 className="pl-1">{data.Project}</h3>
                    <div className="pl-1 grid grid-cols-[auto_1fr] items-center">
                        <div className="stat-desc p-1">{format(new Date(data.TimeStamp), 'EEE MMM dd yyyy HH:mm')}</div>
                        <CommitInfo commit={data.CommitInfo}/>
                    </div>

                    <div className="stats stats-vertical md:stats-horizontal shadow">
                        <PlatformBuildResult
                            caption="Windows"
                            detailsTitle="Windows Build Downloads"
                            entry={find(data.Results, e => e.Preset.startsWith("Windows"))}
                            icon={<WinIcon/>}/>
                        <PlatformBuildResult
                            caption="Android"
                            detailsTitle="Android Build Downloads"
                            entry={find(data.Results, e => e.Preset.startsWith("Android"))}
                            icon={<AndroidIcon/>}/>
                        <PlatformBuildResult
                            caption="iOS"
                            detailsTitle="iOS Build Downloads"
                            entry={find(data.Results, e => e.Preset.startsWith("iOS"))}
                            icon={<IOSIcon/>}/>
                    </div>
                </div>
            ))}
        </main>
    );
}
