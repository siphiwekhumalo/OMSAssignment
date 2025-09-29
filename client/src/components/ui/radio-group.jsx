import { createContext, useContext, forwardRef } from "react";
import { cn } from "@/lib/utils";

const RadioGroupContext = createContext({});

export const RadioGroup = forwardRef(({ className, onValueChange, defaultValue, value, name, ...props }, ref) => {
  const currentValue = value !== undefined ? value : defaultValue;
  return (
    <RadioGroupContext.Provider value={{ onValueChange, value: currentValue, name }}>
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
  const context = useContext(RadioGroupContext) || {};
  const { onValueChange, name, value: groupValue } = context;
  
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
      checked={groupValue === value}
      onChange={(e) => {
        if (e.target && e.target.value !== undefined && onValueChange) {
          onValueChange(e.target.value);
        }
      }}
      {...props}
    />
  );
});
RadioGroupItem.displayName = "RadioGroupItem";