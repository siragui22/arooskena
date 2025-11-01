'use client';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'pink', 
  className = '',
  fullScreen = false,
  text = null 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-3',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4'
  };

  const colorClasses = {
    pink: 'border-pink-300 border-t-pink-600',
    gray: 'border-gray-300 border-t-gray-600',
    white: 'border-white/30 border-t-white'
  };

  const spinnerClasses = `
    ${sizeClasses[size]} 
    ${colorClasses[color]} 
    rounded-full 
    animate-spin 
    ${className}
  `;

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
          <div className={spinnerClasses}></div>
          {text && (
            <p className="mt-4 text-gray-600 font-medium">{text}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <div className={spinnerClasses}></div>
      {text && (
        <span className="ml-2 text-gray-600">{text}</span>
      )}
    </div>
  );
};

export default LoadingSpinner;
