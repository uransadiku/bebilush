"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { updatePassword } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AccountPage() {
    const { user, loading: authLoading } = useAuth();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const searchParams = useSearchParams();
    const router = useRouter();
    const action = searchParams.get("action");

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (password !== confirmPassword) {
            setError("Fjalëkalimet nuk përputhen.");
            return;
        }

        if (password.length < 6) {
            setError("Fjalëkalimi duhet të jetë të paktën 6 karaktere.");
            return;
        }

        if (!user) return;

        setLoading(true);
        try {
            await updatePassword(user, password);
            setSuccess("Fjalëkalimi u vendos me sukses!");
            setPassword("");
            setConfirmPassword("");
            // Optional: Redirect after success
            // setTimeout(() => router.push("/"), 2000);
        } catch (err: any) {
            console.error("Error setting password:", err);
            setError("Ndodhi një gabim gjatë vendosjes së fjalëkalimit. Ju lutem provoni përsëri.");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4">
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Menaxho Llogarinë</CardTitle>
                    <CardDescription>
                        {user.email}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {action === "set-password" && (
                        <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-md text-sm">
                            Ju jeni kyçur me sukses! Për siguri më të lartë dhe qasje më të lehtë në të ardhmen, ju rekomandojmë të vendosni një fjalëkalim për llogarinë tuaj.
                        </div>
                    )}

                    <h3 className="text-lg font-medium mb-4">Siguria</h3>
                    <form onSubmit={handleSetPassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Fjalëkalim i Ri</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Shkruani fjalëkalimin e ri"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Konfirmo Fjalëkalimin</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Shkruani përsëri fjalëkalimin"
                                required
                            />
                        </div>

                        {error && <p className="text-sm text-red-500">{error}</p>}
                        {success && <p className="text-sm text-green-500">{success}</p>}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Ruaj Fjalëkalimin
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
