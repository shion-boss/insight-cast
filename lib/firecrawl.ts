export async function fetchMarkdown(url: string): Promise<string> {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, formats: ['markdown'], waitFor: 2000 }),
  })
  if (!res.ok) {
    console.error('[firecrawl] fetchMarkdown failed', url, res.status)
    return ''
  }
  const json = await res.json()
  return (json.data?.markdown as string) ?? ''
}
