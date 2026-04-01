export const config = { runtime: 'edge' };

export default async function handler(req) {
  const GIST_ID = process.env.GIST_ID;
  const GH_TOKEN = process.env.GH_TOKEN;

  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        'Authorization': `token ${GH_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'the-1-dollar-experiment'
      },
      cache: 'no-store'
    });
    const gist = await res.json();
    const data = JSON.parse(gist.files['data.json'].content);

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ supporters: 47, totalRaised: 58, topDonors: [] }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
