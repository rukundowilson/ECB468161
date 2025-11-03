// Utility functions for category-related operations
// 
// IMPORTANT: This file has been updated to prioritize database settings over hardcoded values.
// 
// PRIMARY SOURCE OF TRUTH: Database fields
// - requires_size: TINYINT(1) - Whether products need size variants
// - size_type: ENUM('numeric', 'letter') - Type of sizes used
// - size_options: JSON - Available size options array
//
// FALLBACK: Hardcoded arrays below are only used when:
// 1. Database settings are not available
// 2. Backward compatibility is needed
// 3. Category object is not passed to functions
//
// RECOMMENDATION: Always pass the full category object to these functions
// for the most accurate and up-to-date behavior.

/**
 * Fallback categories that require size attributes for their variants
 * Used only when database settings are not available
 */
const FALLBACK_SIZE_REQUIRED_CATEGORIES = [
  'clothing',
  'shoes',
  'apparel',
  'footwear',
  'garments',
  'attire'
];

/**
 * Fallback categories that use numeric sizes (shoes, etc.)
 * Used only when database settings are not available
 */
const FALLBACK_NUMERIC_SIZE_CATEGORIES = [
  'shoes',
  'footwear',
  'sneakers',
  'boots',
  'sandals',
  'heels'
];

/**
 * Fallback categories that use letter sizes (clothing, etc.)
 * Used only when database settings are not available
 */
const FALLBACK_LETTER_SIZE_CATEGORIES = [
  'clothing',
  'apparel',
  'garments',
  'attire',
  'shirts',
  'pants',
  'dresses',
  'tops',
  'bottoms'
];

/**
 * Check if a category requires size attributes for variants
 * @param {string} categoryName - The name of the category
 * @param {Object} category - The category object with database settings
 * @returns {boolean} - True if size is required, false otherwise
 */
export function requiresSize(categoryName, category = null) {
  // Primary: Use database settings if available
  if (category && category.requires_size !== undefined) {
    return category.requires_size === 1;
  }
  
  // Fallback: Use name-based detection for backward compatibility
  if (!categoryName) return false;
  
  const normalizedName = categoryName.toLowerCase().trim();
  return FALLBACK_SIZE_REQUIRED_CATEGORIES.some(requiredCategory => 
    normalizedName.includes(requiredCategory) || 
    requiredCategory.includes(normalizedName)
  );
}

/**
 * Get a list of fallback categories that require size
 * @returns {string[]} - Array of fallback category names that require size
 * @deprecated Use database settings instead. This is only for backward compatibility.
 */
export function getSizeRequiredCategories() {
  return [...FALLBACK_SIZE_REQUIRED_CATEGORIES];
}

/**
 * Check if a product requires size based on its category
 * @param {Object} product - The product object
 * @param {string} product.category_name - The category name
 * @returns {boolean} - True if size is required, false otherwise
 */
export function productRequiresSize(product) {
  return requiresSize(product?.category_name);
}

/**
 * Check if a category uses numeric sizes (shoes, etc.)
 * @param {string} categoryName - The name of the category
 * @param {Object} category - The category object with database settings
 * @returns {boolean} - True if numeric sizes are used, false otherwise
 */
export function usesNumericSizes(categoryName, category = null) {
  // Primary: Use database settings if available
  if (category && category.size_type) {
    return category.size_type === 'numeric';
  }
  
  // Fallback: Use name-based detection for backward compatibility
  if (!categoryName) return false;
  
  const normalizedName = categoryName.toLowerCase().trim();
  return FALLBACK_NUMERIC_SIZE_CATEGORIES.some(fallbackCategory => 
    normalizedName.includes(fallbackCategory) || 
    fallbackCategory.includes(normalizedName)
  );
}

/**
 * Check if a category uses letter sizes (clothing, etc.)
 * @param {string} categoryName - The name of the category
 * @param {Object} category - The category object with database settings
 * @returns {boolean} - True if letter sizes are used, false otherwise
 */
export function usesLetterSizes(categoryName, category = null) {
  // Primary: Use database settings if available
  if (category && category.size_type) {
    return category.size_type === 'letter';
  }
  
  // Fallback: Use name-based detection for backward compatibility
  if (!categoryName) return false;
  
  const normalizedName = categoryName.toLowerCase().trim();
  return FALLBACK_LETTER_SIZE_CATEGORIES.some(fallbackCategory => 
    normalizedName.includes(fallbackCategory) || 
    fallbackCategory.includes(normalizedName)
  );
}

