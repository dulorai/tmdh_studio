import React, { useState } from 'react';
import { TumdahLogoIcon, CheckIcon, ChevronDownIcon, TwitterIcon, GithubIcon } from './icons';
import { inviteCodes } from '../utils/inviteCodes';

interface LandingPageProps {
  onStart: () => void;
  onGoHome: () => void;
}

const VIDEOS = [
  { type: 'youtube', id: '6dSFYrj0r8g', title: 'Inspirational Video 1' },
  { type: 'youtube', id: 'D_wuNE4d250', title: 'Inspirational Video 2' },
  { type: 'youtube', id: 'AUClUtW6U-0', title: 'Inspirational Video 3' },
  { type: 'youtube', id: 'Lcf3F4kUmzw', title: 'Inspirational Video 4' },
];

const NavLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            // Find the header to calculate an offset, so the sticky nav doesn't cover the section title
            const header = document.querySelector('header');
            const headerOffset = header ? header.offsetHeight + 20 : 100; // Add some padding
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    return (
      <a 
        href={href} 
        onClick={handleClick}
        className="text-black hover:text-green-600 transition-colors duration-200 font-inter text-xl cursor-pointer"
      >
        {children}
      </a>
    );
};

const CTAButton: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string, primary?: boolean }> = ({ onClick, children, className = '', primary = false }) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 font-bold border-4 border-black transition-all transform hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] active:translate-y-[2px] active:shadow-none ${primary ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-white hover:bg-gray-100 text-black'} ${className}`}
  >
    {children}
  </button>
);

const Navbar: React.FC<{ onStart: () => void; onGoHome: () => void; }> = ({ onStart, onGoHome }) => (
  <header className="sticky top-0 z-50 bg-green-300 border-b-4 border-black shadow-[0_8px_0px_#000]">
    <div className="container mx-auto px-6 py-4 flex justify-between items-center">
      <button onClick={onGoHome} className="flex items-center space-x-2 focus:outline-none focus:ring-4 focus:ring-green-400 rounded-lg p-1 -m-1 transition-all duration-200">
        <TumdahLogoIcon className="h-8 w-8 text-black" />
        <span className="text-2xl font-bold text-black">Tumdah AI Studio</span>
      </button>
      <nav className="hidden md:flex items-center space-x-8">
        <NavLink href="#features">Features</NavLink>
        <NavLink href="#how-it-works">How It Works</NavLink>
        <NavLink href="#faq">FAQ</NavLink>
      </nav>
      <CTAButton onClick={onStart} className="hidden md:block" primary>Get Started</CTAButton>
    </div>
  </header>
);

const Hero: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <section className="py-20 md:py-32">
    <div className="container mx-auto px-6 text-center">
      <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-black leading-tight">
        Turn Lyrics into Legendary <br />
        <span className="text-green-600">Music Videos</span>
      </h1>
      <p className="font-inter mt-6 text-lg md:text-xl text-gray-800 max-w-3xl mx-auto">
        Use AI to instantly generate stunning storyboards from your songs. No crew, no camera, just pure creativity unleashed.
      </p>
      <div className="mt-10 flex justify-center gap-4">
        <CTAButton onClick={onStart} primary className="text-2xl">Paste Invitation Code to Access</CTAButton>
      </div>
      <div className="mt-16 md:mt-24 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          {VIDEOS.map(video => (
            <a
              key={video.id}
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black border-4 border-black shadow-[12px_12px_0px_#000] group hover:shadow-[16px_16px_0px_#000] transition-all transform hover:translate-y-[-2px]"
            >
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                  <svg className="w-20 h-20 text-white group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const Partners = () => (
    <section className="py-12">
        <div className="container mx-auto px-6 text-center">
            <h3 className="font-inter text-sm font-bold text-gray-700 uppercase tracking-widest">
                Trusted by creators worldwide
            </h3>
            <div className="mt-8 flex justify-center items-center gap-x-12 gap-y-4 flex-wrap">
                <p className="text-3xl font-bold text-gray-500">Vimeo</p>
                <p className="text-3xl font-bold text-gray-500">SoundCloud</p>
                <p className="text-3xl font-bold text-gray-500">TikTok</p>
                <p className="text-3xl font-bold text-gray-500">IndieHackers</p>
                <p className="text-3xl font-bold text-gray-500">Bandcamp</p>
            </div>
        </div>
    </section>
);

