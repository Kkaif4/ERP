import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-extrabold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer tracking-wide",
    {
        variants: {
            variant: {
                // Primary — emerald with glow shadow
                primary:
                    "bg-primary text-primary-foreground rounded-xl shadow-[0_8px_16px_rgba(21,128,61,0.25)] hover:-translate-y-0.5 hover:shadow-[0_12px_20px_rgba(21,128,61,0.3)]",
                // Secondary — neutral slate
                secondary:
                    "bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 hover:text-slate-900 shadow-none",
                // Outline — emerald border
                outline:
                    "border-2 border-primary text-primary hover:bg-primary/5 rounded-xl",
                // Ghost — no background
                ghost:
                    "text-primary hover:bg-primary/5 rounded-xl font-medium shadow-none",
                // Danger — icon-only destructive (34×34)
                destructive:
                    "bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500 rounded-[10px] w-[34px] h-[34px] p-0",
                // Link style
                link:
                    "text-primary underline-offset-4 hover:underline shadow-none rounded-none",
                // Legacy danger (full-width)
                danger:
                    "bg-red-500 text-white hover:bg-red-600 rounded-xl shadow-lg shadow-red-200",
            },
            size: {
                sm: "px-4 py-2 text-sm",
                md: "px-6 py-3 text-base",
                lg: "px-8 py-4 text-lg",
                xl: "px-10 py-5 text-xl w-full",
                icon: "h-9 w-9",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "md",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
    loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={disabled || loading}
                {...props}
            >
                {loading ? (
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                {children}
            </Comp>
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
