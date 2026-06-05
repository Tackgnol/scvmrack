import { render } from 'vitest-browser-react';
import { expect, describe, it, afterEach } from 'vitest';
import { Seo } from '@/seo/Seo';
import { getSiteUrl } from '@/seo/siteUrl';
import BrowserTestProvider from '../BrowserTestProvider';

describe('Seo Component', () => {
    afterEach(() => {
        // Clean up head tags to not pollute other tests
        document.head.querySelectorAll('meta').forEach(el => el.remove());
        document.head.querySelectorAll('link[rel="canonical"]').forEach(el => el.remove());
        document.head.querySelectorAll('script#seo-json-ld').forEach(el => el.remove());
    });

    it('renders standard SEO tags correctly', async () => {
        await render(
            <BrowserTestProvider>
                <Seo title="Test Page" description="A test description" />
            </BrowserTestProvider>
        );

        await expect.poll(() => document.title).toBe('Test Page | Scvm Rack');
        
        const descMeta = document.head.querySelector('meta[name="description"]');
        expect(descMeta?.getAttribute('content')).toBe('A test description');
        
        const ogTitle = document.head.querySelector('meta[property="og:title"]');
        expect(ogTitle?.getAttribute('content')).toBe('Test Page | Scvm Rack');

        const robots = document.head.querySelector('meta[name="robots"]');
        expect(robots?.getAttribute('content')).toContain('index,follow');
    });

    it('does not double append site name to title', async () => {
        await render(
            <BrowserTestProvider>
                <Seo title="Already has Scvm Rack" description="Desc" />
            </BrowserTestProvider>
        );

        await expect.poll(() => document.title).toBe('Already has Scvm Rack');
    });

    it('sets canonical url correctly', async () => {
        await render(
            <BrowserTestProvider>
                <Seo title="Canonical Test" description="Desc" path="/about" />
            </BrowserTestProvider>
        );

        await expect.poll(() => document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${getSiteUrl()}/about`);
    });

    it('renders keywords when provided', async () => {
        await render(
            <BrowserTestProvider>
                <Seo title="Keyword Test" description="Desc" keywords={['one', 'two', 'three']} />
            </BrowserTestProvider>
        );

        await expect.poll(() => document.head.querySelector('meta[name="keywords"]')?.getAttribute('content')).toBe('one, two, three');
    });

    it('handles noIndex properly', async () => {
         await render(
            <BrowserTestProvider>
                <Seo title="NoIndex Test" description="Desc" noIndex={true} />
            </BrowserTestProvider>
        );

        await expect.poll(() => document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toContain('noindex,nofollow');
    });

    it('renders jsonLd correctly', async () => {
        const mockJsonLd = { "@context": "https://schema.org", "@type": "WebSite", "name": "Test" };
        await render(
            <BrowserTestProvider>
                <Seo title="JsonLd Test" description="Desc" jsonLd={mockJsonLd} />
            </BrowserTestProvider>
        );

        await expect.poll(() => document.head.querySelector('script#seo-json-ld')?.textContent).toBe(JSON.stringify(mockJsonLd));
    });
});
