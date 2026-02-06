import { Footer } from "@/components/ui/Footer";
import { Header } from "@/components/ui/Header";
import { LayoutWrapper } from "@/components/LayoutWrapper";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh max-w-screen flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto px-2 overflow-x-hidden">
        <LayoutWrapper>{children}</LayoutWrapper>
      </main>
      <Footer />
    </div>
  );
}
