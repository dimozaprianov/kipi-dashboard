import {Component, createEffect, For, onCleanup, Show} from "solid-js";
import {createResource} from "solid-js";
import {HeartbeatClient, TrackedService} from "../api/monitoringApi";
import {Card, CardContent, CardDescription, CardHeader} from "../shadcn/components/ui/card";
import {formatDistanceStrict, formatDistanceToNow} from "date-fns";
import {ErrorIcon, SuccessIcon} from "../components/icons";
import {T} from "../components/typography";
import {ReportsClient} from "../api/apiClient";
import {cn} from "../shadcn/libs/cn";


export const Home: Component = () => {
    const [result] = createResource<TrackedService[]>(async () => {
        const client = new HeartbeatClient("https://dev.kipiinteractive.com")
        return await client.trackedServices()
    })
    const [systemActivity, {refetch}] = createResource<string[]>(async () => {
        const client = new ReportsClient(import.meta.env.VITE_CI_SERVER)
        return await client.getSystemLog()
    })

    createEffect(() => {
        const interval = setInterval(() => refetch(), 700)
        onCleanup(() => clearInterval(interval))
    })

    return <div class="p-24 py-8">
        <T variant="title2" size="xl" class="mb-4">Continuous Integration Services Status</T>
        <div class="flex flex-row flex-wrap">
            <For each={result()}>
                {service => <Card class="w-fit">
                    <CardHeader class="flex flex-row gap-1">
                        <Show when={service.isActive} fallback={<ErrorIcon class="text-red-700"/>}><SuccessIcon class="text-green-600"/></Show> {service.name}
                    </CardHeader>
                    <CardContent>
                        <CardDescription>
                            <For each={service.signals}>
                                {signal => <div>{signal.id} [{formatDistanceStrict(signal.lastHeartbeat, Date.now())}]</div>}
                            </For>
                        </CardDescription>
                    </CardContent>
                </Card>}
            </For>
        </div>
        <T variant="title2" size="xl" class="mt-4 mb-2">System Activity Logging</T>
        <For each={systemActivity()}>
            {(activity, idx) =>
               <div class={cn("w-fit ml-3 font-mono", idx() === 0 ? "text-foreground" : "text-muted-foreground")}>
                    <T variant="body">{activity}</T>
               </div>
            }
        </For>
    </div>
};

