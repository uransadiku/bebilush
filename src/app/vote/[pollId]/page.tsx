'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { pollService, Poll } from '@/services/pollService';
import { Heart, Check, ArrowRight, Sparkles, Home, Share2, RotateCcw, Crown, Medal, Award, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

// Types for stored vote data
interface StoredVoteData {
    votedNames: string[]; // Ordered by preference (index 0 = #1 choice)
    voterName: string;
    votedAt: string;
}

// Ranking points: 1st choice = 3pts, 2nd = 2pts, 3rd = 1pt
const RANK_POINTS = [3, 2, 1] as const;
const RANK_LABELS = ['Favoriti #1', 'Favoriti #2', 'Favoriti #3'] as const;
const RANK_COLORS = [
    'from-amber-400 to-yellow-500', // Gold for #1
    'from-zinc-300 to-zinc-400',    // Silver for #2
    'from-amber-600 to-amber-700'   // Bronze for #3
] as const;

export default function VotePage() {
    const params = useParams();
    const router = useRouter();
    const pollId = params.pollId as string;
    const { user, loading: authLoading } = useAuth();

    const MAX_VOTES = 3;
    const [poll, setPoll] = useState<Poll | null>(null);
    const [loading, setLoading] = useState(true);
    const [rankedChoices, setRankedChoices] = useState<string[]>([]); // Ordered array of selected names
    const [voterName, setVoterName] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // New states for returning voter experience
    const [isReturningVoter, setIsReturningVoter] = useState(false);
    const [previousVoteData, setPreviousVoteData] = useState<StoredVoteData | null>(null);

    // Get user's display name (from Google sign-in or email)
    const getUserDisplayName = () => {
        if (!user) return '';
        if (user.displayName) return user.displayName.split(' ')[0]; // First name only
        if (user.email) return user.email.split('@')[0]; // Username from email
        return '';
    };

    // Pre-fill voter name for logged-in users
    useEffect(() => {
        if (!authLoading && user) {
            const displayName = getUserDisplayName();
            if (displayName && !voterName) {
                setVoterName(displayName);
            }
        }
    }, [user, authLoading]);

    useEffect(() => {
        let mounted = true;

        const fetchPoll = async () => {
            if (!pollId) return;

            // Check if already voted and load previous vote data
            const hasVoted = localStorage.getItem(`hasVoted_${pollId}`);
            const storedVoteData = localStorage.getItem(`voteData_${pollId}`);
            
            if (hasVoted) {
                if (mounted) {
                    setSubmitted(true);
                    setIsReturningVoter(true); // This is a returning voter
                    
                    // Load their previous vote data if available
                    if (storedVoteData) {
                        try {
                            const voteData = JSON.parse(storedVoteData) as StoredVoteData;
                            setPreviousVoteData(voteData);
                            setVoterName(voteData.voterName);
                        } catch (e) {
                            console.error("Error parsing stored vote data", e);
                        }
                    }
                }
            }

            try {
                const data = await pollService.getPoll(pollId);
                if (mounted) {
                    setPoll(data);
                }
            } catch (error) {
                console.error("Error loading poll", error);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchPoll();

        return () => {
            mounted = false;
        };
    }, [pollId]);

    // Handle ranked selection - clicking adds to next available rank, clicking again removes
    const handleNameClick = (name: string) => {
        setRankedChoices(prev => {
            const currentRank = prev.indexOf(name);
            
            if (currentRank !== -1) {
                // Already selected - remove it and shift others up
                return prev.filter(n => n !== name);
            }
            
            // Not selected yet - add to next rank if space available
            if (prev.length >= MAX_VOTES) {
                return prev; // Already at max
            }
            
            return [...prev, name];
        });
    };

    // Get the rank (1-3) of a name, or null if not ranked
    const getNameRank = (name: string): number | null => {
        const index = rankedChoices.indexOf(name);
        return index !== -1 ? index + 1 : null;
    };

    const handleSubmit = async () => {
        if (!poll || !voterName.trim()) return;

        if (rankedChoices.length === 0) {
            alert("Ju lutem zgjidhni të paktën një emër!");
            return;
        }

        // Convert ranked choices to vote record with points
        // 1st choice = 3pts, 2nd = 2pts, 3rd = 1pt
        const votes: Record<string, number> = {};
        rankedChoices.forEach((name, index) => {
            votes[name] = RANK_POINTS[index];
        });

        setIsSubmitting(true);
        try {
            await pollService.submitVote(poll.id!, voterName, votes);
            
            // Store vote data for returning voter experience (ordered by rank)
            const voteData: StoredVoteData = {
                votedNames: rankedChoices, // Already ordered by preference
                voterName: voterName,
                votedAt: new Date().toISOString()
            };
            localStorage.setItem(`hasVoted_${poll.id}`, 'true');
            localStorage.setItem(`voteData_${poll.id}`, JSON.stringify(voteData));
            
            setPreviousVoteData(voteData);
            setIsReturningVoter(false); // Just submitted, not returning
            setSubmitted(true);
        } catch (error) {
            console.error("Error submitting vote", error);
            alert("Ndodhi një gabim. Ju lutem provoni përsëri.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Share the poll link
    const sharePoll = () => {
        const url = window.location.href;
        const text = `Ndihmoni ${poll?.creatorName} të zgjedhë emrin e bebit! Votoni këtu:`;
        
        if (navigator.share) {
            navigator.share({ title: 'Sondazh për Emrin e Bebit', text, url });
        } else {
            navigator.clipboard.writeText(url);
            alert('Linku u kopjua!');
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFF8F5] to-[#FFF0E5]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-black/10 border-t-black rounded-full animate-spin" />
                    <p className="text-zinc-500 font-medium">Po ngarkojmë sondazhin...</p>
                </div>
            </div>
        );
    }

    // Poll not found
    if (!poll) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#FFF8F5] to-[#FFF0E5] p-6">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-4xl">🔍</span>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-heading font-bold text-zinc-900">Sondazhi nuk u gjet</h1>
                        <p className="text-zinc-500">Ky link mund të jetë i pasaktë ose sondazhi është mbyllur.</p>
                    </div>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-medium hover:scale-105 transition-transform"
                    >
                        <Home size={18} />
                        <span>Kthehu në Bebilush</span>
                    </Link>
                </div>
            </div>
        );
    }

// Success/Thank you state - Different UI for returning voters vs just submitted
    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#FFF8F5] via-[#FFF0E5] to-[#FFE8D6] relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-20 left-10 w-32 h-32 bg-[#FFD6C4]/30 rounded-full blur-3xl" />
                <div className="absolute bottom-40 right-10 w-40 h-40 bg-[#FFE8D6]/50 rounded-full blur-3xl" />
                <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-[#FFC9B0]/20 rounded-full blur-2xl" />
                
                {/* Content */}
                <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
                    <div className="max-w-md w-full space-y-8">
                        
                        {isReturningVoter ? (
                            // RETURNING VOTER
                            <>
                                {/* Already voted indicator */}
                                <div className="text-center space-y-6">
                                    <div className="relative inline-block">
                                        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-green-500/25">
                                            <Check className="w-12 h-12 text-white" strokeWidth={3} />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                                            <RotateCcw className="w-4 h-4 text-zinc-500" />
                                        </div>
                </div>
                                    
                                    <div className="space-y-3">
                                        <h1 className="text-3xl md:text-4xl font-heading font-bold text-zinc-900 leading-tight">
                                            Keni votuar tashmë{previousVoteData?.voterName ? `, ${previousVoteData.voterName}` : ''}!
                                        </h1>
                                        <p className="text-lg text-zinc-600 leading-relaxed">
                                            Faleminderit që ndihmuat <span className="font-semibold text-zinc-800">{poll.creatorName}</span> të zgjedhë emrin e bebit.
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            // JUST SUBMITTED - Celebration experience
                            <>
                                {/* Success animation */}
                                <div className="text-center space-y-6">
                                    <div className="relative inline-block">
                                        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-green-500/25 animate-in zoom-in duration-500">
                                            <Check className="w-12 h-12 text-white" strokeWidth={3} />
                                        </div>
                                        {/* Sparkle decorations */}
                                        <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-400 animate-pulse" />
                                        <Heart className="absolute -bottom-1 -left-3 w-5 h-5 text-rose-400 fill-rose-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <h1 className="text-4xl md:text-5xl font-heading font-bold text-zinc-900 leading-tight">
                                            Faleminderit, <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400">{voterName || 'mik'}</span>!
                                        </h1>
                                        <p className="text-lg text-zinc-600 leading-relaxed">
                                            Vota jote u regjistrua me sukses. <br/>
                                            <span className="font-semibold text-zinc-800">{poll.creatorName}</span> do të jetë shumë {poll.creatorName.endsWith('a') ? 'e lumtur' : 'i lumtur'} për ndihmën tuaj në zgjedhjen e emrit të bebit!
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* SHARED SECTIONS - Same for both states */}

                        {/* Rankings Display - Consistent styling */}
                                {previousVoteData?.votedNames && previousVoteData.votedNames.length > 0 && (
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-black/5 border border-white/50">
                                <p className="text-sm text-zinc-500 mb-4 font-medium">Renditja juaj:</p>
                                <div className="space-y-3">
                                    {previousVoteData.votedNames.map((name, idx) => (
                                        <div 
                                                    key={name}
                                            className={cn(
                                                "flex items-center gap-3",
                                                !isReturningVoter && "animate-in fade-in slide-in-from-bottom-2"
                                            )}
                                            style={!isReturningVoter ? { animationDelay: `${idx * 100}ms` } : undefined}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md",
                                                idx === 0 ? "bg-gradient-to-br from-amber-400 to-yellow-500" :
                                                idx === 1 ? "bg-gradient-to-br from-zinc-300 to-zinc-400" :
                                                "bg-gradient-to-br from-amber-600 to-amber-700"
                                            )}>
                                                {idx === 0 ? <Crown size={16} /> : idx + 1}
                                            </div>
                                            <span className="font-heading font-bold text-lg text-zinc-800">
                                                    {name}
                                                </span>
                                            <span className="text-xs text-zinc-400 ml-auto">
                                                {RANK_POINTS[idx]} pikë
                                            </span>
                                        </div>
                                    ))}
                                        </div>
                                    </div>
                                )}

                        {/* Share Invitation - Consistent styling */}
                        <div className={cn(
                            "bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl shadow-black/5 border border-white/50 space-y-4",
                            !isReturningVoter && "animate-in fade-in slide-in-from-bottom-3 duration-500"
                        )} style={!isReturningVoter ? { animationDelay: '300ms' } : undefined}>
                            <p className="text-zinc-600 text-center">
                                Njohni dikë tjetër që mund ta ndihmojë <span className="font-semibold text-zinc-800">{poll.creatorName}</span>?
                            </p>
                            
                            <button
                                onClick={sharePoll}
                                className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-orange-400 text-white font-medium rounded-xl hover:scale-[1.02] transition-all shadow-lg shadow-rose-500/20 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Share2 size={18} />
                                <span>Shpërndaje me miqtë</span>
                            </button>
                                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-3 py-2">
                            <div className="flex-1 h-px bg-zinc-200/60" />
                            <span className="text-xs text-zinc-400 uppercase tracking-wider">Eksploroni Bebilush</span>
                            <div className="flex-1 h-px bg-zinc-200/60" />
                    </div>

                        {/* Explore CTAs */}
                        <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => router.push('/emrat')}
                                className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 hover:shadow-md hover:border-zinc-200 transition-all text-center space-y-2 group"
                                    >
                                <span className="text-3xl block group-hover:scale-110 transition-transform">👶</span>
                                <span className="text-sm font-medium text-zinc-700">Gjenero Emra</span>
                                    </button>
                        <button
                            onClick={() => router.push('/kuptimi')}
                                className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 hover:shadow-md hover:border-zinc-200 transition-all text-center space-y-2 group"
                                    >
                                <span className="text-3xl block group-hover:scale-110 transition-transform">📖</span>
                                <span className="text-sm font-medium text-zinc-700">Kuptimi i Emrit</span>
                                    </button>
                                </div>

                        {/* Registration hook for guest users - subtle */}
                        {!user && (
                            <p className="text-center text-xs text-zinc-400 pt-2">
                                Prisni bebe? <button onClick={() => router.push('/register?redirect=/emrat')} className="underline underline-offset-2 hover:text-zinc-600 transition-colors">Krijoni llogari falas</button> për të ruajtur emrat.
                            </p>
                        )}

                        {/* Bebilush branding */}
                        <div className="text-center pt-4">
                            <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-600 transition-colors">
                                <Heart size={14} className="fill-current" />
                                <span className="text-sm font-medium">Bebilush</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Voting state
    const currentVoteCount = rankedChoices.length;
    const isMaxReached = currentVoteCount >= MAX_VOTES;

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#FFF8F5] to-[#FFF0E5]">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-700 transition-colors">
                        <Heart size={16} className="fill-current text-rose-400" />
                        <span className="text-sm font-semibold">Bebilush</span>
                    </Link>
                    <span className="text-xs font-medium bg-black/5 px-3 py-1.5 rounded-full text-zinc-600">
                        Sondazh
                    </span>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 py-8 space-y-6">
                {/* Header section */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-100 to-orange-100 text-rose-700 px-4 py-2 rounded-full text-sm font-semibold">
                        <Heart size={14} className="fill-current" />
                        <span>Ndihmoni të zgjedhim emrin</span>
                    </div>
                    
                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-zinc-900 leading-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400">{poll.creatorName}</span> po kërkon ndihmën tuaj!
                    </h1>
                    
                    <p className="text-zinc-600 leading-relaxed">
                        Renditni <span className="font-bold text-black">3 emrat tuaj të preferuar</span> sipas preferencës.
                        <br />
                        <span className="text-sm text-zinc-400">Kliko emrat në renditje: favoriti i parë, i dytë, i tretë.</span>
                    </p>
                </div>

                {/* Selected Rankings Display */}
                {rankedChoices.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 shadow-lg shadow-black/5 border border-zinc-100 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-zinc-700">Renditja juaj</h3>
                            <button
                                onClick={() => setRankedChoices([])}
                                className="text-xs text-zinc-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                            >
                                <X size={12} />
                                <span>Pastro</span>
                            </button>
                        </div>
                        <div className="space-y-2">
                            {rankedChoices.map((name, idx) => (
                                <div 
                                    key={name}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-zinc-50 to-zinc-100/50 group animate-in slide-in-from-left-2"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0",
                                        `bg-gradient-to-br ${RANK_COLORS[idx]}`
                                    )}>
                                        {idx === 0 ? <Crown size={18} /> : idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-heading font-bold text-zinc-900">{name}</p>
                                        <p className="text-xs text-zinc-400">{RANK_LABELS[idx]} • {RANK_POINTS[idx]} pikë</p>
                                    </div>
                                    <button
                                        onClick={() => handleNameClick(name)}
                                        className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                            
                            {/* Empty slots */}
                            {[...Array(MAX_VOTES - rankedChoices.length)].map((_, idx) => (
                                <div 
                                    key={`empty-${idx}`}
                                    className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-zinc-200"
                                >
                                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-300 font-bold flex-shrink-0">
                                        {rankedChoices.length + idx + 1}
                                    </div>
                                    <p className="text-sm text-zinc-300">
                                        {RANK_LABELS[rankedChoices.length + idx]}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Names list */}
                <div className="space-y-2">
                    <p className="text-sm font-medium text-zinc-500 px-1">
                        {rankedChoices.length === 0 
                            ? "Kliko emrin tuaj të preferuar:" 
                            : rankedChoices.length < MAX_VOTES 
                                ? `Zgjidhni ${RANK_LABELS[rankedChoices.length].toLowerCase()}:` 
                                : "Renditja e kompletuar!"}
                    </p>
                    <div className="space-y-2">
                    {poll.names.map((name, index) => {
                            const rank = getNameRank(name);
                            const isSelected = rank !== null;
                        const isDisabled = !isSelected && isMaxReached;

                        return (
                            <button
                                key={name}
                                    onClick={() => handleNameClick(name)}
                                disabled={isDisabled}
                                className={cn(
                                        "w-full p-4 rounded-2xl flex items-center justify-between transition-all duration-300 group",
                                    isSelected
                                            ? `bg-gradient-to-r ${RANK_COLORS[rank! - 1]} text-white shadow-lg scale-[1.01]`
                                        : isDisabled
                                                ? "bg-zinc-100/50 text-zinc-300 cursor-not-allowed"
                                                : "bg-white text-zinc-900 hover:shadow-md hover:shadow-black/5 border border-zinc-100 hover:border-zinc-200 active:scale-[0.98]"
                                    )}
                                    style={{ animationDelay: `${index * 30}ms` }}
                                >
                                    <span className={cn(
                                        "text-lg font-heading font-bold",
                                        isSelected && "drop-shadow-sm"
                                    )}>
                                        {name}
                                    </span>
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                                    isSelected 
                                            ? "bg-white/25" 
                                        : isDisabled 
                                            ? "bg-zinc-200/50" 
                                                : "bg-zinc-100 group-hover:bg-amber-100"
                                )}>
                                    {isSelected ? (
                                            rank === 1 ? (
                                                <Crown size={20} className="text-white drop-shadow" />
                                            ) : (
                                                <span className="text-white font-bold text-lg drop-shadow">{rank}</span>
                                            )
                                        ) : (
                                            <span className={cn(
                                                "text-sm font-medium transition-colors",
                                                isDisabled ? "text-zinc-300" : "text-zinc-400 group-hover:text-amber-600"
                                            )}>
                                                {rankedChoices.length + 1}
                                            </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                    </div>
                </div>

                {/* Submit section */}
                <div className="bg-white p-6 rounded-3xl shadow-lg shadow-black/5 border border-zinc-100 space-y-4">
                    {user ? (
                        // Logged-in user - show their name
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-zinc-50 to-zinc-100/50 rounded-xl">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-orange-400 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-rose-500/20">
                                {voterName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-zinc-500 uppercase tracking-wider">Duke votuar si</p>
                                <p className="font-bold text-zinc-900 text-lg">{voterName}</p>
                            </div>
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <Check size={16} className="text-green-600" />
                            </div>
                        </div>
                    ) : (
                        // Guest user - ask for name
                    <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700 ml-1">Emri juaj</label>
                        <input
                            type="text"
                            value={voterName}
                            onChange={(e) => setVoterName(e.target.value)}
                                placeholder="Si quheni?"
                                className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-xl focus:border-rose-300 focus:bg-white focus:outline-none transition-all font-medium text-lg"
                        />
                    </div>
                    )}
                    
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !voterName.trim() || currentVoteCount === 0}
                        className={cn(
                            "w-full py-4 font-semibold text-lg rounded-2xl transition-all flex items-center justify-center gap-3",
                            currentVoteCount > 0 && voterName.trim()
                                ? "bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-xl shadow-rose-500/25 hover:shadow-2xl hover:shadow-rose-500/30 hover:scale-[1.02] active:scale-95"
                                : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                        )}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Po dërgohet...</span>
                            </>
                        ) : (
                            <>
                                <span>Dërgo Renditjen</span>
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>

                    {currentVoteCount === 0 && (
                        <p className="text-center text-sm text-zinc-400">
                            Zgjidhni të paktën një emër për të vazhduar
                        </p>
                    )}
                    
                    {currentVoteCount > 0 && currentVoteCount < MAX_VOTES && (
                        <p className="text-center text-sm text-zinc-400">
                            Mund të vazhdoni me {currentVoteCount} zgjedhje, ose shtoni {MAX_VOTES - currentVoteCount} të tjera
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
