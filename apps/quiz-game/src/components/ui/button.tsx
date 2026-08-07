import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none active:scale-95 whitespace-nowrap',
  {
    variants: {
      variant: {
        primary: 'bg-primary-gradient text-white shadow-glow hover:brightness-110',
        accent: 'bg-accent-gradient text-arena-bg shadow-glow-accent hover:brightness-110',
        ghost: 'bg-white/5 text-white hover:bg-white/10 border border-white/10',
        outline: 'border-2 border-arena-primary text-arena-primary2 hover:bg-arena-primary/10',
        danger: 'bg-arena-danger text-white hover:brightness-110',
        success: 'bg-arena-success text-white hover:brightness-110',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-5 py-2.5 text-base',
        lg: 'px-8 py-4 text-lg',
        xl: 'px-10 py-5 text-xl',
        icon: 'p-2.5',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => {
  return <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = 'Button';
