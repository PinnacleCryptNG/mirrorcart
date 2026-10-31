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
        cart.replace(look.pieces.map((p) => ({ productId: p.product, variantId: p.variant, qty: 1 })));
        router.push("/cart?try=1");
      }}
    >
      {children}
    </button>
  );
}
