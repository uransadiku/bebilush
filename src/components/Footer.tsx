export default function Footer() {
    return (
        <footer className="bg-secondary/30 pt-16 pb-8 mt-auto border-t">
            <div className="container">
                <div className="flex flex-col md:flex-row justify-between gap-12 mb-12">
                    <div className="max-w-xs">
                        <h3 className="font-heading text-2xl text-primary mb-2 font-semibold">Bebilush</h3>
                        <p className="text-muted-foreground text-sm">Shoqëruesi juaj në çdo hap të mëmësisë.</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16">
                        <div className="flex flex-col gap-2">
                            <h4 className="font-semibold mb-2 text-foreground">Eksploro</h4>
                            <a href="/emrat" className="text-muted-foreground hover:text-primary text-sm transition-colors">Gjeni Emrin</a>
                            <a href="/dyqani" className="text-muted-foreground hover:text-primary text-sm transition-colors">Dyqani</a>
                            <a href="/blog" className="text-muted-foreground hover:text-primary text-sm transition-colors">Blog</a>
                        </div>
                        <div className="flex flex-col gap-2">
                            <h4 className="font-semibold mb-2 text-foreground">Komuniteti</h4>
                            <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Bebilush Chat</a>
                            <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Instagram</a>
                            <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">TikTok</a>
                        </div>
                        <div className="flex flex-col gap-2">
                            <h4 className="font-semibold mb-2 text-foreground">Legal</h4>
                            <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Privatësia</a>
                            <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Kushtet</a>
                        </div>
                    </div>
                </div>

                <div className="border-t pt-8 text-center text-muted-foreground text-sm">
                    <p>&copy; {new Date().getFullYear()} Bebilush. Të gjitha të drejtat e rezervuara.</p>
                </div>
            </div>
        </footer>
    );
}
