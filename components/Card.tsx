import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`bg-white p-6 rounded-xl shadow-lg border border-slate-200 transition-all duration-300 hover:border-brand-primary/50 hover:shadow-brand-primary/10 ${className}`}>
      {children}
    </div>
  );
};

export default Card;