/**
 * Get size type for a category
 * @param {string} categoryName - The name of the category
 * @param {Object} category - The category object with database settings
 * @returns {string} - 'numeric', 'letter', or 'none'
 */
export function getSizeType(categoryName, category = null) {
  // Primary: Use database settings if available
  if (category && category.size_type) {
    return category.size_type;
  }
  
  // Fallback: Use name-based detection for backward compatibility
  if (usesNumericSizes(categoryName)) return 'numeric';
  if (usesLetterSizes(categoryName)) return 'letter';
  return 'none';
}

/**
 * Get suggested size options for a category
 * @param {string} categoryName - The name of the category
 * @param {Object} category - The category object with database settings
 * @returns {string[]} - Array of suggested size options
 */
export function getSizeOptions(categoryName, category = null) {
  // Primary: Use database settings if available
  if (category && category.size_options) {
    if (Array.isArray(category.size_options)) {
      // Already an array
      return category.size_options;
    } else if (typeof category.size_options === 'string') {
      try {
        // Try to parse as JSON first
        return JSON.parse(category.size_options);
      } catch (error) {
        // If JSON parsing fails, try to split by comma (fallback for old format)
        try {
          const sizeOptions = category.size_options.split(',').map(option => option.trim()).filter(option => option.length > 0);
          if (sizeOptions.length > 0) {
            return sizeOptions;
          }
        } catch (splitError) {
          console.error('Error parsing size options:', splitError);
        }
      }
    }
  }
  
  // Fallback: Use hardcoded defaults for backward compatibility
  if (usesNumericSizes(categoryName)) {
    return ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13'];
  }
  if (usesLetterSizes(categoryName)) {
    return ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  }
  return [];
}

/**
 * Validate size format for a category
 * @param {string} size - The size value
 * @param {string} categoryName - The name of the category
 * @param {Object} category - The category object with database settings
 * @returns {boolean} - True if size format is valid, false otherwise
 */
export function validateSizeFormat(size, categoryName, category = null) {
  if (!size || !size.trim()) return false;
  
  const sizeValue = size.trim().toUpperCase();
  
  if (usesNumericSizes(categoryName, category)) {
    // Numeric sizes: 6, 6.5, 7, etc.
    return /^\d+(\.\d+)?$/.test(sizeValue);
  }
  
  if (usesLetterSizes(categoryName, category)) {
    // Letter sizes: XS, S, M, L, XL, etc.
    return /^[X]*[SL]$/.test(sizeValue);
  }
  
  return true; // For categories that don't require specific format
}

/**
 * Convert comma-separated size options string to JSON array
 * @param {string} sizeOptionsString - Comma-separated string like "XS,S,M,L,XL"
 * @returns {string} - JSON array string like '["XS","S","M","L","XL"]'
 */
export function convertSizeOptionsToJson(sizeOptionsString) {
  if (!sizeOptionsString || typeof sizeOptionsString !== 'string') return null;
  
  try {
    // Try to parse as JSON first (already in correct format)
    JSON.parse(sizeOptionsString);
    return sizeOptionsString; // Already valid JSON
  } catch (error) {
    // Convert comma-separated string to JSON array
    const options = sizeOptionsString.split(',').map(option => option.trim()).filter(option => option.length > 0);
    return JSON.stringify(options);
  }
}

/**
 * SUMMARY: What hardcoded values are still needed?
 * 
 * 1. FALLBACK_SIZE_REQUIRED_CATEGORIES - Only for backward compatibility
 *    - Used when category object is not available
 *    - Can be removed once all code passes full category objects
 * 
 * 2. FALLBACK_NUMERIC_SIZE_CATEGORIES - Only for backward compatibility
 *    - Used when category.size_type is not available
 *    - Can be removed once all categories have size_type set
 * 
 * 3. FALLBACK_LETTER_SIZE_CATEGORIES - Only for backward compatibility
 *    - Used when category.size_type is not available
 *    - Can be removed once all categories have size_type set
 * 
 * 4. Hardcoded size arrays in getSizeOptions() - Only for fallback
 *    - Used when category.size_options is not available
 *    - Can be removed once all categories have size_options set
 * 
 * MIGRATION PATH:
 * 1. Update all calling code to pass full category objects
 * 2. Ensure all categories in database have proper settings
 * 3. Remove fallback arrays and hardcoded values
 * 4. Simplify functions to only use database settings
 */
