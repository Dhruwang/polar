import { getServerSideAPI } from '@/utils/api'
import { Article, Platforms, ResponseError } from '@polar-sh/sdk'
import type { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import ClientPage from './ClientPage'

const cacheConfig = {
  next: {
    revalidate: 30, // 30 seconds
  },
}

export async function generateMetadata(
  {
    params,
  }: {
    params: { organization: string; postSlug: string }
  },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const api = getServerSideAPI()

  let article: Article | undefined

  try {
    article = await api.articles.lookup({
      platform: Platforms.GITHUB,
      organizationName: params.organization,
      slug: params.postSlug,
    })
  } catch (e) {
    if (e instanceof ResponseError && e.response.status === 404) {
      notFound()
    }
  }

  if (!article) {
    notFound()
  }

  return {
    title: {
      absolute: `${article.title} by ${article.byline.name}`,
    },

    openGraph: {
      title: `${article.title}`,
      description: `${article.title} by ${article.byline.name}`,
      siteName: 'Polar',

      images: [
        {
          url: `https://polar.sh/og?articleId=${article.id}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      images: [
        {
          url: `https://polar.sh/og?articleId=${article.id}`,
          width: 1200,
          height: 630,
          alt: `${article.title}`,
        },
      ],
      card: 'summary_large_image',
      title: `${article.title}`,
      description: `${article.title} by ${article.byline.name}`,
    },
  }
}

export default async function Page({
  params,
  searchParams,
}: {
  params: { organization: string; postSlug: string }
  searchParams: {
    tab?: string
  }
}) {
  const api = getServerSideAPI()

  const [post, organization] = await Promise.all([
    api.articles.lookup({
      platform: Platforms.GITHUB,
      organizationName: params.organization,
      slug: params.postSlug,
    }),
    api.organizations.lookup(
      {
        platform: Platforms.GITHUB,
        organizationName: params.organization,
      },
      cacheConfig,
    ),
  ])

  return <>{post && <ClientPage post={post} organization={organization} />}</>
}