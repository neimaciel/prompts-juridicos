import { useEffect } from 'react';

interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  structuredData?: object;
}

export const useSEO = (config: SEOConfig) => {
  useEffect(() => {
    // Update document title
    if (config.title) {
      document.title = config.title;
    }

    // Update meta description
    if (config.description) {
      updateMetaTag('description', config.description);
    }

    // Update keywords
    if (config.keywords) {
      updateMetaTag('keywords', config.keywords);
    }

    // Update canonical URL
    if (config.canonical) {
      updateCanonicalLink(config.canonical);
    }

    // Update Open Graph tags
    if (config.ogTitle) {
      updateMetaProperty('og:title', config.ogTitle);
    }
    if (config.ogDescription) {
      updateMetaProperty('og:description', config.ogDescription);
    }
    if (config.ogImage) {
      updateMetaProperty('og:image', config.ogImage);
    }
    if (config.ogUrl) {
      updateMetaProperty('og:url', config.ogUrl);
    }

    // Update structured data
    if (config.structuredData) {
      updateStructuredData(config.structuredData);
    }
  }, [config]);
};

const updateMetaTag = (name: string, content: string) => {
  let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
  if (!element) {
    element = document.createElement('meta');
    element.name = name;
    document.head.appendChild(element);
  }
  element.content = content;
};

const updateMetaProperty = (property: string, content: string) => {
  let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.appendChild(element);
  }
  element.content = content;
};

const updateCanonicalLink = (href: string) => {
  let element = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.appendChild(element);
  }
  element.href = href;
};

const updateStructuredData = (data: object) => {
  // Remove existing structured data for this page
  const existingScript = document.querySelector('script[data-dynamic-schema]');
  if (existingScript) {
    existingScript.remove();
  }

  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-dynamic-schema', 'true');
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
};

// SEO configurations for different pages
export const seoConfigs = {
  home: {
    title: 'Prompts Jurídicos com IA | Gerador de Documentos Legais Brasileiro',
    description: 'Crie documentos jurídicos profissionais com inteligência artificial. Contratos, petições, pareceres e notificações. Especializado em direito brasileiro. Grátis para começar.',
    keywords: 'prompts jurídicos, gerador documentos legais, IA direito, contratos automáticos, petições iniciais, direito brasileiro',
    canonical: 'https://promptsjuridicos.com.br/',
    ogTitle: 'Prompts Jurídicos com IA | Gerador de Documentos Legais Brasileiro',
    ogDescription: 'Crie documentos jurídicos profissionais com inteligência artificial especializada em direito brasileiro.',
    ogUrl: 'https://promptsjuridicos.com.br/',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Prompts Jurídicos - Página Inicial",
      "description": "Plataforma de geração de documentos jurídicos com IA",
      "url": "https://promptsjuridicos.com.br/",
      "mainEntity": {
        "@type": "WebApplication",
        "name": "Prompts Jurídicos Ampliados",
        "applicationCategory": "LegalApplication"
      }
    }
  },
  
  gerador: {
    title: 'Gerador de Prompts Jurídicos | IA Especializada em Direito Brasileiro',
    description: 'Ferramenta profissional para gerar contratos, petições, pareceres e notificações jurídicas com inteligência artificial. Análise de qualidade inclusa.',
    keywords: 'gerador jurídico, contratos IA, petições automáticas, pareceres jurídicos, notificações legais',
    canonical: 'https://promptsjuridicos.com.br/gerador',
    ogTitle: 'Gerador de Prompts Jurídicos | IA Especializada',
    ogDescription: 'Ferramenta profissional para gerar documentos jurídicos com IA. Contratos, petições, pareceres e notificações.',
    ogUrl: 'https://promptsjuridicos.com.br/gerador',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Gerador de Documentos Jurídicos",
      "description": "Ferramenta de geração de documentos legais com IA",
      "url": "https://promptsjuridicos.com.br/gerador"
    }
  },

  updates: {
    title: 'Atualizações e Melhorias | Prompts Jurídicos',
    description: 'Veja as últimas atualizações, melhorias e funcionalidades implementadas na plataforma Prompts Jurídicos. Sistema de scoring inteligente e mais.',
    keywords: 'atualizações prompts jurídicos, melhorias IA, scoring inteligente, funcionalidades legais',
    canonical: 'https://promptsjuridicos.com.br/updates',
    ogTitle: 'Atualizações | Prompts Jurídicos',
    ogDescription: 'Últimas atualizações e melhorias da plataforma jurídica com IA.',
    ogUrl: 'https://promptsjuridicos.com.br/updates'
  },

  docsmart: {
    title: 'DocSmart | Análise de Contratos com IA | Prompts Jurídicos',
    description: 'Analise contratos e documentos jurídicos com inteligência artificial. Detecta dados sensíveis, criptografa informações e gera análises detalhadas.',
    keywords: 'análise contratos, IA jurídica, criptografia documentos, LGPD compliance, análise legal',
    canonical: 'https://promptsjuridicos.com.br/docsmart',
    ogTitle: 'DocSmart | Análise de Contratos com IA',
    ogDescription: 'Analise contratos e documentos jurídicos com IA. Proteção LGPD e análise detalhada.',
    ogUrl: 'https://promptsjuridicos.com.br/docsmart'
  }
};