export interface ProofFileStore {
  store(proofId: string, content: Buffer, filename: string): Promise<{ cid: string }>;
}
