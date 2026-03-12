import { createUser, transitionUserState, NotFoundError, ValidationError, type PlatformUser, type UserLifecycleEvent } from "@valyria/domain";
import type { PlatformRepository } from "./platform-repository";

export class OnboardingService {
  constructor(private readonly repository: PlatformRepository) {}

  async listUsers(): Promise<PlatformUser[]> {
    return this.repository.listUsers();
  }

  async createUser(input: { email: string; name?: string }): Promise<PlatformUser> {
    const user = createUser({
      id: crypto.randomUUID(),
      email: input.email,
      ...(input.name ? { name: input.name } : {})
    });

    const savedUser = await this.repository.upsertUser(user);

    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      actorUserId: savedUser.id,
      action: "user.created",
      entityType: "user",
      entityId: savedUser.id,
      payload: {
        email: savedUser.email
      },
      createdAt: new Date().toISOString()
    });

    return savedUser;
  }

  async transitionUser(input: {
    userId: string;
    event: UserLifecycleEvent;
    walletAddress?: string;
  }): Promise<PlatformUser> {
    const user = await this.repository.getUser(input.userId);

    if (!user) {
      throw new NotFoundError("User");
    }

    if (input.event === "link_wallet" && !input.walletAddress) {
      throw new ValidationError("walletAddress is required when linking a wallet.");
    }

    const nextState = transitionUserState(user.state, input.event);
    const updatedUser: PlatformUser = {
      ...user,
      ...(input.walletAddress ? { walletAddress: input.walletAddress } : {}),
      state: nextState,
      updatedAt: new Date().toISOString()
    };

    const savedUser = await this.repository.upsertUser(updatedUser);

    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      actorUserId: savedUser.id,
      action: `user.transition.${input.event}`,
      entityType: "user",
      entityId: savedUser.id,
      payload: {
        from: user.state,
        to: nextState
      },
      createdAt: new Date().toISOString()
    });

    return savedUser;
  }
}
