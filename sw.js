var C='shop-v20';
self.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){return c.addAll(['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable.png'])}));self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==C}).map(function(x){return caches.delete(x)}))}));self.clients.claim()});
self.addEventListener('fetch',function(e){
if(e.request.method!=='GET')return;
var u=new URL(e.request.url);
if(u.origin!==location.origin&&u.hostname!=='cdn.jsdelivr.net')return;
// Network-first: avoid keeping an old app/login bundle forever. Fall back to cache offline.
e.respondWith(fetch(e.request).then(function(r){
 if(r&&(r.ok||r.type==='opaque')){var cp=r.clone();caches.open(C).then(function(c){c.put(e.request,cp)});}
 return r;
}).catch(function(){return caches.match(e.request).then(function(cached){if(cached)return cached;throw new Error('Offline and no cached response')})}));
});
self.addEventListener('notificationclick',function(e){e.notification.close();var g=(e.notification.data&&e.notification.data.v)||'al';
e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(l){for(var i=0;i<l.length;i++){if('focus' in l[i]){l[i].postMessage({go:g});return l[i].focus()}}return self.clients.openWindow('./#'+g)}))});
