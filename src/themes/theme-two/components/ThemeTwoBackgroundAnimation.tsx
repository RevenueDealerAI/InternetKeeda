import React from 'react';
import '../styles/theme-two.css';

export const ThemeTwoBackgroundAnimation: React.FC = () => {
  return (
    <div className="theme-two fixed inset-0 -z-10 overflow-hidden bg-secondary">
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-primary rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-primary rounded-full opacity-15 animate-bounce"></div>
      <div className="absolute bottom-32 left-32 w-28 h-28 bg-gradient-primary rounded-full opacity-25 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-20 h-20 bg-gradient-primary rounded-full opacity-20 animate-bounce"></div>
      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>
    </div>
  );
};
