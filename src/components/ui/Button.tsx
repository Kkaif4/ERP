import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
    size?: "sm" | "md" | "lg" | "xl";
    loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = "", variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
        const baseStyles = "inline-flex items-center justify-center font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none rounded-2xl touch-target cursor-pointer tracking-wide";

        const variants = {
            primary: "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20",
            secondary: "bg-primary-light text-primary-dark hover:bg-green-200 shadow-md shadow-primary/5",
            outline: "border-2 border-primary text-primary hover:bg-primary-light",
            ghost: "text-primary hover:bg-primary-light font-medium",
            danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200",
        };

        const sizes = {
            sm: "px-4 py-2 text-sm",
            md: "px-6 py-3 text-base",
            lg: "px-8 py-4 text-lg",
            xl: "px-10 py-5 text-xl w-full",
        };

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                disabled={disabled || loading}
                {...props}
            >
                {loading ? (
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";
