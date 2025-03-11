import {createAsync} from "@solidjs/router";
import {BuildsClient, EScheduledBuildStatus, ScheduledBuild} from "../api/apiClient";
import {createEffect, createSignal, For, Match, onCleanup, Show, Switch} from "solid-js";
import {Tab, TabsContent, TabsIndicator, TabsList, TabsTrigger} from "../shadcn/components/ui/tab";
import {T} from "../components/typography";
import {LoadingIndicator} from "../components/loadingIndicator";
import {Button} from "../shadcn/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogClose,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "../shadcn/components/ui/alertDialog";
import {formatRelative} from "date-fns"
import {Badge} from "../shadcn/components/ui/badge";
import "../components/buildingIndicator.css"
import {createStoreResource} from "../utils/resources";
import {LogViewer} from "../components/logViewer";

function StatusBadge(props: {status: EScheduledBuildStatus}) {
    return <Switch fallback={<div>Not Found</div>}>
        <Match when={props.status === EScheduledBuildStatus.Queued}>
            <Badge class="bg-orange-400 hover:bg-orange-400">Queued</Badge>
        </Match>
        <Match when={props.status === EScheduledBuildStatus.Building}>
            <Badge class="bg-blue-500 hover:bg-blue-500">Building</Badge>
        </Match>
        <Match when={props.status === EScheduledBuildStatus.Finished}>
            <Badge class="bg-green-600 hover:bg-green-600">Finished</Badge>
        </Match>
        <Match when={props.status === EScheduledBuildStatus.Failed}>
            <Badge class="bg-red-500 hover:bg-red-500">Failed</Badge>
        </Match>
        <Match when={props.status === EScheduledBuildStatus.Archived}>
            return <Badge>Archived</Badge>
        </Match>
    </Switch>
}

type TActions = {
    build: ScheduledBuild
    action: (build: ScheduledBuild, action: "cancel" | "archive") => Promise<void>
}

function Actions(props: TActions) {
    const [logOpened, setLogOpened] = createSignal(false)
    return <div class="flex flex-row h-full pl-4 gap-1">
        <Show when={props.build.status === EScheduledBuildStatus.Queued}>
            <Button size="xs" onClick={() => props.action(props.build, "cancel")}>Cancel</Button>
        </Show>
        <Show when={props.build.status !== EScheduledBuildStatus.Queued}>
            <Button size="xs" variant="outline" onClick={() => setLogOpened(true)}>log</Button>
        </Show>
        <Show when={props.build.link}>
            <Button variant="outline" size="xs">
                <a href={props.build.link}>
                    <svg width="14px" height="14px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 21H18M12 3V17M12 17L17 12M12 17L7 12" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </a>
            </Button>
        </Show>
        <Show when={props.build.status > EScheduledBuildStatus.Building && props.build.status !== EScheduledBuildStatus.Archived}>
            <Button size="xs" onClick={() => props.action(props.build, "archive")}>archive</Button>
        </Show>
        <LogViewer open={logOpened()} log={props.build.log} onClosed={() => setLogOpened(false)}/>
    </div>
}

export function Builds() {
    const buildsClient = new BuildsClient()
    const projects = createAsync(() => buildsClient.getPresets())
    const [builds, {refetch, setStore}] = createStoreResource(() => buildsClient.getBuilds())
    const [selectedProject, setSelectedProject] = createSignal<string | undefined>(undefined)
    const [selectedPreset, setSelectedPreset] = createSignal<string | undefined>(undefined)
    async function startBuild() {
        const preset = selectedPreset()
        setSelectedPreset(undefined)
        if (!preset)
            return
        await buildsClient.queueBuild(selectedProject() ?? projects()[0].id, preset)
        refetch()
    }
    async function buildAction(build: ScheduledBuild, action: "cancel" | "archive") {
        const idx = builds.value.findIndex(b => b.id === build.id)
        switch (action) {
            case "cancel":
            case "archive":
                setStore("value", idx, "status", EScheduledBuildStatus.Archived)
                await buildsClient.archive(build.id)
                break
        }
    }


    createEffect(() => {
        const timeout = setInterval(() => refetch(), 1000)
        onCleanup(() => clearInterval(timeout))
    })

    const now = Date.now()
    return <div class="p-24 py-8">
        <AlertDialog open={!!selectedPreset()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Build Start</AlertDialogTitle>
                    <AlertDialogDescription>
                        Start the build for {selectedProject() ?? projects()[0].id} with preset {selectedPreset()}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogClose onClick={() => setSelectedPreset(undefined)}>cancel</AlertDialogClose>
                    <AlertDialogAction onClick={() => startBuild()}>Confirm</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <div class="flex flex-row gap-2">
            <div class="w-1/3">
                <T variant="title2">Projects</T>
                <Show when={projects()} fallback={<LoadingIndicator/>}>
                    <Tab defaultValue={projects()[0].id} onChange={v => setSelectedProject(v)}>
                        <TabsList class="w-fit">
                            <For each={projects() ?? []}>
                                {(project) => (<TabsTrigger class="w-fit" value={project.id}>{project.id}</TabsTrigger>)}
                            </For>
                            <TabsIndicator />
                        </TabsList>
                            <For each={projects() ?? []}>
                                {(project) => (
                                    <TabsContent value={project.id} class="grid">
                                        <T variant="title2">Presets:</T>
                                        <div class="flex flex-row flex-wrap gap-1">
                                            <For each={project.presets}>
                                                {(preset) => <Button size="sm" onClick={() => setSelectedPreset(preset)}>{preset}</Button>}
                                            </For>
                                        </div>
                                    </TabsContent>
                                )}
                            </For>
                    </Tab>
                </Show>
            </div>
            <div class="w-2/3">
                <T variant="title2">Queued Build</T>
                <table>
                    <thead class="border-b border-gray-300">
                        <tr>
                            <th class="text-left w-full pl-1">Project</th>
                            <th class="text-left w-fit pl-1">Preset</th>
                            <th class="text-left w-fit pl-1">Status</th>
                            <th class="text-left w-fit pl-1">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        <For each={builds.value ?? []}>
                            {(build) => {
                                return <tr>
                                    <td class="min-w-64 p-1">
                                        <div class="flex flex-row gap-2">
                                            <Show when={build.status === EScheduledBuildStatus.Building}>
                                                <div class="ml-4 building-indicator"/>
                                            </Show>
                                            {build.project}
                                        </div>
                                    </td>
                                    <td class="min-w-32 p-1">{build.preset}</td>
                                    <td class="min-w-32 p-1"><StatusBadge status={build.status}/></td>
                                    <td class="min-w-32 p-1">{formatRelative(build.timeStamp, now)}</td>
                                    <td class="min-w-32 p-1"><Actions build={build} action={buildAction}/></td>
                                </tr>
                            }}
                        </For>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
}