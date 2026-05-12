"use client";

interface HeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function Header({ title, description, children }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background sticky top-0 z-30 min-h-[65px]">
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 rounded-full bg-primary flex-shrink-0" />
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-3">{children}</div>
      )}
    </header>
  );
}
