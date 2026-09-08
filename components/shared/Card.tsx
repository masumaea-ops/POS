import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-xs p-5 md:p-6 border border-slate-200/80 dark:border-slate-800 transition-colors ${className}`}>
      {children}
    </div>
  );
};

export default Card;