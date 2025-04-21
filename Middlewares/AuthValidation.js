const Joi = require('joi');

const signupValidation = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(15).required()
  });
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400)
      .json({ message: "Bad request", error })
  }
  next();
}
const loginValidation = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(4).max(100).required()
  });
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400)
      .json({ message: "Bad request", error })
  }
  next();
}

const restaurantValidation = (req, res, next) => {
  // When using FormData, ensure we handle the request properly
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    // Basic validation for required fields
    const { name, email, password, address, phone } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400)
        .json({ message: "Required fields missing" });
    }
    
    // Additional validation can be done here
    if (name.length < 3 || password.length < 8) {
      return res.status(400)
        .json({ message: "Invalid field length" });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400)
        .json({ message: "Invalid email format" });
    }
    
    next();
    return;
  }
  
  // For regular JSON requests, use Joi validation
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(15).required(),
    address: Joi.string().min(5).max(200),
    phone: Joi.string().min(10).max(15)
  });
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400)
      .json({ message: "Bad request", error })
  }
  next();
}

module.exports = {
  signupValidation,
  loginValidation,
  restaurantValidation
}