import { Suspense } from "react";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
    return (
        <div className="container mx-auto py-10 flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
                <SignUpForm />
            </Suspense>
        </div>
    );
}
