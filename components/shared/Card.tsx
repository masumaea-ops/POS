import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-main p-6 border border-transparent ${className}`}>
      {children}
    </div>
  );
};

export default Card;