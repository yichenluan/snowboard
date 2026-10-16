(() => {
  'use strict';

  // This module only sees public view descriptors. It never reads form fields,
  // personal records, or a persistent visitor identifier.
  if (window.SnowAnalytics) return;
  const disabled = { view() {} };
  window.SnowAnalytics = disabled;
  const config = window.SNOW_ANALYTICS_CONFIG;
  const optedOut = () => navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  const production = location.origin === 'https://snowboardguide.cn' ||
    (location.origin === 'https://jinke.me' && location.pathname.startsWith('/snowboard/'));
  if (!config || typeof config.websiteId !== 'string' || !config.websiteId.trim() ||
      !production || optedOut()) return;

  let scriptUrl;
  try {
    scriptUrl = new URL(config.scriptUrl || 'https://cloud.umami.is/script.js');
    if (scriptUrl.protocol !== 'https:' || scriptUrl.username || scriptUrl.password || scriptUrl.search || scriptUrl.hash) return;
  } catch { return; }

  const maxQueue = 32;
  const campaign = new URLSearchParams();
  const query = new URLSearchParams(location.search);
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    const value = (query.get(key) || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 100);
    if (value) campaign.set(key, value);
  }
  const campaignSuffix = campaign.size ? '?' + campaign.toString() : '';
  let entryReferrer = '';
  try {
    const referrer = new URL(document.referrer);
    if (/^https?:$/.test(referrer.protocol) && referrer.origin !== location.origin) entryReferrer = referrer.origin;
  } catch { /* Direct visits and invalid referrers have no attribution. */ }

  let status = 'idle', queue = [], current = null, pageShown = true;
  let interval = null, loadTimeout = null, script = null;
  const visible = () => pageShown && document.visibilityState === 'visible';

  function stop() {
    status = 'failed';
    queue = [];
    current = null;
    clearInterval(interval);
    clearTimeout(loadTimeout);
    interval = null;
    loadTimeout = null;
    document.removeEventListener('visibilitychange', visibilityChanged);
    window.removeEventListener('pagehide', pageHidden);
    window.removeEventListener('pageshow', pageRestored);
    if (script) {
      script.onload = null;
      script.onerror = null;
      script.remove();
    }
  }

  function deliver(record) {
    if (optedOut()) { stop(); return; }
    try {
      // Always override URL, referrer and title, including for events belonging
      // to a departed view. Umami's defaults may contain an OAuth query/hash.
      const result = window.umami.track(props => ({
        ...props,
        url: record.url,
        title: record.title,
        referrer: record.referrer,
        id: undefined,
        name: record.name,
        data: record.data,
      }));
      Promise.resolve(result).catch(() => {});
    } catch { /* Analytics must never interrupt the site. */ }
  }

  function load() {
    status = 'loading';
    try {
      script = document.createElement('script');
      script.async = true;
      script.src = scriptUrl.href;
      script.referrerPolicy = 'no-referrer';
      for (const [key, value] of Object.entries({
        'data-website-id': config.websiteId.trim(),
        'data-auto-track': 'false',
        'data-auto-pageview': 'false',
        'data-exclude-search': 'true',
        'data-exclude-hash': 'true',
        'data-do-not-track': 'true',
        'data-domains': 'snowboardguide.cn,jinke.me',
      })) script.setAttribute(key, value);
      script.onload = () => {
        if (status !== 'loading') return;
        clearTimeout(loadTimeout);
        loadTimeout = null;
        if (typeof window.umami?.track !== 'function' || optedOut()) { stop(); return; }
        status = 'ready';
        const pending = queue;
        queue = [];
        for (const record of pending) {
          if (status !== 'ready') break;
          deliver(record);
        }
      };
      script.onerror = stop;
      loadTimeout = setTimeout(stop, 15000);
      document.head.append(script);
    } catch { stop(); }
  }

  function send(record) {
    if (status === 'failed') return;
    if (status === 'ready') { deliver(record); return; }
    if (queue.length === maxQueue) queue.shift();
    queue.push(record);
    if (status === 'idle') load();
  }

  function flush() {
    if (!current || status === 'failed') return;
    const view = current, now = performance.now();
    if (view.startedAt !== null) view.pendingMs += Math.max(0, now - view.startedAt);
    view.startedAt = visible() ? now : null;
    const milliseconds = Math.floor(view.pendingMs);
    if (!milliseconds) return;
    view.pendingMs -= milliseconds;
    send({ url: view.url, title: view.title, referrer: view.referrer,
      name: 'page_visible', data: { seconds: milliseconds / 1000 } });
  }

  function visibilityChanged() {
    flush();
  }
  function pageHidden() {
    pageShown = false;
    flush();
  }
  function pageRestored() {
    pageShown = true;
    if (current && current.startedAt === null && visible()) current.startedAt = performance.now();
  }

  window.SnowAnalytics = {
    view(descriptor) {
      if (status === 'failed') return;
      if (optedOut()) { stop(); return; }
      const path = descriptor?.path;
      if (typeof path !== 'string' || path.length > 200 ||
          !/^\/snowboard\/(?:[a-z0-9_-]+(?:\/[a-z0-9_-]+)*\/?)?$/i.test(path)) return;
      if (current?.path === path) return;
      const previousPath = current?.path;
      flush();
      if (status === 'failed') return;
      current = {
        path, url: path + campaignSuffix,
        title: String(descriptor.title || '单板滑雪技术手册').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 200),
        referrer: previousPath || entryReferrer,
        pendingMs: 0, startedAt: visible() ? performance.now() : null,
      };
      if (status === 'idle') {
        document.addEventListener('visibilitychange', visibilityChanged);
        window.addEventListener('pagehide', pageHidden);
        window.addEventListener('pageshow', pageRestored);
        interval = setInterval(flush, 60000);
      }
      send({ url: current.url, title: current.title, referrer: current.referrer });
    },
  };
})();
