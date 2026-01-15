
import React from 'react';
import { UserRole } from '../types';
import Logo from '../components/Logo';

interface LandingPageProps {
  onSelectRole: (role: UserRole) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectRole }) => {
  return (
    <div className="bg-[#fafafa] min-h-screen selection:bg-orange-100 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-6">
        <div className="max-w-7xl mx-auto glass rounded-[2rem] px-8 py-4 flex justify-between items-center shadow-2xl shadow-gray-200/50">
          <Logo size="md" />
          <div className="hidden lg:flex gap-10 font-black text-gray-400 uppercase tracking-widest text-[10px]">
            <a href="#" className="hover:text-orange-600 transition-colors">Restaurants</a>
            <a href="#" className="hover:text-orange-600 transition-colors">Couriers</a>
            <a href="#" className="hover:text-orange-600 transition-colors">Luxury AI</a>
          </div>
          <button 
            onClick={() => onSelectRole(UserRole.CUSTOMER)}
            className="orange-gradient text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl shadow-orange-100 hover:scale-105 transition active:scale-95"
          >
            Enter Portal
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-20 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-orange-100">
            <i className="fas fa-sparkles text-[8px]"></i> Powered by Gemini 3.0
          </div>
          <h1 className="text-7xl lg:text-8xl font-[900] leading-[0.85] text-gray-900 tracking-tighter">
            Elegance <br />
            <span className="text-orange-600">Delivered.</span>
          </h1>
          <p className="text-xl text-gray-500 font-medium max-w-md leading-relaxed">
            The world's first food delivery ecosystem that thinks like a connoisseur. Experience culinary perfection.
          </p>
          <div className="flex flex-col sm:flex-row gap-5">
            <button 
               onClick={() => onSelectRole(UserRole.CUSTOMER)}
               className="bg-gray-900 text-white px-10 py-6 rounded-[2rem] font-black hover:bg-black transition flex items-center justify-center gap-4 shadow-2xl shadow-gray-300"
            >
              Order Now <i className="fas fa-arrow-right text-xs"></i>
            </button>
            <button 
               onClick={() => onSelectRole(UserRole.RESTAURANT)}
               className="bg-white text-gray-900 border-2 border-gray-100 px-10 py-6 rounded-[2rem] font-black hover:bg-gray-50 transition"
            >
              Partner with Us
            </button>
          </div>
        </div>
        <div className="relative animate-float">
          <div className="absolute -inset-10 orange-gradient opacity-10 blur-[100px] rounded-full"></div>
          <div className="relative z-10 glass p-4 rounded-[4rem] shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80" 
              alt="Luxury Food" 
              className="rounded-[3.5rem] shadow-xl w-full h-[500px] object-cover"
            />
          </div>
          <div className="absolute -right-8 top-20 glass p-6 rounded-[2rem] shadow-2xl z-20 space-y-2 border border-white/50">
             <div className="flex -space-x-3">
               {[1,2,3,4].map(i => <img key={i} src={`https://picsum.photos/seed/${i}/50/50`} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />)}
             </div>
             <p className="text-[10px] font-black text-gray-800 uppercase tracking-widest">12k+ Foodies Active</p>
          </div>
        </div>
      </section>

      {/* Role Selection Grid */}
      <section className="py-32 px-6 max-w-7xl mx-auto space-y-20">
        <div className="text-center space-y-6">
          <h2 className="text-4xl lg:text-5xl font-[900] tracking-tight">One ecosystem, <span className="text-orange-600">infinite flavor.</span></h2>
          <p className="text-gray-400 font-medium max-w-xl mx-auto">Choose your diamond path and start your digital culinary journey today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { role: UserRole.CUSTOMER, title: 'Epicurean', icon: 'bag-shopping', desc: 'Browse curated menus with AI guidance.' },
            { role: UserRole.RESTAURANT, title: 'Chef Partner', icon: 'utensils', desc: 'Manage luxury dining at digital scale.' },
            { role: UserRole.DRIVER, title: 'Diamond Courier', icon: 'motorcycle', desc: 'Elite logistics for elite culinary gems.' },
            { role: UserRole.ADMIN, title: 'Architect', icon: 'chess-king', desc: 'Total platform oversight and analytics.' }
          ].map((item, idx) => (
            <div 
              key={idx}
              onClick={() => onSelectRole(item.role)}
              className="glass p-10 rounded-[3rem] hover:shadow-2xl hover:scale-[1.02] transition-all group cursor-pointer border border-white/40"
            >
              <div className="w-16 h-16 orange-gradient rounded-3xl flex items-center justify-center text-white mb-10 shadow-xl group-hover:rotate-12 transition">
                <i className={`fas fa-${item.icon} text-2xl`}></i>
              </div>
              <h3 className="text-2xl font-black mb-4">{item.title}</h3>
              <p className="text-gray-400 font-medium text-sm leading-relaxed mb-10">{item.desc}</p>
              <div className="text-orange-600 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                Launch Portal <i className="fas fa-chevron-right text-[8px]"></i>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-gray-100 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-10">
          <Logo size="md" />
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em]">
            Diamondfoods Ecosystem © 2024 • A New Paradigm of Delivery
          </p>
          <div className="flex gap-6">
            {['twitter', 'instagram', 'linkedin'].map(s => <i key={s} className={`fab fa-${s} text-gray-300 hover:text-orange-600 cursor-pointer transition`}></i>)}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
