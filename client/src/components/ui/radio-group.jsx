import { createContext, useContext, forwardRef } from "react";
import { cn } from "@/lib/utils";

const RadioGroupContext = createContext({});

export const RadioGroup = forwardRef(({ className, onValueChange, defaultValue, ...props }, ref) => {
  return (
    <RadioGroupContext.Provider value={{ onValueChange, value: defaultValue }}>
      <div
        className={cn("grid gap-2", className)}
        {...props}
        ref={ref}
      />
    </RadioGroupContext.Provider>
  );
});
RadioGroup.displayName = "RadioGroup";

export const RadioGroupItem = forwardRef(({ className, children, value, ...props }, ref) => {
  const { onValueChange } = useContext(RadioGroupContext);
  
  return (
    <input
      type="radio"
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      value={value}
      onChange={() => onValueChange?.(value)}
      {...props}
    />
  );
});
RadioGroupItem.displayName = "RadioGroupItem";