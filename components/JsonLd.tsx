// Server component. Data is always server-generated — never raw user input.
// JSON.stringify is safe for structured data objects from our own codebase.
// eslint-disable-next-line react/no-danger
export function JsonLd({ data }: { data: object }) {
  const __html = JSON.stringify(data)
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html }} />
}
