import {Component, For, Show, JSX} from "solid-js"
import {AndroidIcon, GearIcon, IOSIcon, TestIcon, WinIcon} from "../../components/icons"
import _find from "lodash/find"
import {format} from "date-fns"
import {CommitInfo} from "../../components/commitInfo"
import {SectionDetails} from "../../components/sectionDetails"
import { useData } from "vike-solid/useData"
import {DashboardReport, TestResults, WeeklyBuildResult} from "../../data-types/apiClient";



enum EVisualStatus {
    Success,
    Error,
    Skipped,
    Warning,
}

interface StatEntryProps {
    title?: string;
    result?: string;
    icon?: JSX.Element;
    status: EVisualStatus | boolean | undefined;
    detailsTitle?: string;
    log?: string;
    download?: string;
    testResults?: TestResults;
}

const StatEntry: Component<StatEntryProps> = (props) => {
    let {title, result, icon, status, detailsTitle, log, download, testResults} = props;
    const classes = ["text-success", "text-error", "text-gray-300", "text-warning"];

    if (status === true) status = EVisualStatus.Success;
    if (status === false) status = EVisualStatus.Error;
    if (status === undefined) status = EVisualStatus.Skipped;

    return (
        <div class="stat relative">
            <div class={"stat-figure " + classes[status]}>
                {icon}
            </div>
            <div class="flex flex-row stat-title">{title}</div>
            <div class="stat-desc">{result}</div>
            <Show when={log || download || testResults}>
                <SectionDetails desc={detailsTitle!} log={log} download={download} testResults={testResults}/>
            </Show>
        </div>
    );
};

interface PlatformBuildResultProps {
    entry?: WeeklyBuildResult;
    icon: JSX.Element;
    caption: string;
    detailsTitle: string;
}

const PlatformBuildResult = (props: PlatformBuildResultProps) => {
    const common = () => {
        return {
            icon: props.icon,
            title: props.caption,
            detailsTitle: props.detailsTitle,
            log: props.entry?.log,
            download: props.entry?.downloadLink,
        }
    };

    return (
        <Show
            when={props.entry}
            fallback={<StatEntry result="-" status={EVisualStatus.Skipped} {...common()} />}
        >
            <StatEntry
                result={props.entry?.success ? "Success" : "Failed"}
                status={props.entry?.success ? EVisualStatus.Success : EVisualStatus.Error}
                {...common()}
            />
        </Show>
    );
};

interface IBuildResult {
    buildLog?: string,
    buildWarnings?: number
    buildSuccess: boolean
}

interface BuildResultEntryProps {
    entry?: IBuildResult;
    caption: string;
    icon: JSX.Element;
    detailsTitle: string;
}

const BuildResultEntry = (props: BuildResultEntryProps) => {
    const common = () => {
        return {
            icon: props.icon,
            title: props.caption,
            detailsTitle: props.detailsTitle,
            log: props.entry?.buildLog,
        }
    };

    return (
        <Show
            when={props.entry}
            fallback={<StatEntry result="-" status={EVisualStatus.Skipped} {...common} />}
        >
            <StatEntry
                result={`Success${props.entry?.buildWarnings !== undefined ? `, ${props.entry?.buildWarnings} warnings` : ""}`}
                status={props.entry?.buildSuccess ? EVisualStatus.Success : EVisualStatus.Error}
                {...common}
            />
        </Show>
    );
};

interface PassedTestsEntryProps {
    icon: JSX.Element;
    title: string;
    detailsTitle?: string;
    rawResult: TestResults;
}

const PassedTestsEntry: Component<PassedTestsEntryProps> = (props) => {
    const {icon, title, detailsTitle, rawResult} = props;
    const common = {
        icon,
        title,
        detailsTitle,
        log: rawResult?.log ?? "",
        testResults: rawResult,
    };

    return (
        <Show
            when={rawResult?.criticalErrors || rawResult?.testsTimedOut}
            fallback={
                <StatEntry
                    {...common}
                    result={
                        !rawResult?.results
                            ? "Skipped"
                            : `${rawResult.results.filter(r => r.result).length}/${rawResult.results.length} passed`
                    }
                    status={
                        !rawResult?.results
                            ? EVisualStatus.Skipped
                            : rawResult.results.filter(r => r.result).length === rawResult.results.length
                                ? EVisualStatus.Success
                                : EVisualStatus.Error
                    }
                />
            }
        >
            <Show when={rawResult?.criticalErrors} fallback={
                <Show when={rawResult?.testsTimedOut}
                      fallback={<StatEntry {...common} result="Timed Out" status={EVisualStatus.Error}/>}>
                    <StatEntry {...common} result="Crash" status={EVisualStatus.Error}/>
                </Show>
            }>
                <StatEntry {...common} result="Crash" status={EVisualStatus.Error}/>
            </Show>
        </Show>
    );
};

