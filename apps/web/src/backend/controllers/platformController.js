export class PlatformController {
  constructor(platformService) {
    this.platformService = platformService;
  }

  list(moduleId, role) {
    return this.platformService.list(moduleId, role);
  }

  searchRecords(role) {
    return this.platformService.searchRecords(role);
  }

  create(moduleId, values, role) {
    return this.platformService.create(moduleId, values, role);
  }

  update(moduleId, id, values, role) {
    return this.platformService.update(moduleId, id, values, role);
  }

  remove(moduleId, id, role) {
    return this.platformService.remove(moduleId, id, role);
  }

  referenceFarms() {
    return this.platformService.referenceFarms();
  }

  farmDetails(farmId, role) {
    return this.platformService.getFarmDetails(farmId, role);
  }

  notifications(role) {
    return this.platformService.notifications(role);
  }

  dashboard(role) {
    return this.platformService.dashboard(role);
  }
}
