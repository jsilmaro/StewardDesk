import { Droppable } from "@hello-pangea/dnd";
import { Plus, MoreVertical, Trash2 } from "lucide-react";
import { Task, Column as ColumnType } from "@workspace/api-client-react";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";
import { useAuth } from "@workspace/replit-auth-web";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useDeleteColumn } from "@/hooks/use-kanban";

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  allColumns: ColumnType[];
  onAddTask: (columnId: number) => void;
}

export function KanbanColumn({ column, tasks, allColumns, onAddTask }: ColumnProps) {
  const { mutate: deleteColumn } = useDeleteColumn();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const sortedTasks = [...tasks].sort((a, b) => a.position - b.position);

  return (
    <div className="flex flex-col flex-shrink-0 w-[320px] max-h-full h-full bg-black/30 backdrop-blur-md rounded-2xl border border-white/15 shadow-xl overflow-hidden">
      
      {/* Column Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white/90 text-base tracking-tight">
            {column.title}
          </h3>
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-semibold text-white/60 border border-white/10">
            {tasks.length}
          </span>
        </div>
        
        <div className="flex items-center">
          <button 
            onClick={() => onAddTask(column.id)}
            className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Add task"
          >
            <Plus className="w-4 h-4" />
          </button>
          
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus:outline-none">
                <MoreVertical className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-lg border-white/10 bg-gray-900/90 backdrop-blur-md">
                <DropdownMenuItem 
                  onClick={() => deleteColumn({ id: column.id })}
                  className="text-red-400 focus:text-red-300 focus:bg-white/5 cursor-pointer flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete Section
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px mx-4 bg-white/10" />

      {/* Droppable Area */}
      <Droppable droppableId={String(column.id)}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 overflow-y-auto px-3 py-3 min-h-[150px] transition-colors duration-200",
              snapshot.isDraggingOver ? "bg-green-500/5" : ""
            )}
          >
            {sortedTasks.map((task, index) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                index={index} 
                columns={allColumns} 
              />
            ))}
            {provided.placeholder}
            
            <button
              onClick={() => onAddTask(column.id)}
              className="w-full mt-1 py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>
        )}
      </Droppable>
    </div>
  );
}
