import "./style.css";
import "./tailwind.css";

import type { JSX } from "solid-js";
import logoUrl from "../assets/logo.svg";

export default function LayoutDefault(props: { class: string, children?: JSX.Element }) {
  return (

        <body class={props.class}>
        <nav class="navbar flex flex-row items-center gap-2 bg-base-100 p-2">
            <div class="navbar-start">
                <img src="/assets/logo.svg" class="h-12" alt="logo" />
                <a class="btn btn-ghost text-xl">Kipi Interactive Dashboard</a>
            </div>
        </nav>
        {props.children}
        </body>
  );
}



function Logo() {
  return (
    <div class={"p-5 mb-2"}>
      <a href="/">
        <img src={logoUrl} height={64} width={64} alt="logo" />
      </a>
    </div>
  );
}
