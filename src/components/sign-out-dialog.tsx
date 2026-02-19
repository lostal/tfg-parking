"use client";

import { useTransition } from "react";
import { signOutAction } from "@/lib/supabase/sign-out";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Loader2 } from "lucide-react";

interface SignOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction();
    });
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cerrar sesión"
      desc="¿Estás seguro de que quieres cerrar sesión? Tendrás que volver a iniciar sesión para acceder a tu cuenta."
      confirmText={
        isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Saliendo…
          </>
        ) : (
          "Cerrar sesión"
        )
      }
      cancelBtnText="Cancelar"
      destructive
      isLoading={isPending}
      handleConfirm={handleSignOut}
      className="sm:max-w-sm"
    />
  );
}
