import { Suspense } from "react";

import AuthForm from "@/components/auth-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f7f8fc]">
          <p className="text-sm text-slate-500">Loading sign in...</p>
        </div>
      }
    >
      <AuthForm mode="login" />
    </Suspense>
  );
}
