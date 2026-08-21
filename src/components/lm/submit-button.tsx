"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "./ui";

export function SubmitButton({
  children,
  pendingText = "جارٍ الحفظ...",
  className,
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  variant?: "primary" | "secondary" | "danger";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={cn("w-full", className)} variant={variant}>
      {pending ? pendingText : children}
    </Button>
  );
}
