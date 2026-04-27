import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DeleteBudgetDialogProps {
  open: boolean
  budgetName: string
  isDeleting: boolean
  onOpenChange: (open: boolean) => void
  onConfirmDelete: () => void
}

export function DeleteBudgetDialog({
  open,
  budgetName,
  isDeleting,
  onOpenChange,
  onConfirmDelete,
}: DeleteBudgetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Budget</DialogTitle>
          <DialogDescription>
            This will permanently remove
            {" "}
            <span className="font-medium text-foreground">{budgetName}</span>
            {" "}
            and its progress tracking view.
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
            disabled={isDeleting}
            onClick={onConfirmDelete}
          >
            {isDeleting ? "Deleting..." : "Delete Budget"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
