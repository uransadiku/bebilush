"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/**
 * Global Google One Tap integration.
 *
 * - Shows the floating "Continue as <name>" prompt when the user is signed out
 * - Uses Google Identity Services to get an ID token
 * - Signs the user into Firebase with signInWithCredential
 * - On /login or /register, respects the ?redirect=... query param
 * - On all other routes, stays on the same page and refreshes the UI
 */
export function GoogleOneTap() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const redirectParam = searchParams.get("redirect");
    const initializedRef = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (loading || user) return; // Don't show One Tap while auth state is resolving or user is logged in
        if (initializedRef.current) return;

        if (!GOOGLE_CLIENT_ID) {
            console.warn("Google One Tap: NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set.");
            return;
        }

        const startOneTap = () => {
            const google = (window as any).google;
            if (!google?.accounts?.id) {
                console.warn("Google One Tap: google.accounts.id is not available.");
                return;
            }

            initializedRef.current = true;

            google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: async (response: any) => {
                    if (!response?.credential) return;

                    try {
                        const credential = GoogleAuthProvider.credential(response.credential);
                        await signInWithCredential(auth, credential);

                        const shouldRedirect = pathname === "/login" || pathname === "/register";

                        if (shouldRedirect) {
                            router.push(redirectParam || "/");
                        } else {
                            // Stay on the same page; just refresh client state
                            router.refresh();
                        }
                    } catch (error) {
                        console.error("Google One Tap sign-in failed", error);
                    }
                },
                auto_select: true,
                cancel_on_tap_outside: false,
                context: pathname === "/register" ? "signup" : "signin",
            });

            google.accounts.id.prompt();
        };

        const existingScript = document.getElementById("google-identity-services");
        if (existingScript) {
            if ((window as any).google) {
                startOneTap();
            } else {
                existingScript.addEventListener("load", startOneTap, { once: true });
            }
            return;
        }

        const script = document.createElement("script");
        script.id = "google-identity-services";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = startOneTap;
        document.head.appendChild(script);
    }, [user, loading, pathname, redirectParam, router]);

    return null;
}
