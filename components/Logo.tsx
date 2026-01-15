
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  textColor?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', textColor = 'text-gray-900' }) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 'text-xs',
    md: 'text-lg',
    lg: 'text-3xl',
    xl: 'text-5xl'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizes[size]} orange-gradient rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200`}>
        <i className={`fas fa-gem ${iconSizes[size]}`}></i>
      </div>
      {(size === 'md' || size === 'lg' || size === 'sm') && (
        <span className={`${size === 'lg' ? 'text-3xl' : 'text-xl'} font-extrabold tracking-tight ${textColor}`}>
          Diamond<span className="text-orange-600">foods</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
