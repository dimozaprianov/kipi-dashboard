import {Component, For, Show} from "solid-js";
import {createResource} from "solid-js";
import {HeartbeatClient, TrackedService} from "../api/monitoringApi";
import {Card, CardContent, CardDescription, CardHeader} from "../shadcn/components/ui/card";
import {formatDistanceStrict, formatDistanceToNow} from "date-fns";
import {ErrorIcon, SuccessIcon} from "../components/icons";
import {T} from "../components/typography";


export const Home: Component = () => {
    const [result, {refetch}] = createResource<TrackedService[]>(async () => {
        const client = new HeartbeatClient("https://dev.kipiinteractive.com")
        return await client.trackedServices()
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
    </div>
};

//<li class="pl-4">- @signal.Id [@((DateTimeOffset.Now - signal.LastHeartbeat).FormatIntervalHours())]</li>