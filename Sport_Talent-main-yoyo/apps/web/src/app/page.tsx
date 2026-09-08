"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PranaHome } from "@/components/prana-home/PranaHome";
import Login from "./login/page";

export default function HomePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const verifySession = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || typeof token !== "string" || token.length < 20) {
        // No valid token present - enforce login
        localStorage.removeItem("token");
        localStorage.removeItem("isLoggedIn");
        setIsAuthenticated(false);
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
        setIsAuthenticated(false);
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
        setIsAuthenticated(false);
      }
    } catch (err) {
      // If network offline but token has valid JWT signature structure, permit temporary fallback
      const token = localStorage.getItem("token");
      if (token && token.split(".").length === 3) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    }
  }, []);

  useEffect(() => {
    verifySession();

    // Re-verify on back/forward cache restore ("undo" navigation) and tab visibility
    const handlePageShow = (e: PageTransitionEvent) => {
      verifySession();
    };

    const handlePopState = () => {
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

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#0B100E] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B7F34A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If not authenticated, show the Login page first in front
  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => verifySession()} />;
  }

  // Once authenticated and verified, show the PRANA Home experience
  return <PranaHome />;
}
