import { Suspense } from "react";

import AuthForm from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f7f8fc]">
          <p className="text-sm text-slate-500">Loading registration...</p>
        </div>
      }
    >
      <AuthForm mode="register" />
    </Suspense>
  );
}
