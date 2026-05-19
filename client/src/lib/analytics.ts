// Define the gtag and fbq functions globally
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
  }
}

// Initialize Google Analytics
export const initGA = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!measurementId) {
    console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    return;
  }

  // Add Google Analytics script to the head
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  // Initialize gtag
  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}');
  `;
  document.head.appendChild(script2);
};

// Track page views - useful for single-page applications
export const trackPageView = (url: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) return;
  
  window.gtag('config', measurementId, {
    page_path: url
  });
};

// Track events
export const trackEvent = (
  action: string, 
  category?: string, 
  label?: string, 
  value?: number
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Meta Pixel tracking functions
export const trackMetaPixelEvent = (eventName: string, parameters?: any) => {
  if (typeof window === 'undefined' || !window.fbq) return;
  
  window.fbq('track', eventName, parameters);
};

// Track custom Meta Pixel events
export const trackMetaPixelCustomEvent = (eventName: string, parameters?: any) => {
  if (typeof window === 'undefined' || !window.fbq) return;
  
  window.fbq('trackCustom', eventName, parameters);
};

// Specific Meta Pixel events for this legal app
export const trackPromptGeneration = (documentType?: string) => {
  trackMetaPixelEvent('CompleteRegistration', {
    content_name: documentType || 'Legal Prompt',
    value: 1,
    currency: 'BRL'
  });
  
  // Also track custom event
  trackMetaPixelCustomEvent('PromptGenerated', {
    document_type: documentType
  });
};

export const trackPromptView = (documentType?: string) => {
  trackMetaPixelEvent('ViewContent', {
    content_name: documentType || 'Legal Prompt',
    content_type: 'legal_document'
  });
};