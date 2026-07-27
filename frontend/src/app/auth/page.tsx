"use client";

import { useSearchParams } from "next/navigation";
import { SignIn, SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Suspense } from "react";

function AuthContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  return (
    <div className="flex flex-col items-center">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Home
      </Link>
      {tab === "register" ? (
        <SignUp routing="hash" signInUrl="/auth" />
      ) : (
        <SignIn routing="hash" signUpUrl="/auth?tab=register" />
      )}
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="flex min-h-screen bg-slate-50 items-center justify-center p-4 relative overflow-hidden">
      {/* Background Soft Mesh Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-indigo-100/70 to-blue-100/40 rounded-full blur-3xl pointer-events-none" />
      <Suspense fallback={
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
          <span>Loading Auth...</span>
        </div>
      }>
        <AuthContent />
      </Suspense>
    </div>
  );
}
