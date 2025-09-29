import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const RadioGroup = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      className={cn("grid gap-2", className)}
      ref={ref}
      {...props}
    >
      {children}
    </div>
  );
});
RadioGroup.displayName = "RadioGroup";

export const RadioGroupItem = forwardRef(({ className, value, onChange, name, checked, ...props }, ref) => {
  return (
    <input
      type="radio"
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      {...props}
    />
  );
});
RadioGroupItem.displayName = "RadioGroupItem";