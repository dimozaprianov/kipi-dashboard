"use client"

import React, {ReactNode, useState} from "react";
import {ErrorIcon, SuccessIcon} from "@/components/icons";

type SectionDetailsProps = {
    desc: string;
    log?: string;
    download?: string;
    testResults?: ITestResults;
}

function Modal({title, className, isOpen, children, actions, onCloseClicked}: { title: string, className?: string, isOpen: boolean, actions?: ReactNode, children?: ReactNode, onCloseClicked: () => void } ) {
    if (!isOpen) return null;

    return <dialog className="modal modal-open">
        <div className={"modal-box flex flex-col overflow-hidden " + (className ?? "")}>
            <div className="flex flex-row justify-between items-center top-0 left-0 w-full h-20 p-5">
                <h3 className="font-bold text-lg m-0 pr-10">{title}</h3>
                <button className="btn btn-sm btn-circle btn-ghost right-2 top-2"
                        onClick={onCloseClicked}>✕
                </button>
            </div>
            <div className="flex flex-shrink-1 h-fit overflow-auto">
                {children}
            </div>
            {actions && <div className="modal-action flex flex-row items-center">{actions}</div>}
        </div>
    </dialog>
}

export function SectionDetails({desc, log, download, testResults}: SectionDetailsProps) {
    const [open, setOpen] = useState(false)
    const [logText, setLogText] = useState<string | undefined>()

    async function downloadLogContent() {
        const response = await fetch(`/kipi-dashboard/data/logs/${log}`)
        setLogText(await response.text())
    }

    return <>
        <div className="absolute top-0 left-0 w-full h-full cursor-pointer" onClick={() => setOpen(true)}/>
        <Modal
            className="max-w-fit"
            title={desc}
            isOpen={open}
            onCloseClicked={() => setOpen(false)}
            actions={<>
                {log && <button className="btn" onClick={() => downloadLogContent()}>Check Log</button>}
                {download && <a className="btn" href={download} target="_blank">Download Build</a>}
            </>}>
            <div className="flex flex-col gap-1">
                {testResults?.Results.map(r => (<div key={r.Test} className="flex flex-row flex-nowrap items-center gap-2">
                    {r.Result ? <SuccessIcon className="text-success"/> : <ErrorIcon className="text-error"/>}
                    <div className="text-sm">{r.Test}</div>
                </div>))}
            </div>
        </Modal>
        <Modal title={desc} isOpen={!!logText} onCloseClicked={() => setLogText(undefined)} className="max-w-fit">
            <code className="whitespace-pre-wrap text-nowrap bg-transparent">{logText}</code>
        </Modal>
    </>
}