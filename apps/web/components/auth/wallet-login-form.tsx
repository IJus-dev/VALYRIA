"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { deriveKeypair, deriveAddress, sign } from "ripple-keypairs";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function utf8ToHex(input: string): string {
  return Array.from(new TextEncoder().encode(input))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export function WalletLoginForm() {
  const router = useRouter();
  const [walletSeed, setWalletSeed] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"connect" | "signing">("connect");
  const [challengeData, setChallengeData] = useState<{
    challengeId: string;
    message: string;
    userId: string;
    walletAddress: string;
    publicKey: string;
    privateKey: string;
  } | null>(null);

  async function handleGenerateChallenge() {
    if (!walletSeed.trim()) {
      toast.error("Informe a seed da wallet testnet.");
      return;
    }

    setLoading(true);

    try {
      const keypair = deriveKeypair(walletSeed.trim());
      const walletAddress = deriveAddress(keypair.publicKey);

      const res = await fetch("/api/auth/wallet-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? err?.error ?? "Falha ao criar challenge");
      }

      const data = await res.json();

      setChallengeData({
        challengeId: data.challengeId,
        message: data.message,
        userId: data.userId,
        walletAddress,
        publicKey: keypair.publicKey,
        privateKey: keypair.privateKey,
      });
      setStep("signing");
      toast.success(`Challenge gerado para ${walletAddress.slice(0, 8)}...`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar challenge");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignAndLogin() {
    if (!challengeData) return;

    setLoading(true);

    try {
      const signature = sign(
        utf8ToHex(challengeData.message),
        challengeData.privateKey
      );

      const verifyRes = await fetch("/api/auth/wallet-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challengeData.challengeId,
          signature,
          publicKey: challengeData.publicKey,
          userId: challengeData.userId,
        }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json().catch(() => null);
        throw new Error(err?.message ?? err?.error ?? "Verificação falhou");
      }

      const result = await signIn("wallet", {
        walletAddress: challengeData.walletAddress,
        userId: challengeData.userId,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Falha ao criar sessão");
      }

      toast.success("Login realizado com sucesso!");
      window.location.href = "/dashboard";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro na verificação");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card tone="soft" className="p-6">
      <div className="flex items-center gap-3">
        <Badge>Wallet Login</Badge>
        <span className="text-xs text-ink/55">Testnet only</span>
      </div>

      {step === "connect" ? (
        <div className="mt-5 flex flex-col gap-4">
          <p className="text-sm text-ink/70">
            Cole a seed da sua wallet XRPL testnet. A seed é usada apenas
            localmente para assinar o challenge — nunca é enviada ao servidor.
          </p>
          <div>
            <span className="label-caps mb-1 block">Wallet seed</span>
            <Input
              type="password"
              placeholder="sEdXXXXXXXXXXXXXXXXXXXXXXXXX"
              value={walletSeed}
              onChange={(e) => setWalletSeed(e.target.value)}
            />
          </div>
          <Button onClick={handleGenerateChallenge} disabled={loading}>
            {loading ? "Gerando challenge..." : "Conectar wallet"}
          </Button>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-4">
          <div className="rounded-tile border border-line/45 bg-paper/72 p-4">
            <span className="label-caps">Wallet</span>
            <p className="mt-1 font-mono text-sm text-dusk">
              {challengeData?.walletAddress}
            </p>
          </div>

          <div className="rounded-tile border border-line/45 bg-paper/72 p-4">
            <span className="label-caps">Challenge message</span>
            <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-ink/65">
              {challengeData?.message}
            </pre>
          </div>

          <Button onClick={handleSignAndLogin} disabled={loading}>
            {loading ? "Verificando assinatura..." : "Assinar e entrar"}
          </Button>

          <button
            type="button"
            onClick={() => {
              setStep("connect");
              setChallengeData(null);
            }}
            className="text-sm text-ink/55 underline"
          >
            Voltar
          </button>
        </div>
      )}
    </Card>
  );
}
