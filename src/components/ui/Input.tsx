import React, { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, className = "", id, type, ...props }, ref) => {
        const generatedId = useId();
        const inputId = id || generatedId;
        const [showPassword, setShowPassword] = useState(false);

        const isPassword = type === "password";
        const inputType = isPassword ? (showPassword ? "text" : "password") : type;

        return (
            <div className="w-full space-y-2 flex flex-col group/input">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 px-1 transition-colors duration-300 group-focus-within/input:text-emerald-600"
                    >
                        {label}
                    </label>
                )}

                <div className="relative flex items-center">
                    {icon && React.isValidElement(icon) && (
                        <div className="absolute left-5 text-slate-300 group-focus-within/input:text-emerald-500 transition-all duration-300 z-10 pointer-events-none">
                            {React.cloneElement(icon as React.ReactElement<any>, {
                                size: 18,
                                strokeWidth: 2
                            })}
                        </div>
                    )}

                    <input
                        ref={ref}
                        id={inputId}
                        type={inputType}
                        className={`
                            w-full h-14 rounded-xl border-2 border-slate-100 bg-slate-50
                            px-5 text-[15px] font-semibold text-slate-700
                            placeholder:text-slate-300/80
                            focus:border-emerald-500/30 focus:bg-white
                            focus:outline-none focus:ring-4 focus:ring-emerald-500/[0.05]
                            transition-all duration-300
                            disabled:opacity-50
                            ${icon ? "pl-14" : "pl-5"}
                            ${isPassword ? "pr-14" : "pr-5"}
                            ${error ? "border-red-500/50 bg-red-50/10 focus:ring-red-500/5 focus:border-red-500/40" : ""}
                            ${className}
                        `}
                        {...props}
                    />

                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 p-2 text-slate-300 hover:text-emerald-600 focus:outline-none transition-all duration-200 active:scale-90"
                        >
                            {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
                        </button>
                    )}
                </div>

                {error && (
                    <p className="ml-1 text-[11px] font-bold text-red-500 uppercase tracking-widest animate-in slide-in-from-top-1 duration-300">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";