const Features = () => (
  <section id="features" className="py-20 md:py-28 bg-white border-y-4 border-black">
    <div className="container mx-auto px-6">
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-bold">Go from Idea to Storyboard in Minutes</h2>
        <p className="font-inter mt-4 text-gray-700">Tumdah AI Studio is packed with powerful features to make your visual storytelling effortless and professional.</p>
      </div>
      <div className="mt-16 grid md:grid-cols-3 gap-8">
        <div className="bg-green-100 p-8 border-4 border-black shadow-[8px_8px_0px_#000]">
          <h3 className="text-3xl font-bold">Instant Visualization</h3>
          <p className="font-inter mt-3 text-gray-800">Stop guessing what your video could look like. See your lyrics come to life with rich, descriptive scenes generated in seconds.</p>
        </div>
        <div className="bg-lime-100 p-8 border-4 border-black shadow-[8px_8px_0px_#000]">
          <h3 className="text-3xl font-bold">Boundless Styles</h3>
          <p className="font-inter mt-3 text-gray-800">From Ghibli-esque anime to gritty neo-noir, upload any reference image and our AI will match the artistic style with stunning accuracy.</p>
        </div>
        <div className="bg-teal-100 p-8 border-4 border-black shadow-[8px_8px_0px_#000]">
          <h3 className="text-3xl font-bold">Cinematic Shot Generation</h3>
          <p className="font-inter mt-3 text-gray-800">Direct your own video with professional shots. Generate everything from wide establishing shots to intense close-ups for every single scene.</p>
        </div>
      </div>
    </div>
  </section>
);

const HowItWorks = () => (
    <section id="how-it-works" className="py-20 md:py-28">
        <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-6xl font-bold">Create Your Masterpiece in 3 Simple Steps</h2>
            <div className="mt-16 grid md:grid-cols-3 gap-8 md:gap-12 text-left">
                <div className="relative">
                    <div className="absolute -left-4 -top-4 text-8xl font-black text-gray-200">01</div>
                    <h3 className="text-3xl font-bold pl-4 border-l-8 border-green-500">Provide Input</h3>
                    <p className="font-inter mt-4 text-gray-800">Paste your lyrics or script, then upload reference images for your characters and desired visual style.</p>
                </div>
                <div className="relative">
                    <div className="absolute -left-4 -top-4 text-8xl font-black text-gray-200">02</div>
                    <h3 className="text-3xl font-bold pl-4 border-l-8 border-green-500">Customize Scenes</h3>
                    <p className="font-inter mt-4 text-gray-800">Tweak the AI-generated descriptions, settings, and character assignments to perfectly match your creative vision.</p>
                </div>
                <div className="relative">
                    <div className="absolute -left-4 -top-4 text-8xl font-black text-gray-200">03</div>
                    <h3 className="text-3xl font-bold pl-4 border-l-8 border-green-500">Generate Shots</h3>
                    <p className="font-inter mt-4 text-gray-800">Click generate and watch as a full cinematic storyboard, complete with varied camera angles, is created for you.</p>
                </div>
            </div>
        </div>
    </section>
);

