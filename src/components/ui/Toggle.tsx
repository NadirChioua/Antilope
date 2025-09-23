import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: 'purple' | 'green' | 'blue' | 'red' | 'orange' | 'yellow';
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({ 
  checked, 
  onChange, 
  color = 'blue',
  disabled = false 
}) => {
  const colorClasses = {
    purple: 'peer-focus:ring-purple-300 peer-checked:bg-purple-600',
    green: 'peer-focus:ring-green-300 peer-checked:bg-green-600',
    blue: 'peer-focus:ring-blue-300 peer-checked:bg-blue-600',
    red: 'peer-focus:ring-red-300 peer-checked:bg-red-600',
    orange: 'peer-focus:ring-orange-300 peer-checked:bg-orange-600',
    yellow: 'peer-focus:ring-yellow-300 peer-checked:bg-yellow-600'
  };

  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
        disabled={disabled}
      />
      <div className={`
        w-11 h-6 bg-gray-200 rounded-full peer 
        peer-focus:outline-none peer-focus:ring-4 
        peer-checked:after:translate-x-full peer-checked:after:border-white 
        after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
        after:bg-white after:border-gray-300 after:border after:rounded-full 
        after:h-5 after:w-5 after:transition-all
        ${colorClasses[color]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `.replace(/\s+/g, ' ').trim()}></div>
    </label>
  );
};