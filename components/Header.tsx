import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-[#182a5c] border-b border-slate-700/50 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img src="/sha.png" alt="Sha-Shib Group Logo" className="w-20 h-20 object-contain" />
          </div>
          {/* Text */}
          <div className="flex-grow text-left">
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-wide">
              SHA-SHIB GROUP
            </h1>
            <p className="text-xs md:text-sm text-slate-200 mt-1">
              Empowering Knowledge Through Vision
            </p>
            <p className="text-xs text-slate-300">
              Run by SHA-SHIB Academy Private Limited
            </p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-500/50 text-center">
          <p className="text-sm text-slate-200 font-semibold tracking-wide capitalize">
            sha - shib college of technology, parwaliya sadak, bhopal, madhya pradesh
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;