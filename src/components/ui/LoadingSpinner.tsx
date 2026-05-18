import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  className = ''
}) => {
  const sizeClass = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-4',
    large: 'h-12 w-12 border-4'
  };
  
  return (
    <div className={`flex justify-center py-4 ${className}`}>
      <div
        className={`animate-spin rounded-full border-t-transparent border-solid border-blue-500 dark:border-blue-400 ${sizeClass[size]}`}
      ></div>
    </div>
  );
};

export default LoadingSpinner; 