// Validation middleware for common fields

export const validateRequired = (fields) => {
  return (req, res, next) => {
    const missingFields = [];
    
    for (const field of fields) {
      if (!req.body[field] || req.body[field] === '') {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    next();
  };
};

export const validateNumeric = (fields) => {
  return (req, res, next) => {
    const invalidFields = [];
    
    for (const field of fields) {
      if (req.body[field] !== undefined && isNaN(parseFloat(req.body[field]))) {
        invalidFields.push(field);
      }
    }
    
    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid numeric values for fields: ${invalidFields.join(', ')}`
      });
    }
    
    next();
  };
};

export const validatePositive = (fields) => {
  return (req, res, next) => {
    const invalidFields = [];
    
    for (const field of fields) {
      if (req.body[field] !== undefined && parseFloat(req.body[field]) < 0) {
        invalidFields.push(field);
      }
    }
    
    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Fields must be positive: ${invalidFields.join(', ')}`
      });
    }
    
    next();
  };
};

export const validateEmail = (req, res, next) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (req.body.email && !emailRegex.test(req.body.email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }
  
  next();
};

export const validateSku = (req, res, next) => {
  const skuRegex = /^[A-Z0-9-_]+$/i;
  
  if (req.body.sku && !skuRegex.test(req.body.sku)) {
    return res.status(400).json({
      success: false,
      message: 'SKU must contain only letters, numbers, hyphens, and underscores'
    });
  }
  
  next();
};




