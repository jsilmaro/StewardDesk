import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Plus, MoreVertical, Trash2, GripVertical } from "lucide-react";
import { Task, Column as ColumnType } from "@workspace/api-client-react";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteColumn } from "@/hooks/use-kanban";

interface ColumnProps {
  column: ColumnType;
  index: number;
  tasks: Task[];
  allColumns: ColumnType[];
  onAddTask: (columnId: number) => void;
}

export function KanbanColumn({ column, index, tasks, allColumns, onAddTask }: ColumnProps) {
  const { mutate: deleteColumn } = useDeleteColumn();
  const sortedTasks = [...tasks].sort((a, b) => a.position - b.position);

  return (
    <Draggable draggableId={`col-${column.id}`} index={index}>
      {(dragProvided, dragSnapshot) => (
        <div
          ref={dragProvided.innerRef}
          {...dragProvided.draggableProps}
          className="snap-center h-full flex-shrink-0"
        >
          <div
            className={cn(
              "flex flex-col flex-shrink-0 w-[300px] max-h-full h-full rounded-2xl shadow-xl overflow-hidden backdrop-blur-md border transition-colors duration-300",
              dragSnapshot.isDragging ? "shadow-2xl ring-2 ring-green-500/30" : ""
            )}
            style={{ background: "var(--column-bg)", borderColor: "var(--column-border)" }}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <div className="flex items-center gap-2">
                {/* Drag handle */}
                <div
                  {...dragProvided.dragHandleProps}
                  className="cursor-grab active:cursor-grabbing opacity-30 hover:opacity-70 transition-opacity -ml-1"
                  style={{ color: "var(--column-title)" }}
                >
                  <GripVertical className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm tracking-tight" style={{ color: "var(--column-title)" }}>
                  {column.title}
                </h3>
                <span
                  className="flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold"
                  style={{ background: "var(--column-count-bg)", color: "var(--column-count-text)" }}
                >
                  {tasks.length}
                </span>
              </div>

              <div className="flex items-center">
                <button
                  onClick={() => onAddTask(column.id)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: "var(--icon-muted)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--icon-muted-hover)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--icon-muted)"; }}
                  title="Add task"
                >
                  <Plus className="w-4 h-4" />
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="p-1.5 rounded-lg transition-colors focus:outline-none"
                    style={{ color: "var(--icon-muted)" }}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-44 rounded-xl shadow-lg dark:bg-gray-900/90 dark:backdrop-blur-md dark:border-white/10 bg-white/95 backdrop-blur-md border-black/10"
                  >
                    <DropdownMenuItem
                      onClick={() => deleteColumn({ id: column.id })}
                      className="text-red-500 focus:text-red-600 dark:text-red-400 dark:focus:text-red-300 dark:focus:bg-white/5 focus:bg-red-50 cursor-pointer flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Section
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px mx-4" style={{ background: "var(--column-divider)" }} />

            {/* Droppable tasks */}
            <Droppable droppableId={String(column.id)}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex-1 overflow-y-auto px-3 py-3 min-h-[120px] transition-colors duration-200",
                    snapshot.isDraggingOver ? "bg-green-500/[0.04]" : ""
                  )}
                >
                  {sortedTasks.map((task, i) => (
                    <TaskCard key={task.id} task={task} index={i} columns={allColumns} />
                  ))}
                  {provided.placeholder}

                  <button
                    onClick={() => onAddTask(column.id)}
                    className="w-full mt-1 py-2 flex items-center justify-center gap-2 text-xs font-medium rounded-xl border border-dashed border-transparent transition-all"
                    style={{ color: "var(--add-task-text)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "var(--add-col-bg-hover)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--add-col-border)";
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--icon-muted)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--add-task-text)";
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Task
                  </button>
                </div>
              )}
            </Droppable>
          </div>
        </div>
      )}
    </Draggable>
  );
}
