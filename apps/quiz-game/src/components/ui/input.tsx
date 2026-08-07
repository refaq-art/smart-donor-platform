import {
  forwardRef,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'w-full rounded-xl border border-arena-border bg-arena-surface2 px-4 py-2.5 text-white placeholder:text-white/40 outline-none transition focus:border-arena-primary focus:ring-2 focus:ring-arena-primary/30',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-xl border border-arena-border bg-arena-surface2 px-4 py-2.5 text-white placeholder:text-white/40 outline-none transition focus:border-arena-primary focus:ring-2 focus:ring-arena-primary/30',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'w-full rounded-xl border border-arena-border bg-arena-surface2 px-4 py-2.5 text-white outline-none transition focus:border-arena-primary focus:ring-2 focus:ring-arena-primary/30',
      className
    )}
    {...props}
  />
));
Select.displayName = 'Select';

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1.5 block text-sm font-semibold text-white/80', className)} {...props} />;
}
