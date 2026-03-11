import {BuildsClient, EngineForBuild, EScheduledBuildStatus, GitHubCommit, ScheduledBuild} from "../api/apiClient";
import {
    createEffect,
    createMemo,
    createResource,
    createSignal,
    For,
    Match,
    onCleanup,
    Show,
    Switch,
    untrack
} from "solid-js";
import {Tab, TabsContent, TabsIndicator, TabsList, TabsTrigger} from "../shadcn/components/ui/tab";
import {T} from "../components/typography";
import {LoadingIndicator} from "../components/loadingIndicator";
import {Button} from "../shadcn/components/ui/button";
import {formatDistanceToNow, formatRelative} from "date-fns"
import {Badge} from "../shadcn/components/ui/badge";
import "../components/buildingIndicator.css"
import {createStoreResource} from "../utils/resources";
import {LogViewer as LogViewerExt} from "../components/logViewer";
import {find} from "lodash";
import {
    Combobox,
    ComboboxContent,
    ComboboxInput,
    ComboboxItem,
    ComboboxTrigger
} from "../shadcn/components/ui/combobox";
import {RefreshIcon} from "../components/icons";
import {TextField, TextFieldRoot} from "../shadcn/components/ui/textField";

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
            <Badge>Archived</Badge>
        </Match>
    </Switch>
}

type TActions = {
    build: ScheduledBuild
    action: (build: ScheduledBuild, action: "cancel" | "archive") => Promise<void>
}

type TLogViewer = {
    open: boolean
    buildId: string | undefined
    onClosed: () => void
}

export function LogViewer(props: TLogViewer) {
    const buildsClient = new BuildsClient(import.meta.env.VITE_CI_SERVER)
    const logKey = createMemo(() => (props.open ? props.buildId : null));
    const [log, {refetch}] = createResource(logKey, (id) => buildsClient.getBuildLog(id));
    createEffect(() => {
        if (props.open) {
            const timeout = setInterval(() => ["ready", "errored"].includes(log.state) && refetch(), 1000)
            onCleanup(() => clearInterval(timeout))
        }
    })

    return <Show when={log()}>
        <LogViewerExt open={props.open} onClosed={props.onClosed} log={log()}/>
    </Show>
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
        <Show when={props.build?.link}>
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
        <LogViewer open={logOpened()} buildId={props.build.id} onClosed={() => setLogOpened(false)}/>
    </div>
}

export function RenderCommitEntry(props: {commit: GitHubCommit}) {
    return <div class="flex flex-col hover:bg-gray-200 w-full">
        <T variant="detail"><b>{props.commit.author}</b>, {props.commit.sha.substring(0, 8)}, {formatDistanceToNow(props.commit.timeStamp)} ago</T>
        <For each={props.commit.log.split("\n")}>
            {line => <T variant="subtitle" class="ml-2">{line}</T>}
        </For>
    </div>
}

function TitleSection(props: {title: string, onRefresh?: () => void}) {
    return <div class="flex flex-row justify-between">
        <T variant="title">{props.title}</T>
        {props.onRefresh && <Button variant="ghost" onClick={() => props.onRefresh()}><RefreshIcon/></Button>}
    </div>
}

