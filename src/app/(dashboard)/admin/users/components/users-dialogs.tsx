"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteUser } from "@/app/(dashboard)/admin/actions";
import { useUsers } from "./users-provider";

// --- Delete User Dialog -------------------------------------------------------

function DeleteUserDialog() {
  const { open, setOpen, currentRow, setCurrentRow } = useUsers();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const closeDialog = () => {
    setOpen(null);
    setCurrentRow(null);
  };

  const onConfirm = () => {
    if (!currentRow) return;
    startTransition(async () => {
      const result = await deleteUser({ user_id: currentRow.id });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Cuenta eliminada correctamente");
      closeDialog();
      router.refresh();
    });
  };

  const displayName =
    currentRow?.full_name || currentRow?.email || "este usuario";

  return (
    <AlertDialog
      open={open === "delete"}
      onOpenChange={(o) => !o && closeDialog()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar cuenta</AlertDialogTitle>
          <AlertDialogDescription>
            Vas a eliminar permanentemente la cuenta de{" "}
            <strong>{displayName}</strong>. Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={pending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Eliminar cuenta
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// --- Combined Dialogs Wrapper -------------------------------------------------

export function UsersDialogs() {
  return <DeleteUserDialog />;
}
