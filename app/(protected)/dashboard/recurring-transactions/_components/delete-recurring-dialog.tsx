import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DeleteRecurringDialogProps {
  open: boolean
  title: string
  isDeleting: boolean
  onOpenChange: (open: boolean) => void
  onConfirmDelete: () => void
}

export function DeleteRecurringDialog({
  open,
  title,
  isDeleting,
  onOpenChange,
  onConfirmDelete,
}: DeleteRecurringDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Recurring Transaction</DialogTitle>
          <DialogDescription>
            This will permanently remove
            {" "}
            <span className="font-medium text-foreground">{title}</span>
            {" "}
            and stop future scheduled runs.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