export function BuildOnDemand() {
    const buildsClient = new BuildsClient(import.meta.env.VITE_CI_SERVER)
    const [builds, {refetch, setStore}] = createStoreResource(() => buildsClient.getBuilds())

    const [projects, {setStore: setProjectsStore, mutate: setProjects}] = createStoreResource(() => buildsClient.getPresets(false))
    const [engines, {refetch: refreshEngines}] = createResource(() => buildsClient.getEngineBuilds())

    const [selectedProjectRaw, setSelectedProject] = createSignal<string | undefined>(undefined)
    const [selectedBranch, setSelectedBranch] = createSignal<string | undefined>(undefined)
    const [selectedPreset, setSelectedPreset] = createSignal<string | undefined>(undefined)
    const [selectedEngine, setSelectedEngine] = createSignal<string | undefined>(undefined)
    const [suffix, setSuffix] = createSignal<string>("")
    const selectedProject = createMemo(() => {
        if (projects.value)
            return selectedProjectRaw() ?? projects.value[0].id
        else
            return undefined
    })

    const [commits, {refetch: refetchCommits, mutate: changeCommits}] = createStoreResource(async () =>
        selectedBranch()
            ? await buildsClient.getCommits(selectedProject(), selectedBranch(), false)
            : [])

    const [selectedCommit, setSelectedCommit] = createSignal<string | undefined>(undefined)
    const [defaultEngine] = createResource(
        () => [selectedProjectRaw() ?? (projects.value ? projects.value[0].id : undefined), selectedCommit() ?? selectedBranch(), engines()],
        async ([project, sha, engines]: [string, string, EngineForBuild[] | undefined]) => {
            if (!engines || !project || !sha)
                return
            const enginePath = await buildsClient.getDefaultEngineForBuild(project, sha)
            const engineInfo = engines.find(e => e.path === enginePath)
            return engineInfo.name
        }
    )

    function refreshPresets() {
        setSelectedPreset(undefined)
        buildsClient.getPresets(true)
            .then(result => {
                setProjects(result)
                setSelectedPreset(undefined)
            })
    }

    function refreshBranches() {
        if (!projects.value)
            return []
        const selectedProjectId = selectedProject()
        const selectedProjectIdx = projects.value.findIndex(b => b.id === selectedProjectId)

        setProjectsStore("value", selectedProjectIdx, "branches", undefined)
    }

    function refreshCommits() {
        if (selectedBranch()) {
            buildsClient.getCommits(selectedProject(), selectedBranch(), true)
                .then(result => {
                    changeCommits(result)
                })
        }
    }

    async function startBuild() {
        const preset = selectedPreset()
        setSelectedPreset(undefined)
        if (!preset)
            return
        const enginesInfo = engines()
        const engineToUse = selectedEngine() ?? defaultEngine()
        const selected = enginesInfo.find(e => e.name === engineToUse)
        await buildsClient.queueBuild(selectedProject(), preset, selectedBranch(), selectedCommit() ?? selectedBranch(), suffix() ?? "", selected?.path ?? "")
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

    function branches() {
        if (!projects.value)
            return []
        const selectedProjectId = selectedProject()
        const project = find(projects.value, v => v.id === selectedProjectId)

        return project?.branches?.list ?? []
    }

    createEffect(() => {
        if (!projects.value)
            return
        const selectedProjectId = selectedProject()
        const selectedProjectIdx = projects.value.findIndex(b => b.id === selectedProjectId)
        const project = find(projects.value, v => v.id === selectedProjectId)

        if (!project.branches) {
            untrack(async () => {
                const branches = await buildsClient.getBranches(selectedProjectId, true)
                setProjectsStore("value", selectedProjectIdx, "branches", branches)
                setSelectedBranch(branches.defaultBranch)
            })
        } else {
            if (!selectedBranch()) {
                setSelectedBranch(project.branches.defaultBranch)
            }
        }
    })

    createEffect(() => {
        if (!commits.value)
            return

        const commitsList = commits.value
        if (!selectedCommit() && commitsList.length > 0)
            setSelectedCommit(commitsList[0].sha)
    })

    createEffect(() => {
        if (selectedBranch()) {
            changeCommits([])
            setSelectedCommit(undefined)
            refetchCommits()
        }
    })

    createEffect(() => {
        if (selectedProject()) {
            changeCommits([])
            setSelectedBranch(undefined)
            setSelectedPreset(undefined)
            setSelectedCommit(undefined)
        }
    })

    createEffect(() => {
        const timeout = setInterval(() => ["ready", "errored"].includes(builds.state) && refetch(), 1000)
        onCleanup(() => clearInterval(timeout))
    })

    function commitObj(sha: string) {
        return find(commits.value, c => c.sha === sha)
    }

    function shorten(commitLog: string | undefined) {
        if (!commitLog)
            return ""
        return commitLog.split("\n")[0]
    }

    const now = Date.now()
    return <div class="p-24 py-8">
        <div class="flex flex-row gap-8">
            <div class="w-1/6">
                <T variant="title2">Projects</T>
                <Show when={projects.value} fallback={<LoadingIndicator/>}>
                    <Tab defaultValue={projects.value[0].id} onChange={v => setSelectedProject(v)}>
                        <TabsList class="w-fit">
                            <For each={projects.value ?? []}>
                                {(project) => (<TabsTrigger class="w-fit" value={project.id}>{project.id}</TabsTrigger>)}
                            </For>
                            <TabsIndicator />
                        </TabsList>
                            <For each={projects.value ?? []}>
                                {(project) => (
                                    <TabsContent value={project.id} class="grid">
                                        <TitleSection title="Presets:" onRefresh={refreshPresets}/>
                                        <Combobox<string>
                                            multiple={false}
                                            value={selectedPreset()}
                                            onChange={value => setSelectedPreset(value)}
                                            options={project.presets}
                                            class="mb-4"
                                            placeholder="Choose preset…"
                                            itemComponent={(props) => (
                                                <ComboboxItem item={props.item}>{props.item.rawValue}</ComboboxItem>
                                            )}
                                        >
                                            <ComboboxTrigger>
                                                <ComboboxInput />
                                            </ComboboxTrigger>
                                            <ComboboxContent listClass="max-h-[var(--kb-popper-content-available-height)] overflow-y-auto"/>
                                        </Combobox>
                                        <TitleSection title="Branches:" onRefresh={refreshBranches}/>
                                        <Combobox<string>
                                            multiple={false}
                                            value={selectedBranch()}
                                            onChange={value => setSelectedBranch(value)}
                                            options={branches()}
                                            class="mb-4"
                                            placeholder="Choose branch…"
                                            itemComponent={(props) => (
                                                <ComboboxItem item={props.item}>{props.item.rawValue}</ComboboxItem>
                                            )}
                                        >
                                            <ComboboxTrigger>
                                                <ComboboxInput />
                                            </ComboboxTrigger>
                                            <ComboboxContent listClass="max-h-[var(--kb-popper-content-available-height)] overflow-y-auto"/>
                                        </Combobox>
                                        <TitleSection title="Commit:" onRefresh={refreshCommits}/>
                                        <Combobox<string>
                                            multiple={false}
                                            value={selectedCommit()}
                                            onChange={value => setSelectedCommit(value)}
                                            options={commits.value.map(c => c.sha)}
                                            class="mb-4"
                                            placeholder="Choose branch…"
                                            itemComponent={(props) => (
                                                <ComboboxItem class="w-full" item={props.item}><RenderCommitEntry commit={commitObj(props.item.rawValue)}/></ComboboxItem>
                                            )}
                                            sameWidth={true}
                                            fitViewport={true}
                                            optionLabel={sha => shorten(commitObj(sha)?.log)}
                                        >
                                            <ComboboxTrigger>
                                                <ComboboxInput />
                                            </ComboboxTrigger>
                                            <ComboboxContent listClass="max-h-[var(--kb-popper-content-available-height)] overflow-y-auto"/>
                                        </Combobox>
                                        <TitleSection title="Custom Suffix:"/>
                                        <TextFieldRoot class="mb-4" value={suffix()} onChange={v => setSuffix(v)}>
                                            <TextField type="text" placeholder="Suffix" />
                                        </TextFieldRoot>
                                        <TitleSection title="Build With:" onRefresh={refreshEngines}/>
                                        <Combobox<string>
                                            multiple={false}
                                            value={selectedEngine() ?? defaultEngine()}
                                            onChange={value => setSelectedEngine(value)}
                                            options={(engines() ?? []).map(m => m.name)}
                                            class="mb-4"
                                            placeholder="Choose engine to use for build, leave it empty to use default…"
                                            itemComponent={(props) => (
                                                <ComboboxItem item={props.item} class={defaultEngine() === props.item.rawValue ? "font-bold" : ""}>{props.item.rawValue}{defaultEngine() === props.item.rawValue && " (default)"}</ComboboxItem>
                                            )}
                                            sameWidth={true}
                                            fitViewport={true}

                                        >
                                            <ComboboxTrigger>
                                                <ComboboxInput class={!selectedEngine() || selectedEngine() === defaultEngine() ? "font-bold" : ""}/>
                                            </ComboboxTrigger>
                                            <ComboboxContent listClass="max-h-[var(--kb-popper-content-available-height)] overflow-y-auto"/>
                                        </Combobox>
                                    </TabsContent>
                                )}
                            </For>
                        <Button disabled={!selectedPreset()} onClick={() => startBuild()}>Queue Build</Button>
                    </Tab>
                </Show>
            </div>
            <div class="w-5/6">
                <T variant="title2">Queued Build</T>
                <table>
                    <thead class="border-b border-gray-300">
                    <tr class="h-8">
                        <th class="text-left w-full pl-2">Project</th>
                        <th class="text-left w-fit pl-2">Status</th>
                        <th class="text-left w-fit pl-2">Commit</th>
                        <th class="text-left max-w-16 pl-2 bg-gray-100">Branch</th>
                        <th class="text-left w-fit pl-2">Engine</th>
                        <th class="text-left w-fit pl-2 bg-gray-100">Preset</th>
                        <th class="text-left w-fit pl-2">Date</th>
                    </tr>
                    </thead>
                    <tbody>
                        <For each={builds.value ?? []}>
                            {(build) => {
                                return <tr>
                                    <td class="min-w-24 p-1">
                                        <div class="flex flex-row gap-2">
                                            <T>{build.project}</T>
                                            <Show when={build.status === EScheduledBuildStatus.Building}>
                                                <div class="ml-4 building-indicator"/>
                                            </Show>
                                        </div>
                                    </td>
                                    <td class="min-w-24 p-1"><StatusBadge status={build.status}/></td>

                                    <td class="px-3">
                                        <T variant="details">{build?.sha?.length === 40 ? build.sha.substring(0, 8) : build.sha}</T>
                                    </td>
                                    <td class="p-1 max-w-48 bg-gray-100">
                                        <T variant="body" class="text-nowrap truncate">{build.branch}</T>
                                    </td>
                                    <td class="p-1">
                                        <T variant="body" class="text-nowrap font-medium">{build.unrealName}</T>
                                    </td>

                                    <td class="min-w-24 p-1 bg-gray-100">
                                        <T variant="body">{build.preset}</T>
                                    </td>
                                    <td class="min-w-24 p-1 text-nowrap"><T variant="body">{formatRelative(build.timeStamp, now)}</T></td>
                                    <td class="min-w-24 p-1"><Actions build={build} action={buildAction}/></td>
                                </tr>
                            }}
                        </For>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
}
