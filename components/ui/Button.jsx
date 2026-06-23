"use client";

import { forwardRef } from "react";

const VARIANTS = {
  primary:
    "bg-flame text-graphite hover:bg-flame-bright active:scale-[0.98] font-semibold shadow-[0_0_0_1px_rgba(255,122,26,0.3)]",
  secondary:
    "bg-transparent text-paper border border-hairline hover:border-steel hover:bg-panel-raised",
  ghost: "bg-transparent text-paper-dim hover:text-paper",
  danger: "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20",
};

const SIZES = {
  sm: "text-xs px-3 py-1.5",
  md: "text-sm px-5 py-2.5",
  lg: "text-base px-7 py-3.5",
};

const Button = forwardRef(function Button(
  { variant = "primary", size = "md", className = "", children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-sm transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
