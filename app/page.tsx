"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import TodoApp from "@/components/TodoApp";
import AuthForm from "@/components/AuthForm";

export default function Home() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    // 初期ロード中
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/60 text-sm">読み込み中...</p>
      </div>
    );
  }

  if (!session) return <AuthForm />;
  return <TodoApp session={session} />;
}
