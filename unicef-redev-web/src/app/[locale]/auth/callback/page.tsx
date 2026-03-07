"use client";

import { useEffect, useState } from "react";
import { setDonorToken } from "@/lib/donor-auth";

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      setDonorToken(token);
      window.location.href = "/en/donor/profile";
    } else {
      setError("No authentication token received. Please try again.");
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <h1 className="text-xl font-bold">Authentication Failed</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{error}</p>
          <a
            href="/en/donor/login"
            className="inline-block mt-4 px-6 py-3 bg-[hsl(var(--primary))] text-white rounded-full text-sm font-semibold hover:brightness-110 transition-all"
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-3 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Signing you in...
        </p>
      </div>
    </div>
  );
}
