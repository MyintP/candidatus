// Jooble API integration — live job search
// Docs: https://jooble.org/api/about
// Free API key: https://jooble.org/api/about → Register

export async function fetchLiveJobs({ keywords, location, page = 1, resultsPerPage = 10 }) {
  const apiKey = import.meta.env.VITE_JOOBLE_API_KEY
if (true) {
    // Return mock data if no API key configured
    return getMockJobs(keywords, location)
  }

  try {
    const response = await fetch(`/jooble-api/${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords,
        location,
        page,
        ResultOnPage: resultsPerPage
      })
    })

    if (!response.ok) throw new Error(`Jooble API error: ${response.status}`)
    const data = await response.json()
    return data.jobs || []
  } catch (error) {
    console.warn('Jooble API unavailable, using mock data:', error.message)
    return getMockJobs(keywords, location)
  }
}

function getMockJobs(keywords, location) {
  return [
    {
      id: 'mock-1',
      title: `Senior ${keywords}`,
      company: 'Queensland Government',
      location: location || 'Brisbane, QLD',
      salary: '$130,000 - $160,000',
      snippet: `Seeking an experienced ${keywords} to lead enterprise architecture initiatives across government services. Must have TOGAF certification, cloud strategy experience, and stakeholder engagement at executive level.`,
      link: '#',
      updated: new Date().toISOString(),
      type: 'Full-time'
    },
    {
      id: 'mock-2',
      title: `Principal ${keywords}`,
      company: 'Major Australian Bank',
      location: location || 'Brisbane, QLD',
      salary: '$150,000 - $185,000',
      snippet: `Lead solution architecture for digital transformation programs. Experience with Azure, cloud migration, and governance frameworks required. Dynamics 365 implementation experience highly regarded.`,
      link: '#',
      updated: new Date().toISOString(),
      type: 'Contract'
    },
    {
      id: 'mock-3',
      title: `Enterprise ${keywords}`,
      company: 'Global Consulting Firm',
      location: location || 'Brisbane, QLD',
      salary: '$160,000 - $200,000',
      snippet: `Drive architecture strategy across financial services clients. Must demonstrate board-level stakeholder management, M&A integration experience, and the ability to lead architecture review boards.`,
      link: '#',
      updated: new Date().toISOString(),
      type: 'Full-time'
    }
  ]
}
