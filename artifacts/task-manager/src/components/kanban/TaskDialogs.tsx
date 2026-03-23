import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { useCreateTask, useUpdateTask, useCreateColumn } from "@/hooks/use-kanban";
import { Task, Column } from "@workspace/api-client-react";

// --- Create Task Dialog ---
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

export function CreateTaskDialog({ open, onOpenChange, defaultColumnId, columns }: CreateTaskDialogProps) {
  const { mutate: createTask, isPending } = useCreateTask();
  
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      columnId: defaultColumnId || (columns[0]?.id ?? 0),
    },
  });

  // Update default when it changes
  useEffect(() => {
    if (defaultColumnId) {
      form.setValue("columnId", defaultColumnId);
    }
  }, [defaultColumnId, form]);

  const onSubmit = (data: TaskFormData) => {
    createTask(
      { data: { ...data, position: 0 } },
      { onSuccess: () => {
          form.reset();
          onOpenChange(false);
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur-xl border-border/60 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-foreground">Plant a new task</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            What needs to grow today? Add details for your new task below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-foreground font-medium">Task Title</Label>
            <Input 
              id="title" 
              placeholder="E.g., Water the office plants" 
              className="bg-white border-border/50 focus:border-primary focus:ring-primary/20"
              {...form.register("title")} 
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground font-medium">Description <span className="text-muted-foreground font-normal">(Optional)</span></Label>
            <Textarea 
              id="description" 
              placeholder="Add some fertile details..." 
              className="bg-white border-border/50 min-h-[100px] resize-none focus:border-primary focus:ring-primary/20"
              {...form.register("description")} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-foreground font-medium">Priority</Label>
              <Select 
                onValueChange={(val: any) => form.setValue("priority", val)} 
                defaultValue={form.getValues("priority")}
              >
                <SelectTrigger className="bg-white border-border/50">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (Sprout)</SelectItem>
                  <SelectItem value="medium">Medium (Branch)</SelectItem>
                  <SelectItem value="high">High (Tree)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="column" className="text-foreground font-medium">Column</Label>
              <Select 
                onValueChange={(val) => form.setValue("columnId", parseInt(val))} 
                defaultValue={form.getValues("columnId").toString()}
              >
                <SelectTrigger className="bg-white border-border/50">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(col => (
                    <SelectItem key={col.id} value={col.id.toString()}>{col.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-border/50 text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
            >
              {isPending ? "Planting..." : "Add Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Edit Task Dialog ---
interface EditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: Column[];
}

export function EditTaskDialog({ task, open, onOpenChange, columns }: EditTaskDialogProps) {
  const { mutate: updateTask, isPending } = useUpdateTask();
  
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    values: task ? {
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      columnId: task.columnId,
    } : undefined,
  });

  const onSubmit = (data: TaskFormData) => {
    if (!task) return;
    updateTask(
      { id: task.id, data },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur-xl border-border/60 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-foreground">Prune Task</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Make adjustments to this task's details.
          </DialogDescription>
        </DialogHeader>
        
        {task && (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            {/* Same form fields as Create */}
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-foreground font-medium">Task Title</Label>
              <Input id="edit-title" className="bg-white" {...form.register("title")} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-desc" className="text-foreground font-medium">Description</Label>
              <Textarea id="edit-desc" className="bg-white min-h-[100px]" {...form.register("description")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Priority</Label>
                <Select onValueChange={(val: any) => form.setValue("priority", val)} defaultValue={task.priority}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Status</Label>
                <Select onValueChange={(val) => form.setValue("columnId", parseInt(val))} defaultValue={task.columnId.toString()}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {columns.map(col => (
                      <SelectItem key={col.id} value={col.id.toString()}>{col.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// --- Create Column Dialog ---
const columnSchema = z.object({
  title: z.string().min(1, "Title is required").max(50, "Keep it short"),
});

export function CreateColumnDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (o: boolean) => void }) {
  const { mutate: createColumn, isPending } = useCreateColumn();
  
  const form = useForm<z.infer<typeof columnSchema>>({
    resolver: zodResolver(columnSchema),
    defaultValues: { title: "" }
  });

  const onSubmit = (data: z.infer<typeof columnSchema>) => {
    createColumn({ data: { title: data.title, position: 0 } }, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-card/95 backdrop-blur-xl border-border/60 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">New Section</DialogTitle>
          <DialogDescription>Add a new column to organize your workflow.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="col-title" className="font-medium">Column Name</Label>
            <Input id="col-title" placeholder="E.g., Backlog, In Review..." className="bg-white" {...form.register("title")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Create Column
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
