import React from 'react';
import '../styles/theme-two.css';

interface ThemeTwoButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const ThemeTwoButton: React.FC<ThemeTwoButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
}) => {
  const baseClasses = 'theme-two font-outfit font-medium transition-all duration-200 ease-in-out';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
  };
  
  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
    xl: 'btn-xl',
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

interface ThemeTwoHeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export const ThemeTwoHeading: React.FC<ThemeTwoHeadingProps> = ({
  children,
  level = 1,
  className = '',
}) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <Tag className={`theme-two text-heading font-outfit font-semibold ${className}`}>
      {children}
    </Tag>
  );
};

interface ThemeTwoParagraphProps {
  children: React.ReactNode;
  className?: string;
}

export const ThemeTwoParagraph: React.FC<ThemeTwoParagraphProps> = ({
  children,
  className = '',
}) => {
  return (
    <p className={`theme-two text-paragraph font-outfit leading-relaxed ${className}`}>
      {children}
    </p>
  );
};

interface ThemeTwoCardProps {
  children: React.ReactNode;
  className?: string;
}

export const ThemeTwoCard: React.FC<ThemeTwoCardProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`theme-two card ${className}`}>
      {children}
    </div>
  );
};

// Example usage component
export const ThemeTwoExample: React.FC = () => {
  return (
    <div className="theme-two bg-primary min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Headings */}
        <div className="space-y-4">
          <ThemeTwoHeading level={1}>Theme Two Heading</ThemeTwoHeading>
          <ThemeTwoHeading level={2}>Subheading Example</ThemeTwoHeading>
          <ThemeTwoHeading level={3}>Smaller Heading</ThemeTwoHeading>
        </div>
        
        {/* Paragraphs */}
        <div className="space-y-4">
          <ThemeTwoParagraph>
            This is a paragraph using Theme Two styling with the Inter font family and the specified paragraph color.
          </ThemeTwoParagraph>
          <ThemeTwoParagraph>
            Another paragraph to demonstrate the consistent styling across Theme Two components.
          </ThemeTwoParagraph>
        </div>
        
        {/* Buttons */}
        <div className="flex gap-4 flex-wrap">
          <ThemeTwoButton variant="primary" size="lg">
            Primary Button
          </ThemeTwoButton>
          <ThemeTwoButton variant="secondary" size="lg">
            Secondary Button
          </ThemeTwoButton>
          <ThemeTwoButton variant="primary" size="sm">
            Small Button
          </ThemeTwoButton>
        </div>
        
        {/* Card */}
        <ThemeTwoCard>
          <ThemeTwoHeading level={3} className="mb-4">
            Card Example
          </ThemeTwoHeading>
          <ThemeTwoParagraph>
            This is a card component using Theme Two styling. It demonstrates how the gradient background,
            Inter font family, and color scheme work together.
          </ThemeTwoParagraph>
          <div className="mt-4">
            <ThemeTwoButton variant="primary">
              Action Button
            </ThemeTwoButton>
          </div>
        </ThemeTwoCard>
        
        {/* Gradient Background Example */}
        <div className="theme-two bg-gradient-primary p-8 rounded-lg text-white">
          <ThemeTwoHeading level={2} className="text-white mb-4">
            Gradient Background
          </ThemeTwoHeading>
          <ThemeTwoParagraph className="text-white/90">
            This section uses the primary gradient background (#7D37FF to #FFAEA5) 
            with white text for contrast.
          </ThemeTwoParagraph>
        </div>
      </div>
    </div>
  );
};
