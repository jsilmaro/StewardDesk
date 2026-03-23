import { useState, useMemo, useEffect } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { KanbanColumn } from "./Column";
import { useColumns, useTasks, useUpdateTask } from "@/hooks/use-kanban";
import { Skeleton } from "@/components/ui/skeleton";
import { Task } from "@workspace/api-client-react";
import { Plus } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { CreateTaskDialog, CreateColumnDialog } from "./TaskDialogs";

export function Board() {
  const { data: columns, isLoading: isLoadingCols } = useColumns();
  const { data: tasks, isLoading: isLoadingTasks } = useTasks();
  const { mutate: updateTask } = useUpdateTask();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (tasks) setLocalTasks(tasks);
  }, [tasks]);

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState<number | undefined>();
  const [isColDialogOpen, setIsColDialogOpen] = useState(false);

  const tasksByColumn = useMemo(() => {
    const grouped: Record<number, Task[]> = {};
    if (columns) {
      columns.forEach(c => { grouped[c.id] = []; });
    }
    localTasks.forEach(t => {
      if (grouped[t.columnId]) {
        grouped[t.columnId].push(t);
      } else {
        grouped[t.columnId] = [t];
      }
    });
    return grouped;
  }, [columns, localTasks]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    const sourceColId = parseInt(source.droppableId);
    const destColId = parseInt(destination.droppableId);
    const taskId = parseInt(draggableId);

    const newTasks = [...localTasks];
    const taskIndex = newTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const taskToMove = { ...newTasks[taskIndex] };
    
    const sourceColTasks = [...(tasksByColumn[sourceColId] || [])].sort((a, b) => a.position - b.position);
    sourceColTasks.splice(source.index, 1);
    
    const destColTasks = sourceColId === destColId 
      ? sourceColTasks 
      : [...(tasksByColumn[destColId] || [])].sort((a, b) => a.position - b.position);
      
    destColTasks.splice(destination.index, 0, taskToMove);

    taskToMove.columnId = destColId;
    taskToMove.position = destination.index;

    newTasks[taskIndex] = taskToMove;
    setLocalTasks(newTasks);

    updateTask({
      id: taskId,
      data: {
        columnId: destColId,
        position: destination.index
      }
    });
  };

  const handleOpenTaskDialog = (colId: number) => {
    setActiveColumnId(colId);
    setIsTaskDialogOpen(true);
  };

  if (isLoadingCols || isLoadingTasks) {
    return (
      <div className="flex gap-5 p-6 h-full overflow-hidden">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex flex-col gap-3 w-[320px] flex-shrink-0">
            <Skeleton className="h-12 w-full rounded-xl bg-white/5" />
            <Skeleton className="h-28 w-full rounded-xl bg-white/5" />
            <Skeleton className="h-20 w-full rounded-xl bg-white/5" />
          </div>
        ))}
      </div>
    );
  }

  const safeColumns = columns || [];

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-5 px-6 py-5 h-full overflow-x-auto items-start snap-x snap-mandatory">
          {safeColumns.map((col) => (
            <div key={col.id} className="snap-center h-full">
              <KanbanColumn
                column={col}
                allColumns={safeColumns}
                tasks={tasksByColumn[col.id] || []}
                onAddTask={handleOpenTaskDialog}
              />
            </div>
          ))}

          {/* Add Column - admin only */}
          {isAdmin && (
            <button
              onClick={() => setIsColDialogOpen(true)}
              className="flex-shrink-0 w-[280px] h-[80px] flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/15 hover:border-white/30 hover:bg-white/5 text-white/40 hover:text-white/70 transition-all group snap-center backdrop-blur-sm"
            >
              <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">Add Section</span>
            </button>
          )}
          
          <div className="flex-shrink-0 w-4 h-full" />
        </div>
      </DragDropContext>

      <CreateTaskDialog 
        open={isTaskDialogOpen} 
        onOpenChange={setIsTaskDialogOpen} 
        defaultColumnId={activeColumnId}
        columns={safeColumns}
      />
      
      <CreateColumnDialog
        open={isColDialogOpen}
        onOpenChange={setIsColDialogOpen}
      />
    </>
  );
}
