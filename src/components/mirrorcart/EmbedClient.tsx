"use client";
import { useEffect, useState } from "react";
import { MirrorcartModal } from "./MirrorcartModal";
import { api, Item } from "./api";

/** Runs inside the widget iframe; talks to the host page via postMessage. */
export function EmbedClient({ store, items, hostOrigin }: { store: string; items: Item[]; hostOrigin: string }) {
  const [list, setList] = useState(items);
  useEffect(() => {
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
  }, []);
  const send = (type: string, payload?: unknown) => window.parent?.postMessage({ type, payload }, hostOrigin || "*");
  return (
    <div className="min-h-screen bg-transparent">
      <MirrorcartModal
        items={list} store={store} embedded
        onClose={() => send("mirrorcart:close")}
        onReplaceItems={setList}
        onRemove={(it) => send("mirrorcart:remove-item", it)}
        onSwap={(it, v) => send("mirrorcart:swap-item", { ...it, newVariant: v })}
        onCheckout={(kept) => {
          if (sessionStorage.getItem("mc-tried-on") === "1") api.track("checkout_after_tryon", store, kept);
          sessionStorage.removeItem("mc-tried-on");
          send("mirrorcart:checkout", { items: kept });
        }}
      />
    </div>
  );
}
