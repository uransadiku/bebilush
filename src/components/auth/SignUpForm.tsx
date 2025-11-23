"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

export function SignUpForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [newsletter, setNewsletter] = useState(false);
    const [terms, setTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { signInWithGoogle } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect") || "/";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!terms) {
            setError("Duhet të pranoni Kushtet dhe Privatësinë.");
            return;
        }

        setLoading(true);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            // Here you would typically save the newsletter preference to your database
            router.push(redirectUrl);
        } catch (err: any) {
            setError(err.message || "Ndodhi një gabim gjatë regjistrimit.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
            router.push(redirectUrl);
        } catch (error) {
            setError("Gabim gjatë kyçjes me Google.");
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-center text-primary">Krijo Llogari</CardTitle>
                <CardDescription className="text-center">
                    Bashkohuni me komunitetin tonë të nënave
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
                        <Label htmlFor="password">Fjalëkalimi</Label>
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

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="newsletter"
                            checked={newsletter}
                            onCheckedChange={(checked) => setNewsletter(checked as boolean)}
                        />
                        <Label htmlFor="newsletter" className="text-sm font-normal">
                            Më dërgoni të rejat dhe këshilla për mëmësinë
                        </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="terms"
                            checked={terms}
                            onCheckedChange={(checked) => setTerms(checked as boolean)}
                        />
                        <Label htmlFor="terms" className="text-sm font-normal">
                            Pranoj <Link href="/terms" className="text-primary hover:underline">Kushtet</Link> dhe <Link href="/privacy" className="text-primary hover:underline">Privatësinë</Link>
                        </Label>
                    </div>

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Regjistrohu
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
                    Keni llogari?{" "}
                    <Link href="/login" className="text-primary hover:underline">
                        Kyçu këtu
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
