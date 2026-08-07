import { cn } from '@/lib/utils';

export function ProgressBar({ value, className, colorClassName }: { value: number; className?: string; colorClassName?: string }) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-white/10', className)}>
      <div
        className={cn('h-full rounded-full bg-primary-gradient transition-all duration-300', colorClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
