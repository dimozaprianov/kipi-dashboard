import { createSignal, JSX, Show, For } from "solid-js";
import { ErrorIcon, SuccessIcon } from "./icons";
import {TestResults} from "../data-types/apiClient";

type SectionDetailsProps = {
    desc: string;
    log?: string;
    download?: string;
    testResults?: TestResults;
};

type ModalProps = {
    title: string;
    className?: string;
    isOpen: boolean;
    actions?: JSX.Element;
    children?: JSX.Element;
    onCloseClicked: () => void;
};

function Modal(props: ModalProps) {
    return (
        <Show when={props.isOpen}>
            <dialog class="modal modal-open">
                <div class={`modal-box flex flex-col overflow-hidden ${props.className ?? ""}`}>
                    <div class="flex flex-row justify-between items-center top-0 left-0 w-full h-20 p-5">
                        <h3 class="font-bold text-lg m-0 pr-10">{props.title}</h3>
                        <button class="btn btn-sm btn-circle btn-ghost right-2 top-2" onClick={props.onCloseClicked}>
                            ✕
                        </button>
                    </div>
                    <div class="flex flex-shrink-1 h-fit overflow-auto">
                        {props.children}
                    </div>
                    <Show when={props.actions}>
                        <div class="modal-action flex flex-row items-center">{props.actions}</div>
                    </Show>
                </div>
            </dialog>
        </Show>
    );
}

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

            <Modal
                className="max-w-fit"
                title={props.desc}
                isOpen={open()}
                onCloseClicked={() => setOpen(false)}
                actions={
                    <>
                        {props.log && <button class="btn" onClick={downloadLogContent}>Check Log</button>}
                        {props.download && <a class="btn" href={props.download} target="_blank">Download Build</a>}
                    </>
                }
            >
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
            </Modal>

            <Modal
                title={props.desc}
                isOpen={!!logText()}
                onCloseClicked={() => setLogText(undefined)}
                className="max-w-fit"
            >
                <code class="whitespace-pre-wrap text-nowrap bg-transparent">{logText()}</code>
            </Modal>
        </>
    );
}