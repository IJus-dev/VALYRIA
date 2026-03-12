import Link from "next/link";
import type { Session } from "next-auth";
import { signOut } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";

const publicNavigation = [
  { href: "/dashboard", label: "Home" },
  { href: "/market", label: "Market" },
  { href: "/login", label: "Login" }
];

const appNavigation = [
  { href: "/dashboard", label: "Home" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/market", label: "Market" },
  { href: "/wallet", label: "Wallet" },
  { href: "/bond-vault", label: "Bond vault" },
  { href: "/redeems", label: "Redeems" },
  { href: "/oracles", label: "Oracles" },
  { href: "/proofs", label: "Proofs" },
  { href: "/disputes", label: "Disputes" },
  { href: "/analytics", label: "Analytics" },
  { href: "/reputation", label: "Reputation" },
  { href: "/governance", label: "Governance" },
  { href: "/admin/offers", label: "Admin" },
  { href: "/notifications", label: "Alerts" },
  { href: "/offers/new", label: "New offer" }
];

export function SiteHeader({ session }: { session: Session | null }) {
  const navigation = session?.user ? appNavigation : publicNavigation;

  return (
    <header className="panel sticky top-4 z-header mt-2 flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div>
          <Eyebrow>VALYRIA</Eyebrow>
          <div className="mt-1 text-sm text-ink/70">XRPL commodity derivatives infrastructure</div>
        </div>
        <Badge variant="outline">MVP técnico</Badge>
      </div>

      <nav className="flex flex-wrap items-center gap-2">
        {session?.user ? (
          <div className="rounded-pill border border-line/55 bg-paper/84 px-3 py-2 text-sm text-dusk">
            {session.user.walletAddress
              ? `${session.user.walletAddress.slice(0, 8)}...${session.user.walletAddress.slice(-4)}`
              : session.user.email ?? session.user.id}
          </div>
        ) : null}
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-pill border border-transparent px-3 py-2 text-sm text-ink/72 transition duration-200 ease-fluent hover:border-line/45 hover:bg-paper/86"
          >
            {item.label}
          </Link>
        ))}
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/health`}
          className="rounded-pill border border-line/55 bg-paper/82 px-3 py-2 text-sm text-dusk"
        >
          API health
        </a>
        {session?.user ? (
          <form
            action={async () => {
              "use server";
              await signOut({
                redirectTo: "/login"
              });
            }}
          >
            <Button variant="ghost" size="sm" type="submit">Sign out</Button>
          </form>
        ) : null}
      </nav>
    </header>
  );
}
