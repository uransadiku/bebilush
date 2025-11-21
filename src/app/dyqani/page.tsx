import { ShoppingBag, Download, Star } from 'lucide-react';
import Button from '@/components/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DyqaniPage() {
    const products = [
        {
            id: 1,
            title: 'Udhërrëfyesi i Mëmësisë',
            type: 'eBook',
            price: '9.99 €',
            description: 'Një guidë e plotë për 3 muajt e parë me bebin tuaj.',
            rating: 4.8
        },
        {
            id: 2,
            title: 'Planifikuesi i Ushqimit',
            type: 'Template',
            price: '4.99 €',
            description: 'Menu javore dhe lista blerjesh për fillimin e ushqimit.',
            rating: 4.9
        },
        {
            id: 3,
            title: 'Gjumi i Ëmbël',
            type: 'Kurs Video',
            price: '29.99 €',
            description: 'Mësoni sekretet e gjumit të qetë për bebin tuaj.',
            rating: 5.0
        }
    ];

    return (
        <div className="container py-12">
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                    <ShoppingBag size={16} />
                    <span>Dyqani Dixhital</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-foreground">Mjete për Nënën Moderne</h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Burime të krijuara nga ekspertë për t'ju ndihmuar në çdo hap të rritjes së fëmijës suaj.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {products.map((product) => (
                    <Card key={product.id} className="flex flex-col h-full hover:shadow-lg transition-all duration-300 border-border/50">
                        <div className="aspect-[4/3] bg-muted relative overflow-hidden group">
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20 group-hover:scale-105 transition-transform duration-500">
                                <ShoppingBag size={64} />
                            </div>
                            <div className="absolute top-4 left-4">
                                <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-foreground hover:bg-background/90">
                                    {product.type}
                                </Badge>
                            </div>
                        </div>

                        <CardHeader>
                            <div className="flex justify-between items-start mb-2">
                                <CardTitle className="text-xl">{product.title}</CardTitle>
                                <div className="flex items-center gap-1 text-amber-500 text-sm font-medium">
                                    <Star size={14} fill="currentColor" />
                                    <span>{product.rating}</span>
                                </div>
                            </div>
                            <CardDescription className="line-clamp-2">
                                {product.description}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="mt-auto pt-0">
                            <div className="text-2xl font-bold text-primary">{product.price}</div>
                        </CardContent>

                        <CardFooter>
                            <Button className="w-full" icon={<Download size={16} />}>
                                Bli Tani
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
