"use client";

import { useEffect, useRef, useCallback } from "react";
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
 * 
 * Handles prompt states including: displayed, suppressed, skipped, and dismissed
 */
export function GoogleOneTap() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const redirectParam = searchParams.get("redirect");
    const initializedRef = useRef(false);
    const promptActiveRef = useRef(false);

    const cancelPrompt = useCallback(() => {
        try {
            const google = (window as any).google;
            if (google?.accounts?.id && promptActiveRef.current) {
                google.accounts.id.cancel();
                promptActiveRef.current = false;
            }
        } catch {
            // Silently ignore - prompt may already be cancelled
        }
    }, []);

    useEffect(() => {
        // Cancel prompt and reset initialization when user logs in
        if (user) {
            cancelPrompt();
            initializedRef.current = false;
            return;
        }

        if (typeof window === "undefined") return;
        if (loading) return; // Wait for auth state to resolve

        if (!GOOGLE_CLIENT_ID) {
            console.warn("Google One Tap: NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set.");
            return;
        }

        // Prevent duplicate initialization within the same session
        if (initializedRef.current) return;

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
                            router.refresh();
                        }
                    } catch (error) {
                        console.error("Google One Tap sign-in failed", error);
                    }
                },
                auto_select: true,
                cancel_on_tap_outside: false,
            });

            // Show the prompt and handle notification states
            google.accounts.id.prompt((notification: any) => {
                promptActiveRef.current = true;
                
                // Handle various prompt states
                if (notification.isNotDisplayed()) {
                    const reason = notification.getNotDisplayedReason();
                    // Common reasons: 'suppressed_by_user', 'opt_out_or_no_session', 'browser_not_supported'
                    if (reason !== 'opt_out_or_no_session') {
                        console.debug("Google One Tap not displayed:", reason);
                    }
                    promptActiveRef.current = false;
                } else if (notification.isSkippedMoment()) {
                    // User closed the prompt
                    promptActiveRef.current = false;
                } else if (notification.isDismissedMoment()) {
                    const reason = notification.getDismissedReason();
                    // 'credential_returned' means success, others are user dismissals
                    if (reason !== 'credential_returned') {
                        console.debug("Google One Tap dismissed:", reason);
                    }
                    promptActiveRef.current = false;
                }
            });
        };

        const existingScript = document.getElementById("google-identity-services");
        if (existingScript) {
            if ((window as any).google?.accounts?.id) {
                startOneTap();
            } else {
                existingScript.addEventListener("load", startOneTap, { once: true });
            }
        } else {
            const script = document.createElement("script");
            script.id = "google-identity-services";
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            script.onload = startOneTap;
            document.head.appendChild(script);
        }

        // Cleanup: cancel prompt on unmount or when dependencies change
        return () => {
            cancelPrompt();
        };
    }, [user, loading, pathname, redirectParam, router, cancelPrompt]);

    return null;
}
