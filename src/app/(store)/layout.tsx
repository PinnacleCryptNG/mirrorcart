import { StoreHeader, StoreFooter } from "@/components/StoreChrome";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StoreHeader />
      <main className="min-h-[60vh]">{children}</main>
      <StoreFooter />
    </>
  );
}
