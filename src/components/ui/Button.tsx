import React from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading,
    className = '',
    ...props
}) => {
    const baseStyles =
        "inline-flex shrink-0 items-center justify-center gap-2 font-semibold leading-5 transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background";

    const variants = {
        primary:
            "bg-primary text-on-primary hover:brightness-110 border border-transparent shadow-sm",
        secondary:
            "bg-surface text-foreground border border-border hover:bg-surface-alt shadow-sm",
        danger: "bg-danger text-on-danger hover:brightness-110 border border-transparent shadow-sm",
        success: "bg-success text-on-success hover:brightness-110 border border-transparent shadow-sm",
        ghost: "shadow-none bg-transparent text-muted hover:text-foreground hover:bg-surface-elevated/80 border border-transparent",
    };

    const sizes = {
        sm: "min-h-8 px-3 py-1.5 text-xs rounded-md",
        md: "min-h-10 px-4 py-2 text-sm rounded-lg",
        lg: "min-h-12 px-6 py-3 text-base rounded-lg",
        icon: "h-10 w-10 p-2 rounded-lg shadow-none",
    };

    return (
        <button
            {...props}
            className={cn(baseStyles, variants[variant], sizes[size], 'glass-button', `glass-button-${variant}`, className)}
            disabled={isLoading || props.disabled}
            aria-busy={isLoading || undefined}
        >
            {isLoading ? (
                <div className="flex items-center gap-2">
                    <LoaderCircle className="animate-spin h-4 w-4" aria-hidden />
                    <span>Processing</span>
                </div>
            ) : children}
        </button>
    );
};
