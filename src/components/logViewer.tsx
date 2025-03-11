import {createEffect, createMemo, For} from "solid-js";
import {Dialog, DialogContent} from "../shadcn/components/ui/dialog";

type TLogViewer = {
    open: boolean
    log: string | undefined
    onClosed: () => void
}

function scrollToBottom(element: HTMLElement) {
    if (element) {
        element.scrollTop = element.scrollHeight;
    }
}

function isAtTheBottom(element: HTMLElement) {
    if (!element) return false;
    return element.scrollTop + element.clientHeight >= element.scrollHeight - 5;
}

export function LogViewer(props: TLogViewer) {
    let logContainer: HTMLDivElement | undefined = undefined

    let shouldScrollToBottom = true

    createEffect(() => {
        props.open && props.log
        if (shouldScrollToBottom) {
            setTimeout(() => scrollToBottom(logContainer), 0)
        }
    })

    function onLogScroll() {
        shouldScrollToBottom = isAtTheBottom(logContainer)
    }

    const lines = createMemo(() => {
        return (props.log ?? "").split("\n")
    })
    return <Dialog open={props.open} onOpenChange={open => !open && props.onClosed()}>
        <DialogContent class="h-[80%] max-w-[80%]">
            <div ref={logContainer} class="flex w-full h-full overflow-auto mt-4" onScroll={onLogScroll}>
                <div class="w-fit">
                    <For each={lines()}>
                        {(line) => <div>{line}</div>}
                    </For>
                </div>
            </div>
        </DialogContent>
    </Dialog>
}