import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  href: string;
  className?: string;
  /** Visual height; can exceed header row height when parent uses overflow-visible + items-center */
  heightClass?: string;
  /** Extra classes for the image (e.g. wider max-width in the header) */
  imageClassName?: string;
  priority?: boolean;
};

export function BrandLogo({
  href,
  className,
  heightClass = "h-12",
  imageClassName,
  priority = false,
}: BrandLogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0 items-center overflow-visible leading-none",
        className,
      )}
      aria-label="LeadRescue home"
    >
      <Image
        src="/logo.png"
        alt="LeadRescue"
        width={400}
        height={120}
        priority={priority}
        className={cn(
          heightClass,
          "w-auto max-w-[min(72vw,420px)] object-contain object-left",
          imageClassName,
        )}
      />
    </Link>
  );
}
