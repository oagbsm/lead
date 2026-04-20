"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");

  async function handleLogin() {
    await supabase.auth.signInWithOtp({
      email,
    });
    alert("Check your email for login link");
  }

  return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="bg-white p-6 rounded-xl w-[350px]">
        <h2 className="text-xl font-bold mb-4">Login</h2>

        <input
          className="w-full border p-2 mb-4"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-black text-white py-2 rounded"
        >
          Send Magic Link
        </button>
      </div>
    </div>
  );
}