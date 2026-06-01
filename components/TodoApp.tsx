"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, CheckCircle2, Circle, Trash2, Pencil, X, Check, CalendarDays, Flag, LayoutList } from "lucide-react";
import { format, isPast, isToday, isTomorrow, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import type { Todo, Priority, FilterType } from "@/types/todo";

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; dot: string }> = {
  high: { label: "高", color: "text-rose-600", bg: "bg-rose-50 border-rose-200", dot: "bg-rose-500" },
  medium: { label: "中", color: "text-amber-600", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500" },
  low: { label: "低", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
};

function formatDeadline(deadline: string): { text: string; urgent: boolean; overdue: boolean } {
  const date = parseISO(deadline);
  const overdue = isPast(date) && !isToday(date);
  const urgent = isToday(date) || isTomorrow(date);
  let text: string;
  if (isToday(date)) text = "今日まで";
  else if (isTomorrow(date)) text = "明日まで";
  else if (overdue) text = format(date, "M月d日", { locale: ja }) + " (期限切れ)";
  else text = format(date, "M月d日(E)", { locale: ja });
  return { text, urgent, overdue };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [newTitle, setNewTitle] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");

  const [editTitle, setEditTitle] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editPriority, setEditPriority] = useState<Priority>("medium");

  // Supabaseからデータ取得
  const fetchTodos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setTodos(data as Todo[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTodos();

    // リアルタイム更新
    const channel = supabase
      .channel("todos-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "todos" }, () => {
        fetchTodos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTodos]);

  const addTodo = async () => {
    if (!newTitle.trim()) return;
    const todo: Todo = {
      id: generateId(),
      title: newTitle.trim(),
      completed: false,
      deadline: newDeadline || null,
      priority: newPriority,
      createdAt: new Date().toISOString(),
    };
    const { error } = await supabase.from("todos").insert({
      id: todo.id,
      title: todo.title,
      completed: todo.completed,
      deadline: todo.deadline,
      priority: todo.priority,
      created_at: todo.createdAt,
    });
    if (error) return;
    setNewTitle("");
    setNewDeadline("");
    setNewPriority("medium");
    setShowForm(false);
  };

  const toggleTodo = async (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    await supabase.from("todos").update({ completed: !todo.completed }).eq("id", id);
    setTodos(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTodo = async (id: string) => {
    await supabase.from("todos").delete().eq("id", id);
    setTodos(todos.filter((t) => t.id !== id));
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDeadline(todo.deadline ?? "");
    setEditPriority(todo.priority);
  };

  const saveEdit = async () => {
    if (!editTitle.trim() || !editingId) return;
    await supabase
      .from("todos")
      .update({ title: editTitle.trim(), deadline: editDeadline || null, priority: editPriority })
      .eq("id", editingId);
    setTodos(
      todos.map((t) =>
        t.id === editingId
          ? { ...t, title: editTitle.trim(), deadline: editDeadline || null, priority: editPriority }
          : t
      )
    );
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const deleteCompleted = async () => {
    const completedIds = todos.filter((t) => t.completed).map((t) => t.id);
    await supabase.from("todos").delete().in("id", completedIds);
    setTodos(todos.filter((t) => !t.completed));
  };

  const filtered = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const stats = {
    total: todos.length,
    completed: todos.filter((t) => t.completed).length,
    overdue: todos.filter(
      (t) => !t.completed && t.deadline && isPast(parseISO(t.deadline)) && !isToday(parseISO(t.deadline))
    ).length,
  };

  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl glass mb-4 shadow-lg">
            <LayoutList className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">タスク管理</h1>
          <p className="text-white/70 mt-1 text-sm">今日もひとつずつ、着実に。</p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-3 mb-5 animate-fade-in">
          {[
            { label: "合計", value: stats.total, color: "text-blue-600" },
            { label: "完了", value: stats.completed, color: "text-emerald-600" },
            { label: "期限切れ", value: stats.overdue, color: "text-rose-600" },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm">
              <span className={`text-base font-bold ${s.color}`}>{s.value}</span>
              <span className="text-xs text-gray-500">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Main card */}
        <div className="glass-card rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {(["all", "active", "completed"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filter === f ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {f === "all" ? "すべて" : f === "active" ? "未完了" : "完了済み"}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setShowForm(!showForm); setEditingId(null); }}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              タスク追加
            </button>
          </div>

          {/* Add form */}
          {showForm && (
            <div className="px-5 py-4 bg-blue-50/60 border-b border-blue-100 animate-slide-in">
              <div className="space-y-3">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTodo()}
                  placeholder="タスクを入力..."
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl border border-blue-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <div className="flex gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <CalendarDays className="w-4 h-4 text-blue-400 shrink-0" />
                    <input
                      type="date"
                      value={newDeadline}
                      min={today}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-blue-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-blue-400 shrink-0" />
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as Priority)}
                      className="px-3 py-2 rounded-xl border border-blue-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="high">優先度：高</option>
                      <option value="medium">優先度：中</option>
                      <option value="low">優先度：低</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setShowForm(false); setNewTitle(""); setNewDeadline(""); setNewPriority("medium"); }}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={addTodo}
                    disabled={!newTitle.trim()}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    追加する
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Todo list */}
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="py-16 text-center text-gray-400">
                <div className="text-4xl mb-3">⏳</div>
                <p className="text-sm">読み込み中...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <div className="text-4xl mb-3">
                  {filter === "completed" ? "🎉" : "📝"}
                </div>
                <p className="text-sm">
                  {filter === "completed"
                    ? "まだ完了したタスクはありません"
                    : filter === "active"
                    ? "未完了のタスクはありません"
                    : "タスクを追加してみましょう"}
                </p>
              </div>
            ) : (
              filtered.map((todo) => {
                const deadline = todo.deadline ? formatDeadline(todo.deadline) : null;
                const isEditing = editingId === todo.id;
                const p = PRIORITY_CONFIG[todo.priority];

                return (
                  <div
                    key={todo.id}
                    className={`px-5 py-4 transition-colors hover:bg-gray-50/50 animate-slide-in ${
                      todo.completed ? "opacity-60" : ""
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                          autoFocus
                          className="w-full px-4 py-2.5 rounded-xl border border-blue-300 bg-blue-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <div className="flex gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            <CalendarDays className="w-4 h-4 text-blue-400 shrink-0" />
                            <input
                              type="date"
                              value={editDeadline}
                              onChange={(e) => setEditDeadline(e.target.value)}
                              className="flex-1 px-3 py-2 rounded-xl border border-blue-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Flag className="w-4 h-4 text-blue-400 shrink-0" />
                            <select
                              value={editPriority}
                              onChange={(e) => setEditPriority(e.target.value as Priority)}
                              className="px-3 py-2 rounded-xl border border-blue-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                              <option value="high">優先度：高</option>
                              <option value="medium">優先度：中</option>
                              <option value="low">優先度：低</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={cancelEdit}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <X className="w-3.5 h-3.5" /> キャンセル
                          </button>
                          <button
                            onClick={saveEdit}
                            disabled={!editTitle.trim()}
                            className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" /> 保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleTodo(todo.id)}
                          className="mt-0.5 shrink-0 transition-transform hover:scale-110"
                        >
                          {todo.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-blue-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300 hover:text-blue-400" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium leading-snug ${
                              todo.completed ? "line-through text-gray-400" : "text-gray-800"
                            }`}
                          >
                            {todo.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${p.bg} ${p.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                              {p.label}
                            </span>
                            {deadline && (
                              <span
                                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                                  deadline.overdue
                                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                                    : deadline.urgent
                                    ? "bg-amber-50 text-amber-600 border border-amber-200"
                                    : "bg-gray-50 text-gray-500 border border-gray-200"
                                }`}
                              >
                                <CalendarDays className="w-3 h-3" />
                                {deadline.text}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => startEdit(todo)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                            aria-label="編集"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteTodo(todo.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                            aria-label="削除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {todos.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {stats.completed} / {stats.total} 件完了
              </span>
              {stats.completed > 0 && (
                <button
                  onClick={deleteCompleted}
                  className="text-xs text-gray-400 hover:text-rose-500 transition-colors"
                >
                  完了済みを削除
                </button>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-white/40 text-xs mt-6">データはクラウドに保存されます</p>
      </div>
    </div>
  );
}
