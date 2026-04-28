import { prisma } from "@/lib/prisma";

type InfoPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function InfoPage({ params }: InfoPageProps) {
  const { slug } = await params;

  const page = await prisma.footerPage.findUnique({
    where: { slug },
  });

  if (!page || !page.isPublished) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">{page.title}</h1>
        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">
          {page.content}
        </p>
      </div>
    </main>
  );
}
