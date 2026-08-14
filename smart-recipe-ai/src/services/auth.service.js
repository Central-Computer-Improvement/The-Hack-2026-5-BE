const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "smart_recipe_ai_secret_key_2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// In-memory mock storage for users (Active when Supabase is not connected)
const mockUsersDb = new Map();

/**
 * Generate JWT token for authenticated user
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Register a new user
 */
const registerUser = async ({ name, email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists
  if (mockUsersDb.has(normalizedEmail)) {
    const error = new Error("User with this email already exists");
    error.statusCode = 400;
    throw error;
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const newUser = {
    id: userId,
    name,
    email: normalizedEmail,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };

  // Store user
  mockUsersDb.set(normalizedEmail, newUser);

  // Return user without password + token
  const { password: _, ...userWithoutPassword } = newUser;
  const token = generateToken(userId);

  return {
    user: userWithoutPassword,
    token,
  };
};

/**
 * Login user
 */
const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = mockUsersDb.get(normalizedEmail);
  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const { password: _, ...userWithoutPassword } = user;
  const token = generateToken(user.id);

  return {
    user: userWithoutPassword,
    token,
  };
};

/**
 * Get user profile by ID
 */
const getUserById = async (userId) => {
  for (const user of mockUsersDb.values()) {
    if (user.id === userId) {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
  }
  const error = new Error("User not found");
  error.statusCode = 404;
  throw error;
};

/* 
 ===================================================================
  SUPABASE INTEGRATION PLACEHOLDER FOR TEAMMATE:
  When your teammate sets up Supabase, uncomment the code below 
  and replace the mock implementations.
 ===================================================================

 const { createClient } = require('@supabase/supabase-js');
 const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

 exports.registerUserWithSupabase = async ({ name, email, password }) => {
   const { data, error } = await supabase.auth.signUp({
     email,
     password,
     options: { data: { name } }
   });
   if (error) throw error;
   return { user: data.user, session: data.session };
 };

 exports.loginUserWithSupabase = async ({ email, password }) => {
   const { data, error } = await supabase.auth.signInWithPassword({
     email,
     password
   });
   if (error) throw error;
   return { user: data.user, session: data.session };
 };
 ===================================================================
*/

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  generateToken,
};
