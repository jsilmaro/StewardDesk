import { useState, useMemo, useEffect, useRef } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { KanbanColumn } from "./Column";
import { useColumns, useTasks, useUpdateTask, useCreateColumn, useUpdateColumn } from "@/hooks/use-kanban";
import { Skeleton } from "@/components/ui/skeleton";
import { Task, Column } from "@workspace/api-client-react";
import { Plus } from "lucide-react";
import { useAuth } from "@workspace/auth-web";
import { CreateTaskDialog, CreateColumnDialog } from "./TaskDialogs";

const DEFAULT_COLUMNS = ["To Do", "In Progress", "Done"];

export function Board() {
  const { data: columns, isLoading: isLoadingCols } = useColumns();
  const { data: tasks, isLoading: isLoadingTasks } = useTasks();
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: updateColumn } = useUpdateColumn();
  const { mutate: createColumn } = useCreateColumn();
  const { user } = useAuth();

  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [localColumns, setLocalColumns] = useState<Column[]>([]);
  const seededRef = useRef(false);

  useEffect(() => {
    if (tasks) setLocalTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    if (columns) setLocalColumns(columns);
  }, [columns]);

  // Auto-seed default columns for new users
  useEffect(() => {
    if (
      !isLoadingCols &&
      columns !== undefined &&
      columns.length === 0 &&
      !seededRef.current
    ) {
      seededRef.current = true;
      DEFAULT_COLUMNS.forEach((title, index) => {
        createColumn({ data: { title, position: index } });
      });
    }
  }, [columns, isLoadingCols, createColumn]);

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState<number | undefined>();
  const [isColDialogOpen, setIsColDialogOpen] = useState(false);

  const tasksByColumn = useMemo(() => {
    const grouped: Record<number, Task[]> = {};
    if (localColumns) localColumns.forEach((c) => { grouped[c.id] = []; });
    localTasks.forEach((t) => {
      if (grouped[t.columnId]) grouped[t.columnId].push(t);
      else grouped[t.columnId] = [t];
    });
    return grouped;
  }, [localColumns, localTasks]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Column reorder
    if (type === "COLUMN") {
      const newCols = [...localColumns];
      const [moved] = newCols.splice(source.index, 1);
      newCols.splice(destination.index, 0, moved);
      const reordered = newCols.map((c, i) => ({ ...c, position: i }));
      setLocalColumns(reordered);
      reordered.forEach((c) => updateColumn({ id: c.id, data: { position: c.position } }));
      return;
    }

    // Task reorder
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

  const safeColumns = localColumns ?? [];

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board" type="COLUMN" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex gap-4 px-5 pt-4 pb-5 h-full overflow-x-auto items-start snap-x snap-mandatory"
            >
              {safeColumns.map((col, index) => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  index={index}
                  allColumns={safeColumns}
                  tasks={tasksByColumn[col.id] ?? []}
                  onAddTask={handleOpenTaskDialog}
                />
              ))}
              {provided.placeholder}

              <button
                onClick={() => setIsColDialogOpen(true)}
                className="flex-shrink-0 w-[240px] flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-6 transition-all group snap-center backdrop-blur-sm"
                style={{ borderColor: "var(--add-col-border)", color: "var(--add-col-text)" }}
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

              <div className="flex-shrink-0 w-4" />
            </div>
          )}
        </Droppable>
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
