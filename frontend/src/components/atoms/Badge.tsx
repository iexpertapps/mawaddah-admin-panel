import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "destructive" | "default";
  className?: string;
}

const variantClasses: Record<string, string> = {
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  destructive: "bg-red-100 text-red-800",
  default: "bg-gray-100 text-gray-800",
};

const Badge: React.FC<BadgeProps> = ({ children, variant = "default", className = "" }) => {
  return (
    <span
      className={`inline-block px-2 py-1 rounded text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export { Badge };
export default Badge; 