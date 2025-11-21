import { Button as ShadcnButton, ButtonProps as ShadcnButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ShadcnButtonProps {
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export default function Button({
    children,
    variant = "default",
    isLoading,
    icon,
    className,
    ...props
}: ButtonProps) {
    // Map old variants to shadcn variants if needed
    const mapVariant = (v: string) => {
        if (v === 'primary') return 'default';
        if (v === 'primary-dark') return 'default'; // fallback
        return v as any;
    };

    return (
        <ShadcnButton
            variant={mapVariant(variant as string)}
            className={cn("gap-2", className)}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
            {children}
        </ShadcnButton>
    );
}
