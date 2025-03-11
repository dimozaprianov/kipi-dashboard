import {createSignal, For} from "solid-js";
import { format } from "date-fns";
import {T} from "./typography";
import {GitLogEntry} from "../api/apiClient";

export function CommitInfo(props: { commit: GitLogEntry }) {
    const [visible, setVisible] = createSignal(false);

    return (
        <>
            <a
                class="flex grow-1 link-neutral cursor-pointer select-none"
                onClick={() => setVisible(!visible())}
            >
                <T variant="details">Commit Info</T>
            </a>
            <div class={(visible() ? "" : "hidden") + " flex flex-col col-span-2 border-l border-l-gray-300 pl-5 py-1 mb-2 "}>
                <T variant="body">
                    {format(new Date(props.commit.timeStamp), 'EEE MMM dd yyyy HH:mm')} <b>{props.commit.author}</b> <span class="font-light">({props.commit.sha})</span>
                </T>
                <For each={props.commit.message.split("\n")}>
                    {(text: string) => <T variant="body">{text}</T>}
                </For>
            </div>
        </>
    );
}