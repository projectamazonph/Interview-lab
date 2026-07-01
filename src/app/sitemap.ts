import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://interviewlab.chatglm.site';

  // Since this is a single-page app, all content is served from the root.
  // These are the logical "sections" that users can navigate to.
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    // The SPA uses client-side routing, but search engines can still index
    // the landing page which contains all the marketing content and CTAs.
    // API routes are disallowed in robots.txt, so no need to list them.
  ];
}
