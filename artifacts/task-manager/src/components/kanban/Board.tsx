import { useState, useMemo, useEffect } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { KanbanColumn } from "./Column";
import { useColumns, useTasks, useUpdateTask } from "@/hooks/use-kanban";
import { Skeleton } from "@/components/ui/skeleton";
import { Task } from "@workspace/api-client-react";
import { Plus } from "lucide-react";
import { CreateTaskDialog, CreateColumnDialog } from "./TaskDialogs";

export function Board() {
  const { data: columns, isLoading: isLoadingCols } = useColumns();
  const { data: tasks, isLoading: isLoadingTasks } = useTasks();
  const { mutate: updateTask } = useUpdateTask();

  // Local state for optimistic UI during drag and drop
  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  // Sync server tasks to local state when they load or change
  useEffect(() => {
    if (tasks) setLocalTasks(tasks);
  }, [tasks]);

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState<number | undefined>();
  const [isColDialogOpen, setIsColDialogOpen] = useState(false);

  // Group tasks by column
  const tasksByColumn = useMemo(() => {
    const grouped: Record<number, Task[]> = {};
    if (columns) {
      columns.forEach(c => { grouped[c.id] = []; });
    }
    localTasks.forEach(t => {
      if (grouped[t.columnId]) {
        grouped[t.columnId].push(t);
      } else {
        grouped[t.columnId] = [t]; // fallback
      }
    });
    return grouped;
  }, [columns, localTasks]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a valid droppable area
    if (!destination) return;

    // Dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    const sourceColId = parseInt(source.droppableId);
    const destColId = parseInt(destination.droppableId);
    const taskId = parseInt(draggableId);

    // Optimistic UI Update
    const newTasks = [...localTasks];
    const taskIndex = newTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const taskToMove = { ...newTasks[taskIndex] };
    
    // Remove from source array representation
    const sourceColTasks = [...(tasksByColumn[sourceColId] || [])].sort((a,b) => a.position - b.position);
    sourceColTasks.splice(source.index, 1);
    
    // Add to dest array representation
    const destColTasks = sourceColId === destColId 
      ? sourceColTasks 
      : [...(tasksByColumn[destColId] || [])].sort((a,b) => a.position - b.position);
      
    destColTasks.splice(destination.index, 0, taskToMove);

    // In a real app, we'd recalculate all positions. For this mock API, 
    // we'll update the single task's position to its new index and let the server handle it.
    taskToMove.columnId = destColId;
    taskToMove.position = destination.index;

    // Update local state
    newTasks[taskIndex] = taskToMove;
    setLocalTasks(newTasks);

    // Fire mutation to server
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
      <div className="flex gap-6 p-6 h-full overflow-hidden">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex flex-col gap-4 w-[320px] flex-shrink-0">
            <Skeleton className="h-12 w-full rounded-xl bg-primary/5" />
            <Skeleton className="h-32 w-full rounded-xl bg-card/50" />
            <Skeleton className="h-24 w-full rounded-xl bg-card/50" />
          </div>
        ))}
      </div>
    );
  }

  const safeColumns = columns || [];

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 px-8 py-6 h-full overflow-x-auto items-start snap-x snap-mandatory">
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

          {/* Add Column Button */}
          <button
            onClick={() => setIsColDialogOpen(true)}
            className="flex-shrink-0 w-[320px] h-[100px] flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all group snap-center"
          >
            <div className="w-8 h-8 rounded-full bg-secondary/50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <span className="font-medium">Add Section</span>
          </button>
          
          {/* Spacer for right edge padding in scroll container */}
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
