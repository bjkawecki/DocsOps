type LandingJsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/** Injects a JSON-LD script into document head for the current page. */
export function LandingJsonLd({ data }: LandingJsonLdProps) {
  const json = JSON.stringify(data);
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
