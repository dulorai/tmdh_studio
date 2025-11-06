import React, { useState } from 'react';
import { TumdahLogoIcon } from './icons';
import { inviteCodes } from '../utils/inviteCodes';

interface InviteGateProps {
    onUnlockSuccess: (code: string) => void;
}

const InviteGate: React.FC<InviteGateProps> = ({ onUnlockSuccess }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const upperCaseCode = code.toUpperCase();
        
        if (inviteCodes.has(upperCaseCode)) {
            setError(null);
            onUnlockSuccess(upperCaseCode);
        } else {
            setError('Invalid invite code. Please try again.');
            setCode('');
        }
    };

    return (
        <div className="bg-green-300 text-black font-bebas min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md text-center">
                <TumdahLogoIcon className="h-24 w-24 mx-auto text-black" />
                <h1 className="text-5xl md:text-7xl font-black text-black mt-4">
                    Tumdah AI Studio
                </h1>
                <p className="font-inter mt-4 text-xl text-gray-800">
                    Invite Only Access
                </p>

                <form onSubmit={handleSubmit} className="mt-8">
                    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_#000] p-6">
                        <label htmlFor="invite-code" className="sr-only">Invite Code</label>
                        <input
                            id="invite-code"
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Enter your invite code"
                            className="w-full bg-white border-4 border-black p-4 text-2xl text-center focus:ring-4 focus:ring-green-400 focus:outline-none transition-all duration-200"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="w-full mt-4 bg-green-500 text-white text-3xl font-bold py-3 px-4 border-4 border-black transition-all transform hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] active:translate-y-[2px] active:shadow-none hover:bg-green-600 disabled:bg-gray-400"
                            disabled={!code}
                        >
                            Unlock Studio
                        </button>
                    </div>
                </form>
                
                {error && (
                    <div className="mt-4 bg-red-500 text-white p-3 border-4 border-black font-inter animate-shake">
                        <p>{error}</p>
                    </div>
                )}
            </div>
             <footer className="absolute bottom-8 text-center text-gray-800 font-inter">
                <p>&copy; {new Date().getFullYear()} Tumdah AI Studio. All rights reserved.</p>
            </footer>
             <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default InviteGate;
