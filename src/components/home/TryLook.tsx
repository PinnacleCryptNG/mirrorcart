"use client";
import { useRouter } from "next/navigation";
import { cart } from "@/lib/cart";
import type { Look } from "@/lib/looks";

/** Puts a lookbook look in the cart and opens the try-on straight away. */
export function TryLook({ look, children, className }: { look: Look; children: React.ReactNode; className?: string }) {
  const router = useRouter();
  return (
    <button
      className={className}
      onClick={() => {
        for (const p of look.pieces) {
          const { product: productId, variant: variantId } = p;
          if (!cart.get().some((i) => i.productId === productId && i.variantId === variantId)) cart.add(productId, variantId);
        }
        router.push("/cart?try=1");
      }}
    >
      {children}
    </button>
  );
}