const getSuccessText = (value: true | false | undefined): string => {
    switch (value) {
        case false:
            return "Failed";
        case undefined:
            return "Skipped";
        default:
            return "Success";
    }
};

const Page: Component = () => {
    const projects = useData<DashboardReport[]>()

    return (
        <main class="flex min-h-screen flex-col items-start justify-start p-24 prose">
            <h2>Nightly Tests</h2>
            <For each={projects}>
                {(project, i) => (
                    <div>
                        <h3 class="pl-1">{project.project}</h3>
                        <For each={project.nightly}>
                            {(entry) => (
                                <>
                                    <div class="pl-1 grid grid-cols-[auto_1fr] items-center">
                                        <div
                                            class="stat-desc p-1">{format(new Date(entry.timeStamp), 'EEE MMM dd yyyy HH:mm')}</div>
                                        <CommitInfo commit={entry.commitInfo}/>
                                    </div>
                                    <div class="stats stats-vertical md:stats-horizontal shadow mb-2">
                                        <BuildResultEntry
                                            detailsTitle="Windows Compilation"
                                            caption="Compilation"
                                            entry={entry}
                                            icon={<GearIcon/>}
                                        />
                                        <BuildResultEntry
                                            caption="Windows"
                                            detailsTitle="Windows Build"
                                            entry={_find(entry.crossPlatformBuildResults, e => e.preset === "Windows")}
                                            icon={<WinIcon/>}
                                        />
                                        <BuildResultEntry
                                            detailsTitle="iOS Build"
                                            caption="iOS"
                                            entry={_find(entry.crossPlatformBuildResults, e => e.preset === "iOS")}
                                            icon={<IOSIcon/>}
                                        />
                                        <BuildResultEntry
                                            caption="Android"
                                            detailsTitle="Android Build"
                                            entry={_find(entry.crossPlatformBuildResults, e => e.preset === "Android")}
                                            icon={<AndroidIcon/>}
                                        />
                                        <PassedTestsEntry
                                            title="Tests"
                                            detailsTitle="Test Results"
                                            rawResult={entry?.testResults!}
                                            icon={<TestIcon/>}
                                        />
                                    </div>
                                </>
                            )}
                        </For>
                    </div>
                )}
            </For>

            <h2>Weekly Builds</h2>
            <For each={projects}>
                {(projectData, i) => (
                    <div>
                        <h3 class="pl-1">{projectData.project}</h3>
                        <For each={projectData.weekly}>
                            {(entry) => (
                                <>
                                    <div class="pl-1 grid grid-cols-[auto_1fr] items-center">
                                        <div
                                            class="stat-desc p-1">{format(new Date(entry.timeStamp), 'EEE MMM dd yyyy HH:mm')}</div>
                                        <CommitInfo commit={entry.commitInfo}/>
                                    </div>
                                    <div class="stats stats-vertical md:stats-horizontal shadow mb-2">
                                        <PlatformBuildResult
                                            caption="Windows"
                                            detailsTitle="Windows Build Downloads"
                                            entry={_find(entry.results, e => e.preset?.startsWith("Windows"))}
                                            icon={<WinIcon/>}
                                        />
                                        <PlatformBuildResult
                                            caption="Android"
                                            detailsTitle="Android Build Downloads"
                                            entry={_find(entry.results, e => e.preset?.startsWith("Android"))}
                                            icon={<AndroidIcon/>}
                                        />
                                        <PlatformBuildResult
                                            caption="iOS"
                                            detailsTitle="iOS Build Downloads"
                                            entry={_find(entry.results, e => e.preset?.startsWith("iOS"))}
                                            icon={<IOSIcon/>}
                                        />
                                    </div>
                                </>
                            )}
                        </For>
                    </div>
                )}
            </For>
        </main>
    );
};

export default Page;