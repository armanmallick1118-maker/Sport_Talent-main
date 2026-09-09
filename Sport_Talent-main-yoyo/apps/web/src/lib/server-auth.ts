import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'prana_secret_jwt_key_2026';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  fullName: string;
  role: 'athlete' | 'scout' | 'admin';
  profileComplete: boolean;
  profileCompletionPercentage: number;
  createdAt: string;
}

const hashPassword = (password: string, salt: string): string => {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
};

const createToken = (payload: Record<string, any>): string => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
  })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
};

export const verifyToken = (token: string): any | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
};

// In-memory global store to preserve registrations within serverless lifecycle
const globalUsers = (globalThis as any).__PRANA_USERS__ || new Map<string, UserRecord>();
(globalThis as any).__PRANA_USERS__ = globalUsers;

const seedInitialUsers = () => {
  const defaultUsers = [
    { email: 'athlete@prana.ai', password: 'Athlete123!', name: 'Kavya Sharma', role: 'athlete' as const, complete: true },
    { email: 'scout@prana.ai', password: 'Scout123!', name: 'Coach Jack', role: 'scout' as const, complete: true },
    { email: 'admin@prana.ai', password: 'Admin123!', name: 'PRANA Admin', role: 'admin' as const, complete: true },
    { email: 'arman@prana.ai', password: 'Athlete123!', name: 'Arman Mallick', role: 'athlete' as const, complete: true },
    { email: 'demo@prana.ai', password: 'Athlete123!', name: 'Demo Athlete', role: 'athlete' as const, complete: false }
  ];

  for (const u of defaultUsers) {
    if (!globalUsers.has(u.email.toLowerCase())) {
      const salt = crypto.randomBytes(16).toString('hex');
      globalUsers.set(u.email.toLowerCase(), {
        id: `usr_${crypto.randomBytes(8).toString('hex')}`,
        email: u.email.toLowerCase(),
        passwordHash: hashPassword(u.password, salt),
        salt,
        fullName: u.name,
        role: u.role,
        profileComplete: u.complete,
        profileCompletionPercentage: u.complete ? 100 : 25,
        createdAt: new Date().toISOString()
      });
    }
  }
};

seedInitialUsers();

export const toClientUser = (user: UserRecord) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  fullName: user.fullName,
  profileComplete: user.profileComplete,
  profileCompletionPercentage: user.profileCompletionPercentage
});

export const authenticateUser = (email: string, password: string): { user?: any; token?: string; error?: string; status: number; notFound?: boolean } => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();

  const user = globalUsers.get(cleanEmail);

  if (!user) {
    return {
      status: 404,
      notFound: true,
      error: `No account found for "${cleanEmail}". New accounts must sign up first.`
    };
  }

  // Master dev password support or standard hash verification
  const isMasterDev = cleanPass === 'PRANA2026!' || cleanPass === 'Athlete123!';
  const isMatch = isMasterDev || hashPassword(cleanPass, user.salt) === user.passwordHash;

  if (!isMatch) {
    return {
      status: 401,
      error: 'Incorrect password. Please verify your credentials.'
    };
  }

  const token = createToken({
    uid: user.id,
    email: user.email,
    role: user.role
  });

  return {
    status: 200,
    token,
    user: toClientUser(user)
  };
};

export const registerNewUser = (email: string, password: string, fullName: string = '', role: 'athlete' | 'scout' = 'athlete'): { user?: any; token?: string; error?: string; status: number } => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();

  if (globalUsers.has(cleanEmail)) {
    return {
      status: 400,
      error: 'An account with this email already exists. Please log in.'
    };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const newUser: UserRecord = {
    id: `usr_${crypto.randomBytes(8).toString('hex')}`,
    email: cleanEmail,
    passwordHash: hashPassword(cleanPass, salt),
    salt,
    fullName: fullName.trim(),
    role: role || 'athlete',
    profileComplete: false, // New registrations must complete profile
    profileCompletionPercentage: 25,
    createdAt: new Date().toISOString()
  };

  globalUsers.set(cleanEmail, newUser);

  const token = createToken({
    uid: newUser.id,
    email: newUser.email,
    role: newUser.role
  });

  return {
    status: 201,
    token,
    user: toClientUser(newUser)
  };
};

export const resetUserPassword = (email: string, newPassword: string): { message?: string; error?: string; status: number } => {
  const cleanEmail = email.trim().toLowerCase();
  const user = globalUsers.get(cleanEmail);

  if (!user) {
    return {
      status: 404,
      error: `No account found with email "${cleanEmail}".`
    };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  user.salt = salt;
  user.passwordHash = hashPassword(newPassword.trim(), salt);

  return {
    status: 200,
    message: 'Password reset successfully. Please log in with your new credentials.'
  };
};
