import { createSignal } from "solid-js";

export { Counter };

function Counter() {
  const [count, setCount] = createSignal(0);

  return (
    <button type="button" class={"btn"} onClick={() => setCount((count) => count + 1)}>
      Counter {count()}
    </button>
  );
}
