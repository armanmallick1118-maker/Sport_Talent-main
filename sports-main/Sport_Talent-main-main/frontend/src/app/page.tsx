"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PranaHome } from "@/components/prana-home/PranaHome";

export default function HomePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const verifySession = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const hasCookie = typeof document !== 'undefined' && document.cookie.includes("token=");
      if (!token || !hasCookie || typeof token !== "string" || token.length < 20) {
        // No valid token or cookie present - enforce login immediately
        localStorage.removeItem("token");
        localStorage.removeItem("isLoggedIn");
        document.cookie = "token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        setIsAuthenticated(false);
        window.location.replace("/login");
        return;
      }

      // Cryptographically verify token against backend
      const res = await fetch("/api/v1/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        // Token expired, revoked, or invalid: purge storage immediately
        localStorage.removeItem("token");
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        localStorage.removeItem("userId");
        localStorage.removeItem("userEmail");
        document.cookie = "token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        setIsAuthenticated(false);
        window.location.replace("/login");
        return;
      }

      const data = await res.json();
      if (data.valid && data.user) {
        // Update fresh user status
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.user.profileComplete === false) {
          localStorage.setItem("prana_profile_incomplete", "true");
        } else {
          localStorage.removeItem("prana_profile_incomplete");
        }
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("isLoggedIn");
        document.cookie = "token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        setIsAuthenticated(false);
        window.location.replace("/login");
      }
    } catch (err) {
      const token = localStorage.getItem("token");
      const hasCookie = typeof document !== 'undefined' && document.cookie.includes("token=");
      if (token && hasCookie && token.split(".").length === 3) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        window.location.replace("/login");
      }
    }
  }, []);

  useEffect(() => {
    verifySession();

    // Re-verify on back/forward cache restore ("undo" navigation) and tab visibility
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        // Discard bfcache and force a full server reload
        window.location.reload();
        return;
      }
      verifySession();
    };

    const handlePopState = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.replace("/login");
        return;
      }
      verifySession();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        verifySession();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("storage", verifySession);
    window.addEventListener("prana_auth_change", verifySession);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("storage", verifySession);
      window.removeEventListener("prana_auth_change", verifySession);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [verifySession]);

  if (isAuthenticated !== true) {
    return (
      <div className="min-h-screen bg-[#0B100E] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B7F34A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Once cryptographically authenticated and verified, show the PRANA Home experience
  return <PranaHome />;
}
