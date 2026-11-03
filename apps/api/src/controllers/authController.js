import { z } from 'zod';
import { AuthService } from '../services/authService.js';

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72)
});

export function createAuthController(repository) {
  const auth = new AuthService(repository);
  return {
    register: async (req, res) => {
      const body = z.object({
        name: z.string().trim().min(2).max(80),
        email: z.string().trim().email().max(254),
        password: z.string().min(8).max(72)
      }).parse(req.body);
      res.status(201).json(await auth.register(body));
    },
    login: async (req, res) => {
      res.json(await auth.login(credentialsSchema.parse(req.body)));
    },
    me: (req, res) => res.json({ user: req.user })
  };
}
