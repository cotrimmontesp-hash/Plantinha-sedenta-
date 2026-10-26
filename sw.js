// Plantinha Sedenta — service worker (cache-first).
// Para publicar uma versão nova do jogo, troque o número em CACHE (ex.: v2).
var CACHE = 'plantinha-v5';
var ARQUIVOS = ['./', './index.html', './manifest.webmanifest']; // ícones vão embutidos (data:)

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ARQUIVOS); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(nomes){
    return Promise.all(nomes.filter(function(n){ return n.indexOf('plantinha-') === 0 && n !== CACHE; })
      .map(function(n){ return caches.delete(n); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  var nav = req.mode === 'navigate';
  e.respondWith(
    caches.match(nav ? './index.html' : req, {ignoreSearch: nav}).then(function(r){
      return r || fetch(req).then(function(resp){
        if (resp && resp.ok && resp.type === 'basic') { var copia = resp.clone(); caches.open(CACHE).then(function(c){ c.put(req, copia); }); }
        return resp;
      }).catch(function(){ return nav ? caches.match('./index.html') : Response.error(); });
    })
  );
});

// Toque na notificação abre (ou traz para frente) o jogo
self.addEventListener('notificationclick', function(e){
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window', includeUncontrolled:true}).then(function(cs){
    for (var i = 0; i < cs.length; i++) if ('focus' in cs[i]) return cs[i].focus();
    return self.clients.openWindow('./');
  }));
});
