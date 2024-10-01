"use client"

import {format} from "date-fns";
import {useState} from "react";

export function CommitInfo({commit}: {commit: IGitLogEntry}) {
    const [visible, setVisible] = useState(false)

    return <>
        <a className="flex grow-1 link-neutral text-xs cursor-pointer select-none" onClick={() => setVisible(!visible)}>
            Commit Info
        </a>
        <div className={(visible ? "" : "hidden") + " col-span-2 border-l border-l-gray-300 pl-5 py-1 mb-2"}>
            <div className="stat-desc">
                {format(new Date(commit.TimeStamp), 'EEE MMM dd yyyy HH:mm')} {commit.Author} {commit.Sha}
            </div>
            <div className="stat-desc whitespace-pre-wrap">
                {commit.Message.replace("\r", "")}
            </div>
        </div>
    </>
}