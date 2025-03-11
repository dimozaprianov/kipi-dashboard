import {createEffect, createResource, untrack} from "solid-js";
import {createStore, reconcile, SetStoreFunction, Store, unwrap} from "solid-js/store";
import {ResourceFetcher} from "solid-js";


type TStoreResource<T extends Record<string, any>> = {
    state: "unresolved" | "pending" | "refreshing" | "ready" | "errored"
    value: T | undefined
}

type TStoreResourceReturn<T extends Record<string, any>> = [
    Store<TStoreResource<T>>,
    {
        setStore: SetStoreFunction<TStoreResource<T>>;
        refetch: (info?: unknown) => (Promise<T | undefined> | T | undefined | null)
        mutate: (v: T | ((state: T) => T)) => void
        getOriginal: () => T | undefined
    }
]

export function createStoreResource<T extends Record<string, any>>(fetcher: ResourceFetcher<true, T>, useReconcile: boolean = true): TStoreResourceReturn<T> {
    const [result, {refetch}] = createResource<T>(fetcher)
    const [store, setStore] = createStore<TStoreResource<T>>({
        state: result.state,
        value: undefined
    })

    createEffect(() => {
        const state = result.state
        setStore("state", state)
        if (state === "ready") {
            if (useReconcile)
                setStore("value", reconcile(result(), {merge: true, key: "_id"}))
            else
                setStore({"value": result()})
        }
    })

    const mutate = (v: T | ((state: T) => T)) => {
        const unwrapped = unwrap(store.value)
        typeof v === "function" && (v = v(unwrapped!))
        if (useReconcile)
            setStore("value", reconcile(v))
        else
            setStore({value: v})
        return store.value
    }

    return [store, {refetch, mutate, setStore, getOriginal: () => untrack(() => result())}]
}