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
import {filter} from "lodash";

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
        log: rawResult?.Log ?? "",
        testResults: rawResult,
    }
    if (rawResult?.CriticalErrors)
        return <StatEntry {...common} result="Crash" status={EVisualStatus.Error}/>;
    if (rawResult?.TestsTimedOut)
        return <StatEntry {...common} result="Timed Out" status={EVisualStatus.Error}/>;

    let num = 0
    const results = rawResult?.Results ?? []
    for (const r of results) {
        if (r.Result)
            num++;
    }

    return <StatEntry {...common} result={results.length === 0 ? "Skipped" : `${num}/${results.length} passed`} status={
        results.length == 0
            ? EVisualStatus.Skipped
            : num == results.length
                ? EVisualStatus.Success
                : EVisualStatus.Error
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

function groupAndSortData<T extends {Project: string, TimeStamp: Date}>(data: T[]): T[][] {
    const groupedData = filter(groupBy(data, item => item.Project || 'NoProject'), a => a.length > 0);
    const sortedGroupedData = map(groupedData, group => {
            return sortBy(group, item => -new Date(item.TimeStamp).getTime())
        });
    return sortBy(sortedGroupedData, item => item.length > 0 ? -new Date(item[0].TimeStamp).getTime() : -1);
}

export default async function Home() {
    const nightlyRaw = await readTestsData<INightlyDevTestsResult>('./public/data/nightly-tests')
    const nightly = groupAndSortData(nightlyRaw)
    const weeklyRaw = await readTestsData<IWeeklyBuildResults>('./public/data/weekly-builds')
    const weekly = groupAndSortData(weeklyRaw)

    return (
        <main className="flex min-h-screen flex-col items-start justify-start p-24 prose">
            <h2>Nightly Tests</h2>
            {nightly.map((data, i) => (
                <div key={i}>
                    <h3 className="pl-1">{data[0].Project}</h3>
                    {data.map(entry => (<>
                        <div className="pl-1 grid grid-cols-[auto_1fr] items-center">
                            <div
                                className="stat-desc p-1">{format(new Date(entry.TimeStamp), 'EEE MMM dd yyyy HH:mm')}</div>
                            <CommitInfo commit={entry.CommitInfo}/>
                        </div>
                        <div className="stats stats-vertical md:stats-horizontal shadow mb-2">
                            <BuildResultEntry
                                detailsTitle="Windows Compilation"
                                caption="Compilation"
                                entry={entry}
                                icon={<GearIcon/>}/>
                            <BuildResultEntry
                                detailsTitle="iOS Compilation"
                                caption="iOS"
                                entry={find(entry.MobileTestResults, e => e.Platform == "iOS")}
                                icon={<IOSIcon/>}/>
                            <BuildResultEntry
                                caption="Android"
                                detailsTitle="Android Compilation"
                                entry={find(entry.MobileTestResults, e => e.Platform == "Android")}
                                icon={<AndroidIcon/>}/>
                            <StatEntry
                                title="Packaging"
                                result={getSuccessText(entry.PackageSuccess)}
                                icon={<WinIcon/>}
                                status={entry.PackageSuccess}/>
                            <PassedTestsEntry
                                title="Tests"
                                detailsTitle="Test Results"
                                rawResult={entry?.TestResults}
                                icon={<TestIcon/>}/>
                        </div>
                        </>))}
                        </div>
                    ))}
                    <h2>Weekly Builds</h2>
                    {weekly.map((data, i) => (<div key={i}>
                        <h3 className="pl-1">{data[0].Project}</h3>
                        {data.map(entry => <>
                            <div className="pl-1 grid grid-cols-[auto_1fr] items-center">
                            <div className="stat-desc p-1">{format(new Date(entry.TimeStamp), 'EEE MMM dd yyyy HH:mm')}</div>
                            <CommitInfo commit={entry.CommitInfo}/>
                        </div>

                        <div className="stats stats-vertical md:stats-horizontal shadow mb-2">
                            <PlatformBuildResult
                                caption="Windows"
                                detailsTitle="Windows Build Downloads"
                                entry={find(entry.Results, e => e.Preset.startsWith("Windows"))}
                                icon={<WinIcon/>}/>
                            <PlatformBuildResult
                                caption="Android"
                                detailsTitle="Android Build Downloads"
                                entry={find(entry.Results, e => e.Preset.startsWith("Android"))}
                                icon={<AndroidIcon/>}/>
                            <PlatformBuildResult
                                caption="iOS"
                                detailsTitle="iOS Build Downloads"
                                entry={find(entry.Results, e => e.Preset.startsWith("iOS"))}
                                icon={<IOSIcon/>}/>
                        </div>
                    </>)}
            </div>))}
        </main>
    );
}
