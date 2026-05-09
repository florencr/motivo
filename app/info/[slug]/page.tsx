import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type InfoPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: InfoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.footerPage.findUnique({ where: { slug } });
  if (!page || !page.isPublished) {
    return {
      title: "Faqja nuk u gjet",
      robots: { index: false, follow: false },
    };
  }
  const text = page.content.replace(/\s+/g, " ").trim();
  const description = text.length > 0 ? text.slice(0, 160) : `${page.title} në Motivo.`;
  return {
    title: page.title,
    description,
    alternates: { canonical: `/info/${page.slug}` },
    openGraph: {
      type: "article",
      title: page.title,
      description,
      url: `/info/${page.slug}`,
    },
  };
}

export default async function InfoPage({ params }: InfoPageProps) {
  const { slug } = await params;

  const page = await prisma.footerPage.findUnique({
    where: { slug },
  });

  if (!page || !page.isPublished) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Faqja nuk u gjet</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">{page.title}</h1>
        <div className="mt-4 text-sm leading-7 text-slate-700">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: (props) => (
                <h2 className="mt-6 text-2xl font-bold text-slate-900" {...props} />
              ),
              h2: (props) => (
                <h2 className="mt-6 text-xl font-bold text-slate-900" {...props} />
              ),
              h3: (props) => (
                <h3 className="mt-5 text-lg font-semibold text-slate-900" {...props} />
              ),
              p: (props) => <p className="mt-3" {...props} />,
              ul: (props) => (
                <ul className="mt-3 list-disc space-y-1 pl-6" {...props} />
              ),
              ol: (props) => (
                <ol className="mt-3 list-decimal space-y-1 pl-6" {...props} />
              ),
              li: (props) => <li className="leading-6" {...props} />,
              strong: (props) => (
                <strong className="font-semibold text-slate-900" {...props} />
              ),
              em: (props) => <em {...props} />,
              a: ({ href, ...props }) => (
                <a
                  href={href}
                  className="font-medium text-slate-900 underline hover:text-slate-700"
                  target={href?.startsWith("http") ? "_blank" : undefined}
                  rel={href?.startsWith("http") ? "noreferrer" : undefined}
                  {...props}
                />
              ),
              blockquote: (props) => (
                <blockquote
                  className="mt-3 border-l-4 border-slate-300 pl-4 text-slate-600 italic"
                  {...props}
                />
              ),
              hr: () => <hr className="my-6 border-slate-200" />,
              code: (props) => (
                <code
                  className="rounded bg-slate-100 px-1 py-0.5 text-xs"
                  {...props}
                />
              ),
            }}
          >
            {page.content}
          </ReactMarkdown>
        </div>
      </div>
    </main>
  );
}
