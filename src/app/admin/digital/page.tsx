


export default function DigitalExperiencePage() {
    return (
        <div className="space-y-6">
            <div className="glass-panel p-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mobile & Digital Experience</h1>
                <p className="text-slate-500 font-medium mt-2">Digital transformation and mobile-first experiences.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    'Mobile App Settings',
                    'Digital Portals',
                    'User Personalization',
                    'Omnichannel Support',
                    'Digital Asset Management',
                    'API Integrations'
                ].map((feature) => (
                    <div key={feature} className="glass-panel p-6 hover:border-primary/50 transition-colors group cursor-pointer">
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors">{feature}</h3>
                        <p className="text-sm text-slate-500 mt-2">Drive digital growth through advanced {feature.toLowerCase()}.</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
