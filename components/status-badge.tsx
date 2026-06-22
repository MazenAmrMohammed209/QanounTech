import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "active" | "pending" | "completed" | "cancelled" | "in-progress" | "overdue"
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    completed: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    "in-progress": "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    overdue: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  }

  const labels = {
    active: "Active",
    pending: "Pending",
    completed: "Completed",
    cancelled: "Cancelled",
    "in-progress": "In Progress",
    overdue: "Overdue",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[status],
        className,
      )}
    >
      {labels[status]}
    </span>
  )
}
