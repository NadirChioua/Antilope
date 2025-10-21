-- ============================================================================
-- UPDATE CATEGORIES TO FRENCH
-- ============================================================================
-- This script updates all existing categories in the database to French
-- ============================================================================

-- Update product categories to French
UPDATE public.products 
SET category = CASE 
  WHEN category = 'Hair Care' THEN 'Soins des Cheveux'
  WHEN category = 'Skin Care' THEN 'Soins de la Peau'
  WHEN category = 'Nail Care' THEN 'Soins des Ongles'
  WHEN category = 'Styling Products' THEN 'Produits de Coiffage'
  WHEN category = 'Tools & Equipment' THEN 'Outils et Équipements'
  WHEN category = 'Cleaning Supplies' THEN 'Produits de Nettoyage'
  WHEN category = 'Other' THEN 'Autres'
  ELSE category
END
WHERE category IN ('Hair Care', 'Skin Care', 'Nail Care', 'Styling Products', 'Tools & Equipment', 'Cleaning Supplies', 'Other');

-- Update service categories to French
UPDATE public.services 
SET category = CASE 
  WHEN category = 'haircut' THEN 'Coupe'
  WHEN category = 'coloring' THEN 'Coloration'
  WHEN category = 'styling' THEN 'Coiffage'
  WHEN category = 'treatment' THEN 'Traitement'
  WHEN category = 'manicure' THEN 'Manucure'
  WHEN category = 'pedicure' THEN 'Pédicure'
  WHEN category = 'facial' THEN 'Soin du Visage'
  WHEN category = 'massage' THEN 'Massage'
  WHEN category = 'waxing' THEN 'Épilation'
  WHEN category = 'eyebrows' THEN 'Sourcils'
  WHEN category = 'eyelashes' THEN 'Cils'
  WHEN category = 'other' THEN 'Autres'
  ELSE category
END
WHERE category IN ('haircut', 'coloring', 'styling', 'treatment', 'manicure', 'pedicure', 'facial', 'massage', 'waxing', 'eyebrows', 'eyelashes', 'other');

-- Show updated categories
SELECT 'Product categories updated to French:' as info;
SELECT DISTINCT category as "Product Categories" FROM public.products ORDER BY category;

SELECT 'Service categories updated to French:' as info;
SELECT DISTINCT category as "Service Categories" FROM public.services ORDER BY category;

-- Verification
SELECT 
  'Categories successfully updated to French' as status,
  'All product and service categories are now in French' as message;
