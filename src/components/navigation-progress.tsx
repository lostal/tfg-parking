/**
 * NavigationProgress Component
 *
 * Top loading bar that shows during page navigation.
 * Adapted from shadcn-admin for Next.js App Router.
 */

"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LoadingBar, { type LoadingBarRef } from "react-top-loading-bar";

export function NavigationProgress() {
  const ref = useRef<LoadingBarRef>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevPathRef = useRef("");

  useEffect(() => {
    const currentPath = pathname + searchParams.toString();

    if (prevPathRef.current && prevPathRef.current !== currentPath) {
      // Navigation just completed
      ref.current?.complete();
    }

    prevPathRef.current = currentPath;
  }, [pathname, searchParams]);

  // Start loading on any click on links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (link && link.href && link.href.startsWith(window.location.origin)) {
        ref.current?.continuousStart();
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <LoadingBar
      color="var(--muted-foreground)"
      ref={ref}
      shadow={true}
      height={2}
    />
  );
}
