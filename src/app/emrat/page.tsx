'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, X, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

// Simple motion components could be added here, but we'll stick to CSS transitions for reliability
// This design focuses on Editorial Minimalism - "The UI is the text"

export default function EmratPage() {
    // State
    const router = useRouter();
    const [gender, setGender] = useState<'boy' | 'girl' | 'both'>('both');
    const [style, setStyle] = useState<string>('modern');
    const [startingLetter, setStartingLetter] = useState('');
    const [generatedNames, setGeneratedNames] = useState<any[]>([]);
    const [savedNames, setSavedNames] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [hasDismissedAuth, setHasDismissedAuth] = useState(false);
    const [showToast, setShowToast] = useState(false);

    // Translation map
    const origins: Record<string, string> = {
        'Albanian': 'Shqiptare',
        'Traditional Albanian': 'Tradicionale',
        'Islamic': 'Islame',
        'Christian': 'Kristiane',
        'Catholic': 'Katolike',
        'Nature-inspired': 'Natyra',
        'Modern Albanian': 'Moderne',
        'Arabic': 'Arabe',
        'Greek': 'Greke',
        'Latin': 'Latine',
        'Turkish': 'Turke',
        'Illyrian': 'Ilire'
    };

    const generateNames = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsLoading(true);
        
        if (!showResults) {
            setGeneratedNames([]);
        }
        
        // Simulate network delay for better UX feel if it's too fast
        const minTime = new Promise(resolve => setTimeout(resolve, 800));
        
        try {
            const [response] = await Promise.all([
                fetch('/api/generate-names', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ gender, style, startingLetter }),
                }),
                minTime
            ]);

            const data = await response.json();

            if (!response.ok) throw new Error(data.error);
            
            if (data.names) {
                if (showResults) {
                    setGeneratedNames(prev => [...prev, ...data.names]);
                } else {
                    setGeneratedNames(data.names);
                    setShowResults(true);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSaveName = (name: string) => {
        setSavedNames(prev => {
            const newSet = new Set(prev);
            if (newSet.has(name)) {
                newSet.delete(name);
            } else {
                newSet.add(name);
                // Smart Hook Logic
                if (!hasDismissedAuth) {
                    setShowAuthModal(true);
                } else {
                    // Show subtle toast for users who dismissed the modal
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 4000);
                }
            }
            return newSet;
        });
    };

    const handleDismissAuth = () => {
        setShowAuthModal(false);
        setHasDismissedAuth(true);
    };

    // Reset view to generate again
    const resetView = () => {
        setShowResults(false);
        setGeneratedNames([]);
    };

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[#F8F8F8] text-zinc-900 font-sans selection:bg-black selection:text-white pt-8">
            
            {/* SAVED INDICATOR - Moved down below header (header is h-20/80px) */}
            <div className="fixed top-24 right-6 z-[40] mix-blend-difference text-white md:text-zinc-900 md:mix-blend-normal pointer-events-none">
                {savedNames.size > 0 && (
                    <div className="flex items-center gap-2 text-sm font-medium pointer-events-auto animate-in fade-in zoom-in duration-300">
                        <span className="bg-black text-white h-10 px-4 flex items-center justify-center rounded-full text-sm shadow-xl">
                            <Heart className="w-4 h-4 fill-white mr-2" />
                            {savedNames.size}
                        </span>
                    </div>
                )}
            </div>

            {/* AUTH HOOK MODAL */}
            {showAuthModal && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" 
                        onClick={handleDismissAuth}
                    />
                    
                    {/* Modal Content */}
                    <div className="relative bg-white w-full max-w-md p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <button 
                            onClick={handleDismissAuth}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-black transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-2">
                                <Heart className="w-8 h-8 fill-black text-black" />
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-2xl md:text-3xl font-heading font-bold text-zinc-900">
                                    Mos i humbni emrat e preferuar
                                </h3>
                                <p className="text-zinc-500 leading-relaxed">
                                    Krijoni një llogari falas për të ruajtur listën tuaj dhe për ta aksesuar atë nga çdo pajisje.
                                </p>
                            </div>

                            <div className="w-full space-y-3 pt-2">
                                <button 
                                    onClick={() => router.push('/register')}
                                    className="w-full py-4 bg-black text-white font-medium text-lg hover:scale-[1.02] transition-transform active:scale-95"
                                >
                                    Krijo Llogari Falas
                                </button>
                                <button 
                                    onClick={handleDismissAuth}
                                    className="w-full py-4 text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
                                >
                                    Vazhdo si vizitor
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MINIMAL TOAST NOTIFICATION */}
            {showToast && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-4 bg-zinc-900 text-white px-6 py-4 rounded-full shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
                    <span className="text-sm font-medium text-zinc-200">U ruajt në sesionin e tanishëm.</span>
                    <button 
                        onClick={() => router.push('/register')}
                        className="text-sm font-bold text-white hover:underline underline-offset-2"
                    >
                        Ruaje përgjithmonë
                    </button>
                </div>
            )}

            {/* MAIN INTERFACE */}
            <main className="relative flex flex-col items-center justify-center min-h-[70vh]">
                
                {/* INPUT SECTION */}
                <div className={cn(
                    "w-full flex flex-col items-center px-6 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    showResults ? "-translate-y-[20vh] opacity-0 pointer-events-none absolute inset-0" : "opacity-100"
                )}>
                    <div className="max-w-4xl w-full space-y-12 md:space-y-16">
                        
                        {/* The Narrative Form */}
                        <div className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold leading-[1.1] tracking-tight text-zinc-900">
                            <span className="text-zinc-400 font-medium text-2xl md:text-3xl block mb-6">
                                Dua të gjej një emër për...
                            </span>
                            
                            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                                {/* Gender Selector */}
                                <div className="relative inline-block group">
                                    <span className="border-b-4 border-black cursor-pointer hover:opacity-70 transition-opacity">
                                        {gender === 'boy' ? 'një Djalë' : gender === 'girl' ? 'një Vajzë' : 'këdo'}
                                    </span>
                                    <select 
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value as any)}
                                    >
                                        <option value="boy">një Djalë</option>
                                        <option value="girl">një Vajzë</option>
                                        <option value="both">këdo (Surprizë)</option>
                                    </select>
                                </div>

                                <span className="text-zinc-400">që është</span>

                                {/* Style Selector */}
                                <div className="relative inline-block group">
                                    <span className="border-b-4 border-black cursor-pointer hover:opacity-70 transition-opacity">
                                        {style === 'modern' ? 'Modern' : 
                                         style === 'traditional' ? 'Tradicional' : 
                                         style === 'religious' ? 'Fetar' : 'Natyral'}
                                    </span>
                                    <select 
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        value={style}
                                        onChange={(e) => setStyle(e.target.value)}
                                    >
                                        <option value="modern">Modern</option>
                                        <option value="traditional">Tradicional</option>
                                        <option value="religious">Fetar</option>
                                        <option value="nature">Natyral</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 mt-4">
                                <span className="text-zinc-400">dhe fillon me</span>
                                
                                {/* Letter Input */}
                                <div className="relative inline-flex items-baseline">
                                    <input 
                                        type="text" 
                                        maxLength={1}
                                        placeholder="?"
                                        value={startingLetter}
                                        onChange={(e) => setStartingLetter(e.target.value.toUpperCase())}
                                        className="bg-transparent border-b-4 border-zinc-200 focus:border-black text-center w-[1.5em] outline-none placeholder:text-zinc-300 uppercase"
                                    />
                                </div>
                                <span className="text-zinc-300 text-2xl md:text-4xl font-normal self-center ml-2">(opsionale)</span>
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="pt-8">
                            <button 
                                onClick={() => generateNames()}
                                disabled={isLoading}
                                className="group flex items-center gap-4 text-xl md:text-2xl font-medium transition-all hover:gap-6 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <span className="animate-pulse">Po kërkojmë...</span>
                                ) : (
                                    <>
                                        <span className="border-b border-transparent group-hover:border-black transition-all">
                                            Gjenero Emrat
                                        </span>
                                        <div className="bg-black text-white rounded-full p-3 transition-transform group-hover:scale-110 group-hover:rotate-[-10deg]">
                                            <Sparkles size={20} />
                                        </div>
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                </div>

                {/* RESULTS SECTION - FULLSCREEN OVERLAY */}
                <div className={cn(
                    "fixed inset-0 z-[60] bg-white overflow-y-auto transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    showResults ? "translate-y-0" : "translate-y-[100vh]"
                )}>
                    <div className="min-h-screen">
                        {/* Sticky Header */}
                        <div className="sticky top-0 z-50 px-6 py-6 flex justify-between items-center bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 border-b border-zinc-100">
                            <button 
                                onClick={resetView}
                                className="group flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 hover:bg-black hover:text-white transition-all duration-300"
                            >
                                <ArrowRight size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                                <span className="text-sm font-medium">Ndrysho Kërkimin</span>
                            </button>
                            
                            <h2 className="text-sm font-medium tracking-widest uppercase text-zinc-400 hidden md:block absolute left-1/2 -translate-x-1/2">
                                Rezultatet
                            </h2>
                        </div>

                        {/* Gallery Grid */}
                        <div className="container max-w-6xl mx-auto px-4 pb-20">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 md:gap-y-24 mt-10">
                                {generatedNames.map((name, index) => {
                                    const isSaved = savedNames.has(name.name);
                                    return (
                                        <div key={index} className="group flex flex-col gap-4">
                                            <div className="relative">
                                                <h3 className="text-6xl md:text-7xl font-heading font-bold tracking-tighter text-zinc-900 group-hover:text-black transition-colors">
                                                    {name.name}
                                                </h3>
                                                <button 
                                                    onClick={() => toggleSaveName(name.name)}
                                                    className={cn(
                                                        "absolute -right-4 -top-4 p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100",
                                                        isSaved ? "opacity-100 text-red-500" : "text-zinc-300 hover:text-red-500"
                                                    )}
                                                >
                                                    <Heart size={24} fill={isSaved ? "currentColor" : "none"} />
                                                </button>
                                            </div>
                                            
                                            <div className="space-y-2 border-l-2 border-zinc-100 pl-4 transition-colors group-hover:border-black">
                                                <p className="text-lg text-zinc-600 italic leading-relaxed">
                                                    "{name.meaning}"
                                                </p>
                                                <div className="flex items-center gap-3 text-sm font-medium tracking-wide uppercase text-zinc-400">
                                                    <span>{name.gender === 'boy' ? 'Djalë' : 'Vajzë'}</span>
                                                    <span>•</span>
                                                    <span>{origins[name.origin] || name.origin}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Footer Action */}
                            <div className="mt-32 text-center pb-12">
                                <button 
                                    onClick={() => generateNames()}
                                    disabled={isLoading}
                                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-black rounded-full hover:scale-105 transition-transform disabled:opacity-50"
                                >
                                    {isLoading ? 'Po kërkojmë...' : 'Gjenero të tjera'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
