import {readdir, readFile} from 'fs/promises';
import path from 'path';
import {AndroidIcon, GearIcon, IOSIcon, TestIcon, WinIcon} from "@/components/icons";
import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';
import flatten from "lodash/flatten";
import map from "lodash/map";
import find from 'lodash/find';
import {format} from 'date-fns';
import {forEach} from "lodash";
import {CommitInfo} from "@/components/commitInfo";

async function readNightlyTests(): Promise<INightlyDevTestsResult[]> {
// Replace with your folder path
    const folderPath = './public/data/nightly-tests';
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
    status: EVisualStatus | boolean | undefined
}

function StatEntry({title, result, icon, status}: StatEntryProps) {
    const classes = ["text-success", "text-error", "text-gray-300", "text-warning"]
    if (status === true)
        status = EVisualStatus.Success
    if (status === false)
        status = EVisualStatus.Error
    if (status === undefined)
        status = EVisualStatus.Skipped

    return <div className="stat">
        <div className={"stat-figure " + classes[status]}>
            {icon}
        </div>
        <div className="stat-title">{title}</div>
        <div className="stat-desc">{result}</div>
    </div>;
}

function BuildResultEntry({entry, caption, icon}: { entry?: IBuildResult, caption: string, icon: JSX.Element }) {
    if (!entry)
        return <StatEntry title={caption} result="Skipped" icon={icon} status={EVisualStatus.Skipped}/>

    return entry.BuildSuccess
        ? <StatEntry title={caption} result={`Success, ${entry.BuildWarnings} warnings`} icon={icon} status={EVisualStatus.Success}/>
        : <StatEntry title={caption} result="Failed" icon={icon} status={EVisualStatus.Error}/>
}

function PassedTestsEntry({icon, title, rawResult}: {
    icon: JSX.Element,
    title: string,
    rawResult: ITestResults
}) {
    if (rawResult.CriticalErrors)
        return <StatEntry title={title} result="Crash" icon={icon} status={EVisualStatus.Error}/>;
    if (rawResult.TestsTimedOut)
        return <StatEntry title={title} result="Timed Out" icon={icon} status={EVisualStatus.Error}/>;

    let num = 0
    const results = rawResult.Results ?? []
    for (const r of results) {
        if (r.Result)
            num++;
    }

    return <StatEntry title={title} result={`${num}/${results.length} passed`} icon={<WinIcon/>} status={
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

export default async function Home() {
    const data = await readNightlyTests()
    const groupedData = groupBy(data, item => item.Project || 'NoProject');
    const sortedGroupedData = map(groupedData, group =>
        sortBy(group, item => new Date(item.StartTime))
    );
    const result = sortBy(flatten(sortedGroupedData), item => -new Date(item.StartTime).getTime());

    return (
        <main className="flex min-h-screen flex-col items-start justify-start p-24 prose">
            <h2>Nightly Tests</h2>
            {result.map((data, i) => (<div key={i}>
                    <h3 className="pl-1">{data.Project}</h3>
                    <div className="pl-1 grid grid-cols-[auto_1fr] items-center">
                        <div className="stat-desc p-1">{format(new Date(data.StartTime), 'EEE MMM dd yyyy HH:mm')}</div>
                        <CommitInfo commit={data.CommitInfo}/>
                    </div>

                    <div className="stats shadow">
                        <BuildResultEntry caption="Build" entry={data} icon={<GearIcon/>}/>
                        <BuildResultEntry caption="iOS" entry={find(data.MobileTestResults, e => e.Platform == "iOS")}
                                          icon={<IOSIcon/>}/>
                        <BuildResultEntry caption="Android"
                                          entry={find(data.MobileTestResults, e => e.Platform == "Android")}
                                          icon={<AndroidIcon/>}/>
                        <StatEntry title="Packaging" result={getSuccessText(data.PackageSuccess)} icon={<WinIcon/>}
                                   status={data.PackageSuccess}/>
                        <PassedTestsEntry title="Tests" rawResult={data.TestResults} icon={<TestIcon/>}/>
                    </div>
                </div>
            ))}
        </main>
    );
}
