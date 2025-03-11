import "./index.css";
import type { JSX } from "solid-js";
import {
    NavigationMenu,
    NavigationMenuTrigger
} from "../shadcn/components/ui/navigationMenu";

export default function LayoutDefault(props: { class?: string, children?: JSX.Element }) {
  return (
        <section class={props.class}>
            <nav class="flex flex-row justify-between items-center bg-base-100 p-2 w-full">
                <a class="text-xl font-sans" href="/">
                    <div class="flex flex-row items-center gap-2">
                        <img src="/logo.svg" class="h-12" alt="logo" />
                        Kipi Interactive Dashboard
                    </div>
                </a>
                <div class="flex">
                    <NavigationMenu>
                        <NavigationMenuTrigger as="a" href="/">Status</NavigationMenuTrigger>
                        <NavigationMenuTrigger as="a" href="/nightly">Nightly</NavigationMenuTrigger>
                        <NavigationMenuTrigger as="a" href="/weekly">Weekly</NavigationMenuTrigger>
                        <NavigationMenuTrigger as="a" href="/builds">Builds</NavigationMenuTrigger>
                    </NavigationMenu>
                </div>
            </nav>
            {props.children}
        </section>
  );
}