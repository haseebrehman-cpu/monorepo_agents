import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-indigo-600 text-white hover:bg-indigo-500",
        secondary: "bg-gray-500 text-white hover:bg-gray-400",
        outline: "border border-gray-500 bg-white text-gray-700 hover:bg-gray-50",
        ghost: "bg-transparent text-gray-500 hover:bg-gray-100",
        link: "text-indigo-600 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-2 text-sm",
        md: "h-9 px-3 text-base",
        lg: "h-11 px-4 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export default function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={clsx(buttonVariants({ variant, size }), className)}
    />
  );
}
