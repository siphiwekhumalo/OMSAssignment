export function TooltipProvider({ children, ...props }) {
  return <div {...props}>{children}</div>;
}

export function Tooltip({ children }) {
  return <div>{children}</div>;
}