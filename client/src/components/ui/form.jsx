import { createContext, useContext, useId, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const FormFieldContext = createContext({});
const FormItemContext = createContext({});

export function Form({ 
  children, 
  // Filter out React Hook Form props that shouldn't go to DOM
  formState,
  subscribe,
  trigger,
  register,
  watch,
  reset,
  unregister,
  handleSubmit,
  setValue,
  getValues,
  resetField,
  clearErrors,
  setError,
  setFocus,
  getFieldState,
  formControl,
  ...props 
}) {
  return <form {...props}>{children}</form>;
}

export function FormField({ control, name, render, ...props }) {
  return (
    <FormFieldContext.Provider value={{ name, ...props }}>
      {render({ field: { name, ...control?.register(name) } })}
    </FormFieldContext.Provider>
  );
}

export const FormItem = forwardRef(({ className, ...props }, ref) => {
  const id = useId();
  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";

export const FormLabel = forwardRef(({ className, ...props }, ref) => {
  const { id } = useContext(FormItemContext);
  return <Label ref={ref} className={className} htmlFor={id} {...props} />;
});
FormLabel.displayName = "FormLabel";

export const FormControl = forwardRef(({ ...props }, ref) => {
  const { id } = useContext(FormItemContext);
  return <div ref={ref} id={id} {...props} />;
});
FormControl.displayName = "FormControl";

export const FormMessage = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {children}
    </p>
  );
});
FormMessage.displayName = "FormMessage";