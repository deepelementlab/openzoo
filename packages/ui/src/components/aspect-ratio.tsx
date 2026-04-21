import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const aspectRatioVariants = cva("relative w-full overflow-hidden", {
  variants: {
    ratio: {
      "1/1": "aspect-square",
      "4/3": "aspect-[4/3]",
      "16/9": "aspect-[16/9]",
      "21/9": "aspect-[21/9]",
    },
  },
  defaultVariants: { ratio: "16/9" },
});

interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof aspectRatioVariants> {}

function AspectRatio({ className, ratio, ...props }: AspectRatioProps) {
  return <div className={cn(aspectRatioVariants({ ratio }), className)} {...props} />;
}

export { AspectRatio };
