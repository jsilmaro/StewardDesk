import { useState, useMemo, useEffect } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { KanbanColumn } from "./Column";
import { useColumns, useTasks, useUpdateTask } from "@/hooks/use-kanban";
import { Skeleton } from "@/components/ui/skeleton";
import { Task } from "@workspace/api-client-react";
import { Plus, Eye } from "lucide-react";
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
    if (columns) columns.forEach((c) => { grouped[c.id] = []; });
    localTasks.forEach((t) => {
      if (grouped[t.columnId]) grouped[t.columnId].push(t);
      else grouped[t.columnId] = [t];
    });
    return grouped;
  }, [columns, localTasks]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Admins cannot drag tasks they don't own
    const taskId = parseInt(draggableId);
    const task = localTasks.find((t) => t.id === taskId);
    if (task && task.userId !== user?.id) return;

    const sourceColId = parseInt(source.droppableId);
    const destColId = parseInt(destination.droppableId);

    const newTasks = [...localTasks];
    const taskIndex = newTasks.findIndex((t) => t.id === taskId);
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

    updateTask({ id: taskId, data: { columnId: destColId, position: destination.index } });
  };

  const handleOpenTaskDialog = (colId: number) => {
    setActiveColumnId(colId);
    setIsTaskDialogOpen(true);
  };

  if (isLoadingCols || isLoadingTasks) {
    return (
      <div className="flex gap-5 p-6 h-full overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-3 w-[300px] flex-shrink-0">
            <Skeleton className="h-10 w-full rounded-xl opacity-30" />
            <Skeleton className="h-24 w-full rounded-xl opacity-20" />
            <Skeleton className="h-20 w-full rounded-xl opacity-15" />
          </div>
        ))}
      </div>
    );
  }

  const safeColumns = columns ?? [];

  return (
    <>
      {/* Admin read-only notice */}
      {isAdmin && (
        <div
          className="mx-5 mt-3 mb-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border"
          style={{
            background: "rgba(251, 191, 36, 0.10)",
            borderColor: "rgba(251, 191, 36, 0.25)",
            color: "rgba(251, 191, 36, 0.90)",
          }}
        >
          <Eye className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Admin view — you can see all tasks for monitoring. Task editing belongs to each user only.
          </span>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 px-5 pt-4 pb-5 h-full overflow-x-auto items-start snap-x snap-mandatory">
          {safeColumns.map((col) => (
            <div key={col.id} className="snap-center h-full flex-shrink-0">
              <KanbanColumn
                column={col}
                allColumns={safeColumns}
                tasks={tasksByColumn[col.id] ?? []}
                onAddTask={handleOpenTaskDialog}
              />
            </div>
          ))}

          {/* Add Column — admin only */}
          {isAdmin && (
            <button
              onClick={() => setIsColDialogOpen(true)}
              className="flex-shrink-0 w-[240px] flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-6 transition-all group snap-center backdrop-blur-sm"
              style={{
                borderColor: "var(--add-col-border)",
                color: "var(--add-col-text)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--add-col-bg-hover)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--icon-muted)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--add-col-text)";
              }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors border"
                style={{ borderColor: "var(--add-col-border)", background: "rgba(128,128,128,0.06)" }}>
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Add Section</span>
            </button>
          )}

          <div className="flex-shrink-0 w-4" />
        </div>
      </DragDropContext>

      <CreateTaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        defaultColumnId={activeColumnId}
        columns={safeColumns}
      />
      <CreateColumnDialog open={isColDialogOpen} onOpenChange={setIsColDialogOpen} />
    </>
  );
}
