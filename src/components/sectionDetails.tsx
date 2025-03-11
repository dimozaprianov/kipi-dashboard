import { createSignal, For } from "solid-js";
import { ErrorIcon, SuccessIcon } from "./icons";
import {TestResults} from "../api/apiClient";
import {Dialog, DialogContent, DialogFooter, DialogHeader} from "../shadcn/components/ui/dialog";
import {LogViewer} from "./logViewer";
import {Button} from "../shadcn/components/ui/button";

type SectionDetailsProps = {
    desc: string;
    log?: string;
    download?: string;
    testResults?: TestResults;
};

export function SectionDetails(props: SectionDetailsProps) {
    const [open, setOpen] = createSignal(false);
    const [logText, setLogText] = createSignal<string | undefined>();

    async function downloadLogContent() {
        if (props.log) {
            const response = await fetch(`/kipi-dashboard/data/logs/${props.log}`);
            setLogText(await response.text());
        }
    }

    return (
        <>
            <div class="absolute top-0 left-0 w-full h-full cursor-pointer" onClick={() => setOpen(true)} />
            <Dialog
                open={open()}
                onOpenChange={open => !open && setOpen(false)}
            >
                <DialogContent>
                    <DialogHeader>{props.desc}</DialogHeader>
                    <div class="flex flex-col gap-1">
                        <For each={props.testResults?.results}>
                            {(r) => (
                                <div class="flex flex-row flex-nowrap items-center gap-2">
                                    {r.result ? <SuccessIcon class="text-success" /> : <ErrorIcon class="text-error" />}
                                    <div class="text-sm">{r.test}</div>
                                </div>
                            )}
                        </For>
                    </div>
                    <DialogFooter>
                        {props.log && <Button class="btn" size="sm" onClick={downloadLogContent}>Check Log</Button>}
                        {props.download && <Button size="sm"><a class="btn" href={props.download} target="_blank">Download Build</a></Button>}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <LogViewer
                open={!!logText()}
                log={logText()}
                onClosed={() => setLogText(undefined)}
            />
        </>
    );
}