const siteUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "https://lasolution.fr";

export function LandingStructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "La Solution",
        url: siteUrl,
        logo: `${siteUrl}/icon/LOGO-SOLUTION-light.png`,
        description:
          "Passerelle d’achat assisté et d’expédition de colis entre l’Europe et l’Afrique.",
      },
      {
        "@type": "WebSite",
        name: "La Solution",
        url: siteUrl,
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/boutiques?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
