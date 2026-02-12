"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        const data = await res.json();
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-black overflow-hidden selection:bg-zinc-800 selection:text-zinc-200">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-zinc-800 opacity-20 blur-[100px]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="z-10 w-full max-w-md px-4"
      >
        <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-xl shadow-2xl ring-1 ring-white/5">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/50 ring-1 ring-white/10">
              <Lock className="h-6 w-6 text-zinc-400" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-white">
              Admin Access
            </CardTitle>
            <CardDescription className="text-zinc-400 text-sm">
              Enter your secure password to continue
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="relative group">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex h-11 w-full rounded-lg border border-zinc-800 bg-black/50 px-4 py-2 text-sm text-white transition-all placeholder:text-zinc-600 focus:border-zinc-700 focus:bg-black/80 focus:outline-none focus:ring-4 focus:ring-zinc-800/50 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Password..."
                    required
                    autoFocus
                  />
                  <div className="absolute inset-0 rounded-lg bg-linear-to-r from-transparent via-zinc-800/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-500 border border-red-500/20"
                >
                  <p>{error}</p>
                </motion.div>
              )}
            </CardContent>

            <CardFooter className="px-0">
              <Button
                type="submit"
                className="w-full h-11 bg-white text-black hover:bg-zinc-200 transition-all font-medium text-sm tracking-wide"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Unlock Panel
                    <ArrowRight className="ml-2 h-4 w-4 opacity-50" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-6 text-center text-xs text-zinc-600">
          <p>Restricted area. Unauthorized access is prohibited.</p>
        </div>
      </motion.div>
    </div>
  );
}
