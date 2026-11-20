import { z } from 'zod';
import { ASSIGNABLE_ROLES, AuthService } from '../services/authService.js';

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
  role: z.string().optional(),
  rol: z.string().optional()
});

export function createAuthController(repository) {
  const auth = new AuthService(repository);

  return {
    register: async (req, res) => {
      const body = z.object({
        name: z.string().trim().min(2).max(80),
        email: z.string().trim().email().max(254),
        password: z.string().min(8).max(72),
        role: z.enum(ASSIGNABLE_ROLES)
      }).parse(req.body);
      res.status(201).json({ user: await auth.register(body) });
    },

    login: async (req, res) => {
      const { email, password, role, rol } = credentialsSchema.parse(req.body);
      res.json(await auth.login({ email, password, role: role ?? rol }));
    },

    me: (req, res) => res.json({ user: req.user })
  };
}