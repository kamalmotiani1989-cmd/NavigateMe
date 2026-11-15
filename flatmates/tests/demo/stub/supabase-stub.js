// A stand-in for supabase-js, for the speed suite (p28). Every server call answers after a fixed delay, like a
// phone network, from made-up data, and is written down in window.__rpc as { fn, args, at, ms } (ms stays null
// while the call is on its way). Nothing here talks to a real server. Settings come from localStorage:
//   __lat      ms each call takes (default 300)        __auth     ms the sign-in check takes (default 0)
//   __role     seeker | owner (default seeker)         __session  "none" = the server says nobody is signed in
//   __name     the name the server knows (default Neha / Rohit)
(() => {
  const get = (k, d) => { try{ const v = localStorage.getItem(k); return v === null ? d : v; }catch(e){ return d; } };
  const LAT = Number(get('__lat', 300)), AUTH = Number(get('__auth', 0)), role = get('__role', 'seeker'), signedIn = get('__session', '') !== 'none';
  const log = window.__rpc = [], wait = ms => new Promise(r => setTimeout(r, ms));
  const vibe = { sleep:2, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:0, social:1, sharing:1, work:0, pets:1, gen:'z' };
  const iso = d => new Date(Date.now() - d * 864e5).toISOString();
  const AREAS = ['Baner', 'Wakad', 'Kothrud', 'Aundh', 'Hadapsar', 'Viman Nagar', 'Kharadi', 'Koregaon Park'], KINDS = ['room', 'room', 'shared', 'flatmate', 'flat', 'room', 'shared'];
  const ans = (i, j) => (i * 7 + j * 3) % 3;
  const homes = Array.from({ length: 14 }, (_, i) => { const kind = KINDS[i % KINDS.length], res = kind === 'flat' ? 0 : 1 + i % 3;
    const hh = { residents: res, flatmates: res ? [{ type:'working', what:'Engineer', age:'25–30' }] : [], interests: { music:['Indie'], hobbies:['Gym'] } };
    if(res){ Object.keys(vibe).forEach((k, j) => { if(k !== 'gen') hh[k] = ans(i, j); }); hh.gen = i % 2 ? 'z' : 'm'; }
    return { id: 'stub-home-' + i, kind, title: (kind === 'flat' ? '2 BHK flat' : 'Room') + ' in ' + AREAS[i % AREAS.length], city: 'Pune', locality: AREAS[i % AREAS.length],
      bhk: 2 + i % 2, rent: 9000 + i * 1500, deposit: 20000, available_from: '2026-12-01', gender: 'any', furnishing: 'semi', amenities: ['Wi-Fi', 'Lift'], description: 'A bright place near the main road.',
      photos: [], room: null, household: hh, costs: { wifi: 300 }, created_at: iso(i + 1), is_owner: role === 'owner' && i < 2, unlocked: false, unlock_count: 0, request_status: null, bachelors: true,
      status: 'active', geo: null, featured: false, reply_hours: i % 4 ? null : 5, owner_active_at: iso(1), owner_verified: true, home_gender: null }; });
  const me = { phone: role === 'owner' ? '919822222222' : '919811111111', full_name: get('__name', role === 'owner' ? 'Rohit' : 'Neha'), role, occupation: { type: 'working', what: 'Designer' },
    credits: 5, packs: 0, pending: 0, gift_given: true, room_until: null, tribe_until: null, escape_until: null, ref_code: 'ABC123', ref_joined: 0, ref_bonus: 0, vibe,
    interests: { music: ['Indie'], hobbies: [] }, discoverable: true, tribe_open: true, gender: role === 'owner' ? 'male' : 'female', adult_at: iso(10), tribe_show_to: 'all', escape_show_to: 'all',
    boost_credits: 0, sale_credits: 0, on_time_months: 0, show_on_time: false, charges_on: true };
  const seekers = Array.from({ length: 6 }, (_, i) => { const v = {}; Object.keys(vibe).forEach((k, j) => { if(k !== 'gen') v[k] = ans(i + 2, j); }); v.gen = 'z';
    return { seeker_id: 'stub-seeker-' + i, name: ['Riya', 'Aman', 'Zoya', 'Kabir', 'Meera', 'Dev'][i], occupation: { type: 'working', what: 'Analyst' }, areas: [], budget: 12000 + i * 2000,
      match_pct: 90 - i * 6, interests: { music: [], hobbies: [] }, vibe: v, active_at: iso(i), invite_status: null, invite_by: null, on_time: false, move_in: '1m', invites_got: 0, invites_answered: 0 }; });
  const data = { fm_on_hold: () => false, fm_me: () => signedIn ? [me] : [{}], fm_search: () => homes, fm_search_near: () => homes, fm_my_listings: () => homes.filter(h => h.is_owner),
    fm_find_seekers: () => seekers, fm_listing_get: a => homes.filter(h => h.id === a.p_listing) };
  window.supabase = { createClient(){ return {
    rpc(fn, args){ const e = { fn, args: args || {}, at: Math.round(performance.now()), ms: null }; log.push(e);
      return wait(LAT).then(() => { e.ms = Math.round(performance.now() - e.at); const f = data[fn]; return { data: JSON.parse(JSON.stringify(f ? f(args || {}) : [])), error: null }; }); },
    auth: { async getSession(){ if(AUTH) await wait(AUTH); return { data: { session: signedIn ? { access_token: 'stub', user: { id: 'stub-me' } } : null } }; },
      async getUser(){ return { data: { user: signedIn ? { id: 'stub-me' } : null } }; }, async signOut(){ return {}; }, async setSession(){ return { data: {}, error: null }; },
      onAuthStateChange(){ return { data: { subscription: { unsubscribe(){} } } }; } },
    storage: { from(){ return { async upload(){ return { data: {}, error: null }; }, getPublicUrl(){ return { data: { publicUrl: '' } }; } }; } } }; } };
})();
