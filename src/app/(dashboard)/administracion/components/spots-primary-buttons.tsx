"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpots } from "./spots-provider";

export function SpotsPrimaryButtons() {
  const { setOpen } = useSpots();

  return (
    <Button size="sm" className="h-8 gap-1.5" onClick={() => setOpen("add")}>
      <Plus className="h-4 w-4" />
      Nueva plaza
    </Button>
  );
}
