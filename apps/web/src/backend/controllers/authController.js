export class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  login(credentials) {
    return this.authService.login(credentials);
  }

  currentSession() {
    return this.authService.getSession();
  }

  logout() {
    this.authService.logout();
  }

  createUser(values, actorRole) {
    return this.authService.createUser(values, actorRole);
  }

  registerAccount(values) {
    return this.authService.registerAccount(values);
  }
}
