
import React, { useState, useEffect } from 'react';
import Logo from './Logo';

interface MobileShellProps {
  children: React.ReactNode;
  roleName: string;
  onLogout: () => void;
}

const MobileShell: React.FC<MobileShellProps> = ({ children, roleName, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 min-h-screen">
        <div className="w-[375px] h-[812px] bg-white rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.15)] border-[10px] border-gray-900 relative overflow-hidden flex flex-col items-center justify-center orange-gradient">
           <div className="notch"></div>
           <div className="animate-splash flex flex-col items-center">
             <Logo size="xl" className="flex-col" textColor="text-white" />
             <div className="mt-10 flex flex-col items-center gap-3">
               <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
               <p className="text-white/60 text-[8px] font-black uppercase tracking-[0.4em]">Initializing Luxury</p>
             </div>
           </div>
        </div>
      </div>
    );
  }

  if (showWelcome) {
    return (
      <div className="flex items-center justify-center p-4 min-h-screen">
        <div className="w-[375px] h-[812px] bg-white rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.15)] border-[10px] border-gray-900 relative overflow-hidden flex flex-col">
           <div className="notch"></div>
           <div className="flex-1 p-10 flex flex-col items-center justify-center text-center space-y-10 animate-fade-in relative">
             <div className="absolute top-20 left-1/2 -translate-x-1/2 opacity-5">
                <Logo size="xl" className="flex-col" />
             </div>
             <div className="relative w-full h-80 rounded-[3rem] overflow-hidden shadow-2xl border border-gray-100">
               <img src={`https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80`} className="w-full h-full object-cover" alt="Welcome" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
               <div className="absolute bottom-6 left-6 text-left">
                  <p className="text-white/70 text-[10px] font-black uppercase tracking-widest">Diamondfoods v3.0</p>
                  <p className="text-white text-xl font-black">Ready for Perfection?</p>
               </div>
             </div>
             <div className="space-y-4">
                <h1 className="text-3xl font-black leading-tight text-gray-900">
                  <span className="text-orange-600">Diamond</span> <br/> 
                  {roleName} Portal
                </h1>
                <p className="text-gray-400 font-medium text-sm leading-relaxed px-4">
                  Experience the elite standard in digital culinary logistics and dining.
                </p>
             </div>
             <button 
                onClick={() => setShowWelcome(false)}
                className="w-full orange-gradient text-white py-6 rounded-2xl font-black text-lg shadow-xl shadow-orange-100 transform active:scale-95 transition"
             >
               Get Started
             </button>
           </div>
           <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4 min-h-screen">
      <div className="w-[375px] h-[812px] bg-white rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.15)] border-[10px] border-gray-900 relative overflow-hidden flex flex-col animate-slide-up">
        <div className="notch"></div>
        {/* Status Bar */}
        <div className="h-10 bg-white flex justify-between items-center px-8 pt-4 pb-2 z-50">
          <span className="text-xs font-black">9:41</span>
          <div className="flex gap-1.5 items-center">
            <i className="fas fa-signal text-[8px]"></i>
            <i className="fas fa-wifi text-[8px]"></i>
            <div className="w-5 h-2.5 border border-gray-300 rounded-[2px] p-[1px] flex items-center">
               <div className="h-full w-4 bg-gray-900 rounded-[1px]"></div>
            </div>
          </div>
        </div>

        {children}

        {/* Home Indicator */}
        <div className="h-6 bg-white flex items-center justify-center pb-2">
          <div className="w-32 h-1 bg-gray-100 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default MobileShell;
