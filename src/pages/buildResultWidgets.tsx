import {Component, JSX, Show} from "solid-js";
import {SectionDetails} from "../components/sectionDetails";
import {T} from "../components/typography";
import {InfoIcon} from "../components/infoIcon";
import {PeriodicTestsResult, PlatformFullBuild, PlatformTests, TestResult} from "../api/apiClient";

export enum EVisualStatus {
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
    testResults?: TestResult[];
}

export const StatEntry: Component<StatEntryProps> = (props) => {
    let {title, result, icon, status, detailsTitle, log, download, testResults} = props;
    const classes = ["text-green-400", "text-red-400", "text-gray-400", "text-blue-400"];

    if (status === true) status = EVisualStatus.Success;
    if (status === false) status = EVisualStatus.Error;
    if (status === undefined) status = EVisualStatus.Skipped;

    return (
        <div class="flex flex-row items-center gap-2 relative">
            <div class={classes[status]}>
                {icon}
            </div>
            <div class="flex flex-col justify-center">
                <T variant="subtitle">{title}</T>
                <T variant="subtitle" size="sm">{result}</T>
            </div>
            <Show when={log || download || testResults}>
                <InfoIcon class="ml-4 fill-blue-400" size={16}/>
                <SectionDetails desc={detailsTitle!} log={log} download={download} testResults={testResults}/>
            </Show>
        </div>
    );
};

interface PassedTestsEntryProps {
    icon: JSX.Element;
    title: string;
    detailsTitle?: string;
    entry: PlatformTests;
}

export const PassedTestsEntry: Component<PassedTestsEntryProps> = (props) => {
    const {icon, title, detailsTitle, entry} = props;
    const common = {
        log: props.entry.testsLog,
        icon,
        title,
        detailsTitle,
        testResults: entry.results,
    };

    return (
        <Show
            when={entry.buildSuccess && !entry.testsCriticalErrors && !entry.testsTimedOut}
            fallback={
                <Show when={!entry.buildSuccess}
                      fallback={
                          <Show when={entry.testsCriticalErrors} fallback={
                              <Show when={entry.testsTimedOut}
                                    fallback={
                                        <StatEntry {...common} result="Timed Out" status={EVisualStatus.Error}/>
                                    }>
                                  <StatEntry {...common} result="Crash" status={EVisualStatus.Error}/>
                              </Show>
                          }>
                              <StatEntry {...common} result="Crash" status={EVisualStatus.Error}/>
                          </Show>}>
                    <StatEntry {...common} result="None Ran" status={EVisualStatus.Skipped}/>
                </Show>
            }>
            <StatEntry
                {...common}
                result={
                    !entry
                        ? "Skipped"
                        : `${entry.results.filter(r => r.result).length}/${entry.results.length} passed`
                }
                status={
                    !entry
                        ? EVisualStatus.Skipped
                        : entry.results.filter(r => r.result).length === entry.results.length
                            ? EVisualStatus.Success
                            : EVisualStatus.Error
                }
            />
        </Show>
    );
};

interface PlatformBuildResultProps {
    entry?: PlatformTests;
    icon: JSX.Element;
    title: string;
    detailsTitle: string;
}

export const PlatformCompileResult = (props: PlatformBuildResultProps) => {
    const common = () => {
        return {
            icon: props.icon,
            title: props.title,
            detailsTitle: props.detailsTitle,
            log: props.entry?.buildLog
        }
    };

    return (
        <Show
            when={props.entry}
            fallback={<StatEntry result="-" status={EVisualStatus.Skipped} {...common} />}
        >
            <StatEntry
                result={`Success${props.entry?.compilationWarnings !== undefined ? `, ${props.entry?.compilationWarnings} warnings` : ""}`}
                status={props.entry?.buildSuccess ? EVisualStatus.Success : EVisualStatus.Error}
                {...common}
            />
        </Show>
    );
};

interface PlatformFullBuildResultProps {
    entry?: PlatformFullBuild;
    icon: JSX.Element;
    title: string;
    detailsTitle: string;
}

export const PlatformFullBuildResult = (props: PlatformFullBuildResultProps) => {
    const common = () => {
        return {
            icon: props.icon,
            title: props.title,
            detailsTitle: props.detailsTitle,
            log: props.entry?.log,
            download: props.entry.link
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