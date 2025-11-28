"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail, fetchSignInMethodsForEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

export function SignInForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [resetSent, setResetSent] = useState(false);
    const [isGoogleAccount, setIsGoogleAccount] = useState(false);
    const { signInWithGoogle } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect") || "/";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push(redirectUrl);
        } catch (err: any) {
            console.error("Login error:", err);
            // Check if the user exists with another provider
            try {
                const methods = await fetchSignInMethodsForEmail(auth, email);
                if (methods && methods.includes("google.com")) {
                    setIsGoogleAccount(true);
                    setError("Kjo llogari është e lidhur me Google. Ju lutem përdorni butonin e Google më poshtë.");
                } else {
                    setError("Email ose fjalëkalimi i pasaktë.");
                }
            } catch (checkErr) {
                // Fallback to generic error if check fails (e.g. email enumeration protection)
                setError("Email ose fjalëkalimi i pasaktë.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError("");
        try {
            const googleUser = await signInWithGoogle();

            // User closed or cancelled the Google popup; this is not an error.
            if (!googleUser) {
                return;
            }

            if (isGoogleAccount) {
                router.push("/account?action=set-password");
            } else {
                router.push(redirectUrl);
            }
        } catch (error) {
            setError("Gabim gjatë kyçjes me Google.");
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError("Ju lutem shkruani emailin për të resetuar fjalëkalimin.");
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            setResetSent(true);
            setError("");
        } catch (err: any) {
            setError("Gabim gjatë dërgimit të emailit.");
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-center text-primary">Mirësevini</CardTitle>
                <CardDescription className="text-center">
                    Kyçuni në llogarinë tuaj
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="emri@shembull.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Fjalëkalimi</Label>
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                className="text-sm text-primary hover:underline"
                            >
                                Harruat fjalëkalimin?
                            </button>
                        </div>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <div className="space-y-3 text-center">
                            <p className="text-sm text-red-500">{error}</p>
                        </div>
                    )}
                    {resetSent && <p className="text-sm text-green-500 text-center">Email për resetim u dërgua!</p>}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Kyçu
                    </Button>
                </form>

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Ose vazhdo me
                        </span>
                    </div>
                </div>

                <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn}>
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                    </svg>
                    Google
                </Button>
            </CardContent>
            <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                    Nuk keni llogari?{" "}
                    <Link href="/register" className="text-primary hover:underline">
                        Regjistrohu
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
