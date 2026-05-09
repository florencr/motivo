import { prisma } from "@/lib/prisma";

export type FooterLinkItem = {
  title: string;
  href: string;
};

export type FooterLinks = {
  getStarted: FooterLinkItem[];
  userLinks: FooterLinkItem[];
  company: FooterLinkItem[];
  app: FooterLinkItem[];
};

export async function getFooterLinks(): Promise<FooterLinks> {
  const defaults: FooterLinks = {
    getStarted: [
      { title: "Regjistrohu si blerës", href: "/register" },
      { title: "Regjistrohu si shitës", href: "/register" },
      { title: "Regjistro kompani", href: "/register" },
      { title: "Publiko një listim", href: "/dashboard/sell" },
    ],
    userLinks: [
      { title: "Profili im", href: "#" },
      { title: "Të preferuarat", href: "#" },
      { title: "Krahasimi", href: "#" },
      { title: "Mesazhet", href: "#" },
    ],
    company: [
      { title: "Rreth nesh", href: "#" },
      { title: "Kontakti", href: "#" },
      { title: "Politika e privatësisë", href: "#" },
      { title: "Kushtet e përdorimit", href: "#" },
    ],
    app: [
      { title: "iOS App Store", href: "#" },
      { title: "Android Play Store", href: "#" },
    ],
  };

  try {
    const pages = await prisma.footerPage.findMany({
      where: { isPublished: true },
      orderBy: [{ section: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
    });

    if (pages.length === 0) return defaults;

    const data: FooterLinks = {
      getStarted: [],
      userLinks: [],
      company: [],
      app: [],
    };

    for (const page of pages) {
      const link = { title: page.title, href: `/info/${page.slug}` };
      if (page.section === "GET_STARTED") data.getStarted.push(link);
      if (page.section === "USER_LINKS") data.userLinks.push(link);
      if (page.section === "COMPANY") data.company.push(link);
      if (page.section === "APP") data.app.push(link);
    }

    return {
      getStarted: data.getStarted.length ? data.getStarted : defaults.getStarted,
      userLinks: data.userLinks.length ? data.userLinks : defaults.userLinks,
      company: data.company.length ? data.company : defaults.company,
      app: data.app.length ? data.app : defaults.app,
    };
  } catch {
    return defaults;
  }
}
