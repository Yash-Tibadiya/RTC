import { Header } from "@/components/ui/Header";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { cn } from "@/lib/utils";
import { TextHoverEffect } from "@/components/ui/text-hover-effect";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh max-w-screen flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto px-2 overflow-x-hidden">
        <LayoutWrapper>{children}</LayoutWrapper>
      </main>
      <div className="max-w-screen overflow-x-hidden px-2 relative">
        <div className="mx-auto md:max-w-5xl relative">
          <div
            className={cn(
              "h-8 px-2",
              "screen-line-before",
              "after:absolute after:-left-[100vw] after:-z-1 after:h-full after:w-[200vw]",
              "after:bg-[repeating-linear-gradient(315deg,var(--pattern-foreground)_0,var(--pattern-foreground)_1px,transparent_0,transparent_50%)] after:bg-size-[10px_10px] after:[--pattern-foreground:var(--color-edge)]/56",
            )}
          />

          {/* Left intersection pattern */}
          <div
            className="pointer-events-none absolute top-0 left-px -translate-x-full h-8 w-8 -z-1"
            aria-hidden="true"
          >
            <div className="h-full w-full border-x border-edge bg-[repeating-linear-gradient(45deg,var(--pattern-foreground)_0,var(--pattern-foreground)_1px,transparent_0,transparent_50%)] bg-size-[10px_10px] [--pattern-foreground:var(--color-edge)]/56" />
          </div>

          {/* Right intersection pattern */}
          <div
            className="pointer-events-none absolute top-0 right-px translate-x-full h-8 w-8 -z-1"
            aria-hidden="true"
          >
            <div className="h-full w-full border-x border-edge bg-[repeating-linear-gradient(45deg,var(--pattern-foreground)_0,var(--pattern-foreground)_1px,transparent_0,transparent_50%)] bg-size-[10px_10px] [--pattern-foreground:var(--color-edge)]/56" />
          </div>
        </div>
      </div>

      <div
        className={cn(
          "max-w-screen overflow-x-hidden bg-background px-2",
          "transition-shadow duration-300",
        )}
      >
        <div
          className="screen-line-before screen-line-after mx-auto flex h-64 items-center justify-center border-x border-edge px-2 before:z-1 before:transition-[background-color] md:max-w-5xl"
          data-header-container
        >
          {/* Left vertical design strip */}
          <div
            className="border-l border-edge pointer-events-none absolute inset-y-0 left-0 -translate-x-full w-8 bg-[repeating-linear-gradient(45deg,var(--pattern-foreground)_0,var(--pattern-foreground)_1px,transparent_0,transparent_50%)] bg-size-[10px_10px] [--pattern-foreground:var(--color-edge)]/56"
            aria-hidden="true"
          />

          {/* Right vertical design strip */}
          <div
            className="border-r border-edge pointer-events-none absolute inset-y-0 right-0 translate-x-full w-8 bg-[repeating-linear-gradient(45deg,var(--pattern-foreground)_0,var(--pattern-foreground)_1px,transparent_0,transparent_50%)] bg-size-[10px_10px] [--pattern-foreground:var(--color-edge)]/56"
            aria-hidden="true"
          />

            <TextHoverEffect text="RTC" />
        </div>
      </div>
    </div>
  );
}
