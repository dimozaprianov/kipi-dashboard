import {Component, For, Show, JSX, createSignal} from "solid-js"
import {AndroidIcon, IOSIcon, WinIcon} from "../components/icons"
import _find from "lodash/find"
import {format} from "date-fns"
import {CommitInfo} from "../components/commitInfo"
import {DashboardWeeklyReport, ReportsClient, WeeklyBuildResult} from "../api/apiClient";
import {createAsync} from "@solidjs/router";
import {T} from "../components/typography";
import {EVisualStatus, StatEntry} from "./common";
import {Tab, TabsContent, TabsIndicator, TabsList, TabsTrigger} from "../shadcn/components/ui/tab";
import {Card} from "../shadcn/components/ui/card";
import {
    Pagination,
    PaginationEllipsis,
    PaginationItem,
    PaginationItems, PaginationNext,
    PaginationPrevious
} from "../shadcn/components/ui/pagination";

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

function Project(props: {project: DashboardWeeklyReport}) {
    const [page, setPage] = createSignal(1)
    const list = createAsync(async () => {
        if (!props.project)
            return []
        const reportsClient = new ReportsClient(import.meta.env.VITE_CI_SERVER)
        return  await reportsClient.getWeekly(page(), props.project.project)
    })

    return <Show when={props.project}>
        <TabsContent value={props.project.project} class="grid">
            <Card class="flex flex-col gap-2 p-4">
                <For each={list()}>
                    {(entry) => (
                        <>
                            <div class="pl-1 grid grid-cols-[auto_1fr] items-center">
                                <T variant="details" class="pr-4">{format(new Date(entry.timeStamp), 'EEE MMM dd yyyy HH:mm')}</T>
                                <CommitInfo commit={entry.commitInfo}/>
                            </div>
                            <div class="flex mb-2 gap-12">
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
                <Pagination
                    count={Math.ceil(props.project.weeklyCount / 25)}
                    page={page()}
                    onPageChange={page => setPage(page)}
                    itemComponent={props => <PaginationItem page={props.page}>{props.page}</PaginationItem>}
                    ellipsisComponent={() => <PaginationEllipsis />}
                    class="mx-10 justify-start mt-6"
                >
                    <PaginationPrevious />
                    <PaginationItems />
                    <PaginationNext />
                </Pagination>
            </Card>
        </TabsContent>
    </Show>
}

export const Weekly: Component = () => {
    const reportsClient = new ReportsClient(import.meta.env.VITE_CI_SERVER)
    const projects = createAsync(async () => await reportsClient.getWeeklyInitial(1))

    return (
        <Show when={projects()}>
            <div class="flex min-h-screen flex-col items-start justify-start p-24 py-8 min-w-full">
            <T variant="title2" size="xl">Weekly Build Results</T>
            <Tab defaultValue={projects()[0].project}>
                <TabsList class="w-fit">
                    <For each={projects() ?? []}>
                        {(project) => (<TabsTrigger class="w-fit" value={project.project}>{project.project}</TabsTrigger>)}
                    </For>
                    <TabsIndicator />
                </TabsList>
                <For each={projects() ?? []}>
                    {(project) => <Project project={project}/>}
                </For>
            </Tab>
        </div>
        </Show>
    );
};
