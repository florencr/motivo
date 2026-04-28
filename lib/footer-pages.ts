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
      { title: "Register as Buyer", href: "/register" },
      { title: "Register as Seller", href: "/register" },
      { title: "Register Company", href: "/register" },
      { title: "Post a Listing", href: "/cars" },
    ],
    userLinks: [
      { title: "My Profile", href: "#" },
      { title: "Saved Cars", href: "#" },
      { title: "Comparison", href: "#" },
      { title: "Messages", href: "#" },
    ],
    company: [
      { title: "About Us", href: "#" },
      { title: "Contact", href: "#" },
      { title: "Privacy Policy", href: "#" },
      { title: "Terms of Use", href: "#" },
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
