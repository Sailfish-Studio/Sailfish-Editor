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
goog.events = { BrowserFeature: { HAS_W3C_EVENT_SUPPORT: true, SET_KEY_CODE_TO_PREVENT_DEFAULT: false, HAS_W3C_BUTTON: true, HAS_W3C_MOUSEWHEEL: true, HAS_W3C_DETAIL: true, HAS_POINTER_EVENT: typeof window!=='undefined'&&!!window.PointerEvent, HAS_TOUCH_EVENTS: typeof window!=='undefined'&&('ontouchstart' in window), TOUCH_ENABLED: typeof window!=='undefined'&&('ontouchstart' in window||(navigator.maxTouchPoints||0)>0) }, listen: function(s,t,l,c,h){s.addEventListener(t,h||l,!!c);return{key:t,src:s,listener:l,capture:!!c,handler:h||l};}, unlisten: function(k){if(k&&k.src)k.src.removeEventListener(k.key,k.handler,k.capture);}, unlistenByKey: function(k){goog.events.unlisten(k);}, removeAll: function(){}, getListeners: function(){return[];}, fireListeners: function(){return true;} };
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

// --- Extended Closure stubs used by scratch-blocks runtime ---
goog.dom.TagName = { A:'a', BUTTON:'button', CANVAS:'canvas', DIV:'div', IMG:'img', INPUT:'input', LABEL:'label', LI:'li', SELECT:'select', SPAN:'span', SVG:'svg', TABLE:'table', TD:'td', TEXTAREA:'textarea', TR:'tr', UL:'ul' };
goog.dom.classes = { add:function(e,c){if(e.classList)e.classList.add(c);else e.className+=' '+c;}, remove:function(e,c){if(e.classList)e.classList.remove(c);else e.className=e.className.replace(new RegExp('(^|\\b)'+c+'(\\b|$)','g'),'');}, has:function(e,c){if(e.classList)return e.classList.contains(c);return new RegExp('(^|\\b)'+c+'(\\b|$)').test(e.className);}, toggle:function(e,c){if(goog.dom.classes.has(e,c))goog.dom.classes.remove(e,c);else goog.dom.classes.add(e,c);}, enable:function(e,c,en){if(en)goog.dom.classes.add(e,c);else goog.dom.classes.remove(e,c);}, swap:function(e,a,b){goog.dom.classes.remove(e,a);goog.dom.classes.add(e,b);} };
goog.dom.createElement = function(tag){return document.createElement(tag);};
goog.dom.contains = function(a,b){return a&&b?(a===b||!!(a.compareDocumentPosition(b)&16)):false;};
goog.dom.getDocumentScroll = function(){return new goog.math.Coordinate(window.pageXOffset||document.documentElement.scrollLeft||0,window.pageYOffset||document.documentElement.scrollTop||0);};
goog.dom.insertSiblingAfter = function(n,r){if(r&&r.parentNode)r.parentNode.insertBefore(n,r.nextSibling);};
goog.dom.removeChildren = function(n){while(n.firstChild)n.removeChild(n.firstChild);};
goog.dom.animationFrame = { polyfill: function(){} };

goog.style = {
  setStyle: function(e,s){if(typeof s==='string'){e.style.cssText=s;}else{for(var k in s){if(s.hasOwnProperty(k)){try{e.style[k]=s[k];}catch(_e){}}}}},
  getSize: function(e){var r=e.getBoundingClientRect();return new goog.math.Size(r.width||e.offsetWidth||0,r.height||e.offsetHeight||0);},
  getPageOffset: function(e){var r=e.getBoundingClientRect();return new goog.math.Coordinate(r.left+(window.pageXOffset||0),r.top+(window.pageYOffset||0));},
  getViewportPageOffset: function(){return new goog.math.Coordinate(window.pageXOffset||0,window.pageYOffset||0);}
};

