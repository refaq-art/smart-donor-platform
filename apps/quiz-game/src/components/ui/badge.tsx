import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold', {
  variants: {
    tone: {
      primary: 'bg-arena-primary/20 text-arena-primary2 border border-arena-primary/40',
      success: 'bg-arena-success/20 text-arena-success border border-arena-success/40',
      danger: 'bg-arena-danger/20 text-arena-danger border border-arena-danger/40',
      accent: 'bg-arena-accent/20 text-arena-accent2 border border-arena-accent/40',
      neutral: 'bg-white/10 text-white/80 border border-white/10',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
