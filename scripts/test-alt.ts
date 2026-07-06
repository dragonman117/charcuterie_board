async function testKitsu(name: string) {
  try {
    const r = await fetch(`https://kitsu.app/api/edge/anime?filter[text]=${encodeURIComponent(name)}&page[limit]=1`);
    if (r.ok) {
      const j = await r.json();
      const a = j.data?.[0];
      if (a) {
        console.log(`[${name}] kitsu OK: ${a.attributes.canonicalTitle} | cover: ${a.attributes.coverImage?.large?.slice(0,60)} | poster: ${a.attributes.posterImage?.large?.slice(0,60)}`);
      } else console.log(`[${name}] kitsu: no match`);
    } else console.log(`[${name}] kitsu: ${r.status}`);
  } catch (e) { console.log(`[${name}] kitsu err: ${(e as Error).message}`); }
}

async function testTVMaze(name: string) {
  try {
    const r = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(name)}`);
    if (r.ok) {
      const j = await r.json();
      const s = j[0]?.show;
      if (s) console.log(`[${name}] tvmaze OK: ${s.name} | img: ${s.image?.original?.slice(0,60)}`);
      else console.log(`[${name}] tvmaze: no match`);
    } else console.log(`[${name}] tvmaze: ${r.status}`);
  } catch (e) { console.log(`[${name}] tvmaze err: ${(e as Error).message}`); }
}

async function main() {
  await testKitsu('Mushoku Tensei');
  await testKitsu('Tomb Raider King');
  await testKitsu('Sparks of Tomorrow');
  await testTVMaze('Mushoku Tensei');
  await testTVMaze('Sparks of Tomorrow');
}
main();