"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Users, Package, FileText, Loader2 } from "lucide-react";
import { globalSearch, type SearchResult } from "./actions";

const TYPE_ICON: Record<SearchResult["type"], typeof Users> = {
  customer: Users,
  product: Package,
  quote: FileText,
  sale: FileText,
};

const TYPE_LABEL: Record<SearchResult["type"], string> = {
  customer: "Cliente",
  product: "Produto",
  quote: "Orçamento",
  sale: "Venda",
};

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const runSearch = useCallback((term: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (term.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const data = await globalSearch(term);
      setResults(data);
      setLoading(false);
    }, 250);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    runSearch(value);
  }

  function handleSelect(href: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(href);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setResults([]);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 text-sm text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted/50 transition-colors w-56"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="flex-1 text-left">Buscar...</span>
        <kbd className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded border border-border">
          ⌘K
        </kbd>
      </button>

      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
        title="Buscar"
      >
        <Search className="w-4 h-4" />
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle className="sr-only">Busca global</DialogTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Buscar clientes, produtos, orçamentos..."
                value={query}
                onChange={(e) => handleChange(e.target.value)}
                className="pl-9"
              />
              {loading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto px-2 pb-2 pt-2">
            {query.trim().length < 2 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Digite ao menos 2 caracteres
              </p>
            ) : !loading && results.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Nenhum resultado para “{query}”
              </p>
            ) : (
              <div className="space-y-0.5">
                {results.map((result) => {
                  const Icon = TYPE_ICON[result.type];
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result.href)}
                      className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left hover:bg-muted/60 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex-shrink-0">
                        {TYPE_LABEL[result.type]}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
