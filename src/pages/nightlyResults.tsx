import {Component, createSignal, For, Show} from "solid-js"
import {AndroidIcon, GearIcon, IOSIcon, TestIcon, WinIcon} from "../components/icons"
import _find from "lodash/find"
import {format} from "date-fns"
import {CommitInfo} from "../components/commitInfo"
import {DashboardNightlyReport, ReportsClient} from "../api/apiClient";
import {T} from "../components/typography";
import {Tab, TabsContent, TabsIndicator, TabsList, TabsTrigger} from "../shadcn/components/ui/tab";
import {BuildResultEntry, PassedTestsEntry} from "./common";
import {Card} from "../shadcn/components/ui/card";
import {createStoreResource} from "../utils/resources";
import {
    Pagination,
    PaginationEllipsis,
    PaginationItem,
    PaginationItems,
    PaginationNext,
    PaginationPrevious
} from "../shadcn/components/ui/pagination";
import {createAsync} from "@solidjs/router";

export function Project (props: {project: DashboardNightlyReport}) {
    const [page, setPage] = createSignal(1)
    const list = createAsync(async () => {
        if (!props.project)
            return []
        const reportsClient = new ReportsClient()
        return  await reportsClient.getNightly(page(), props.project.project)
    })

    return <Show when={props.project}>
        <TabsContent value={props.project.project} class="grid">
            <Card class="flex flex-col gap-2 p-4">
                <For each={list()}>
                    {(entry) => (
                        <>
                            <div class="pl-1 grid grid-cols-[auto_1fr] items-center gap-2">
                                <T variant="details">{format(new Date(entry.timeStamp), 'EEE MMM dd yyyy HH:mm')}</T>
                                <CommitInfo commit={entry.commitInfo}/>
                            </div>
                            <div class="flex flex-row mb-2 gap-8">
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
                <Pagination
                    count={Math.ceil(props.project.nightlyCount / 25)}
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

export const Nightly: Component = () => {
    const reportsClient = new ReportsClient()
    const [projects, {setStore}] =
        createStoreResource(async () => await reportsClient.getNightlyInitial())

    return (
        <Show when={projects.value}>
            <div class="flex min-h-screen flex-col items-start justify-start p-24 py-8 min-w-full">
                <T variant="title2" size="xl">Nightly Tests Results</T>
                <Tab defaultValue={projects.value[0].project}>
                    <TabsList class="w-fit">
                        <For each={projects.value ?? []}>
                            {(project) => (<TabsTrigger class="w-fit" value={project.project}>{project.project}</TabsTrigger>)}
                        </For>
                        <TabsIndicator />
                    </TabsList>
                    <For each={projects.value ?? []}>
                        {(project) => <Project project={project}/>}
                    </For>
                </Tab>
            </div>
        </Show>
    );
};