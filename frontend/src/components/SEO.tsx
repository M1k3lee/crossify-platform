import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  schema?: object;
  noindex?: boolean;
}

export default function SEO({
  title = 'Crossify.io - Launch Your Token on All Chains | Multi-Chain Token Launch Platform',
  description = 'Launch your token simultaneously on Ethereum, BSC, Base, and Solana with one click. Crossify is the easiest way to create and deploy memecoins and tokens with automatic cross-chain price synchronization.',
  keywords = 'crossify, launch token, launch memecoin, create token, deploy token, multi-chain token, cross-chain token, token launch platform, memecoin launch, how to launch a token, token creator, ethereum token, solana token, BSC token, base token, cross-chain sync',
  image = 'https://crossify.io/og-image.png',
  url,
  type = 'website',
  schema,
  noindex = false,
}: SEOProps) {
  const location = useLocation();
  const currentUrl = url || `https://crossify.io${location.pathname}`;
  const fullTitle = title.includes('Crossify') ? title : `${title} | Crossify.io`;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', 'Crossify.io');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    
    if (noindex) {
      updateMetaTag('robots', 'noindex, nofollow');
    } else {
      updateMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    }

    // Open Graph tags
    updateMetaTag('og:title', fullTitle, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', 'Crossify.io', true);
    updateMetaTag('og:locale', 'en_US', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:site', '@crossify_io');
    updateMetaTag('twitter:creator', '@crossify_io');

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

    // Add structured data (JSON-LD)
    if (schema) {
      let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(schema);
    }

    // Additional SEO meta tags
    updateMetaTag('theme-color', '#3b82f6');
    updateMetaTag('apple-mobile-web-app-capable', 'yes');
    updateMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
    updateMetaTag('apple-mobile-web-app-title', 'Crossify');
  }, [fullTitle, description, keywords, image, currentUrl, type, schema, noindex]);

  return null;
}

// Helper function to generate schema.org structured data
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Crossify.io',
    url: 'https://crossify.io',
    logo: 'https://crossify.io/logo.png',
    description: 'Multi-chain token launch platform for deploying tokens on Ethereum, BSC, Base, and Solana simultaneously.',
    sameAs: [
      'https://twitter.com/crossify_io',
      'https://github.com/crossify',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'webapp@crossify.io',
      contactType: 'Customer Service',
    },
  };
}

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Crossify.io',
    url: 'https://crossify.io',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://crossify.io/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generateSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Crossify',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
    description: 'Launch your token on multiple blockchains simultaneously with automatic cross-chain price synchronization.',
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateHowToSchema(steps: Array<{ name: string; text: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Launch a Token on Multiple Chains',
    description: 'Step-by-step guide to launching your token on Ethereum, BSC, Base, and Solana using Crossify.',
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

