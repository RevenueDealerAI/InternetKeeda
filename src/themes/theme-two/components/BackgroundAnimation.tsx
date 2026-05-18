export const BackgroundAnimation = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-purple-50/30 to-white" />

      {/* Animated Gradient Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

      {/* Radial Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.05),transparent_25%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(59,130,246,0.05),transparent_25%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(236,72,153,0.05),transparent_25%)]" />

      {/* Animated Lines */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent animate-pulse" style={{ animationDelay: '0s' }} />
        <div className="absolute top-1/3 right-1/3 w-32 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-32 h-px bg-gradient-to-r from-transparent via-pink-500/30 to-transparent animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-1 h-1 rounded-full bg-purple-500/30 animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 rounded-full bg-blue-500/30 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 rounded-full bg-pink-500/30 animate-float" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  );
}; 