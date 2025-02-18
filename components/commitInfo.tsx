import { createSignal } from "solid-js";
import { format } from "date-fns";
import {GitLogEntry} from "../data-types/apiClient";

export function CommitInfo(props: { commit: GitLogEntry }) {
    const [visible, setVisible] = createSignal(false);

    return (
        <>
            <a
                class="flex grow-1 link-neutral text-xs cursor-pointer select-none"
                onClick={() => setVisible(!visible())}
            >
                Commit Info
            </a>
            <div class={(visible() ? "" : "hidden") + " col-span-2 border-l border-l-gray-300 pl-5 py-1 mb-2"}>
                <div class="stat-desc">
                    {format(new Date(props.commit.timeStamp), 'EEE MMM dd yyyy HH:mm')} {props.commit.author} {props.commit.sha}
                </div>
                <div class="stat-desc whitespace-pre-wrap">
                    {props.commit.message?.replace("\r", "") ?? ""}
                </div>
            </div>
        </>
    );
}