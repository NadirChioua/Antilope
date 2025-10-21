import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { iconOptions, categories, type IconOption } from '@/utils/iconMapping';
import { useLanguage } from '@/contexts/LanguageContext';

interface IconSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconName: string) => void;
  currentIcon?: string;
  title?: string;
}

const IconSelector: React.FC<IconSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentIcon,
  title = 'Select Icon'
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const filteredIcons = iconOptions.filter(icon => {
    const matchesSearch = icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         icon.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || icon.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleIconSelect = (iconName: string) => {
    onSelect(iconName);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">{t('modals.iconSelector.title')}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('modals.iconSelector.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="All">{t('modals.iconSelector.allCategories')}</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Icons Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-4">
            {filteredIcons.map((iconOption) => {
              const IconComponent = iconOption.icon;
              const isSelected = iconOption.name === currentIcon;
              
              return (
                <button
                  key={iconOption.name}
                  onClick={() => handleIconSelect(iconOption.name)}
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200
                    hover:scale-105 hover:shadow-md group
                    ${isSelected 
                      ? 'border-primary-500 bg-primary-50 text-primary-600' 
                      : 'border-gray-200 hover:border-primary-300 text-gray-600 hover:text-primary-600'
                    }
                  `}
                  title={`${iconOption.name} - ${iconOption.description}`}
                >
                  <IconComponent className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium text-center leading-tight">
                    {iconOption.name}
                  </span>
                </button>
              );
            })}
          </div>

          {filteredIcons.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">{t('modals.iconSelector.noIconsFound')}</p>
              <p className="text-gray-400 text-sm mt-2">{t('modals.iconSelector.tryAdjusting')}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {filteredIcons.length} {t('modals.iconSelector.iconsFound')}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('modals.iconSelector.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IconSelector;