const FAQItem: React.FC<{ q: string; a: string; }> = ({ q, a }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-white border-4 border-black">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left p-6">
                <h4 className="text-2xl font-medium">{q}</h4>
                <ChevronDownIcon className={`h-6 w-6 text-black flex-shrink-0 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                <p className="font-inter text-gray-700 px-6 pb-6">{a}</p>
            </div>
        </div>
    );
}

const FAQ = () => (
    <section id="faq" className="py-20 md:py-28">
        <div className="container mx-auto px-6 max-w-4xl">
            <h2 className="text-4xl md:text-6xl font-bold text-center">Frequently Asked Questions</h2>
            <div className="mt-12 space-y-4">
                <FAQItem 
                    q="What kind of artistic styles can I use?"
                    a="You can use any style! Simply upload a reference image that captures the mood, color palette, and artistic medium you're aiming for. Our AI will analyze it and apply the style to your generated shots."
                />
                <FAQItem
                    q="Can I use my own characters?"
                    a="Absolutely. You can upload one or more character reference images. The AI will ensure that the characters in your storyboard scenes match the appearance of your references with high fidelity."
                />
                <FAQItem
                    q="What is the resolution of the generated images?"
                    a="The images are generated at a standard high-definition resolution suitable for storyboarding, presentations, and social media sharing. Higher resolutions may be available on premium plans."
                />
                 <FAQItem
                    q="How do I get an invite code?"
                    a="Tumdah AI Studio is currently in a private beta. Invite codes are distributed through our partners and community channels. Keep an eye on our social media for opportunities to get access!"
                />
            </div>
        </div>
    </section>
);

const FinalCTA: React.FC<{ onStart: () => void }> = ({ onStart }) => (
    <section className="py-20 md:py-28">
        <div className="container mx-auto px-6">
          <div className="text-center bg-black text-white p-12 border-4 border-black shadow-[12px_12px_0px_#000]">
              <h2 className="text-4xl md:text-6xl font-bold">Ready to Bring Your Music to Life?</h2>
              <p className="font-inter mt-4 text-gray-300 max-w-2xl mx-auto">Start creating your AI-powered music video storyboard today. Your next masterpiece is just a few clicks away.</p>
              <div className="mt-8">
                  <CTAButton onClick={onStart} primary className="text-2xl">Paste Invitation Code to Access</CTAButton>
              </div>
          </div>
        </div>
    </section>
);

const Footer: React.FC<{ onGoHome: () => void; }> = ({ onGoHome }) => (
    <footer className="border-t-4 border-black">
        <div className="container mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                <button onClick={onGoHome} className="text-left focus:outline-none focus:ring-4 focus:ring-green-400 rounded-lg p-1 -m-1 transition-all duration-200">
                     <div className="flex items-center space-x-2">
                        <TumdahLogoIcon className="h-8 w-8 text-black" />
                        <span className="text-2xl font-bold text-black">Tumdah AI Studio</span>
                    </div>
                    <p className="font-inter mt-2 text-gray-700 max-w-xs">AI-powered storyboarding for music videos.</p>
                </button>
                <div className="flex items-center gap-6">
                    <a href="https://x.com/dulalkisku0" target="_blank" rel="noopener noreferrer" className="text-black hover:text-green-600"><TwitterIcon className="h-6 w-6" /></a>
                    <a href="https://github.com/Kh3rwa1" target="_blank" rel="noopener noreferrer" className="text-black hover:text-green-600"><GithubIcon className="h-6 w-6" /></a>
                </div>
            </div>
            <div className="mt-12 border-t-4 border-black pt-8 text-center text-gray-700 font-inter">
                <p>&copy; {new Date().getFullYear()} Tumdah AI Studio. All rights reserved.</p>
            </div>
        </div>
    </footer>
);

const InviteCodeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: (code: string) => void;
}> = ({ isOpen, onClose, onUnlockSuccess }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const upperCaseCode = code.trim().toUpperCase();
        
        if (inviteCodes.has(upperCaseCode)) {
            setError(null);
            onUnlockSuccess(upperCaseCode);
        } else {
            setError('Invalid invite code. Please try again.');
            setCode('');
        }
    };
    
    React.useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setCode('');
                setError(null);
            }, 300);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in-fast"
            onClick={onClose}
        >
            <div 
                className="bg-green-300 w-full max-w-md text-center p-6 border-4 border-black shadow-[12px_12px_0px_#000]"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-4xl font-bold">Enter Invite Code</h2>
                <p className="font-inter mt-2 text-gray-800">
                    Tumdah AI Studio is currently invite-only.
                </p>

                <form onSubmit={handleSubmit} className="mt-6">
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="e.g. TUMDAH-X4F8-9H2K"
                        className="w-full bg-white border-4 border-black p-4 text-2xl text-center focus:ring-4 focus:ring-green-400 focus:outline-none transition-all duration-200"
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="w-full mt-4 bg-green-500 text-white text-3xl font-bold py-3 px-4 border-4 border-black transition-all transform hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] active:translate-y-[2px] active:shadow-none hover:bg-green-600 disabled:bg-gray-400"
                        disabled={!code.trim()}
                    >
                        Unlock Studio
                    </button>
                </form>

                {error && (
                    <div className="mt-4 bg-red-500 text-white p-3 border-4 border-black font-inter">
                        <p>{error}</p>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in-fast {
                    animation: fadeIn 0.2s ease-in-out;
                }
            `}</style>
        </div>
    );
};


export default function LandingPage({ onStart, onGoHome }: LandingPageProps) {
    const [isInviteModalOpen, setInviteModalOpen] = useState(false);

    const handleOpenInviteModal = () => setInviteModalOpen(true);
    const handleCloseInviteModal = () => setInviteModalOpen(false);
    
    const handleUnlockSuccess = (code: string) => {
        localStorage.setItem('tumdah-invite-code', code.toUpperCase());
        handleCloseInviteModal();
        onStart();
    };

  return (
    <div className="bg-green-300 text-black font-bebas">
      <Navbar onStart={handleOpenInviteModal} onGoHome={onGoHome} />
      <main>
        <Hero onStart={handleOpenInviteModal} />
        <Partners />
        <Features />
        <HowItWorks />
        <FAQ />
        <FinalCTA onStart={handleOpenInviteModal} />
      </main>
      <Footer onGoHome={onGoHome} />
      <InviteCodeModal
        isOpen={isInviteModalOpen}
        onClose={handleCloseInviteModal}
        onUnlockSuccess={handleUnlockSuccess}
      />
    </div>
  );
}