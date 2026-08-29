var goog = {};
goog.provided_ = {};
goog.provide = function(name) {
  if (!goog.provided_[name]) {
    goog.provided_[name] = true;
    var parts = name.split('.');
    var obj = typeof window !== 'undefined' ? window : globalThis;
    for (var i = 0; i < parts.length; i++) {
      if (!(parts[i] in obj)) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    return obj;
  }
};
goog.require = function(name) {
  if (!goog.provided_[name]) throw new Error('goog.require: ' + name + ' not yet provided');
  var parts = name.split('.');
  var obj = typeof window !== 'undefined' ? window : globalThis;
  for (var i = 0; i < parts.length; i++) {
    if (!obj) break;
    obj = obj[parts[i]];
  }
  return obj;
};
goog.exportSymbol = function(publicPath, object, opt_obj) {
  var parts = publicPath.split('.');
  var target = opt_obj || (typeof window !== 'undefined' ? window : globalThis);
  for (var i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in target)) target[parts[i]] = {};
    target = target[parts[i]];
  }
  target[parts[parts.length - 1]] = object;
};
goog.exportProperty = function(object, publicPath, value) { object[publicPath] = value; };
goog.module = function(name) {};
goog.scope = function(fn) { fn(); };

// Minimal Closure Library stubs
goog.array = { remove: function(a,o){var i=a.indexOf(o);if(i>=0)a.splice(i,1);}, contains: function(a,o){return a.indexOf(o)>=0;}, insertAt: function(a,o,i){a.splice(i,0,o);}, removeAt: function(a,i){return a.splice(i,1)[0];}, clear: function(a){a.length=0;}, equals: function(a,b){if(a.length!==b.length)return false;for(var i=0;i<a.length;i++){if(a[i]!==b[i])return false;}return true;}, clone: function(a){return a.slice();}, extend: function(a,b){for(var i=0;i<b.length;i++)a.push(b[i]);return a;}, forEach: function(a,f,c){for(var i=0;i<a.length;i++)f.call(c,a[i],i,a);}, map: function(a,f,c){var r=[];for(var i=0;i<a.length;i++)r.push(f.call(c,a[i],i,a));return r;}, some: function(a,f,c){for(var i=0;i<a.length;i++)if(f.call(c,a[i],i,a))return true;return false;}, every: function(a,f,c){for(var i=0;i<a.length;i++)if(!f.call(c,a[i],i,a))return false;return true;}, find: function(a,f,c){for(var i=0;i<a.length;i++)if(f.call(c,a[i],i,a))return a[i];return undefined;}, findIndex: function(a,f,c){for(var i=0;i<a.length;i++)if(f.call(c,a[i],i,a))return i;return-1;}, isEmpty: function(a){return a.length===0;}, toArray: function(a){return Array.prototype.slice.call(a);} };
goog.asserts = { assert: function(c,m){if(!c)throw new Error(m||'Assertion failed');}, assertNumber: function(v){if(typeof v!=='number')throw new Error('Expected number');return v;}, assertString: function(v){if(typeof v!=='string')throw new Error('Expected string');return v;}, assertObject: function(v){if(typeof v!=='object')throw new Error('Expected object');return v;}, assertArray: function(v){if(!Array.isArray(v))throw new Error('Expected array');return v;}, assertInstanceof: function(v,t,m){if(!(v instanceof t))throw new Error(m||'Expected instanceof');return v;}, fail: function(m){throw new Error(m||'Assertion failed');} };
goog.math = { Coordinate: function(x,y){this.x=x;this.y=y;}, Size: function(w,h){this.width=w;this.height=h;}, clamp: function(v,mn,mx){return Math.min(Math.max(v,mn),mx);}, toRadians: function(d){return d*Math.PI/180;}, toDegrees: function(r){return r*180/Math.PI;}, lerp: function(a,b,x){return a+(b-a)*x;} };
goog.string = { startsWith: function(s,p){return s.lastIndexOf(p,0)===0;}, endsWith: function(s,x){var l=s.length-x.length;return l>=0&&s.indexOf(x,l)===l;}, contains: function(s,x){return s.indexOf(x)>=0;}, isEmptyOrWhitespace: function(s){return /^\s*$/.test(s);}, hashCode: function(s){var h=0;for(var i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;}return h;}, compareIgnoreCase: function(a,b){return a.toLowerCase().localeCompare(b.toLowerCase());}, removeWhitespace: function(s){return s.replace(/\s+/g,'');}, truncate: function(s,m){return s.length>m?s.substring(0,m-3)+'...':s;}, capitalize: function(s){return s.charAt(0).toUpperCase()+s.slice(1);}, toUpperCase: function(s){return s.toUpperCase();}, toLowerCase: function(s){return s.toLowerCase();}, caseInsensitiveStartsWith: function(s,p){return s.toLowerCase().lastIndexOf(p.toLowerCase(),0)===0;}, caseInsensitiveEndsWith: function(s,x){var l=s.length-x.length;return l>=0&&s.toLowerCase().indexOf(x.toLowerCase(),l)===l;}, subs: function(s){var a=Array.prototype.slice.call(arguments,1);for(var i=0;i<a.length;i++){var sp=s.split('%s');if(sp.length===0||sp.length>a.length+1)continue;s=sp[0];for(var j=0;j<sp.length-1;j++){s+=a[j]+sp[j+1];}}return s;} };
goog.object = { contains: function(o,k){return k in o;}, getKeys: function(o){var k=[];for(var p in o){if(o.hasOwnProperty(p))k.push(p);}return k;}, getValues: function(o){var v=[];for(var k in o){if(o.hasOwnProperty(k))v.push(o[k]);}return v;}, clone: function(o){var c={};for(var k in o){if(o.hasOwnProperty(k))c[k]=o[k];}return c;}, forEach: function(o,f,c){for(var k in o){if(o.hasOwnProperty(k))f.call(c,o[k],k,o);}}, isEmpty: function(o){for(var k in o){if(o.hasOwnProperty(k))return false;}return true;}, extend: function(t){for(var i=1;i<arguments.length;i++){var s=arguments[i];for(var k in s){if(s.hasOwnProperty(k))t[k]=s[k];}}return t;}, create: function(){if(arguments.length===1&&Array.isArray(arguments[0]))return goog.object.create.apply(null,arguments[0]);if(arguments.length%2)throw new Error('Uneven number of arguments');var o={};for(var i=0;i<arguments.length;i+=2){o[arguments[i]]=arguments[i+1];}return o;}, transpose: function(o){var t={};for(var k in o){if(o.hasOwnProperty(k))t[o[k]]=k;}return t;}, unsafeClone: function(o){if(typeof o==='object'&&o!==null)return JSON.parse(JSON.stringify(o));return o;} };
goog.dom = { createDom: function(t,a){var e=document.createElement(t);if(a){for(var k in a){if(a.hasOwnProperty(k)){if(k==='class')e.className=a[k];else if(k==='style')e.style.cssText=a[k];else e.setAttribute(k,a[k]);}}}for(var i=2;i<arguments.length;i++){var c=arguments[i];if(typeof c==='string')e.appendChild(document.createTextNode(c));else if(c&&c.appendChild)e.appendChild(c);}return e;}, getViewportSize: function(w){var win=w||window;if(win.innerWidth!=null)return new goog.math.Size(win.innerWidth,win.innerHeight);var d=win.document;if(document.compatMode==='CSS1Compat'&&d.documentElement.clientWidth!=null)return new goog.math.Size(d.documentElement.clientWidth,d.documentElement.clientHeight);return new goog.math.Size(d.body.clientWidth,d.body.clientHeight);}, getElement: function(e){return typeof e==='string'?document.getElementById(e):e;}, removeNode: function(n){if(n&&n.parentNode)n.parentNode.removeChild(n);return n;}, appendChild: function(p,c){p.appendChild(c);}, insertBefore: function(p,n,r){p.insertBefore(n,r);}, insertAfter: function(p,n,r){p.insertBefore(n,r?r.nextSibling:null);}, replaceNode: function(n,o){var p=o.parentNode;if(p)p.replaceChild(n,o);} };
goog.userAgent = { JSCRIPT:false, EDGE:typeof navigator!=='undefined'&&/Edge\/\d+/.test(navigator.userAgent), GECKO:typeof navigator!=='undefined'&&/Gecko\/\d+/.test(navigator.userAgent)&&!/like Gecko/.test(navigator.userAgent), WEBKIT:typeof navigator!=='undefined'&&/WebKit\//.test(navigator.userAgent)&&!/Edge\/\d+/.test(navigator.userAgent), MAC:typeof navigator!=='undefined'&&/Macintosh/.test(navigator.userAgent), WINDOWS:typeof navigator!=='undefined'&&/Windows/.test(navigator.userAgent), LINUX:typeof navigator!=='undefined'&&/Linux/.test(navigator.userAgent), PLATFORM:typeof navigator!=='undefined'?navigator.platform||'':'' };
goog.userAgent.product = { CHROME:typeof navigator!=='undefined'&&/Chrome/.test(navigator.userAgent)&&!/Edge/.test(navigator.userAgent), SAFARI:typeof navigator!=='undefined'&&/Safari/.test(navigator.userAgent)&&!/Chrome/.test(navigator.userAgent), FIREFOX:typeof navigator!=='undefined'&&/Firefox/.test(navigator.userAgent), IE:false, EDGE:typeof navigator!=='undefined'&&/Edge\/\d+/.test(navigator.userAgent) };
goog.css = { classes: { add: function(e,c){if(e.classList)e.classList.add(c);else e.className+=' '+c;}, remove: function(e,c){if(e.classList)e.classList.remove(c);else e.className=e.className.replace(new RegExp('(^|\\b)'+c+'(\\b|$)','g'),'');}, has: function(e,c){if(e.classList)return e.classList.contains(c);return new RegExp('(^|\\b)'+c+'(\\b|$)').test(e.className);}, toggle: function(e,c){if(goog.css.classes.has(e,c))goog.css.classes.remove(e,c);else goog.css.classes.add(e,c);}, enable: function(e,c,en){if(en)goog.css.classes.add(e,c);else goog.css.classes.remove(e,c);} } };
goog.events = { listen: function(s,t,l,c,h){s.addEventListener(t,h||l,!!c);return{key:t,src:s,listener:l,capture:!!c,handler:h||l};}, unlisten: function(k){if(k&&k.src)k.src.removeEventListener(k.key,k.handler,k.capture);}, unlistenByKey: function(k){goog.events.unlisten(k);}, removeAll: function(){}, getListeners: function(){return[];}, fireListeners: function(){return true;} };
goog.async = { nextTick: function(cb,c){if(typeof queueMicrotask==='function')queueMicrotask(c?cb.bind(c):cb);else setTimeout(c?cb.bind(c):cb,0);}, throwException: function(e){setTimeout(function(){throw e;},0);} };
goog.dispose = function(o){if(o&&typeof o.dispose==='function')o.dispose();};
goog.Disposable = function(){};
goog.Disposable.prototype.dispose = function(){};
goog.Disposable.prototype.isDisposed = function(){return false;};
goog.Uri = function(u){if(u!==undefined)this.parse_(u);};
goog.Uri.prototype.setPath = function(p){this.path_=p;return this;};
goog.Uri.prototype.getPath = function(){return this.path_||'';};
goog.Uri.prototype.getDomain = function(){return this.domain_||'';};
goog.Uri.prototype.setDomain = function(d){this.domain_=d;return this;};
goog.Uri.prototype.getProtocol = function(){return this.scheme_||'';};
goog.Uri.prototype.setProtocol = function(p){this.scheme_=p;return this;};
goog.Uri.prototype.getQuery = function(){return this.queryData_?this.queryData_.toString():'';};
goog.Uri.prototype.setQuery = function(q){this.queryData_=q;return this;};
goog.Uri.prototype.setParameterValue = function(){};
goog.Uri.prototype.getParameterValue = function(){return null;};
goog.Uri.prototype.toString = function(){var s='';if(this.scheme_)s+=this.scheme_+'://';if(this.domain_)s+=this.domain_;if(this.path_)s+=this.path_;return s;};
goog.Uri.prototype.parse_ = function(u){var m=u.match(/^(https?:\/\/)([^\/]+)([^?]*)(.*)/);if(m){this.scheme_=m[1].replace(/:$/,'').replace(/\//g,'');this.domain_=m[2];this.path_=m[3];}else{this.path_=u;}};
goog.Uri.parse = function(u){return new goog.Uri(u);};
