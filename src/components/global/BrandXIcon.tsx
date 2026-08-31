import type { SVGProps } from "react";
import { siX } from "simple-icons";

interface BrandXIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

export function BrandXIcon({ size = 24, ...props }: BrandXIconProps) {
  return (
    <svg
      {...props}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d={siX.path} />
    </svg>
  );
}
