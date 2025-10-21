// ============================================================================
// ICON MAPPING UTILITY
// ============================================================================
// Provides icon mapping for services with Lucide React icons
// ============================================================================

import {
  Scissors,
  Heart,
  Sparkles,
  Hand,
  Eye,
  Star,
  Crown,
  Gem,
  Flower,
  Sun,
  Moon,
  Palette,
  Brush,
  Wand2,
  Shield,
  Award,
  Gift,
  Diamond,
  Zap,
  Sparkle,
  type LucideIcon
} from 'lucide-react';

export interface IconOption {
  name: string;
  icon: LucideIcon;
  category: string;
  description: string;
}

export const iconOptions: IconOption[] = [
  // Coiffure
  { name: 'scissors', icon: Scissors, category: 'Coiffure', description: 'Coupe et stylisme des cheveux' },
  { name: 'brush', icon: Brush, category: 'Coiffure', description: 'Brossage et coiffage des cheveux' },
  { name: 'sparkle', icon: Sparkle, category: 'Coiffure', description: 'Mèches et coloration' },
  { name: 'wand2', icon: Wand2, category: 'Coiffure', description: 'Transformations capillaires' },
  
  // Beauté & Soins du visage
  { name: 'heart', icon: Heart, category: 'Beauté', description: 'Soins du visage et de la peau' },
  { name: 'sparkles', icon: Sparkles, category: 'Beauté', description: 'Maquillage et mise en beauté' },
  { name: 'eye', icon: Eye, category: 'Beauté', description: 'Sourcils, cils et regard' },
  { name: 'palette', icon: Palette, category: 'Beauté', description: 'Couleurs et maquillage' },
  { name: 'sun', icon: Sun, category: 'Beauté', description: 'Protection solaire et soins' },
  { name: 'moon', icon: Moon, category: 'Beauté', description: 'Soins de nuit' },
  
  // Ongles
  { name: 'hand', icon: Hand, category: 'Ongles', description: 'Soins des mains et des ongles' },
  { name: 'gem', icon: Gem, category: 'Ongles', description: 'Nail art et décorations' },
  { name: 'diamond', icon: Diamond, category: 'Ongles', description: 'Services premium des ongles' },
  
  // Massage & Bien-être
  { name: 'flower', icon: Flower, category: 'Bien-être', description: 'Soins naturels et relaxants' },
  { name: 'shield', icon: Shield, category: 'Bien-être', description: 'Soins protecteurs et réparateurs' },
  { name: 'star', icon: Star, category: 'Bien-être', description: 'Services bien-être à la une' },
  
  // Luxe
  { name: 'crown', icon: Crown, category: 'Luxe', description: 'Services haut de gamme' },
  { name: 'award', icon: Award, category: 'Luxe', description: 'Prestations primées' },
  { name: 'gift', icon: Gift, category: 'Luxe', description: 'Offres cadeaux et spéciales' },
  
  // Express
  { name: 'zap', icon: Zap, category: 'Express', description: 'Prestations express' }
];

export const getIconByName = (name: string): LucideIcon | null => {
  const option = iconOptions.find(opt => opt.name === name);
  return option ? option.icon : null;
};

export const getIconOptionsByCategory = (category: string): IconOption[] => {
  return iconOptions.filter(opt => opt.category === category);
};

export const getDefaultIconForService = (serviceName: string): string => {
  const name = serviceName.toLowerCase();
  
  // Hair services
  if (name.includes('hair') || name.includes('cheveux') || name.includes('cut') || name.includes('style') || name.includes('coiffure')) {
    return 'scissors';
  }
  if (name.includes('color') || name.includes('dye') || name.includes('highlight') || name.includes('coloration')) {
    return 'sparkle';
  }
  if (name.includes('brush') || name.includes('brossage') || name.includes('styling')) {
    return 'brush';
  }
  
  // Beauty and skincare
  if (name.includes('face') || name.includes('visage') || name.includes('facial') || name.includes('skin') || name.includes('peau')) {
    return 'heart';
  }
  if (name.includes('makeup') || name.includes('maquillage') || name.includes('beauty') || name.includes('beaute')) {
    return 'sparkles';
  }
  if (name.includes('eyebrow') || name.includes('sourcil') || name.includes('eye') || name.includes('lash') || name.includes('cil')) {
    return 'eye';
  }
  if (name.includes('sun') || name.includes('soleil') || name.includes('protection')) {
    return 'sun';
  }
  if (name.includes('night') || name.includes('nuit') || name.includes('soir')) {
    return 'moon';
  }
  
  // Nail services
  if (name.includes('nail') || name.includes('ongle') || name.includes('manicure') || name.includes('pedicure')) {
    return 'hand';
  }
  if (name.includes('art') || name.includes('decoration') || name.includes('design')) {
    return 'gem';
  }
  if (name.includes('premium') || name.includes('luxury') || name.includes('vip')) {
    return 'diamond';
  }
  
  // Wellness and massage
  if (name.includes('massage') || name.includes('relax') || name.includes('spa') || name.includes('wellness')) {
    return 'flower';
  }
  if (name.includes('healing') || name.includes('protection') || name.includes('care')) {
    return 'shield';
  }
  if (name.includes('featured') || name.includes('special') || name.includes('star')) {
    return 'star';
  }
  
  // Luxury services
  if (name.includes('luxury') || name.includes('premium') || name.includes('vip') || name.includes('exclusive')) {
    return 'crown';
  }
  if (name.includes('award') || name.includes('best') || name.includes('top')) {
    return 'award';
  }
  if (name.includes('gift') || name.includes('cadeau') || name.includes('special')) {
    return 'gift';
  }
  
  // Quick services
  if (name.includes('quick') || name.includes('express') || name.includes('fast') || name.includes('rapide')) {
    return 'zap';
  }
  
  return 'scissors'; // Default fallback for hair services
};

export const categories = [
  'Coiffure',
  'Beauté',
  'Ongles',
  'Bien-être',
  'Luxe',
  'Express'
];
