import { Draggable } from "@hello-pangea/dnd";
import { MoreHorizontal, Calendar, Leaf } from "lucide-react";
import { Task, Column } from "@workspace/api-client-react";
import { cn, formatDate } from "@/lib/utils";
import { useAuth } from "@workspace/replit-auth-web";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  const { user } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Only the task owner can edit or delete — admins are read-only monitors
  const isOwner = task.userId === user?.id;

  const priorityConfig = {
    low: {
      bg: "bg-emerald-500/15",
      text: "text-emerald-500 dark:text-emerald-400",
      border: "border-emerald-500/20",
      icon: <Leaf className="w-3 h-3 mr-1" />,
    },
    medium: {
      bg: "bg-amber-500/15",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-500/20",
      icon: <div className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 mr-1.5 flex-shrink-0" />,
    },
    high: {
      bg: "bg-red-500/15",
      text: "text-red-600 dark:text-red-400",
      border: "border-red-500/20",
      icon: <div className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400 mr-1.5 flex-shrink-0" />,
    },
  };

  const pConfig = priorityConfig[task.priority as keyof typeof priorityConfig] ?? priorityConfig.medium;

  return (
    <>
      <Draggable draggableId={String(task.id)} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={cn(
              "group relative flex flex-col gap-2.5 p-3.5 mb-2 rounded-xl border",
              "backdrop-blur-sm transition-all duration-200 ease-out outline-none",
              snapshot.isDragging
                ? "rotate-[1.5deg] scale-[1.02] z-50 cursor-grabbing shadow-2xl"
                : "cursor-grab hover:-translate-y-0.5 shadow-sm"
            )}
            style={{
              ...(provided.draggableProps.style ?? {}),
              background: snapshot.isDragging
                ? "var(--task-bg-drag)"
                : "var(--task-bg)",
              borderColor: snapshot.isDragging
                ? "var(--task-border-drag)"
                : "var(--task-border)",
            }}
            onMouseEnter={(e) => {
              if (!snapshot.isDragging) {
                (e.currentTarget as HTMLDivElement).style.background = "var(--task-bg-hover)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--task-border-hover)";
              }
            }}
            onMouseLeave={(e) => {
              if (!snapshot.isDragging) {
                (e.currentTarget as HTMLDivElement).style.background = "var(--task-bg)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--task-border)";
              }
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-start gap-2">
              <h4
                className="font-medium text-sm leading-snug break-words flex-1"
                style={{ color: "var(--task-title)" }}
              >
                {task.title}
              </h4>

              {/* Edit menu — only for task owner */}
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 -mr-1.5 -mt-0.5 rounded-md focus:outline-none focus:opacity-100 flex-shrink-0"
                    style={{ color: "var(--icon-muted)" }}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-40 rounded-xl shadow-xl dark:bg-gray-900/90 dark:backdrop-blur-md dark:border-white/10 bg-white/95 backdrop-blur-md border-black/10"
                  >
                    <DropdownMenuItem
                      onClick={() => setIsEditDialogOpen(true)}
                      className="cursor-pointer dark:text-white/80 dark:hover:text-white dark:focus:bg-white/5 text-gray-700 focus:bg-gray-100"
                    >
                      Edit task
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => deleteTask({ id: task.id })}
                      className="text-red-500 focus:text-red-600 dark:text-red-400 dark:focus:text-red-300 dark:focus:bg-white/5 focus:bg-red-50 cursor-pointer"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Description */}
            {task.description && (
              <p
                className="text-xs line-clamp-2 leading-relaxed"
                style={{ color: "var(--task-desc)" }}
              >
                {task.description}
              </p>
            )}

            {/* Footer */}
            <div
              className="flex items-center justify-between pt-2 border-t"
              style={{ borderColor: "var(--task-divider)" }}
            >
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                  pConfig.bg, pConfig.text, pConfig.border
                )}
              >
                {pConfig.icon}
                <span className="capitalize">{task.priority}</span>
              </span>

              <div
                className="flex items-center text-xs font-medium"
                style={{ color: "var(--task-meta)" }}
              >
                <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
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