goog.math.Rect = function(x,y,w,h){this.left=x;this.top=y;this.width=w;this.height=h;};
goog.math.Rect.prototype.getLeft=function(){return this.left;};
goog.math.Rect.prototype.getTop=function(){return this.top;};
goog.math.Rect.prototype.getWidth=function(){return this.width;};
goog.math.Rect.prototype.getHeight=function(){return this.height;};
goog.math.Rect.prototype.getRight=function(){return this.left+this.width;};
goog.math.Rect.prototype.getBottom=function(){return this.top+this.height;};
goog.math.Rect.prototype.getSize=function(){return new goog.math.Size(this.width,this.height);};
goog.math.Rect.prototype.getTopLeft=function(){return new goog.math.Coordinate(this.left,this.top);};
goog.math.Rect.prototype.clone=function(){return new goog.math.Rect(this.left,this.top,this.width,this.height);};
goog.math.Rect.prototype.contains=function(r){return r instanceof goog.math.Rect?this.left<=r.left&&this.right>=r.right&&this.top<=r.top&&this.bottom>=r.bottom:this.containsPoint(r);};
goog.math.Rect.prototype.containsPoint=function(c){return c.x>=this.left&&c.x<=this.left+this.width&&c.y>=this.top&&c.y<=this.top+this.height;};
goog.math.Rect.prototype.intersects=function(r){return this.left<r.getRight()&&r.getLeft()<this.getRight()&&this.top<r.getBottom()&&r.getTop()<this.getBottom();};
goog.math.Rect.prototype.intersection=function(r){var x0=Math.max(this.left,r.getLeft()),x1=Math.min(this.left+this.width,r.getRight()),y0=Math.max(this.top,r.getTop()),y1=Math.min(this.top+this.height,r.getBottom());if(x0<=x1&&y0<=y1)return new goog.math.Rect(x0,y0,x1-x0,y1-y0);return null;};
goog.math.Rect.prototype.boundingRect=function(r){var x0=Math.min(this.left,r.left),y0=Math.min(this.top,r.top),x1=Math.max(this.getRight(),r.getRight()),y1=Math.max(this.getBottom(),r.getBottom());return new goog.math.Rect(x0,y0,x1-x0,y1-y0);};
goog.math.Coordinate.prototype.add=function(c){this.x+=c.x;this.y+=c.y;return this;};
goog.math.Coordinate.prototype.difference=function(c){return new goog.math.Coordinate(this.x-c.x,this.y-c.y);};
goog.math.Coordinate.prototype.scale=function(sx,sy){this.x*=sx;this.y*=sy;return this;};
goog.math.Coordinate.prototype.offset=function(dx,dy){this.x+=dx;this.y+=dy;return this;};
goog.math.Coordinate.prototype.toString=function(){return '('+this.x+', '+this.y+')';};
goog.math.Coordinate.prototype.equals=function(other){return other!=null&&this.x===other.x&&this.y===other.y;};
goog.math.Coordinate.distance=function(a,b){var dx=a.x-b.x,dy=a.y-b.y;return Math.sqrt(dx*dx+dy*dy);};
goog.math.Coordinate.equals=function(a,b){return a!=null&&b!=null&&a.x===b.x&&a.y===b.y;};

goog.Timer = { callOnce: function(fn,ms){var h=setTimeout(function(){fn.call(null);},ms||1);if(h.unref)h.unref();return h;}, clear: function(h){clearTimeout(h);} };

goog.color = {
  hexToRgb: function(hex){var h=String(hex).replace('#','');if(h.length===3)h=h.replace(/(.)/g,'$1$1');var n=parseInt(h,16);return [(n>>16)&255,(n>>8)&255,n&255];},
  rgbArrayToHex: function(rgb){return '#'+((1<<24)|(rgb[0]<<16)|(rgb[1]<<8)|rgb[2]).toString(16).slice(1);},
  rgbToHsv: function(r,g,b){r/=255;g/=255;b/=255;var max=Math.max(r,g,b),min=Math.min(r,g,b),h=0,s=max===0?0:1-min/max,v=max;if(max!==min){var d=max-min;if(max===r)h=(g-b)/d+(g<b?6:0);else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h/=6;}return [h*360,s*100,v*100];},
  hexToHsv: function(hex){var rgb=goog.color.hexToRgb(hex);return goog.color.rgbToHsv(rgb[0],rgb[1],rgb[2]);},
  hsvToRgb: function(h,s,v){h=((h%360)+360)%360;s/=100;v/=100;var c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c,rs=0,gs=0,bs=0;if(h<60){rs=c;gs=x;}else if(h<120){rs=x;gs=c;}else if(h<180){gs=c;bs=x;}else if(h<240){gs=x;bs=c;}else if(h<300){rs=x;bs=c;}else{rs=c;bs=x;}return [Math.round((rs+m)*255),Math.round((gs+m)*255),Math.round((bs+m)*255)];},
  hsvToHex: function(h,s,v){return goog.color.rgbArrayToHex(goog.color.hsvToRgb(h,s,v));},
  darken: function(hex,factor){var rgb=goog.color.hexToRgb(hex);return goog.color.rgbArrayToHex(rgb.map(function(v){return Math.max(0,Math.round(v*(1-factor)));}));}
};

