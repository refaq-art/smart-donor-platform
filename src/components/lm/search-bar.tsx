"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { inputClass } from "./ui";
import { cn } from "@/lib/utils";

export function SearchBar({ placeholder = "بحث باسم العميل..." }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") || "");
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
      router.replace(`${pathname}?${params.toString()}`);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 300);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={cn(inputClass, "pr-10")}
      />
    </div>
  );
}

export function FilterChips({
  options,
  paramName,
}: {
  options: { value: string; label: string }[];
  paramName: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(paramName) || options[0]?.value || "ALL";

  function setFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") params.delete(paramName);
    else params.set(paramName, value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setFilter(opt.value)}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs font-bold transition",
            current === opt.value
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
