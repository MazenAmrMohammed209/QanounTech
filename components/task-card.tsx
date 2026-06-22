import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, ArrowUpRight, Clock, Users, CheckSquare } from "lucide-react"

export function TaskCard({
  task,
  caseName,
  assigneeName,
  onEdit,
  onStart,
  onComplete,
  hideEdit = false
}: {
  task: any,
  caseName: string,
  assigneeName: string,
  onEdit?: (task: any) => void,
  onStart?: (taskId: string) => void,
  onComplete?: (taskId: string) => void,
  hideEdit?: boolean
}) {
  const isPending = task.status === "pending" || task.status === "todo";
  const isInProgress = task.status === "in_progress";
  const isDone = task.status === "completed" || task.status === "done";

  return (
    <Card className={`transition-colors ${isDone ? 'opacity-70 bg-secondary/10' : isInProgress ? 'hover:border-accent/50 border-l-2 border-l-accent border-l-solid' : 'hover:border-magenta/50'}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          {isDone ? (
            <>
              <Badge variant="outline" className="text-xs grayscale text-muted-foreground border-muted-foreground/30">مكتملة</Badge>
              <CheckSquare className="h-4 w-4 text-accent" />
            </>
          ) : (
            <>
              <Badge className={`bg-purple text-white border-transparent text-xs`}>{task.priority === "high" ? "عالية" : task.priority === "low" ? "منخفضة" : "عادية"}</Badge>
              <div className="flex items-center gap-2">
                {!hideEdit && onEdit && (
                  <button className="text-muted-foreground hover:text-foreground" onClick={() => onEdit(task)} title="تعديل المهمة">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                <button className="text-muted-foreground hover:text-foreground"><ArrowUpRight className="h-4 w-4" /></button>
              </div>
            </>
          )}
        </div>
        <div>
          <h4 className={`font-semibold text-sm ${isDone ? 'line-through' : ''}`}>{task.title}</h4>
          <p className="text-xs text-muted-foreground mt-1">{caseName}</p>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border mt-3">
          <span className="text-xs flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {task.due_date || "بدون تاريخ"}</span>
          <Badge variant="outline" className={`text-xs flex items-center gap-1 ${isDone ? 'grayscale text-muted-foreground border-muted-foreground/30' : 'bg-secondary/30'}`}>
            <Users className={`h-3 w-3 ${!isDone ? 'text-magenta' : ''}`} />
            {assigneeName}
          </Badge>
        </div>

        {isPending && onStart && (
          <Button variant="outline" size="sm" className="w-full gap-2 mt-2 h-8 text-xs" onClick={() => onStart(task.id)}>
            <Clock className="h-3 w-3 text-accent" />
            ابدأ المهمة
          </Button>
        )}

        {isInProgress && onComplete && (
          <Button variant="outline" size="sm" className="w-full gap-2 mt-2 h-8 text-xs" onClick={() => onComplete(task.id)}>
            <CheckSquare className="h-3 w-3 text-accent" />
            إنهاء المهمة
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
