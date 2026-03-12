import type { AuditLogEntry, PlatformRepository } from "./platform-repository";

export class AuditService {
  constructor(private readonly repository: PlatformRepository) {}

  async listLogs(limit?: number): Promise<AuditLogEntry[]> {
    return this.repository.listAuditLogs(limit);
  }
}
