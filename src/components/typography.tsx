import {ComponentProps} from "solid-js";
import "./typography.css"
import {cn} from "../shadcn/libs/cn";

type TypographyConfig = ComponentProps<any> & {
    variant: "title" | "subtitle" | "body" | "label" | "details"
    size: "sm" | "lg" | "xl"
}

export function T(props: TypographyConfig) {
    switch (props.variant) {
        case "title":
            return <h1 class={cn("title", "font-semibold", props.size, props.class)}>{props.children}</h1>
        case "title2":
            return <h2 class={cn("title2", "font-medium", props.size, props.class)}>{props.children}</h2>
        case "subtitle":
        case "body":
        case "details":
        case "link-details":
            return <div class={cn(props.variant, props.size, props.class)}>{props.children}</div>
        case "label":
            return <label class={cn(props.size, props.class)}>{props.children}</label>
    }

    return <div>{props.children}</div>
}