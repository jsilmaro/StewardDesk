import { Draggable } from "@hello-pangea/dnd";
import { MoreHorizontal, Calendar, Leaf } from "lucide-react";
import { Task, Column } from "@workspace/api-client-react";
import { cn, formatDate } from "@/lib/utils";
import { useAuth } from "@workspace/replit-auth-web";
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
  const { user } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const isOwner = task.userId === user?.id;
  const canModify = isAdmin || isOwner;

  const priorityConfig = {
    low: {
      bg: "bg-emerald-500/15",
      text: "text-emerald-300",
      border: "border-emerald-500/20",
      icon: <Leaf className="w-3 h-3 mr-1" />,
    },
    medium: {
      bg: "bg-amber-500/15",
      text: "text-amber-300",
      border: "border-amber-500/20",
      icon: <div className="w-2 h-2 rounded-full bg-amber-400 mr-1.5" />,
    },
    high: {
      bg: "bg-red-500/15",
      text: "text-red-300",
      border: "border-red-500/20",
      icon: <div className="w-2 h-2 rounded-full bg-red-400 mr-1.5" />,
    },
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
              "group relative flex flex-col gap-3 p-4 mb-2.5 rounded-xl",
              "bg-white/8 backdrop-blur-sm border transition-all duration-200 ease-out outline-none",
              snapshot.isDragging
                ? "shadow-2xl border-green-400/40 rotate-[1.5deg] scale-[1.02] z-50 cursor-grabbing bg-white/12"
                : "border-white/10 hover:border-white/20 hover:-translate-y-0.5 hover:bg-white/10 cursor-grab",
            )}
            style={provided.draggableProps.style}
          >
            {/* Header: Title & Menu */}
            <div className="flex justify-between items-start gap-2">
              <h4 className="font-medium text-white/90 leading-snug break-words text-sm">
                {task.title}
              </h4>
              {canModify && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity p-1 -mr-2 -mt-1 rounded-md hover:bg-white/10 text-white/50 focus:outline-none focus:opacity-100">
                    <MoreHorizontal className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 bg-gray-900/90 backdrop-blur-md border-white/10 shadow-xl rounded-xl">
                    <DropdownMenuItem
                      onClick={() => setIsEditDialogOpen(true)}
                      className="cursor-pointer text-white/80 focus:text-white focus:bg-white/5"
                    >
                      Edit task
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => deleteTask({ id: task.id })}
                      className="text-red-400 focus:text-red-300 focus:bg-white/5 cursor-pointer"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Description Preview */}
            {task.description && (
              <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}

            {/* Footer: Priority & Date */}
            <div className="flex items-center justify-between pt-2 border-t border-white/8">
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                pConfig.bg, pConfig.text, pConfig.border
              )}>
                {pConfig.icon}
                <span className="capitalize">{task.priority}</span>
              </span>
              
              <div className="flex items-center text-xs text-white/35 font-medium">
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
