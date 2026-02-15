/**
 * SignOutDialog Component
 *
 * Confirmation dialog for signing out.
 * Shows warning message and requires explicit confirmation.
 */

"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface SignOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handleSignOut: () => void;
}

export function SignOutDialog({
  open,
  onOpenChange,
  handleSignOut,
}: SignOutDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cerrar sesión"
      desc="¿Estás seguro de que quieres cerrar sesión? Tendrás que volver a iniciar sesión para acceder a tu cuenta."
      confirmText="Cerrar sesión"
      cancelBtnText="Cancelar"
      destructive
      handleConfirm={handleSignOut}
      className="sm:max-w-sm"
    />
  );
}
