import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateTask, useUpdateTask, useCreateColumn } from "@/hooks/use-kanban";
import { Task, Column } from "@workspace/api-client-react";

/* ── Shared field styles ── */
const fieldClass =
  "dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/30 bg-white border-black/10 text-gray-900 placeholder:text-gray-400 focus-visible:ring-green-500/30 focus-visible:border-green-500/50";

const selectTriggerClass =
  "dark:bg-white/5 dark:border-white/10 dark:text-white bg-white border-black/10 text-gray-900";

const selectContentClass =
  "dark:bg-gray-900 dark:border-white/10 dark:text-white bg-white border-black/10 shadow-xl rounded-xl";

const selectItemClass =
  "dark:focus:bg-white/8 dark:text-white focus:bg-gray-100 text-gray-900 cursor-pointer";

/* ── Shared dialog content styles ── */
const dialogContentClass =
  "sm:max-w-[440px] dark:bg-gray-900/95 dark:backdrop-blur-xl dark:border-white/10 bg-white/98 backdrop-blur-xl border-black/8 shadow-2xl";

/* ──────────────────────────────────────────
   Create Task Dialog
   ────────────────────────────────────────── */
const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  columnId: z.coerce.number(),
});
type TaskFormData = z.infer<typeof taskSchema>;

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultColumnId?: number;
  columns: Column[];
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  defaultColumnId,
  columns,
}: CreateTaskDialogProps) {
  const { mutate: createTask, isPending } = useCreateTask();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      columnId: defaultColumnId ?? (columns[0]?.id ?? 0),
    },
  });

  useEffect(() => {
    if (defaultColumnId) form.setValue("columnId", defaultColumnId);
  }, [defaultColumnId, form]);

  const onSubmit = (data: TaskFormData) => {
    createTask(
      { data: { ...data, position: 0 } },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader>
          <DialogTitle className="text-xl dark:text-white text-gray-900">
            Plant a new task
          </DialogTitle>
          <DialogDescription className="dark:text-white/50 text-gray-500">
            What needs to grow today?
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-4">
          <div className="space-y-1.5">
            <Label className="dark:text-white/80 text-gray-700 font-medium text-sm">
              Title
            </Label>
            <Input
              placeholder="E.g., Water the office plants"
              className={fieldClass}
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="dark:text-white/80 text-gray-700 font-medium text-sm">
              Description{" "}
              <span className="dark:text-white/35 text-gray-400 font-normal">(Optional)</span>
            </Label>
            <Textarea
              placeholder="Add some details…"
              className={`${fieldClass} min-h-[90px] resize-none`}
              {...form.register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="dark:text-white/80 text-gray-700 font-medium text-sm">
                Priority
              </Label>
              <Select
                onValueChange={(val: any) => form.setValue("priority", val)}
                defaultValue={form.getValues("priority")}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  <SelectItem value="low" className={selectItemClass}>Low</SelectItem>
                  <SelectItem value="medium" className={selectItemClass}>Medium</SelectItem>
                  <SelectItem value="high" className={selectItemClass}>High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="dark:text-white/80 text-gray-700 font-medium text-sm">
                Column
              </Label>
              <Select
                onValueChange={(val) => form.setValue("columnId", parseInt(val))}
                defaultValue={form.getValues("columnId").toString()}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder="Column" />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  {columns.map((col) => (
                    <SelectItem key={col.id} value={col.id.toString()} className={selectItemClass}>
                      {col.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5 border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-green-600 hover:bg-green-500 text-white shadow-md"
            >
              {isPending ? "Planting…" : "Add Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────────────────────────────────
   Edit Task Dialog
   ────────────────────────────────────────── */
interface EditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: Column[];
}

export function EditTaskDialog({
  task,
  open,
  onOpenChange,
  columns,
}: EditTaskDialogProps) {
  const { mutate: updateTask, isPending } = useUpdateTask();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    values: task
      ? {
          title: task.title,
          description: task.description ?? "",
          priority: task.priority,
          columnId: task.columnId,
        }
      : undefined,
  });

  const onSubmit = (data: TaskFormData) => {
    if (!task) return;
    updateTask({ id: task.id, data }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader>
          <DialogTitle className="text-xl dark:text-white text-gray-900">
            Edit Task
          </DialogTitle>
          <DialogDescription className="dark:text-white/50 text-gray-500">
            Update the details for this task.
          </DialogDescription>
        </DialogHeader>

        {task && (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-4">
            <div className="space-y-1.5">
              <Label className="dark:text-white/80 text-gray-700 font-medium text-sm">Title</Label>
              <Input className={fieldClass} {...form.register("title")} />
            </div>

            <div className="space-y-1.5">
              <Label className="dark:text-white/80 text-gray-700 font-medium text-sm">Description</Label>
              <Textarea className={`${fieldClass} min-h-[90px] resize-none`} {...form.register("description")} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="dark:text-white/80 text-gray-700 font-medium text-sm">Priority</Label>
                <Select
                  onValueChange={(val: any) => form.setValue("priority", val)}
                  defaultValue={task.priority}
                >
                  <SelectTrigger className={selectTriggerClass}><SelectValue /></SelectTrigger>
                  <SelectContent className={selectContentClass}>
                    <SelectItem value="low" className={selectItemClass}>Low</SelectItem>
                    <SelectItem value="medium" className={selectItemClass}>Medium</SelectItem>
                    <SelectItem value="high" className={selectItemClass}>High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="dark:text-white/80 text-gray-700 font-medium text-sm">Status</Label>
                <Select
                  onValueChange={(val) => form.setValue("columnId", parseInt(val))}
                  defaultValue={task.columnId.toString()}
                >
                  <SelectTrigger className={selectTriggerClass}><SelectValue /></SelectTrigger>
                  <SelectContent className={selectContentClass}>
                    {columns.map((col) => (
                      <SelectItem key={col.id} value={col.id.toString()} className={selectItemClass}>
                        {col.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5 border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-green-600 hover:bg-green-500 text-white"
              >
                {isPending ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────────────────────────────────
   Create Column Dialog (Admin only)
   ────────────────────────────────────────── */
const columnSchema = z.object({
  title: z.string().min(1, "Title is required").max(50, "Keep it short"),
});

export function CreateColumnDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { mutate: createColumn, isPending } = useCreateColumn();

  const form = useForm<z.infer<typeof columnSchema>>({
    resolver: zodResolver(columnSchema),
    defaultValues: { title: "" },
  });

  const onSubmit = (data: z.infer<typeof columnSchema>) => {
    createColumn(
      { data: { title: data.title, position: 0 } },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader>
          <DialogTitle className="text-xl dark:text-white text-gray-900">
            New Section
          </DialogTitle>
          <DialogDescription className="dark:text-white/50 text-gray-500">
            Add a new column to organize the workflow.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-4">
          <div className="space-y-1.5">
            <Label className="dark:text-white/80 text-gray-700 font-medium text-sm">
              Column Name
            </Label>
            <Input
              placeholder="E.g., In Review, Blocked…"
              className={fieldClass}
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5 border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-green-600 hover:bg-green-500 text-white"
            >
              {isPending ? "Creating…" : "Create Column"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
