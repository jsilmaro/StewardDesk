import { Draggable } from "@hello-pangea/dnd";
import { MoreHorizontal, Calendar, Leaf } from "lucide-react";
import { Task, Column } from "@workspace/api-client-react";
import { cn, formatDate } from "@/lib/utils";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useDeleteTask } from "@/hooks/use-kanban";
import { useState } from "react";
import { EditTaskDialog } from "./TaskDialogs";

interface TaskCardProps {
  task: Task;
  index: number;
  columns: Column[];
}

export function TaskCard({ task, index, columns }: TaskCardProps) {
  const { mutate: deleteTask } = useDeleteTask();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const priorityConfig = {
    low: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: <Leaf className="w-3 h-3 mr-1" /> },
    medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: <div className="w-2 h-2 rounded-full bg-amber-500 mr-1.5" /> },
    high: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/20", icon: <div className="w-2 h-2 rounded-full bg-destructive mr-1.5" /> },
  };

  const pConfig = priorityConfig[task.priority as keyof typeof priorityConfig];

  return (
    <>
      <Draggable draggableId={String(task.id)} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={cn(
              "group relative flex flex-col gap-3 p-4 mb-3 rounded-xl bg-white border",
              "transition-all duration-200 ease-out outline-none",
              snapshot.isDragging 
                ? "shadow-xl shadow-black/10 border-primary/40 rotate-[2deg] scale-[1.02] z-50 cursor-grabbing" 
                : "card-depth border-border/60 hover:border-primary/20 hover:-translate-y-0.5 cursor-grab",
            )}
            style={provided.draggableProps.style}
          >
            {/* Header: Title & Menu */}
            <div className="flex justify-between items-start gap-2">
              <h4 className="font-medium text-foreground leading-snug break-words">
                {task.title}
              </h4>
              <DropdownMenu>
                <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity p-1 -mr-2 -mt-1 rounded-md hover:bg-muted text-muted-foreground focus:outline-none focus:opacity-100">
                  <MoreHorizontal className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 bg-card border-border/50 shadow-xl rounded-xl">
                  <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)} className="cursor-pointer">
                    Edit task
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => deleteTask({ id: task.id })}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Description Preview */}
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}

            {/* Footer: Priority & Date */}
            <div className="flex items-center justify-between mt-1 pt-3 border-t border-border/40">
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                pConfig.bg, pConfig.text, pConfig.border
              )}>
                {pConfig.icon}
                <span className="capitalize">{task.priority}</span>
              </span>
              
              <div className="flex items-center text-xs text-muted-foreground/80 font-medium">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(task.createdAt)}
              </div>
            </div>
          </div>
        )}
      </Draggable>

      <EditTaskDialog 
        task={task} 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen} 
        columns={columns}
      />
    </>
  );
}
