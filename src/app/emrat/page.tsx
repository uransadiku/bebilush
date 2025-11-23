'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, X, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useSavedNames } from '@/hooks/useSavedNames';

import { pollService } from '@/services/pollService';

// Simple motion components could be added here, but we'll stick to CSS transitions for reliability
// This design focuses on Editorial Minimalism - "The UI is the text"

export default function EmratPage() {
    // State
    const router = useRouter();
    const { user } = useAuth();
    const { savedNames, saveName, removeName, isLoadingNames } = useSavedNames();

    const [gender, setGender] = useState<'boy' | 'girl' | 'both'>('both');
    const [style, setStyle] = useState<string>('modern');
    const [startingLetter, setStartingLetter] = useState('');
    const [generatedNames, setGeneratedNames] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [hasDismissedAuth, setHasDismissedAuth] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [showSavedView, setShowSavedView] = useState(false);
    const [generationCount, setGenerationCount] = useState(0);
    const [modalType, setModalType] = useState<'save' | 'limit' | 'likes_limit' | 'share_poll' | 'enter_name' | 'register_share' | 'confirm_poll'>('save');
    const [isClient, setIsClient] = useState(false);
    const [pollLink, setPollLink] = useState('');
    const [creatorName, setCreatorName] = useState(''); // State for creator name
    const [isCreatingPoll, setIsCreatingPoll] = useState(false);
    const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

    const GUEST_LIMIT = 10;
    const USER_LIMIT = 25;
    const FREE_LIMIT = 3; // Generation limit for guests

    // Restore generation count from local storage
    useEffect(() => {
        setIsClient(true);
        const storedCount = localStorage.getItem('guest_gen_count');
        if (storedCount) {
            setGenerationCount(parseInt(storedCount));
        }

        // Try to get name from auth if available (optional enhancement later)
        if (user?.displayName) {
            setCreatorName(user.displayName);
        }
    }, [user]);

    const incrementGeneration = () => {
        const newCount = generationCount + 1;
        setGenerationCount(newCount);
        localStorage.setItem('guest_gen_count', newCount.toString());
    };

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

    const abortControllerRef = useRef<AbortController | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const generateNames = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Check limit
        if (!user && generationCount >= FREE_LIMIT) {
            setModalType('limit');
            setShowAuthModal(true);
            return;
        }

        // Cancel previous request if exists
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new controller
        const controller = new AbortController();
        abortControllerRef.current = controller;
        const signal = controller.signal;

        setIsLoading(true);

        if (!showResults) {
            setGeneratedNames([]);
        }

        // Simulate network delay for better UX feel if it's too fast
        // Only apply delay on the first search (when results aren't shown yet)
        const minTime = new Promise(resolve => setTimeout(resolve, showResults ? 0 : 800));

        // Calculate existing names to exclude only if we are appending results
        const existingNames = showResults ? generatedNames.map(n => n.name) : [];

        try {
            const [response] = await Promise.all([
                fetch('/api/generate-names', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        gender,
                        style,
                        startingLetter,
                        excludeNames: existingNames
                    }),
                    signal
                }),
                minTime
            ]);

            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            if (data.names) {
                if (!user) {
                    incrementGeneration();
                }
                if (showResults) {
                    setGeneratedNames(prev => [...prev, ...data.names]);
                } else {
                    setGeneratedNames(data.names);
                    setShowResults(true);
                }
            }
        } catch (error: any) {
            if (error.name === 'AbortError' || error.message === 'The user aborted a request.') {
                // Ignore abort errors completely
                return;
            }
            console.error("Generation error:", error);
            // Optionally show a user-friendly error toast here if needed
        } finally {
            // Only turn off loading if this is the current request
            if (abortControllerRef.current === controller) {
                setIsLoading(false);
                abortControllerRef.current = null;
            }
        }
    };

    const toggleSaveName = async (name: string) => {
        if (savedNames.has(name)) {
            await removeName(name);
        } else {
            const currentLimit = user ? USER_LIMIT : GUEST_LIMIT;

            if (savedNames.size >= currentLimit) {
                setModalType('likes_limit');
                setShowAuthModal(true);
                return;
            }

            await saveName(name);

            // Smart Hook Logic - Only show if user is NOT logged in
            if (!user) {
                if (!hasDismissedAuth) {
                    setModalType('save'); // Set modal type for saving
                    setShowAuthModal(true);
                } else {
                    // Show subtle toast for users who dismissed the modal
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 4000);
                }
            }
        }
    };

    const handleDismissAuth = () => {
        setShowAuthModal(false);
        setHasDismissedAuth(true);
    };

    const handleCreatePollClick = async () => {
        if (savedNames.size === 0) return;

        // 1. Guest Check
        if (!user) {
            setModalType('register_share');
            setShowAuthModal(true);
            setShowSavedView(false);
            return;
        }

        setIsCreatingPoll(true);
        try {
            // 2. Check existing polls
            const polls = await pollService.getUserPolls(user.uid);

            // Check for duplicate list (exact match of names)
            const currentNames = Array.from(savedNames).sort().join(',');
            const existingPoll = polls.find(p => p.names.slice().sort().join(',') === currentNames);

            if (existingPoll) {
                const origin = window.location.origin;
                setPollLink(`${origin}/vote/${existingPoll.id}`);
                setModalType('share_poll');
                setShowAuthModal(true);
                setShowSavedView(false);
                setIsCreatingPoll(false);
                return;
            }

            // 3. Check poll limit (Max 3)
            if (polls.length >= 3) {
                alert("Keni arritur limitin e 3 sondazheve aktive. Fshini një ekzistues për të krijuar të ri.");
                setIsCreatingPoll(false);
                return;
            }

            // 4. Ask for name if missing
            if (!creatorName.trim()) {
                setModalType('enter_name');
                setShowAuthModal(true);
                setShowSavedView(false);
                setIsCreatingPoll(false);
                return;
            }

            // 5. Confirm Final List
            setModalType('confirm_poll');
            setShowAuthModal(true);
            setShowSavedView(false);

        } catch (error) {
            console.error("Error checking polls", error);
            setIsCreatingPoll(false);
        }
    };

    const confirmAndCreatePoll = async () => {
        if (!user) return;
        setIsCreatingPoll(true);
        try {
            const namesArray = Array.from(savedNames);
            const pollId = await pollService.createPoll(user.uid, namesArray, creatorName);

            const origin = window.location.origin;
            setPollLink(`${origin}/vote/${pollId}`);
            setModalType('share_poll');
        } catch (error) {
            console.error("Failed to create poll", error);
            alert("Ndodhi një gabim. Ju lutem provoni përsëri.");
        } finally {
            setIsCreatingPoll(false);
        }
    };

    // Reset view to generate again
    const resetView = () => {
        setShowResults(false);
        setGeneratedNames([]);
    };

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[#F8F8F8] text-zinc-900 font-sans selection:bg-black selection:text-white pt-8">

            {/* SAVED INDICATOR - CLICK TO VIEW SAVED NAMES DRAWER */}
            <div className="fixed top-24 right-6 z-[40] pointer-events-none">
                <button
                    onClick={() => setShowSavedView(true)}
                    className="group flex items-center gap-2 text-sm font-medium pointer-events-auto animate-in fade-in zoom-in duration-300 hover:scale-105 transition-transform"
                >
                    <span className="bg-black text-white h-10 px-4 flex items-center justify-center rounded-full text-sm shadow-xl border border-white/10">
                        <Heart className="w-4 h-4 fill-white mr-2 group-hover:scale-110 transition-transform" />
                        {savedNames.size}
                    </span>
                </button>
            </div>

            {/* SAVED NAMES DRAWER (SIDE OVERLAY) */}
            <div className={cn(
                "fixed inset-0 z-[200] bg-black/20 backdrop-blur-sm transition-opacity duration-500",
                showSavedView ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )} onClick={() => setShowSavedView(false)}>
                <div
                    className={cn(
                        "absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-500 flex flex-col",
                        showSavedView ? "translate-x-0" : "translate-x-full"
                    )}
                    style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Drawer Header */}
                    <div className="p-6 md:p-8 border-b border-zinc-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                        <div>
                            <h3 className="text-2xl font-heading font-bold text-zinc-900">Të preferuarit</h3>
                            <p className="text-zinc-500 text-sm mt-1">
                                Keni ruajtur {savedNames.size} nga {user ? USER_LIMIT : GUEST_LIMIT} emra
                            </p>
                        </div>
                        <button
                            onClick={() => setShowSavedView(false)}
                            className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                        >
                            <X size={24} className="text-zinc-400 hover:text-black" />
                        </button>
                    </div>

                    {/* Saved List */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4">
                        {savedNames.size === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-4">
                                <Heart size={48} className="opacity-20" />
                                <p>Asnjë emër i ruajtur ende</p>
                            </div>
                        ) : (
                            Array.from(savedNames).map((name) => (
                                <div key={name} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100 group hover:border-zinc-200 transition-colors">
                                    <span className="text-xl font-heading font-bold text-zinc-900">{name}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSaveName(name);
                                        }}
                                        className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Drawer Footer - Conversion Hook */}
                    {/* Drawer Footer - Gamified & Viral */}
                    <div className="p-6 md:p-8 border-t border-zinc-100 bg-zinc-50/50">
                        {!user ? (
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-4 bg-orange-50/50 rounded-xl border border-orange-100/50">
                                    <div className="p-1.5 bg-orange-100 rounded-full text-orange-600 mt-0.5">
                                        <Sparkles size={14} />
                                    </div>
                                    <p className="text-sm text-orange-800/80 leading-relaxed">
                                        Kujdes: Këta emra do të fshihen. Regjistrohuni për t'i ruajtur dhe për të kërkuar mendimin e miqve!
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.push('/register?redirect=/emrat')}
                                    className="w-full py-4 bg-black text-white font-medium text-lg rounded-xl hover:scale-[1.02] transition-transform shadow-xl shadow-black/5 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <span>Ruaji & Ndaji me Miqtë</span>
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
                                    <div className="p-1.5 bg-blue-100 rounded-full text-blue-600 mt-0.5">
                                        <Sparkles size={14} />
                                    </div>
                                    <p className="text-sm text-blue-800/80 leading-relaxed">
                                        Jeni në dilemë? Ndani listën me partnerin ose miqtë dhe lërini ata të votojnë për emrin e preferuar!
                                    </p>
                                </div>
                                <button
                                    onClick={handleCreatePollClick}
                                    disabled={isCreatingPoll}
                                    className="w-full py-4 bg-black text-white font-medium text-lg rounded-xl hover:scale-[1.02] transition-transform shadow-xl shadow-black/5 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isCreatingPoll ? (
                                        <span className="animate-pulse">Po krijojmë linkun...</span>
                                    ) : (
                                        <>
                                            <span>Krijo Link Votimi</span>
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
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
                                {modalType === 'save' || modalType === 'likes_limit' ? (
                                    <Heart className="w-8 h-8 fill-black text-black" />
                                ) : modalType === 'share_poll' ? (
                                    <Sparkles className="w-8 h-8 text-black fill-black" />
                                ) : (
                                    <Sparkles className="w-8 h-8 text-black" />
                                )}
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl md:text-3xl font-heading font-bold text-zinc-900">
                                    {modalType === 'save' ? 'Mos i humbni emrat e preferuar' :
                                        modalType === 'likes_limit' ? 'Lista është mbushur plot' :
                                            modalType === 'share_poll' ? 'Linku u krijua!' :
                                                modalType === 'enter_name' ? 'Si quheni?' :
                                                    modalType === 'register_share' ? 'Krijoni llogari për të shpërndarë' :
                                                        modalType === 'confirm_poll' ? 'Konfirmoni listën' :
                                                            'Keni arritur limitin ditor'}
                                </h3>
                                <p className="text-zinc-500 leading-relaxed">
                                    {modalType === 'save'
                                        ? `Keni ruajtur ${savedNames.size} emra. Krijoni një llogari falas për t'i ruajtur ata përgjithmonë.`
                                        : modalType === 'likes_limit'
                                            ? `Keni arritur limitin e ${user ? USER_LIMIT : GUEST_LIMIT} emrave të preferuar. ${!user ? 'Regjistrohuni për më shumë.' : ''}`
                                            : modalType === 'share_poll'
                                                ? 'Dërgojani këtë link miqve dhe familjarëve që të votojnë për emrin e tyre të preferuar.'
                                                : modalType === 'enter_name'
                                                    ? 'Shkruani emrin tuaj që miqtë të dinë se kë po ndihmojnë.'
                                                    : modalType === 'register_share'
                                                        ? 'Vetëm përdoruesit e regjistruar mund të krijojnë sondazhe dhe të shpërndajnë listën.'
                                                        : modalType === 'confirm_poll'
                                                            ? 'Lista do të finalizohet për votim. Nuk do të mund të shtoni emra të tjerë në këtë sondazh pasi të krijohet.'
                                                            : 'Keni arritur limitin e kërkimeve si vizitor. Krijoni një llogari falas për të vazhduar kërkimin pa limit.'
                                    }
                                </p>
                            </div>

                            {modalType === 'share_poll' ? (
                                <div className="w-full space-y-4 pt-2">
                                    <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                                        <code className="flex-1 text-sm text-zinc-600 truncate text-left">
                                            {pollLink}
                                        </code>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(pollLink);
                                                alert("Linku u kopjua!");
                                            }}
                                            className="text-xs font-bold bg-black text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800"
                                        >
                                            Kopjo
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const text = `Më ndihmoni të zgjedh emrin e bebit! Votoni këtu: ${pollLink}`;
                                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                        }}
                                        className="w-full py-4 bg-[#25D366] text-white font-medium text-lg rounded-xl hover:scale-[1.02] transition-transform shadow-xl shadow-[#25D366]/20 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <span>Dërgo në WhatsApp</span>
                                    </button>
                                </div>
                            ) : modalType === 'enter_name' ? (
                                <div className="w-full space-y-4 pt-2">
                                    <input
                                        type="text"
                                        value={creatorName}
                                        onChange={(e) => setCreatorName(e.target.value)}
                                        placeholder="Emri juaj (psh. Era)"
                                        className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-xl focus:border-black focus:outline-none transition-colors font-medium text-center"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreatePollClick()}
                                    />
                                    <button
                                        onClick={handleCreatePollClick}
                                        disabled={!creatorName.trim()}
                                        className="w-full py-4 bg-black text-white font-medium text-lg rounded-xl hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50"
                                    >
                                        Vazhdo
                                    </button>
                                </div>
                            ) : modalType === 'confirm_poll' ? (
                                <div className="w-full space-y-3 pt-2">
                                    <button
                                        onClick={confirmAndCreatePoll}
                                        disabled={isCreatingPoll}
                                        className="w-full py-4 bg-black text-white font-medium text-lg rounded-xl hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50"
                                    >
                                        {isCreatingPoll ? 'Po krijohet...' : 'Konfirmo dhe Krijo Linkun'}
                                    </button>
                                    <button
                                        onClick={() => setShowAuthModal(false)}
                                        className="w-full py-4 text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
                                    >
                                        Anulo
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full space-y-3 pt-2">
                                    <button
                                        onClick={() => router.push('/register?redirect=/emrat')}
                                        className="w-full py-4 bg-black text-white font-medium text-lg hover:scale-[1.02] transition-transform active:scale-95"
                                    >
                                        {modalType === 'register_share' ? 'Regjistrohu Tani' : 'Krijo Llogari Falas'}
                                    </button>
                                    <button
                                        onClick={handleDismissAuth}
                                        className="w-full py-4 text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
                                    >
                                        {modalType === 'save' ? 'Vazhdo si vizitor' : 'Mbyll'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MINIMAL TOAST NOTIFICATION WITH ACTION */}
            {showToast && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-4 bg-zinc-900/95 backdrop-blur-md text-white pl-6 pr-2 py-2 rounded-full shadow-2xl animate-in slide-in-from-bottom-5 duration-300 border border-zinc-800/50">
                    <span className="text-sm font-medium text-zinc-200 whitespace-nowrap">U ruajt në listë.</span>
                    <button
                        onClick={() => router.push('/register?redirect=/emrat')}
                        className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:scale-105 transition-transform active:scale-95 whitespace-nowrap"
                    >
                        Ruaje përgjithmonë
                    </button>
                    <button
                        onClick={() => setShowToast(false)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors ml-1"
                    >
                        <X size={14} className="text-zinc-400" />
                    </button>
                </div>
            )}

            {/* MAIN INTERFACE */}
            <main className="relative flex flex-col items-center justify-center min-h-[70vh]">

                {/* INPUT SECTION */}
                <div className={cn(
                    "w-full flex flex-col items-center px-6 transition-all duration-700",
                    showResults ? "-translate-y-[20vh] opacity-0 pointer-events-none absolute inset-0" : "opacity-100"
                )} style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
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
                                        {style === 'modern' ? 'Moderne' :
                                            style === 'traditional' ? 'Tradicionale' :
                                                style === 'muslim' ? 'Myslimane' :
                                                    style === 'catholic' ? 'Katolike' :
                                                        style === 'nature' ? 'Natyra' : 'Mikse'}
                                    </span>
                                    <select
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        value={style}
                                        onChange={(e) => setStyle(e.target.value)}
                                    >
                                        <option value="modern">Moderne</option>
                                        <option value="traditional">Tradicionale (Ilire)</option>
                                        <option value="muslim">Myslimane</option>
                                        <option value="catholic">Katolike</option>
                                        <option value="nature">Natyra</option>
                                        <option value="mix">Të gjitha (Mikse)</option>
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
                        <div className="pt-8 space-y-4">
                            {!user && generationCount >= FREE_LIMIT ? (
                                <div className="space-y-4 w-full">
                                    <button
                                        onClick={() => router.push('/register?redirect=/emrat')}
                                        className="w-full group flex items-center justify-center gap-4 py-5 bg-black text-white text-xl md:text-2xl font-medium rounded-full transition-all hover:scale-[1.02] shadow-xl shadow-black/10 hover:shadow-black/20 relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                        <span>Regjistrohu për më shumë</span>
                                        <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    <div className="flex items-center justify-center gap-2 text-sm font-medium text-orange-600 bg-orange-50 py-2 px-4 rounded-full mx-auto w-fit border border-orange-100">
                                        <span>Limiti falas u arrit ({FREE_LIMIT}/{FREE_LIMIT})</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
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

                                    {/* Free Usage Indicator - Progress Style */}
                                    {!user && (
                                        <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium group/indicator cursor-help">
                                            <div className="flex gap-1">
                                                {[...Array(FREE_LIMIT)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={cn(
                                                            "w-2 h-2 rounded-full transition-colors",
                                                            i < generationCount ? "bg-zinc-300" : "bg-black"
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                            <span>
                                                {Math.max(0, FREE_LIMIT - generationCount)} kërkime falas
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* RESULTS SECTION - FULLSCREEN OVERLAY */}
                <div className={cn(
                    "fixed inset-0 z-[60] bg-white overflow-y-auto transition-transform duration-700",
                    showResults ? "translate-y-0" : "translate-y-[100vh]"
                )} style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
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
                            <div className="mt-32 text-center pb-12 flex flex-col items-center">
                                {!user && generationCount >= FREE_LIMIT ? (
                                    <div className="space-y-6 max-w-md w-full">
                                        <button
                                            onClick={() => router.push('/register?redirect=/emrat')}
                                            className="w-full inline-flex items-center justify-center px-8 py-5 text-lg font-medium text-white bg-black rounded-full hover:scale-105 transition-transform shadow-2xl shadow-black/20"
                                        >
                                            <span>Krijo Llogari Falas</span>
                                            <ArrowRight className="ml-2" size={20} />
                                        </button>
                                        <p className="text-zinc-500 text-sm">
                                            Keni arritur limitin e kërkimeve falas.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <button
                                            onClick={() => generateNames()}
                                            disabled={isLoading}
                                            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-black rounded-full hover:scale-105 transition-transform disabled:opacity-50"
                                        >
                                            {isLoading ? 'Po kërkojmë...' : 'Gjenero të tjera'}
                                        </button>
                                        {!user && (
                                            <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm font-medium">
                                                <div className="flex gap-1">
                                                    {[...Array(FREE_LIMIT)].map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className={cn(
                                                                "w-1.5 h-1.5 rounded-full transition-colors",
                                                                i < generationCount ? "bg-zinc-200" : "bg-zinc-400"
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                                <span>
                                                    {Math.max(0, FREE_LIMIT - generationCount)} falas
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
