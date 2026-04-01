export const config = { runtime: 'edge' };

export default async function handler(req) {
  const GIST_ID  = process.env.GIST_ID;
  const GH_TOKEN = process.env.GH_TOKEN;
  const SECRET   = process.env.UPDATE_SECRET;

  const { searchParams } = new URL(req.url);
  const key    = searchParams.get('key');
  const amount = parseFloat(searchParams.get('amount') || '1');
  const name   = searchParams.get('name') || 'Anonymous';
  const flag   = searchParams.get('flag') || '🌍';

  // Vérification clé secrète
  if (key !== SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Lire les données actuelles
    const getRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        'Authorization': `token ${GH_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'the-1-dollar-experiment'
      }
    });
    const gist = await getRes.json();
    const data = JSON.parse(gist.files['data.json'].content);

    // Mettre à jour les stats
    data.supporters  = (data.supporters || 0) + 1;
    data.totalRaised = Math.round(((data.totalRaised || 0) + amount) * 100) / 100;

    // Mettre à jour les top donateurs
    if (!data.topDonors) data.topDonors = [];
    const existing = data.topDonors.find(d => d.name === name);
    if (existing) {
      existing.amount += amount;
    } else {
      data.topDonors.push({ name, amount, flag });
    }
    data.topDonors.sort((a, b) => b.amount - a.amount);
    data.topDonors = data.topDonors.slice(0, 10); // garder le top 10

    // Sauvegarder dans le Gist
    await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${GH_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'the-1-dollar-experiment'
      },
      body: JSON.stringify({
        files: { 'data.json': { content: JSON.stringify(data) } }
      })
    });

    return new Response(JSON.stringify({ success: true, data }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
