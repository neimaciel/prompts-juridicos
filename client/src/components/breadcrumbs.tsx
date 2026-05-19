import { ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  // Generate structured data for breadcrumbs
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": item.href ? `https://promptsjuridicos.com.br${item.href}` : undefined
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      
      <nav className={cn("flex items-center space-x-1 text-sm text-gray-500", className)} aria-label="Breadcrumb">
        <ol className="flex items-center space-x-1">
          <li>
            <Link href="/">
              <a className="flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                <Home className="h-4 w-4" />
                <span className="sr-only">Home</span>
              </a>
            </Link>
          </li>
          
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
              {item.href && !item.current ? (
                <Link href={item.href}>
                  <a className="text-gray-500 hover:text-gray-700 transition-colors font-medium">
                    {item.label}
                  </a>  
                </Link>
              ) : (
                <span 
                  className={cn(
                    "font-medium",
                    item.current ? "text-gray-900" : "text-gray-500"
                  )}
                  {...(item.current && { "aria-current": "page" })}
                >
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

// Predefined breadcrumb configurations
export const breadcrumbConfigs = {
  home: [],
  updates: [
    { label: "Atualizações", current: true }
  ],
  admin: [
    { label: "Administração", current: true }
  ],
  docsmart: [
    { label: "DocSmart", href: "/docsmart", current: true }
  ],
  docsmartLogin: [
    { label: "DocSmart", href: "/docsmart" },
    { label: "Login", current: true }
  ]
};