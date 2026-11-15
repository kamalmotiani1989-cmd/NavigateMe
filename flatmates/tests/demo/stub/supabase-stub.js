// A stand-in for supabase-js, for the speed suite (p28) and the chat suite (p29). Every server call answers after a
// fixed delay, like a phone network, from made-up data, and is written down in window.__rpc as { fn, args, at, ms }
// (ms stays null while the call is on its way). Nothing here talks to a real server. Settings come from localStorage:
//   __lat      ms each call takes (default 300)        __auth     ms the sign-in check takes (default 0)
//   __role     seeker | owner (default seeker)         __session  "none" = the server says nobody is signed in
//   __name     the name the server knows (default Neha / Rohit)
// Chats (fm_thread_open / get / send / list) are a small world of their own that behaves like the database's:
// one chat per connection, "only what's new" (p_after), a message's own id (p_id) saved once. The test drives the
// other person and the network through window.__chat:
//   say(thread, text)   the other person writes        fail(n, why)  the next n sends fail ("network" or "rate-limited")
//   old = true          a server from before p_after and p_id (it doesn't know those arguments)
//   threads             the chats themselves
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
  // ---- chats
  const ago = s => new Date(Date.now() - s * 1000).toISOString(), stamp = () => new Date().toISOString();
  const chat = window.__chat = { old: false, fails: [], n: 0, threads: [
    { id: 'stub-thread-1', kind: 'room', ref: 'stub-req-1', title: 'Room in Baner', people: ['Rohit'], read_at: ago(3600), messages: [
      { id: 'stub-m-1', mine: true, name: 'Neha', body: 'Hi! Is the room still free?', at: ago(7200) },
      { id: 'stub-m-2', mine: false, name: 'Rohit', body: 'Yes it is. When would you like to see it?', at: ago(7000) },
      { id: 'stub-m-3', mine: true, name: 'Neha', body: 'Saturday morning?', at: ago(6900) }] },
    { id: 'stub-thread-2', kind: 'tribe', ref: 'stub-tribe-1', title: 'Your tribe', people: ['Zoya'], read_at: ago(3600), messages: [
      { id: 'stub-m-9', mine: false, name: 'Zoya', body: 'Shall we look at Kothrud this week?', at: ago(5000) }] }],
    say(thread, body){ const t = chat.threads.find(x => x.id === thread); t.messages.push({ id: 'stub-in-' + (++chat.n), mine: false, name: t.people[0], body, at: stamp() }); },
    fail(n, why){ for(let i = 0; i < n; i++) chat.fails.push(why || 'network'); } };
  const thr = id => chat.threads.find(x => x.id === id);
  const noFn = (fn, a) => ({ throw: { code: 'PGRST202', message: 'Could not find the function public.' + fn + '(' + Object.keys(a).sort().join(', ') + ') in the schema cache' } });
  const chats = {
    fm_thread_open: a => { const t = chat.threads.find(x => x.kind === a.p_kind && x.ref === a.p_ref); return t ? { thread: t.id } : { error: 'not-yet' }; },
    fm_thread_get: a => { if(chat.old && 'p_after' in a) return noFn('fm_thread_get', a);
      const t = thr(a.p_thread); if(!t) return { error: 'not-found' };
      t.read_at = stamp();
      return { thread: t.id, kind: t.kind, title: t.title, ref: t.ref, people: t.people, messages: t.messages.filter(m => !a.p_after || Date.parse(m.at) >= Date.parse(a.p_after)).slice(-200) }; },
    fm_thread_send: a => { if(chat.old && 'p_id' in a) return noFn('fm_thread_send', a);
      const t = thr(a.p_thread); if(!t) return { error: 'not-found' };
      const why = chat.fails.shift();
      if(why === 'network') return { throw: { message: 'TypeError: Failed to fetch' } };
      if(why === 'lost'){ /* the server took it, the answer never arrived */ if(!t.messages.some(m => m.id === a.p_id)) t.messages.push({ id: a.p_id, mine: true, name: me.full_name, body: a.p_body, at: stamp() }); return { throw: { message: 'TypeError: Failed to fetch' } }; }
      if(why) return { throw: { message: why } };
      const was = a.p_id && t.messages.find(m => m.id === a.p_id); if(was) return { message: was.id, at: was.at, again: true };
      const m = { id: a.p_id || 'stub-out-' + (++chat.n), mine: true, name: me.full_name, body: String(a.p_body).trim(), at: stamp() }; t.messages.push(m); t.read_at = m.at;
      return chat.old ? { message: m.id } : { message: m.id, at: m.at }; },
    fm_thread_list: () => chat.threads.filter(t => t.messages.length).map(t => { const last = t.messages[t.messages.length - 1];
      return { thread: t.id, kind: t.kind, title: t.title, ref: t.ref, last_at: last.at, last: { body: last.body.slice(0, 120), mine: last.mine },
        unread: t.messages.filter(m => !m.mine && Date.parse(m.at) > Date.parse(t.read_at)).length }; }).sort((x, y) => Date.parse(y.last_at) - Date.parse(x.last_at)) };
  const data = Object.assign({ fm_on_hold: () => false, fm_me: () => signedIn ? [me] : [{}], fm_search: () => homes, fm_search_near: () => homes, fm_my_listings: () => homes.filter(h => h.is_owner),
    fm_find_seekers: () => seekers, fm_listing_get: a => homes.filter(h => h.id === a.p_listing) }, chats);
  window.supabase = { createClient(){ return {
    rpc(fn, args){ const e = { fn, args: args || {}, at: Math.round(performance.now()), ms: null }; log.push(e);
      return wait(LAT).then(() => { e.ms = Math.round(performance.now() - e.at); const f = data[fn], r = f ? f(args || {}) : [];
        if(r && r.throw){ e.failed = r.throw.message; return { data: null, error: r.throw }; }
        return { data: JSON.parse(JSON.stringify(r)), error: null }; }); },
    auth: { async getSession(){ if(AUTH) await wait(AUTH); return { data: { session: signedIn ? { access_token: 'stub', user: { id: 'stub-me' } } : null } }; },
      async getUser(){ return { data: { user: signedIn ? { id: 'stub-me' } : null } }; }, async signOut(){ return {}; }, async setSession(){ return { data: {}, error: null }; },
      onAuthStateChange(){ return { data: { subscription: { unsubscribe(){} } } }; } },
    storage: { from(){ return { async upload(){ return { data: {}, error: null }; }, getPublicUrl(){ return { data: { publicUrl: '' } }; } }; } } }; } };
})();
