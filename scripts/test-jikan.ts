async function test(name: string) {
  try {
    const r = await fetch('https://api.jikan.moe/v4/anime?q=' + encodeURIComponent(name) + '&limit=1&sfw=true');
    if (r.ok) {
      const j = await r.json();
      const a = j.data?.[0];
      if (a) {
        console.log(`[${name}] jikan OK: ${a.title} | mal: ${a.url} | cover: ${a.images?.jpg?.large_image_url?.slice(0, 60)}`);
        const ext = await fetch(`https://api.jikan.moe/v4/anime/${a.mal_id}/external`);
        if (ext.ok) {
          const ej = await ext.json();
          const links = ej.data?.map((l: any) => `${l.name}:${l.url}`).slice(0, 5);
          console.log(`  external: ${links?.join(' | ')}`);
        }
      } else {
        console.log(`[${name}] jikan: no match`);
      }
    } else {
      console.log(`[${name}] jikan: ${r.status}`);
    }
  } catch (e) {
    console.log(`[${name}] jikan err: ${(e as Error).message}`);
  }
}

async function main() {
  await test('Mushoku Tensei');
  await test('Tomb Raider King');
  await test('Sparks of Tomorrow');
  await test('Ghost in the Shell');
  await test('Bleach Thousand Year Blood War');
}
main();