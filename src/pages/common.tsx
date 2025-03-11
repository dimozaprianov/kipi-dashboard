import {Component, JSX, Show} from "solid-js";
import {TestResults} from "../api/apiClient";
import {SectionDetails} from "../components/sectionDetails";
import { T } from "../components/typography";
import {Button} from "../shadcn/components/ui/button";
import {InfoIcon} from "../components/infoIcon";

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
    testResults?: TestResults;
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

export const BuildResultEntry = (props: BuildResultEntryProps) => {
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

export const PassedTestsEntry: Component<PassedTestsEntryProps> = (props) => {
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
            when={!rawResult?.criticalErrors && !rawResult?.testsTimedOut}
            fallback={
                <Show when={rawResult?.criticalErrors} fallback={
                    <Show when={rawResult?.testsTimedOut}
                          fallback={<StatEntry {...common} result="Timed Out" status={EVisualStatus.Error}/>}>
                        <StatEntry {...common} result="Crash" status={EVisualStatus.Error}/>
                    </Show>
                }>
                    <StatEntry {...common} result="Crash" status={EVisualStatus.Error}/>
                </Show>
            }>
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
        </Show>
    );
};