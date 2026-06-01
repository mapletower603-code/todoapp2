export type Priority = "high" | "medium" | "low";

export type FilterType = "all" | "active" | "completed";

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  deadline: string | null;
  priority: Priority;
  createdAt: string;
}
