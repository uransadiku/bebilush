import Link from 'next/link';
import Button from './Button';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function Hero() {
    return (
        <section className="py-16 md:py-24 bg-gradient-to-b from-background to-[#FFF0E5] overflow-hidden">
            <div className="container grid md:grid-cols-2 gap-16 items-center">
                <div className="max-w-xl">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
                        <Sparkles size={14} />
                        <span>Për nënat shqiptare</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-heading font-bold leading-tight mb-6 text-foreground">
                        Rriteni fëmijën tuaj me <span className="text-primary italic">dashuri</span> dhe <span className="text-primary italic">traditë</span>.
                    </h1>

                    <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                        Zbuloni emra me kuptim, krijoni kujtime të personalizuara dhe gjeni gjithçka që ju nevojitet për udhëtimin tuaj të mëmësisë.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <Link href="/emrat">
                            <Button variant="default" size="lg" icon={<Sparkles size={18} />}>
                                Gjeni Emrin e Bebit
                            </Button>
                        </Link>
                        <Link href="/dyqani">
                            <Button variant="outline" size="lg" icon={<ArrowRight size={18} />}>
                                Vizitoni Dyqanin
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="relative flex justify-center">
                    <div className="w-full max-w-[500px] aspect-square bg-secondary rounded-[30%_70%_70%_30%/30%_30%_70%_70%] relative overflow-hidden shadow-xl animate-blob">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary opacity-80"></div>
                        {/* Placeholder for a beautiful mother & baby image */}
                    </div>
                </div>
            </div>
        </section>
    );
}
