import { getFooterLinks } from "@/lib/footer-pages";

export default async function SiteFooter() {
  const links = await getFooterLinks();

  return (
    <footer className="mt-12 border-t border-slate-800 bg-slate-950 text-slate-200">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-5 lg:px-8">
        <div>
          <h3 className="text-sm font-semibold text-white">Rreth Motivo</h3>
          <p className="mt-3 text-sm text-slate-400">
            Motivo ndihmon blerësit, shitësit dhe koncesionarët të gjejnë makinën e duhur më shpejt, me listime të besueshme.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Fillo</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            {links.getStarted.map((link) => (
              <li key={link.title}>
                <a href={link.href} className="hover:text-white">
                  {link.title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Linke përdoruesi</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            {links.userLinks.map((link) => (
              <li key={link.title}>
                <a href={link.href} className="hover:text-white">
                  {link.title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Kompania</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            {links.company.map((link) => (
              <li key={link.title}>
                <a href={link.href} className="hover:text-white">
                  {link.title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Shkarko aplikacionin</h3>
          <div className="mt-3 space-y-2">
            {links.app.map((link) => (
              <a
                key={link.title}
                href={link.href}
                className="block rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-slate-500 hover:text-white"
              >
                {link.title}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
