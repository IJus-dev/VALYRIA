import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ProofFileStore } from "./proof-file-store";

export class LocalProofFileStore implements ProofFileStore {
  constructor(private readonly basePath: string = "./data/proofs") {}

  async store(proofId: string, content: Buffer, filename: string): Promise<{ cid: string }> {
    const hash = createHash("sha256").update(content).digest("hex");
    const cid = `bafk${hash.slice(0, 52)}`;
    const dir = join(this.basePath, proofId);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), content);
    return { cid };
  }
}
