import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <>
      <div
        className={cn(
          "sticky top-0 z-50 max-w-screen overflow-x-hidden bg-background px-2 pt-2",
          "data-[affix=true]:shadow-[0_0_16px_0_black]/8 dark:data-[affix=true]:shadow-[0_0_16px_0_black]",
          "not-dark:data-[affix=true]:**:data-header-container:after:bg-border",
          "transition-shadow duration-300",
        )}
      >
        <div
          className="screen-line-before screen-line-after mx-auto flex h-12 items-center justify-between gap-2 border-x border-edge px-2 after:z-1 after:transition-[background-color] sm:gap-4 md:max-w-5xl"
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

          {/* Logo */}
          <Link href="/">
            {/* <Image
              src="/images/logo.png"
              alt="Balance Box Logo"
              width={32}
              height={32}
              className="h-11 w-auto cursor-pointer dark:invert"
            /> */}
            <h1 className="text-2xl font-black tracking-tighter">RTC</h1>
          </Link>

          <div className="flex-1" />

          <div className="flex items-center *:first:mr-2">
            <span className="mx-2 flex h-5 w-px bg-border" />
            hello
          </div>
        </div>
      </div>

      <div className="max-w-screen overflow-x-hidden px-2 relative">
        <div className="mx-auto md:max-w-5xl relative">
          <div
            className={cn(
              "h-8 px-2",
              "screen-line-after",
              "before:absolute before:-left-[100vw] before:-z-1 before:h-full before:w-[200vw]",
              "before:bg-[repeating-linear-gradient(315deg,var(--pattern-foreground)_0,var(--pattern-foreground)_1px,transparent_0,transparent_50%)] before:bg-size-[10px_10px] before:[--pattern-foreground:var(--color-edge)]/56",
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
    </>
  );
}
