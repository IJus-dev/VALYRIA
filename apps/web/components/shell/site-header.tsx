import Link from "next/link";
import type { Session } from "next-auth";
import { signOut } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { getLocale } from "@/lib/get-locale";
import { getWebDictionary } from "@valyria/i18n/web";
import { LangToggle } from "@/components/shell/lang-toggle";

export function SiteHeader({ session }: { session: Session | null }) {
  const locale = getLocale();
  const dict = getWebDictionary(locale);
  const t = (key: string) => dict[key] ?? key;

  const publicNavigation = [
    { href: "/dashboard", label: t("nav.home") },
    { href: "/market", label: t("nav.market") },
    { href: "/login", label: t("nav.login") },
  ];

  const appNavigation = [
    { href: "/dashboard", label: t("nav.home") },
    { href: "/onboarding", label: t("nav.onboarding") },
    { href: "/market", label: t("nav.market") },
    { href: "/wallet", label: t("nav.wallet") },
    { href: "/bond-vault", label: t("nav.bondVault") },
    { href: "/redeems", label: t("nav.redeems") },
    { href: "/oracles", label: t("nav.oracles") },
    { href: "/proofs", label: t("nav.proofs") },
    { href: "/disputes", label: t("nav.disputes") },
    { href: "/analytics", label: t("nav.analytics") },
    { href: "/reputation", label: t("nav.reputation") },
    { href: "/governance", label: t("nav.governance") },
    { href: "/admin/offers", label: t("nav.admin") },
    { href: "/notifications", label: t("nav.alerts") },
    { href: "/offers/new", label: t("nav.newOffer") },
  ];

  const navigation = session?.user ? appNavigation : publicNavigation;

  return (
    <header className="panel sticky top-4 z-header mt-2 flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div>
          <Eyebrow>VALYRIA</Eyebrow>
          <div className="mt-1 text-sm text-ink/70">{t("header.tagline")}</div>
        </div>
        <Badge variant="outline">{t("header.badge")}</Badge>
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
          {t("header.apiHealth")}
        </a>
        <LangToggle />
        {session?.user ? (
          <form
            action={async () => {
              "use server";
              await signOut({
                redirectTo: "/login"
              });
            }}
          >
            <Button variant="ghost" size="sm" type="submit">{t("header.signOut")}</Button>
          </form>
        ) : null}
      </nav>
    </header>
  );
}
