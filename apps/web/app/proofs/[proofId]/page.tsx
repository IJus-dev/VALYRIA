import Link from "next/link";
import { getProofDetails } from "@/lib/api";
import { ProofMintPanel } from "@/components/platform/proof-mint-panel";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ProofDetailsPageProps {
  params: Promise<{
    proofId: string;
  }>;
}

export default async function ProofDetailsPage({ params }: ProofDetailsPageProps) {
  const { proofId } = await params;
  const details = await getProofDetails(proofId);
  const metadataEntries = Object.entries(details.proof.metadata ?? {});

  return (
    <main className="grid gap-8 pt-8 lg:grid-cols-[1.05fr_0.95fr]">
      <Card className="p-8">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>{details.proof.artifactType}</Badge>
          <Badge variant="outline">{details.proof.commodity}</Badge>
          {details.offer ? <Badge variant="outline">{details.offer.seriesAlias}</Badge> : null}
        </div>

        <h1 className="mt-5 text-5xl leading-none text-dusk">Pacote da prova.</h1>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-tile border border-line/45 bg-paper/72 p-4">
            <div className="label-caps">URI</div>
            <div className="mt-3 break-all text-sm text-ink/72">{details.proof.uri}</div>
          </div>
          {details.proof.ipfsCid ? (
            <div className="rounded-tile border border-line/45 bg-paper/72 p-4">
              <div className="label-caps">IPFS CID</div>
              <div className="mt-3 break-all text-sm text-ink/72">{details.proof.ipfsCid}</div>
            </div>
          ) : null}
        </div>

        {details.proof.manifestHash ? (
          <div className="mt-4 rounded-tile border border-line/45 bg-paper/72 p-4">
            <div className="label-caps">Manifest hash</div>
            <div className="mt-3 break-all font-mono text-sm text-ink/72">{details.proof.manifestHash}</div>
          </div>
        ) : null}

        {(details.proof.nftTokenId || details.proof.nftMintHash) ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {details.proof.nftTokenId ? (
              <div className="rounded-tile border border-line/45 bg-paper/72 p-4">
                <div className="label-caps">NFTokenID</div>
                <div className="mt-3 break-all text-sm text-ink/72">{details.proof.nftTokenId}</div>
              </div>
            ) : null}
            {details.proof.nftMintHash ? (
              <div className="rounded-tile border border-line/45 bg-paper/72 p-4">
                <div className="label-caps">NFT mint hash</div>
                <div className="mt-3 break-all text-sm text-ink/72">{details.proof.nftMintHash}</div>
              </div>
            ) : null}
          </div>
        ) : null}

        {metadataEntries.length > 0 ? (
          <div className="mt-8 rounded-tile border border-line/45 bg-sand/30 p-5">
            <div className="label-caps">Metadata</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {metadataEntries.map(([key, value]) => (
                <div key={key} className="rounded-tile border border-line/45 bg-paper/72 p-4">
                  <div className="label-caps">{key}</div>
                  <div className="mt-2 break-all text-sm text-ink/72">{String(value)}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      <div className="grid gap-cluster">
        <Card className="p-6">
          <span className="eyebrow">Contexto</span>
          <div className="mt-4 grid gap-3">
            <div className="flex items-center justify-between rounded-tile border border-line/45 bg-paper/72 px-4 py-3">
              <span className="label-caps">Usuário</span>
              <span className="text-sm text-ink/72">{details.user?.name ?? details.user?.email ?? "n/a"}</span>
            </div>
            {details.offer ? (
              <div className="flex items-center justify-between rounded-tile border border-line/45 bg-paper/72 px-4 py-3">
                <span className="label-caps">Oferta</span>
                <span className="text-sm text-ink/72">{details.offer.seriesAlias} ({details.offer.status})</span>
              </div>
            ) : null}
          </div>
        </Card>

        <ProofMintPanel proof={details.proof} />

        {details.relatedProofs.length > 0 ? (
          <Card className="p-6">
            <span className="eyebrow">Provas relacionadas</span>
            <div className="mt-4 grid gap-3">
              {details.relatedProofs.map((proof) => (
                <Link key={proof.id} href={`/proofs/${proof.id}`} className="rounded-tile border border-line/45 bg-paper/72 p-4 transition hover:bg-paper/88">
                  <div className="label-caps">{proof.artifactType}</div>
                  <div className="mt-2 text-2xl text-dusk">{proof.commodity}</div>
                </Link>
              ))}
            </div>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
