import { useQueryClient } from "@tanstack/react-query";
import {
  useGetColumns,
  useCreateColumn as useGeneratedCreateColumn,
  useUpdateColumn as useGeneratedUpdateColumn,
  useDeleteColumn as useGeneratedDeleteColumn,
  useGetTasks,
  useCreateTask as useGeneratedCreateTask,
  useUpdateTask as useGeneratedUpdateTask,
  useDeleteTask as useGeneratedDeleteTask,
  getGetTasksQueryKey,
  getGetColumnsQueryKey,
  type TaskPriority,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

// ============================================================================
// Wrapped Hooks with Cache Invalidation & Toasts
// ============================================================================

export function useColumns() {
  return useGetColumns();
}

export function useTasks() {
  return useGetTasks();
}

export function useCreateColumn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useGeneratedCreateColumn({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetColumnsQueryKey() });
        toast({ title: "Column created", description: "A new board column has been added." });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Error", description: "Failed to create column." });
      }
    }
  });
}

export function useUpdateColumn() {
  const queryClient = useQueryClient();
  return useGeneratedUpdateColumn({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetColumnsQueryKey() });
      }
    }
  });
}

export function useDeleteColumn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useGeneratedDeleteColumn({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetColumnsQueryKey() });
        toast({ title: "Column deleted", description: "The column was removed from your board." });
      }
    }
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useGeneratedCreateTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
        toast({ title: "Task added", description: "Your new task has been planted." });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Error", description: "Failed to add task." });
      }
    }
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useGeneratedUpdateTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
      }
    }
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useGeneratedDeleteTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
        toast({ title: "Task deleted", description: "The task was cleared away." });
      }
    }
  });
}
