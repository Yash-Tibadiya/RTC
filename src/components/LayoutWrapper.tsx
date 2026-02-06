interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({
  children,
}: LayoutWrapperProps) {
  return (
    <div className="relative mx-auto min-h-[calc(100svh-11rem)] md:max-w-5xl border-x border-edge max-w-screen ">
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
      {children}
    </div>
  );
}
