import { getPageImage, source } from "@/lib/source";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/mdx-components";
import type { Metadata } from "next";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { LLMCopyButton, ViewOptions } from "@/components/page-actions";

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
	const params = await props.params;
	const page = source.getPage(params.slug);
	if (!page) notFound();

	const MDX = page.data.body;

	return (
		<div className="contents group/page">
			<DocsPage toc={page.data.toc} full={page.data.full}>
				<div className="flex gap-4 lg:flex-row flex-col lg:place-items-center lg:justify-between">
					<DocsTitle className="lg:order-1 order-2">{page.data.title}</DocsTitle>
					<div className="flex place-items-center gap-2 lg:order-2 order-1">
						<LLMCopyButton markdownUrl={`${page.url}.mdx`} />
						<ViewOptions
							markdownUrl={`${page.url}.mdx`}
							githubUrl={`https://github.com/jsrepojs/jsrepo/blob/main/apps/docs/content/docs/${page.path}`}
						/>
					</div>
				</div>
				<DocsDescription className="group-has-data-[slot='badge-group']/page:mb-0">
					{page.data.description}
				</DocsDescription>
				<DocsBody>
					<MDX
						components={getMDXComponents({
							// this allows you to link to other pages with relative file paths
							a: createRelativeLink(source, page),
						})}
					/>
				</DocsBody>
			</DocsPage>
		</div>
	);
}

export async function generateStaticParams() {
	return source.generateParams();
}

export async function generateMetadata(props: PageProps<"/docs/[[...slug]]">): Promise<Metadata> {
	const params = await props.params;
	const page = source.getPage(params.slug);
	if (!page) notFound();

	return {
		title: page.data.title,
		description: page.data.description,
		openGraph: {
			images: getPageImage(page).url,
		},
	};
}
