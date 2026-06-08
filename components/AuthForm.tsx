"use client";

import { useState } from "react";
import { LayoutList } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError("メールアドレスまたはパスワードが正しくありません");
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError("登録に失敗しました。別のメールアドレスをお試しください");
      } else {
        setMessage("確認メールを送信しました。メールのリンクをクリックしてください。");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl glass mb-4 shadow-lg">
            <LayoutList className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">タスク管理</h1>
          <p className="text-white/70 mt-1 text-sm">今日もひとつずつ、着実に。</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl shadow-2xl p-6 animate-scale-in">
          {/* Tab */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setMessage(null); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m ? "bg-white text-slate-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {m === "login" ? "ログイン" : "新規登録"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="example@email.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="6文字以上"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                {error}
              </p>
            )}
            {message && (
              <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                {message}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !email.trim() || !password.trim()}
              className="w-full py-2.5 bg-slate-600 hover:bg-slate-700 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
            >
              {loading ? "処理中..." : mode === "login" ? "ログイン" : "アカウントを作成"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
