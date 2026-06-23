"use client";

import { forwardRef } from "react";

const Input = forwardRef(function Input(
  { label, error, className = "", id, ...props },
  ref
) {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`bg-panel border border-hairline rounded-sm px-3.5 py-2.5 text-paper placeholder:text-steel/60 focus:border-flame transition-colors ${
          error ? "border-danger" : ""
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
});

export default Input;
