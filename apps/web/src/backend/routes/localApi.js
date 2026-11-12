import { AuthController } from '../controllers/authController';
import { PlatformController } from '../controllers/platformController';
import { LocalStorageRepository } from '../repositories/localStorageRepository';
import { LocalAuthService } from '../services/authService';
import { PlatformService } from '../services/platformService';

const repository = new LocalStorageRepository();
const authController = new AuthController(new LocalAuthService());
const platformController = new PlatformController(new PlatformService(repository));

export const localApi = {
  auth: authController,
  platform: platformController
};