goog.html = {
  SafeHtml: function(s){this.s=s;},
  SafeStyle: function(s){this.s=s;}
};
goog.html.SafeHtml.create = function(tag, attrs, content) {
  var e = document.createElement(tag);
  if (attrs) for (var k in attrs) if (attrs.hasOwnProperty(k)) {
    if (k === 'class') e.className = attrs[k];
    else if (k === 'style' && typeof attrs[k] === 'string') e.style.cssText = attrs[k];
    else e.setAttribute(k, attrs[k]);
  }
  if (content != null) {
    if (typeof content === 'string') e.textContent = content;
    else if (content.s != null) e.textContent = content.s;
    else if (content.appendChild) e.appendChild(content);
  }
  return e;
};
goog.html.SafeHtml.htmlEscape = function(s) {
  return String(s).replace(/[&<>"']/g, function(c) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
};
goog.html.SafeHtml.concat = function() {
  var parts = [];
  for (var i = 0; i < arguments.length; i++) parts.push(arguments[i].s != null ? arguments[i].s : String(arguments[i]));
  return new goog.html.SafeHtml(parts.join(''));
};

goog.html.SafeHtml.prototype.toString=function(){return this.s;};
goog.html.SafeStyle.prototype.toString=function(){return this.s;};

goog.ui = {
  Component: function(){} , MenuItem: function(){} , Menu: function(){} , Slider: function(){} , DatePicker: function(){} , ColorPicker: function(){},
  tree: { TreeControl: function(){}, TreeNode: function(){} }
};
goog.ui.Component.EventType={ACTION:'action',CHANGE:'change',CLICK:'click'};
goog.ui.Component.setDefaultRightToLeft=function(){};
goog.ui.ColorPicker.EventType={CHANGE:'change'};
goog.ui.ColorPicker.SIMPLE_GRID_COLORS=[];
goog.ui.DatePicker.Events={CHANGE:'change'};
goog.ui.MenuItemRenderer={};goog.ui.MenuRenderer={};goog.ui.MenuSeparatorRenderer={};

goog.date = { DateTime: function(){} };
goog.i18n = { DateTimeSymbols: {}, DateTimeSymbols_he: {}, compactNumberingSystems: {}, NumberFormatSymbols: {} };

// --- core goog runtime helpers used by scratch-blocks ---
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {}
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  childCtor.prototype.constructor = childCtor;
};
goog.global = typeof window !== 'undefined' ? window : globalThis;
goog.isString = function(v){ return typeof v === 'string'; };
goog.isNumber = function(v){ return typeof v === 'number'; };
goog.isFunction = function(v){ return typeof v === 'function'; };
goog.isBoolean = function(v){ return typeof v === 'boolean'; };
goog.isArray = function(v){ return Array.isArray(v); };
goog.isDef = function(v){ return v !== undefined; };
goog.isNull = function(v){ return v === null; };
goog.isDefAndNotNull = function(v){ return v != null; };
goog.isObject = function(v){ return v != null && (typeof v === 'object' || typeof v === 'function'); };
goog.mixin = function(target, source) {
  for (var k in source) {
    if (!(k in target)) target[k] = source[k];
  }
  return target;
};
goog.getObjectByName = function(name, obj) {
  obj = obj || goog.global;
  var parts = name.split('.');
  for (var i = 0; i < parts.length; i++) {
    obj = obj[parts[i]];
    if (obj == null) return null;
  }
  return obj;
};
goog.DEBUG = false;
goog.getMsg = function(msg, vars) {
  if (vars) {
    return String(msg).replace(/\{\$([a-zA-Z0-9_]+)\}/g, function(_, n) {
      return vars[n] != null ? vars[n] : '{$' + n + '}';
    });
  }
  return msg;
};
goog.getMsgOrig = goog.getMsg;

// Extra goog.string helpers used by scratch-blocks
goog.string.repeat = function(s, n) { return (new Array((n || 0) + 1)).join(s); };
goog.string.trim = function(s) { return String(s).replace(/^\s+|\s+$/g, ''); };
goog.string.htmlEscape = function(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};
goog.string.caseInsensitiveEquals = function(a, b) { return String(a).toLowerCase() === String(b).toLowerCase(); };

// Deferred inheritance: applied after all scratch-blocks modules have run, so
// base classes are guaranteed to be final regardless of file ordering.
goog.__inheritQueue__ = [];
goog.__inheritLater__ = function(childAccessor, parentAccessor) {
  goog.__inheritQueue__.push([childAccessor, parentAccessor]);
};
goog.__inheritFlush__ = function() {
  for (var i = 0; i < goog.__inheritQueue__.length; i++) {
    var child = goog.__inheritQueue__[i][0]();
    var parent = goog.__inheritQueue__[i][1]();
    if (child == null || parent == null) continue;
    child.superClass_ = parent.prototype;
    if (typeof Object.setPrototypeOf === 'function') {
      Object.setPrototypeOf(child.prototype, parent.prototype);
    } else {
      child.prototype.__proto__ = parent.prototype;
    }
    child.prototype.constructor = child;
  }
  goog.__inheritQueue__ = [];
};
