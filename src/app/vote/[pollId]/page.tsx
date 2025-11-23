'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { pollService, Poll } from '@/services/pollService';
import { Heart, Check, Share2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VotePage() {
    const params = useParams();
    const router = useRouter();
    const pollId = params.pollId as string;

    const MAX_VOTES = 3;
    const [poll, setPoll] = useState<Poll | null>(null);
    const [loading, setLoading] = useState(true);
    const [votes, setVotes] = useState<Record<string, number>>({});
    const [voterName, setVoterName] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        let mounted = true;

        const fetchPoll = async () => {
            if (!pollId) return;

            // Check if already voted
            const hasVoted = localStorage.getItem(`hasVoted_${pollId}`);
            if (hasVoted) {
                if (mounted) setSubmitted(true);
                // We still fetch the poll to show the creator's name
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

    const toggleVote = (name: string) => {
        setVotes(prev => {
            const isSelected = prev[name] === 1;

            if (isSelected) {
                // Always allow deselecting
                return { ...prev, [name]: 0 };
            }

            // Check limit
            const currentCount = Object.values(prev).filter(v => v === 1).length;
            if (currentCount >= MAX_VOTES) {
                alert(`Mund të zgjidhni maksimumi ${MAX_VOTES} emra!`);
                return prev;
            }

            return { ...prev, [name]: 1 };
        });
    };

    const handleSubmit = async () => {
        if (!poll || !voterName.trim()) return;

        // Filter out only selected names
        const activeVotes = Object.fromEntries(
            Object.entries(votes).filter(([_, val]) => val > 0)
        );

        if (Object.keys(activeVotes).length === 0) {
            alert("Ju lutem zgjidhni të paktën një emër!");
            return;
        }

        setIsSubmitting(true);
        try {
            await pollService.submitVote(poll.id!, voterName, activeVotes);
            localStorage.setItem(`hasVoted_${poll.id}`, 'true'); // Mark as voted
            setSubmitted(true);
        } catch (error) {
            console.error("Error submitting vote", error);
            alert("Ndodhi një gabim. Ju lutem provoni përsëri.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8]">
                <div className="animate-pulse text-zinc-400">Po ngarkojmë...</div>
            </div>
        );
    }

    if (!poll) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F8F8] p-6 text-center">
                <h1 className="text-2xl font-bold mb-4">Sondazhi nuk u gjet</h1>
                <p className="text-zinc-500 mb-8">Ky link mund të jetë i pasaktë ose sondazhi është mbyllur.</p>
                <button
                    onClick={() => router.push('/')}
                    className="bg-black text-white px-6 py-3 rounded-full"
                >
                    Kthehu në Bebilush
                </button>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F8F8] p-6 text-center max-w-md mx-auto">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in">
                    <Check className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="text-3xl font-heading font-bold mb-4">Faleminderit {voterName || 'për votën'}!</h1>
                <p className="text-zinc-500 mb-8 text-lg">
                    Vota jote u regjistrua. {poll.creatorName} do të jetë shumë {poll.creatorName.endsWith('a') ? 'e lumtur' : 'i lumtur'} për ndihmën.
                </p>

                <div className="w-full space-y-4">
                    <div className="p-6 bg-white rounded-2xl shadow-xl border border-zinc-100 space-y-4">
                        <p className="font-medium text-lg">Dua të gjej edhe unë një emër për bebin!</p>
                        <button
                            onClick={() => router.push('/emrat')}
                            className="w-full bg-black text-white py-4 rounded-xl font-medium hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                        >
                            <span className="text-xl">👶</span>
                            <span>Gjenero Emra</span>
                        </button>
                    </div>

                    <div className="p-6 bg-white rounded-2xl shadow-sm border border-zinc-100 space-y-4">
                        <p className="font-medium text-zinc-600">Kurioz për kuptimin e emrit të bebit?</p>
                        <button
                            onClick={() => router.push('/kuptimi')}
                            className="w-full bg-zinc-100 text-black py-4 rounded-xl font-medium hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="text-xl">📖</span>
                            <span>Gjej Kuptimin e Emrit</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentVoteCount = Object.values(votes).filter(v => v === 1).length;
    const isMaxReached = currentVoteCount >= MAX_VOTES;

    return (
        <div className="min-h-screen bg-[#F8F8F8] py-12 px-4">
            <div className="max-w-md mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <span className="inline-block px-3 py-1 bg-black/5 rounded-full text-xs font-bold tracking-widest uppercase text-zinc-500">
                        Sondazh
                    </span>
                    <h1 className="text-4xl font-heading font-bold text-zinc-900 leading-tight">
                        {poll.creatorName} po kërkon ndihmën tuaj!
                    </h1>
                    <p className="text-zinc-500">
                        Zgjidhni <span className="font-bold text-black">{MAX_VOTES} emrat</span> që ju pëlqejnë më shumë.
                        <br />
                        <span className="text-sm bg-zinc-100 px-2 py-1 rounded-md mt-2 inline-block">
                            Të zgjedhur: {currentVoteCount}/{MAX_VOTES}
                        </span>
                    </p>
                </div>

                <div className="space-y-3">
                    {poll.names.map((name) => {
                        const isSelected = votes[name] === 1;
                        const isDisabled = !isSelected && isMaxReached;

                        return (
                            <button
                                key={name}
                                onClick={() => toggleVote(name)}
                                disabled={isDisabled}
                                className={cn(
                                    "w-full p-5 rounded-2xl flex items-center justify-between transition-all duration-200 group",
                                    isSelected
                                        ? "bg-black text-white shadow-xl shadow-black/10 scale-[1.02]"
                                        : isDisabled
                                            ? "bg-zinc-50 text-zinc-400 cursor-not-allowed opacity-60"
                                            : "bg-white text-zinc-900 hover:bg-zinc-50 border border-zinc-100"
                                )}
                            >
                                <span className="text-xl font-heading font-bold">{name}</span>
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                                    isSelected ? "bg-white/20" : isDisabled ? "bg-zinc-100" : "bg-zinc-100 group-hover:bg-zinc-200"
                                )}>
                                    {isSelected ? (
                                        <Check size={16} className="text-white" />
                                    ) : (
                                        <Heart
                                            size={16}
                                            className="text-zinc-400"
                                        />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="pt-6 space-y-4 bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-900 ml-1">Emri juaj</label>
                        <input
                            type="text"
                            value={voterName}
                            onChange={(e) => setVoterName(e.target.value)}
                            placeholder="Shkruani emrin tuaj..."
                            className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-xl focus:border-black focus:outline-none transition-colors font-medium"
                        />
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !voterName.trim()}
                        className="w-full py-4 bg-black text-white font-medium text-lg rounded-xl hover:scale-[1.02] transition-transform shadow-xl shadow-black/5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? 'Po dërgohet...' : 'Dërgo Votën'}
                        {!isSubmitting && <ArrowRight size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
