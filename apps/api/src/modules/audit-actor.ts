import type { PlatformRepository } from "./platform-repository";

export async function resolveAuditActorUserId(
  repository: PlatformRepository,
  actorUserId?: string
): Promise<string | undefined> {
  if (!actorUserId) {
    return undefined;
  }

  const actor = await repository.getUser(actorUserId);
  return actor ? actor.id : undefined;
}
