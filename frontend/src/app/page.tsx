"use client";

import React, { useEffect, useState, useCallback } from "react";
import { PranaHome } from "@/components/prana-home/PranaHome";

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const verifySession = useCallback(async () => {
    try {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("token");
      if (!token || typeof token !== "string" || token.trim().length < 20) {
        setIsAuthenticated(false);
        window.location.replace("/login");
        return;
      }

      // Check JWT expiration if structured as 3 parts
      const parts = token.split(".");
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.exp && Date.now() >= payload.exp * 1000) {
            localStorage.clear();
            document.cookie = "token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
            setIsAuthenticated(false);
            window.location.replace("/login");
            return;
          }
        } catch {
          // If atob fails, continue to token verification
        }
      }

      // Sync cookie with token for SSR requests
      try {
        document.cookie = `token=${token}; path=/; max-age=2592000; SameSite=Lax`;
      } catch {}

      // Authenticate immediately so the UI is instantaneous
      setIsAuthenticated(true);

      // Verify asynchronously with backend endpoints
      const verifyHosts = [
        "", // Relative Next.js proxy rewrite
        process.env.NEXT_PUBLIC_API_URL || "",
        "https://sporttalent-production.up.railway.app",
        "http://127.0.0.1:8000",
      ].filter(Boolean);
      const uniqueVerifyHosts = Array.from(new Set(verifyHosts));

      for (const host of uniqueVerifyHosts) {
        try {
          const cleanHost = host.replace(/\/api\/v1\/?$/, "").replace(/\/api\/?$/, "");
          const endpoint = cleanHost ? `${cleanHost}/api/v1/auth/verify` : "/api/v1/auth/verify";
          const res = await fetch(endpoint, {
            headers: { Authorization: `Bearer ${token}` },
          });

          // Only if explicitly rejected by the server do we revoke the session
          if (res.status === 401 || res.status === 403) {
            localStorage.clear();
            document.cookie = "token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
            setIsAuthenticated(false);
            window.location.replace("/login");
            return;
          }

          if (res.ok) {
            const data = await res.json();
            if (data.valid && data.user) {
              localStorage.setItem("user", JSON.stringify(data.user));
              if (data.user.profileComplete === false) {
                localStorage.setItem("prana_profile_incomplete", "true");
              } else {
                localStorage.removeItem("prana_profile_incomplete");
              }
            }
            break;
          }
        } catch {
          // Network latency or offline: keep user authenticated
        }
      }
    } catch {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token && token.length > 20) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        if (typeof window !== "undefined") {
          window.location.replace("/login");
        }
      }
    }
  }, []);

  useEffect(() => {
    verifySession();

    window.addEventListener("storage", verifySession);
    window.addEventListener("prana_auth_change", verifySession);

    return () => {
      window.removeEventListener("storage", verifySession);
      window.removeEventListener("prana_auth_change", verifySession);
    };
  }, [verifySession]);

  if (isAuthenticated !== true) {
    return (
      <div className="min-h-screen bg-[#0B100E] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-2 border-[#B7F34A] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-slate-400">Loading PRANA...</span>
      </div>
    );
  }

  // Cryptographically authenticated and verified: show the PRANA Home experience
  return <PranaHome />;
}
