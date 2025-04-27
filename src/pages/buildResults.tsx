import {For, Show, JSX, createSignal, createMemo} from "solid-js"
import {AndroidIcon, SteamIcon, TestIcon, WinIcon} from "../components/icons"
import {format} from "date-fns"
import {CommitInfo} from "../components/commitInfo"
import {DashboardReport, PeriodicTestsResult, ReportsClient} from "../api/apiClient";
import {createAsync} from "@solidjs/router";
import {T} from "../components/typography";
import {Tab, TabsContent, TabsIndicator, TabsList, TabsTrigger} from "../shadcn/components/ui/tab";
import {Card} from "../shadcn/components/ui/card";
import {
    Pagination,
    PaginationEllipsis,
    PaginationItem,
    PaginationItems, PaginationNext,
    PaginationPrevious
} from "../shadcn/components/ui/pagination";
import {PassedTestsEntry, PlatformCompileResult, PlatformFullBuildResult} from "./buildResultWidgets";
import {some} from "lodash";

function projectTests(platform: string, title: string, detailsTitle: string, icon: () => JSX.Element) {
    return {
        isApplicable: (data: PeriodicTestsResult)=> {
            const platformTest = data.platformTests[platform]
            if (!platformTest)
                return false
            const results = platformTest.results
            return results && results.length > 0
        },
        render: (data: PeriodicTestsResult) =>
            <PassedTestsEntry
                icon={icon()}
                title={title}
                detailsTitle={detailsTitle}
                entry={data.platformTests[platform]}
            />
    }
}

function projectCompilation(platform: string, title: string, detailsTitle: string, icon: () => JSX.Element) {
    return {
        isApplicable: (data: PeriodicTestsResult)=> {
            return !!data.platformTests[platform]
        },
        render: (data: PeriodicTestsResult) =>
            <PlatformCompileResult
                icon={icon()}
                title={title}
                detailsTitle={detailsTitle}
                entry={data.platformTests[platform]}
            />
    }
}

function projectFullBuild(platform: string, title: string, detailsTitle: string, icon: () => JSX.Element) {
    return {
        isApplicable: (data: PeriodicTestsResult)=> {
            return !!data.platformFullBuilds[platform]
        },
        render: (data: PeriodicTestsResult) =>
            <PlatformFullBuildResult
                icon={icon()}
                title={title}
                detailsTitle={detailsTitle}
                entry={data.platformFullBuilds[platform]}
            />
    }
}

const columns = [
    projectCompilation("Windows", "Windows", "Windows Compilation", () => <WinIcon/>),
    projectTests("Windows", "Tests", "Test Results", () => <TestIcon/>),
    projectCompilation("Android", "Android", "Android Compilation", () => <AndroidIcon/>),
    projectFullBuild("WindowsNightly", "Weekly Windows", "Weekly Windows Build", () => <WinIcon/>),
    projectFullBuild("WindowsAndroid", "Weekly Android", "Weekly Android Build", () => <AndroidIcon/>),
    projectFullBuild("SteamNightly", "Nightly Steam", "Nightly Steam Build", () => <SteamIcon/>),
    projectFullBuild("SteamWeekly", "Weekly Steam", "Weekly Steam Build", () => <SteamIcon/>),
]

function getFilteredColumns(data: PeriodicTestsResult[]) {
    return columns.filter(
        ({isApplicable}) => some(data, e => isApplicable(e))
    )
}

function Project(props: {project: DashboardReport, fetchResults: (page: number | undefined, project: string | undefined) => Promise<PeriodicTestsResult[]>}) {
    const [page, setPage] = createSignal(1)
    const list = createAsync(async () => props.fetchResults(page(), props.project.project))
    const columns = createMemo(() => getFilteredColumns(list()))

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
                                <For each={columns()}>
                                    {(column) => column.render(entry)}
                                </For>
                            </div>
                        </>
                    )}
                </For>
                <Pagination
                    count={Math.ceil(props.project.count / 25)}
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

type BuildResultsProps = {
    title: string
    fetchInitial: () => Promise<DashboardReport[]>
    fetchResults: (page: number | undefined, project: string | undefined) => Promise<PeriodicTestsResult[]>
}

const BuildResults = (props: BuildResultsProps) => {
    const projects = createAsync(props.fetchInitial)
    return (
        <Show when={projects()}>
            <div class="flex min-h-screen flex-col items-start justify-start p-24 py-8 min-w-full">
            <T variant="title2" size="xl">{props.title}</T>
            <Tab defaultValue={projects()[0].project}>
                <TabsList class="w-fit">
                    <For each={projects() ?? []}>
                        {(project) => (<TabsTrigger class="w-fit" value={project.project}>{project.project}</TabsTrigger>)}
                    </For>
                    <TabsIndicator />
                </TabsList>
                <For each={projects() ?? []}>
                    {(project) => <Project project={project} fetchResults={props.fetchResults}/>}
                </For>
            </Tab>
        </div>
        </Show>
    );
};

const reportsClient = new ReportsClient(import.meta.env.VITE_CI_SERVER)
export const Weekly = () => <BuildResults
    title="Weekly Builds & Test Results"
    fetchInitial={() => reportsClient.getWeeklyInitial()}
    fetchResults={(page, project) => reportsClient.getWeekly(page ?? 1, project)}
/>

export const Nightly = () => <BuildResults
    title="Nightly Builds & Test Results"
    fetchInitial={() => reportsClient.getNightlyInitial()}
    fetchResults={(page, project) => reportsClient.getNightly(page ?? 1, project)}
/>