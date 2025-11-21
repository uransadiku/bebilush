'use client';

import { useState } from 'react';
import { Sparkles, Search, BookOpen, Heart } from 'lucide-react';
import Button from '@/components/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EmratPage() {
    const [gender, setGender] = useState('both');
    const [style, setStyle] = useState('modern');
    const [startingLetter, setStartingLetter] = useState('');
    const [generatedNames, setGeneratedNames] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const generateNames = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setGeneratedNames([]);

        try {
            const response = await fetch('/api/generate-names', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ gender, style, startingLetter }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate names');
            }

            if (data.names) {
                setGeneratedNames(data.names);
            }
        } catch (error: any) {
            console.error('Error generating names:', error);
            setError(error.message || 'Ndodhi një gabim. Ju lutem provoni përsëri.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container py-12 max-w-4xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-heading font-bold mb-4 text-foreground">Gjeni Emrin e Përsosur</h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Përdorni inteligjencën artificiale për të zbuluar emra shqiptarë unikë, modernë ose tradicionalë për fëmijën tuaj.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Search size={20} className="text-primary" />
                            Preferencat
                        </CardTitle>
                        <CardDescription>Zgjidhni kriteret për emrin</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={generateNames} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gjinia</Label>
                                <Select value={gender} onValueChange={setGender}>
                                    <SelectTrigger id="gender">
                                        <SelectValue placeholder="Zgjidhni gjininë" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="boy">Djalë</SelectItem>
                                        <SelectItem value="girl">Vajzë</SelectItem>
                                        <SelectItem value="both">Surprizë (Të dyja)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="style">Stili i Emrit</Label>
                                <Select value={style} onValueChange={setStyle}>
                                    <SelectTrigger id="style">
                                        <SelectValue placeholder="Zgjidhni stilin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="modern">Modern & Unik</SelectItem>
                                        <SelectItem value="traditional">Tradicional Shqiptar</SelectItem>
                                        <SelectItem value="religious">Fetar (Mysliman/Katolik)</SelectItem>
                                        <SelectItem value="nature">Frymëzuar nga Natyra</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="letter">Shkronja e parë (Opsionale)</Label>
                                <Input
                                    id="letter"
                                    placeholder="p.sh. A"
                                    maxLength={1}
                                    value={startingLetter}
                                    onChange={(e) => setStartingLetter(e.target.value)}
                                    suppressHydrationWarning
                                />
                            </div>

                            <Button type="submit" className="w-full mt-4" isLoading={isLoading} icon={<Sparkles size={16} />}>
                                Gjenero Emra
                            </Button>
                            {error && (
                                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                                    {error}
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>

                <div className="md:col-span-2">
                    {generatedNames.length > 0 ? (
                        <div className="grid gap-4">
                            {generatedNames.map((name, index) => (
                                <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow border-primary/20">
                                    <CardContent className="p-6 flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-2xl font-bold text-primary">{name.name}</h3>
                                                <span className="text-xs px-2 py-0.5 bg-secondary rounded-full text-foreground/80 font-medium capitalize">
                                                    {name.gender === 'boy' ? 'Djalë' : 'Vajzë'}
                                                </span>
                                            </div>
                                            <p className="text-foreground/80 mb-2 italic">{name.meaning}</p>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <BookOpen size={12} />
                                                <span>Origjina: {name.origin}</span>
                                            </div>
                                        </div>
                                        <button className="text-muted-foreground hover:text-red-500 transition-colors" aria-label="Ruaj emrin">
                                            <Heart size={20} />
                                        </button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-xl bg-muted/30">
                            <div className="bg-background p-4 rounded-full mb-4 shadow-sm">
                                <Sparkles size={32} className="text-primary/60" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2 text-foreground">Gati për të zbuluar?</h3>
                            <p className="text-muted-foreground max-w-xs">
                                Plotësoni preferencat në të majtë dhe klikoni "Gjenero Emra" për të parë sugjerimet tona të zgjedhura me kujdes.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
