import { Droppable } from "@hello-pangea/dnd";
import { Plus, MoreVertical, Trash2 } from "lucide-react";
import { Task, Column as ColumnType } from "@workspace/api-client-react";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";
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

  // Sort tasks by position
  const sortedTasks = [...tasks].sort((a, b) => a.position - b.position);

  return (
    <div className="flex flex-col flex-shrink-0 w-[320px] max-h-full h-full bg-secondary/30 rounded-2xl border border-secondary/50 shadow-sm overflow-hidden">
      
      {/* Column Header */}
      <div className="flex items-center justify-between p-4 pb-3 cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-lg font-semibold text-foreground tracking-tight">
            {column.title}
          </h3>
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/60 text-xs font-semibold text-muted-foreground border border-white/40 shadow-sm">
            {tasks.length}
          </span>
        </div>
        
        <div className="flex items-center">
          <button 
            onClick={() => onAddTask(column.id)}
            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Add task"
          >
            <Plus className="w-4 h-4" />
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/50 rounded-lg transition-colors focus:outline-none">
              <MoreVertical className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-lg border-border/50">
              <DropdownMenuItem 
                onClick={() => deleteColumn({ id: column.id })}
                className="text-destructive focus:text-destructive cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete Section
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={String(column.id)}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 overflow-y-auto px-3 pb-4 min-h-[150px] transition-colors duration-200",
              snapshot.isDraggingOver ? "bg-primary/5" : ""
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
            
            {/* Quick Add Button at bottom */}
            <button
              onClick={() => onAddTask(column.id)}
              className="w-full mt-2 py-3 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl border border-transparent hover:border-primary/10 transition-all border-dashed"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>
        )}
      </Droppable>
    </div>
  );
}
