"use client";

import { useEffect } from "react";

export function PrintTrigger() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
      window.onafterprint = () => window.close();
    }, 350);
    return () => clearTimeout(timer);
  }, []);
  return null;
}
