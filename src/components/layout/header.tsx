"use client";

interface HeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function Header({ title, description, children }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-border bg-background sticky top-0 z-30 min-h-[60px] md:min-h-[65px]">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <div className="w-1 h-7 md:h-8 rounded-full bg-primary flex-shrink-0" />

        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-bold tracking-tight text-foreground truncate">
            {title}
          </h1>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate hidden sm:block">
              {description}
            </p>
          )}
        </div>
      </div>

      {children && (
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 ml-2">
          {children}
        </div>
      )}
    </header>
  );
}
