var xe,$,Pt,Kn,K,Rt,At,It,Ze,ke,le,Tt,Qe,Je,Ye,Xn,$e={},Se=[],Vn=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,Re=Array.isArray;function F(t,e){for(var n in e)t[n]=e[n];return t}function et(t){t&&t.parentNode&&t.parentNode.removeChild(t)}function re(t,e,n){var r,s,o,i={};for(o in e)o=="key"?r=e[o]:o=="ref"?s=e[o]:i[o]=e[o];if(arguments.length>2&&(i.children=arguments.length>3?xe.call(arguments,2):n),typeof t=="function"&&t.defaultProps!=null)for(o in t.defaultProps)i[o]===void 0&&(i[o]=t.defaultProps[o]);return we(t,i,r,s,null)}function we(t,e,n,r,s){var o={type:t,props:e,key:n,ref:r,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:s??++Pt,__i:-1,__u:0};return s==null&&$.vnode!=null&&$.vnode(o),o}function oe(t){return t.children}function ce(t,e){this.props=t,this.context=e}function Q(t,e){if(e==null)return t.__?Q(t.__,t.__i+1):null;for(var n;e<t.__k.length;e++)if((n=t.__k[e])!=null&&n.__e!=null)return n.__e;return typeof t.type=="function"?Q(t):null}function Zn(t){if(t.__P&&t.__d){var e=t.__v,n=e.__e,r=[],s=[],o=F({},e);o.__v=e.__v+1,$.vnode&&$.vnode(o),tt(t.__P,o,e,t.__n,t.__P.namespaceURI,32&e.__u?[n]:null,r,n??Q(e),!!(32&e.__u),s),o.__v=e.__v,o.__.__k[o.__i]=o,Gt(r,o,s),e.__e=e.__=null,o.__e!=n&&Nt(o)}}function Nt(t){if((t=t.__)!=null&&t.__c!=null)return t.__e=t.__c.base=null,t.__k.some(function(e){if(e!=null&&e.__e!=null)return t.__e=t.__c.base=e.__e}),Nt(t)}function Ct(t){(!t.__d&&(t.__d=!0)&&K.push(t)&&!Me.__r++||Rt!=$.debounceRendering)&&((Rt=$.debounceRendering)||At)(Me)}function Me(){try{for(var t,e=1;K.length;)K.length>e&&K.sort(It),t=K.shift(),e=K.length,Zn(t)}finally{K.length=Me.__r=0}}function Lt(t,e,n,r,s,o,i,u,c,l,f){var _,a,d,h,y,k,g=r&&r.__k||Se,b=e.length;for(c=Jn(n,e,g,c,b),_=0;_<b;_++)(d=n.__k[_])!=null&&(a=d.__i!=-1&&g[d.__i]||$e,d.__i=_,k=tt(t,d,a,s,o,i,u,c,l,f),h=d.__e,d.ref&&a.ref!=d.ref&&(a.ref&&nt(a.ref,null,d),f.push(d.ref,d.__c||h,d)),y==null&&h!=null&&(y=h),4&d.__u?(c=Ot(d,c,t),a.__e&&(a.__e=null)):typeof d.type=="function"&&k!==void 0?c=k:h&&(c=h.nextSibling),d.__u&=-7);return n.__e=y,c}function Jn(t,e,n,r,s){var o,i,u,c,l,f=n.length,_=f,a=0;for(t.__k=new Array(s),o=0;o<s;o++)(i=e[o])!=null&&typeof i!="boolean"&&typeof i!="function"?(typeof i=="string"||typeof i=="number"||typeof i=="bigint"||i.constructor==String?i=t.__k[o]=we(null,i,null,null,null):Re(i)?i=t.__k[o]=we(oe,{children:i},null,null,null):i.constructor===void 0&&i.__b>0?i=t.__k[o]=we(i.type,i.props,i.key,i.ref?i.ref:null,i.__v):t.__k[o]=i,c=o+a,i.__=t,i.__b=t.__b+1,u=null,(l=i.__i=Yn(i,n,c,_))!=-1&&(_--,(u=n[l])&&(u.__u|=2)),u==null||u.__v==null?(l==-1&&(s>f?a--:s<f&&a++),typeof i.type!="function"&&(i.__u|=4)):l!=c&&(l==c-1?a--:l==c+1?a++:(l>c?a--:a++,i.__u|=4))):t.__k[o]=null;if(_)for(o=0;o<f;o++)(u=n[o])!=null&&(2&u.__u)==0&&(u.__e==r&&(r=Q(u)),Ht(u,u));return r}function Ot(t,e,n){var r,s;if(typeof t.type=="function"){for(r=t.__k,s=0;r&&s<r.length;s++)r[s]&&(r[s].__=t,e=Ot(r[s],e,n));return e}t.__e!=e&&(e&&t.type&&!e.parentNode&&(e=Q(t)),e=n.insertBefore(t.__e,e||null));do e=e&&e.nextSibling;while(e!=null&&e.nodeType==8);return e}function Yn(t,e,n,r){var s,o,i,u=t.key,c=t.type,l=e[n],f=l!=null&&(2&l.__u)==0;if(l===null&&u==null||f&&u==l.key&&c==l.type)return n;if(r>(f?1:0)){for(s=n-1,o=n+1;s>=0||o<e.length;)if((l=e[i=s>=0?s--:o++])!=null&&(2&l.__u)==0&&u==l.key&&c==l.type)return i}return-1}function Et(t,e,n){e[0]=="-"?t.setProperty(e,n??""):t[e]=n==null?"":typeof n!="number"||Vn.test(e)?n:n+"px"}function ve(t,e,n,r,s){var o,i;e:if(e=="style")if(typeof n=="string")t.style.cssText=n;else{if(typeof r=="string"&&(t.style.cssText=r=""),r)for(e in r)n&&e in n||Et(t.style,e,"");if(n)for(e in n)r&&n[e]==r[e]||Et(t.style,e,n[e])}else if(e[0]=="o"&&e[1]=="n")o=e!=(e=e.replace(Tt,"$1")),i=e.toLowerCase(),e=i in t||e=="onFocusOut"||e=="onFocusIn"?i.slice(2):e.slice(2),t.l||(t.l={}),t.l[e+o]=n,n?r?n[le]=r[le]:(n[le]=Qe,t.addEventListener(e,o?Ye:Je,o)):t.removeEventListener(e,o?Ye:Je,o);else{if(s=="http://www.w3.org/2000/svg")e=e.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if(e!="width"&&e!="height"&&e!="href"&&e!="list"&&e!="form"&&e!="tabIndex"&&e!="download"&&e!="rowSpan"&&e!="colSpan"&&e!="role"&&e!="popover"&&e in t)try{t[e]=n??"";break e}catch{}typeof n=="function"||(n==null||n===!1&&e[4]!="-"?t.removeAttribute(e):t.setAttribute(e,e=="popover"&&n==1?"":n))}}function zt(t){return function(e){if(this.l){var n=this.l[e.type+t];if(e[ke]==null)e[ke]=Qe++;else if(e[ke]<n[le])return;return n($.event?$.event(e):e)}}}function tt(t,e,n,r,s,o,i,u,c,l){var f,_,a,d,h,y,k,g,b,v,x,L,q,he,j,H,E=e.type;if(e.constructor!==void 0)return null;128&n.__u&&(c=!!(32&n.__u),o=[u=e.__e=n.__e]),(f=$.__b)&&f(e);e:if(typeof E=="function"){_=i.length;try{if(b=e.props,v=E.prototype&&E.prototype.render,x=(f=E.contextType)&&r[f.__c],L=f?x?x.props.value:f.__:r,n.__c?g=(a=e.__c=n.__c).__=a.__E:(v?e.__c=a=new E(b,L):(e.__c=a=new ce(b,L),a.constructor=E,a.render=er),x&&x.sub(a),a.state||(a.state={}),a.__n=r,d=a.__d=!0,a.__h=[],a._sb=[]),v&&a.__s==null&&(a.__s=a.state),v&&E.getDerivedStateFromProps!=null&&(a.__s==a.state&&(a.__s=F({},a.__s)),F(a.__s,E.getDerivedStateFromProps(b,a.__s))),h=a.props,y=a.state,a.__v=e,d)v&&E.getDerivedStateFromProps==null&&a.componentWillMount!=null&&a.componentWillMount(),v&&a.componentDidMount!=null&&a.__h.push(a.componentDidMount);else{if(v&&E.getDerivedStateFromProps==null&&b!==h&&a.componentWillReceiveProps!=null&&a.componentWillReceiveProps(b,L),e.__v==n.__v||!a.__e&&a.shouldComponentUpdate!=null&&a.shouldComponentUpdate(b,a.__s,L)===!1){e.__v!=n.__v&&(a.props=b,a.state=a.__s,a.__d=!1),e.__e=n.__e,e.__k=n.__k,e.__k.some(function(T){T&&(T.__=e)}),Se.push.apply(a.__h,a._sb),a._sb=[],a.__h.length&&i.push(a),u=Q(n);break e}a.componentWillUpdate!=null&&a.componentWillUpdate(b,a.__s,L),v&&a.componentDidUpdate!=null&&a.__h.push(function(){a.componentDidUpdate(h,y,k)})}if(a.context=L,a.props=b,a.__P=t,a.__e=!1,q=$.__r,he=0,v)a.state=a.__s,a.__d=!1,q&&q(e),f=a.render(a.props,a.state,a.context),Se.push.apply(a.__h,a._sb),a._sb=[];else do a.__d=!1,q&&q(e),f=a.render(a.props,a.state,a.context),a.state=a.__s;while(a.__d&&++he<25);a.state=a.__s,a.getChildContext!=null&&(r=F(F({},r),a.getChildContext())),v&&!d&&a.getSnapshotBeforeUpdate!=null&&(k=a.getSnapshotBeforeUpdate(h,y)),j=f!=null&&f.type===oe&&f.key==null?qt(f.props.children):f,u=Lt(t,Re(j)?j:[j],e,n,r,s,o,i,u,c,l),a.base=e.__e,e.__u&=-161,a.__h.length&&i.push(a),g&&(a.__E=a.__=null)}catch(T){if(i.length=_,e.__v=null,c||o!=null){if(T.then){for(e.__u|=c?160:128;u&&u.nodeType==8&&u.nextSibling;)u=u.nextSibling;o!=null&&(o[o.indexOf(u)]=null),e.__e=u}else if(o!=null)for(H=o.length;H--;)et(o[H])}else e.__e=n.__e;e.__k==null&&(e.__k=n.__k||[]),T.then||Dt(e),$.__e(T,e,n)}}else o==null&&e.__v==n.__v?(e.__k=n.__k,e.__e=n.__e):u=e.__e=Qn(n.__e,e,n,r,s,o,i,c,l);return(f=$.diffed)&&f(e),128&e.__u?void 0:u}function Dt(t){t&&(t.__c&&(t.__c.__e=!0),t.__k&&t.__k.some(Dt))}function Gt(t,e,n){for(var r=0;r<n.length;r++)nt(n[r],n[++r],n[++r]);$.__c&&$.__c(e,t),t.some(function(s){try{t=s.__h,s.__h=[],t.some(function(o){o.call(s)})}catch(o){$.__e(o,s.__v)}})}function qt(t){return typeof t!="object"||t==null||t.__b>0?t:Re(t)?t.map(qt):t.constructor!==void 0?null:F({},t)}function Qn(t,e,n,r,s,o,i,u,c){var l,f,_,a,d,h,y,k=n.props||$e,g=e.props,b=e.type;if(b=="svg"?s="http://www.w3.org/2000/svg":b=="math"?s="http://www.w3.org/1998/Math/MathML":s||(s="http://www.w3.org/1999/xhtml"),o!=null){for(l=0;l<o.length;l++)if((d=o[l])&&"setAttribute"in d==!!b&&(b?d.localName==b:d.nodeType==3)){t=d,o[l]=null;break}}if(t==null){if(b==null)return document.createTextNode(g);t=document.createElementNS(s,b,g.is&&g),u&&($.__m&&$.__m(e,o),u=!1),o=null}if(b==null)k===g||u&&t.data==g||(t.data=g);else{if(o=b=="textarea"&&g.defaultValue!=null?null:o&&xe.call(t.childNodes),!u&&o!=null)for(k={},l=0;l<t.attributes.length;l++)k[(d=t.attributes[l]).name]=d.value;for(l in k)d=k[l],l=="dangerouslySetInnerHTML"?_=d:l=="children"||l in g||l=="value"&&"defaultValue"in g||l=="checked"&&"defaultChecked"in g||ve(t,l,null,d,s);for(l in g)d=g[l],l=="children"?a=d:l=="dangerouslySetInnerHTML"?f=d:l=="value"?h=d:l=="checked"?y=d:u&&typeof d!="function"||k[l]===d||ve(t,l,d,k[l],s);if(f)u||_&&(f.__html==_.__html||f.__html==t.innerHTML)||(t.innerHTML=f.__html),e.__k=[];else if(_&&(t.innerHTML=""),Lt(e.type=="template"?t.content:t,Re(a)?a:[a],e,n,r,b=="foreignObject"?"http://www.w3.org/1999/xhtml":s,o,i,o?o[0]:n.__k&&Q(n,0),u,c),o!=null)for(l=o.length;l--;)et(o[l]);u&&b!="textarea"||(l="value",b=="progress"&&h==null?t.removeAttribute("value"):h!=null&&(h!==t[l]||b=="progress"&&!h||b=="option"&&h!=k[l])&&ve(t,l,h,k[l],s),l="checked",y!=null&&y!=t[l]&&ve(t,l,y,k[l],s))}return t}function nt(t,e,n){try{if(typeof t=="function"){var r=typeof t.__u=="function";r&&t.__u(),r&&e==null||(t.__u=t(e))}else t.current=e}catch(s){$.__e(s,n)}}function Ht(t,e,n){var r,s;if($.unmount&&$.unmount(t),(r=t.ref)&&(r.current&&r.current!=t.__e||nt(r,null,e)),(r=t.__c)!=null){if(r.componentWillUnmount)try{r.componentWillUnmount()}catch(o){$.__e(o,e)}r.base=r.__P=r.__n=null}if(r=t.__k)for(s=0;s<r.length;s++)r[s]&&Ht(r[s],e,n||typeof t.type!="function");n||et(t.__e),t.__c=t.__=t.__e=void 0}function er(t,e,n){return this.constructor(t,n)}function rt(t,e,n){var r,s,o,i;e==document&&(e=document.documentElement),$.__&&$.__(t,e),s=(r=typeof n=="function")?null:n&&n.__k||e.__k,o=[],i=[],tt(e,t=(!r&&n||e).__k=re(oe,null,[t]),s||$e,$e,e.namespaceURI,!r&&n?[n]:s?null:e.firstChild?xe.call(e.childNodes):null,o,!r&&n?n:s?s.__e:e.firstChild,r,i),Gt(o,t,i),t.props.children=null}xe=Se.slice,$={__e:function(t,e,n,r){for(var s,o,i;e=e.__;)if((s=e.__c)&&!s.__)try{if((o=s.constructor)&&o.getDerivedStateFromError!=null&&(s.setState(o.getDerivedStateFromError(t)),i=s.__d),s.componentDidCatch!=null&&(s.componentDidCatch(t,r||{}),i=s.__d),i)return s.__E=s}catch(u){t=u}throw t}},Pt=0,Kn=function(t){return t!=null&&t.constructor===void 0},ce.prototype.setState=function(t,e){var n;n=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=F({},this.state),typeof t=="function"&&(t=t(F({},n),this.props)),t&&F(n,t),t!=null&&this.__v&&(e&&this._sb.push(e),Ct(this))},ce.prototype.forceUpdate=function(t){this.__v&&(this.__e=!0,t&&this.__h.push(t),Ct(this))},ce.prototype.render=oe,K=[],At=typeof Promise=="function"?Promise.prototype.then.bind(Promise.resolve()):setTimeout,It=function(t,e){return t.__v.__b-e.__v.__b},Me.__r=0,Ze=Math.random().toString(8),ke="__d"+Ze,le="__a"+Ze,Tt=/(PointerCapture)$|Capture$/i,Qe=0,Je=zt(!1),Ye=zt(!0),Xn=0;var Ft=function(t,e,n,r){var s;e[0]=0;for(var o=1;o<e.length;o++){var i=e[o++],u=e[o]?(e[0]|=i?1:2,n[e[o++]]):e[++o];i===3?r[0]=u:i===4?r[1]=Object.assign(r[1]||{},u):i===5?(r[1]=r[1]||{})[e[++o]]=u:i===6?r[1][e[++o]]+=u+"":i?(s=t.apply(u,Ft(t,u,n,["",null])),r.push(s),u[0]?e[0]|=2:(e[o-2]=0,e[o]=s)):r.push(u)}return r},Ut=new Map;function Bt(t){var e=Ut.get(this);return e||(e=new Map,Ut.set(this,e)),(e=Ft(this,e.get(t)||(e.set(t,e=(function(n){for(var r,s,o=1,i="",u="",c=[0],l=function(a){o===1&&(a||(i=i.replace(/^\s*\n\s*|\s*\n\s*$/g,"")))?c.push(0,a,i):o===3&&(a||i)?(c.push(3,a,i),o=2):o===2&&i==="..."&&a?c.push(4,a,0):o===2&&i&&!a?c.push(5,0,!0,i):o>=5&&((i||!a&&o===5)&&(c.push(o,0,i,s),o=6),a&&(c.push(o,a,0,s),o=6)),i=""},f=0;f<n.length;f++){f&&(o===1&&l(),l(f));for(var _=0;_<n[f].length;_++)r=n[f][_],o===1?r==="<"?(l(),c=[c],o=3):i+=r:o===4?i==="--"&&r===">"?(o=1,i=""):i=r+i[0]:u?r===u?u="":i+=r:r==='"'||r==="'"?u=r:r===">"?(l(),o=1):o&&(r==="="?(o=5,s=i,i=""):r==="/"&&(o<5||n[f][_+1]===">")?(l(),o===3&&(c=c[0]),o=c,(c=c[0]).push(2,0,o),o=0):r===" "||r==="	"||r===`
`||r==="\r"?(l(),o=2):i+=r),o===3&&i==="!--"&&(o=4,c=c[0])}return l(),c})(t)),e),arguments,[])).length>1?e:e[0]}var Wt=Bt.bind(re);var R=(...t)=>{let e=Wt(...t);return Array.isArray(e)?re(oe,null,...e):e};function jt(){return R`
    <header class="app-header">
      <h1>Huedoku</h1>
    </header>
  `}var fe,M,ot,Kt,Ee=0,tn=[],C=$,Xt=C.__b,Vt=C.__r,Zt=C.diffed,Jt=C.__c,Yt=C.unmount,Qt=C.__;function it(t,e){C.__h&&C.__h(M,t,Ee||e),Ee=0;var n=M.__H||(M.__H={__:[],__h:[]});return t>=n.__.length&&n.__.push({}),n.__[t]}function I(t){return Ee=1,tr(rn,t)}function tr(t,e,n){var r=it(fe++,2);if(r.t=t,!r.__c&&(r.__=[n?n(e):rn(void 0,e),function(u){var c=r.__N?r.__N[0]:r.__[0],l=r.t(c,u);c!==l&&(r.__N=[l,r.__[1]],r.__c.setState({}))}],r.__c=M,!M.__f)){var s=function(u,c,l){if(!r.__c.__H)return!0;var f=!1,_=r.__c.props!==u;if(r.__c.__H.__.some(function(d){if(d.__N){f=!0;var h=d.__[0];d.__=d.__N,d.__N=void 0,h!==d.__[0]&&(_=!0)}}),o){var a=o.call(this,u,c,l);return f?a||_:a}return!f||_};M.__f=!0;var o=M.shouldComponentUpdate,i=M.componentWillUpdate;M.componentWillUpdate=function(u,c,l){if(this.__e){var f=o;o=void 0,s(u,c,l),o=f}i&&i.call(this,u,c,l)},M.shouldComponentUpdate=s}return r.__N||r.__}function ze(t,e){var n=it(fe++,3);!C.__s&&nn(n.__H,e)&&(n.__=t,n.u=e,M.__H.__h.push(n))}function B(t){return Ee=5,nr(function(){return{current:t}},[])}function nr(t,e){var n=it(fe++,7);return nn(n.__H,e)&&(n.__=t(),n.__H=e,n.__h=t),n.__}function rr(){for(var t;t=tn.shift();){var e=t.__H;if(t.__P&&e)try{e.__h.some(Ce),e.__h.some(st),e.__h=[]}catch(n){e.__h=[],C.__e(n,t.__v)}}}C.__b=function(t){M=null,Xt&&Xt(t)},C.__=function(t,e){t&&e.__k&&e.__k.__m&&(t.__m=e.__k.__m),Qt&&Qt(t,e)},C.__r=function(t){Vt&&Vt(t),fe=0;var e=(M=t.__c).__H;e&&(ot===M?(e.__h=[],M.__h=[],e.__.some(function(n){n.__N&&(n.__=n.__N),n.u=n.__N=void 0})):(e.__h.some(Ce),e.__h.some(st),e.__h=[],fe=0)),ot=M},C.diffed=function(t){Zt&&Zt(t);var e=t.__c;e&&e.__H&&(e.__H.__h.length&&(tn.push(e)!==1&&Kt===C.requestAnimationFrame||((Kt=C.requestAnimationFrame)||or)(rr)),e.__H.__.some(function(n){n.u&&(n.__H=n.u,n.u=void 0)})),ot=M=null},C.__c=function(t,e){e.some(function(n){try{n.__h.some(Ce),n.__h=n.__h.filter(function(r){return!r.__||st(r)})}catch(r){e.some(function(s){s.__h&&(s.__h=[])}),e=[],C.__e(r,n.__v)}}),Jt&&Jt(t,e)},C.unmount=function(t){Yt&&Yt(t);var e,n=t.__c;n&&n.__H&&(n.__H.__.some(function(r){try{Ce(r)}catch(s){e=s}}),n.__H=void 0,e&&C.__e(e,n.__v))};var en=typeof requestAnimationFrame=="function";function or(t){var e,n=function(){clearTimeout(r),en&&cancelAnimationFrame(e),setTimeout(t)},r=setTimeout(n,35);en&&(e=requestAnimationFrame(n))}function Ce(t){var e=M,n=t.__c;typeof n=="function"&&(t.__c=void 0,n()),M=e}function st(t){var e=M;t.__c=t.__(),M=e}function nn(t,e){return!t||t.length!==e.length||e.some(function(n,r){return n!==t[r]})}function rn(t,e){return typeof e=="function"?e(t):e}var sr=["single","confinement","pair","group","what-if","stuck"];function ir(t){let e=0;for(;t;e++)t&=t-1;return e}function on(t){return{open:[...t.open],done:t.done.map(e=>[...e]),winners:[...t.winners]}}function _e(t,e,n,r){return e===0?r===n?t.full:0:e===1?1<<n:t.regionMasks[n][r]}function sn(t,e,n,r){let s=0;for(let o=0;o<t.size;o++)s+=ir(e.open[o]&_e(t,n,r,o));return s}function Ae(t,e,n,r){let s=t.regions[n*t.size+r],o=7<<r>>1;for(let i=0;i<t.size;i++){let u=e.open[i]&~t.regionMasks[s][i]&~(1<<r);i===n?u=0:Math.abs(i-n)===1&&(u&=~o),e.open[i]=u}e.done[0][n]=e.done[1][r]=e.done[2][s]=!0,e.winners[n]=r}function ar(t,e){for(let n of[0,1,2])for(let r=0;r<t.size;r++)if(!e.done[n][r]&&sn(t,e,n,r)===0)return!0;return!1}function ur(t,e){for(let n of[0,1,2])for(let r=0;r<t.size;r++){if(e.done[n][r])continue;let s=sn(t,e,n,r);if(s===0)return"contradiction";if(!(s>1))for(let o=0;o<t.size;o++){let i=e.open[o]&_e(t,n,r,o);if(i)return Ae(t,e,o,31-Math.clz32(i)),"progress"}}return"none"}function*an(t,e){if(e===0){yield[];return}for(let n=0;n<=t.length-e;n++)for(let r of an(t.slice(n+1),e-1))yield[t[n],...r]}var lr=[[2,0],[2,1],[0,2],[1,2],[0,1],[1,0]];function Pe(t,e,n){let{size:r}=t;for(let[s,o]of lr){let i=Array.from({length:r},(u,c)=>c).filter(u=>!e.done[s][u]);if(!(i.length<=n))for(let u of an(i,n)){let c=e.open.map((_,a)=>u.reduce((d,h)=>d|_&_e(t,s,h,a),0)),l=[];for(let _=0;_<r;_++)e.done[o][_]||c.some((a,d)=>a&_e(t,o,_,d))&&l.push(_);if(l.length<n)return"contradiction";if(l.length>n)continue;let f=!1;for(let _=0;_<r;_++){let a=l.reduce((h,y)=>h|_e(t,o,y,_),0),d=e.open[_]&~(a&~c[_]);d!==e.open[_]&&(e.open[_]=d,f=!0)}if(f)return"progress"}}return"none"}function cr(t,e){for(let n=0;n<t.size;n++)for(let r=e.open[n],s=0;r;s++,r>>=1){if(!(r&1))continue;let o=on(e);if(Ae(t,o,n,s),ar(t,o))return e.open[n]&=~(1<<s),"progress"}return"none"}function fr(t,e){for(let n=0;n<t.size;n++)for(let r=e.open[n],s=0;r;s++,r>>=1){if(!(r&1))continue;let o=on(e);if(Ae(t,o,n,s),_r(t,o,3)==="contradiction")return e.open[n]&=~(1<<s),"progress"}return"none"}var un=t=>t.done[0].every(Boolean);function at(t,e,n){let r=[[1,()=>ur(t,e)],[2,()=>Pe(t,e,1)],[2,()=>cr(t,e)],[3,()=>Pe(t,e,2)],[4,()=>Pe(t,e,3)],[4,()=>Pe(t,e,4)],[5,()=>fr(t,e)]];for(let[s,o]of r){if(s>n)break;let i=o();if(i!=="none")return{result:i,tier:s}}return{result:"none",tier:0}}function _r(t,e,n){for(;!un(e);){let{result:r}=at(t,e,n);if(r!=="progress")return r}return"progress"}function ln(t,e){let n=Array.from({length:t},()=>new Array(t).fill(0));return e.forEach((r,s)=>{n[r][Math.floor(s/t)]|=1<<s%t}),{size:t,regions:e,regionMasks:n,full:(1<<t)-1}}var cn=t=>({open:new Array(t.size).fill(t.full),done:[0,1,2].map(()=>new Array(t.size).fill(!1)),winners:new Array(t.size).fill(-1)}),dr={maxTier:2,maxSteps:3};function fn(t,e,{found:n,ruledOut:r},s,{maxTier:o,maxSteps:i}=dr){let u=ln(t,e),c=cn(u);for(let f of n)Ae(u,c,Math.floor(f/t),f%t);for(let f of r)c.open[Math.floor(f/t)]&=~(1<<f%t);let l=Math.floor(s/t);for(let f=0;!c.done[0][l];f++)if(f===i||at(u,c,o).result!=="progress")return!1;return c.winners[l]===s%t}function _n(t,e){let n=ln(t,e),r=cn(n),s=new Array(sr.length).fill(0),o=1;for(;!un(r);){let{result:i,tier:u}=at(n,r,5);if(i!=="progress")return s[5]++,{tier:6,uses:s,winners:r.winners};s[u-1]++,o=Math.max(o,u)}return{tier:o,uses:s,winners:r.winners}}var mn=["blank","invalid","found","wrong"],ee=5;var se=30,dn=["#e6194b","#4363d8","#ffe119","#3cb44b","#f58231","#911eb4","#42d4f4","#f032e6","#fabed4","#469990","#9a6324","#dcbeff","#f2f2f2","#800000","#aaffc3","#808000","#000075","#ffd8b1","#a9a9a9","#fffac8","#000000"];function pr(t){let e=Math.max(0,t-dn.length);return[...dn.slice(0,t),...Te(e).map(n=>`hsl(${Math.round(n*360/e)} 70% ${n%2?35:65}%)`)]}function Ie(t,e){let n=[...t];for(let r=n.length-1;r>0;r--){let s=Math.floor(e()*(r+1));[n[r],n[s]]=[n[s],n[r]]}return n}var Te=t=>Array.from({length:t},(e,n)=>n);function de(t,e){let n=Math.floor(e/t),r=e%t,s=[];return n>0&&s.push(e-t),n<t-1&&s.push(e+t),r>0&&s.push(e-1),r<t-1&&s.push(e+1),s}function mr(t,e=Math.random){let n=[],r=new Set,s=o=>{if(o===t)return!0;for(let i of Ie(Te(t),e))if(!r.has(i)&&!(o>0&&Math.abs(n[o-1]-i)<=1)){if(n.push(i),r.add(i),s(o+1))return!0;n.pop(),r.delete(i)}return!1};if(!s(0))throw new Error(`no valid placement for size ${t}`);return n}function hr(t,e,n=Math.random,{skew:r,snake:s}={skew:4,snake:0}){let o=new Array(t*t).fill(-1),i=e.map(()=>Math.max(.02,n()**r)),u=e.map((f,_)=>{let a=_*t+f;return o[a]=_,new Set(de(t,a))}),c=(f,_)=>de(t,f).filter(a=>o[a]===_).length,l=(f,_)=>{let a=f.map(_),d=n()*a.reduce((y,k)=>y+k,0),h=a.findIndex(y=>(d-=y)<0);return f[h===-1?a.findLastIndex(y=>y>0):h]};for(let f=t*t-t;f>0;f--){for(let d of u)for(let h of d)o[h]!==-1&&d.delete(h);let _=l(e.map((d,h)=>h),d=>u[d].size?i[d]:0),a=l([...u[_]],d=>c(d,_)**(1-s));o[a]=_;for(let d of de(t,a))o[d]===-1&&u[_].add(d)}return o}function pn(t){let e=0;for(;t;e++)t&=t-1;return e}function hn(t,e,n=2){let r=Te(t).map(()=>new Array(t).fill(0));e.forEach((a,d)=>{r[a][Math.floor(d/t)]|=1<<d%t});let s=Te(t+1).map(()=>new Array(t).fill(0));s[0].fill((1<<t)-1);let o=new Array(t).fill(!1),i=new Array(t).fill(!1),u=new Array(t).fill(!1),c=new Array(t).fill(-1),l=[],f=(a,d,h)=>{let y=e[d*t+h],k=s[a],g=s[a+1],b=7<<h>>1;for(let v=0;v<t;v++){let x=k[v]&~r[y][v]&~(1<<h);v===d?x=0:Math.abs(v-d)===1&&(x&=~b),g[v]=x}o[d]=i[h]=u[y]=!0,c[d]=h,_(a+1),o[d]=i[h]=u[y]=!1},_=a=>{if(a===t){l.push([...c]);return}let d=s[a],h=-1,y=-1,k=1/0;for(let g=0;g<t;g++){if(!o[g]){let b=pn(d[g]);b<k&&([h,y,k]=[0,g,b])}if(!i[g]){let b=0;for(let v=0;v<t;v++)b+=d[v]>>g&1;b<k&&([h,y,k]=[1,g,b])}if(!u[g]){let b=0;for(let v=0;v<t;v++)b+=pn(d[v]&r[g][v]);b<k&&([h,y,k]=[2,g,b])}if(k===0)return}for(let g=0;g<t;g++){if(h===0&&g!==y)continue;let b=d[g];h===1&&(b&=1<<y),h===2&&(b&=r[y][g]);for(let v=0;b;v++,b>>=1)if(b&1&&(f(a,g,v),l.length>=n))return}};return _(0),l}function br(t,e,n=2){return hn(t,e,n).length}function gr(t,e,n,r){let s=e.flatMap((u,c)=>u===n&&c!==r?[c]:[]);if(s.length===0)return!1;let o=new Set([s[0]]),i=[s[0]];for(;i.length;)for(let u of de(t,i.pop()))u!==r&&e[u]===n&&!o.has(u)&&(o.add(u),i.push(u));return o.size===s.length}var yr=8;function vr(t,e,n,r,s){for(let o=0;o<s;o++){let i=hn(t,n,yr+1).filter(l=>l.some((f,_)=>f!==e[_]));if(!i.length)return!0;let u=Ie([...new Set(i.flatMap(l=>l.flatMap((f,_)=>f===e[_]?[]:[_*t+f])))],r),c=!1;for(let l of u){let f=n[l],_=Ie(de(t,l).map(a=>n[a]).filter(a=>a!==f),r);if(_.length&&gr(t,n,f,l)){n[l]=_[0],c=!0;break}}if(!c)return!1}return br(t,n)===1}function kr(t,e,n,r=500,s=1/0){let o=[],i=[];for(let u=0;u<r&&!(u>0&&performance.now()>s);u++)if(o=mr(t,e),i=hr(t,o,e,n),vr(t,o,i,e,2*t*t))return{winners:o,regions:i,unique:!0};return{winners:o,regions:i,unique:!1}}var Ne=[{sizes:[5,10],shape:{skew:4,snake:0},grades:[1,2]},{sizes:[5,11],shape:{skew:3,snake:0},grades:[2,2]},{sizes:[6,12],shape:{skew:2,snake:0},grades:[2,3]},{sizes:[6,12],shape:{skew:1.5,snake:0},grades:[3,3]},{sizes:[7,13],shape:{skew:1,snake:0},grades:[3,4]},{sizes:[7,13],shape:{skew:1,snake:0},grades:[4,5]},{sizes:[8,14],shape:{skew:1,snake:0},grades:[4,5]},{sizes:[8,14],shape:{skew:1,snake:0},grades:[5,5]}],X=Ne.length,ut=t=>Ne[Math.min(X,Math.max(1,Math.round(t)))-1];function wr(t,[e,n]){return t>=6?100:t<e?(e-t)*1.5:t>n?t-n:0}function Le(t,e=Math.random,{difficulty:n=1,candidates:r=200,budgetMs:s=2500}={}){if(!Number.isInteger(t)||t<ee||t>se)throw new RangeError(`size must be an integer ${ee}-${se}`);let{shape:o,grades:i}=ut(n),u=performance.now()+s,c,l=1/0;for(let _=0;_<r;_++){let a=kr(t,e,o,500,_?u:1/0),{tier:d}=_n(t,a.regions),h=wr(d,i)+(a.unique?0:1e3);if(h<l&&(c={winners:a.winners,regions:a.regions,grade:d},l=h),l===0||performance.now()>u)break}let f=Ie(pr(t),e);return{size:t,...c,colors:f,difficulty:n}}function pe(t,e){return t.winners[Math.floor(e/t.size)]===e%t.size}function Oe(t,e=3){return{puzzle:t,marks:new Array(t.size*t.size).fill("blank"),mistakes:0,lives:e}}function bn(t,e=3,n=Math.random,r=1){return Oe(Le(t,n,{difficulty:r}),e)}function gn({size:t,difficulty:e}){let[,n]=ut(e).sizes;if(t<n)return{size:t+1,difficulty:e};let r=Math.min(X,e+1);return{size:ut(r).sizes[0],difficulty:r}}function V(t){return t.mistakes>=t.lives?"lost":t.marks.filter(n=>n==="found").length===t.puzzle.size?"won":"playing"}var De=t=>t==="found"||t==="wrong";function lt(t,e){let n=t.marks[e];if(V(t)!=="playing"||De(n))return t;let r=[...t.marks];return r[e]=n==="invalid"?"blank":"invalid",{...t,marks:r}}function yn(t,e,n){if(V(t)!=="playing")return t;let r=[...e];for(let s of n)De(r[s])||(r[s]="invalid");return{...t,marks:r}}function vn(t){let{size:e,regions:n}=t.puzzle,r=t.marks.flatMap((o,i)=>o==="found"?[i]:[]);if(!r.length)return t;let s=t.marks.map((o,i)=>{if(o!=="blank")return o;let u=Math.floor(i/e),c=i%e;return r.some(f=>{let _=Math.floor(f/e),a=f%e;return _===u||a===c||n[f]===n[i]||Math.abs(_-u)<=1&&Math.abs(a-c)<=1})?"invalid":o});return{...t,marks:s}}function kn(t,e){let{puzzle:n,marks:r}=t;if(!pe(n,e))return!1;let s=[],o=[];return r.forEach((i,u)=>{i==="found"?s.push(u):i!=="blank"&&!pe(n,u)&&o.push(u)}),!fn(n.size,n.regions,{found:s,ruledOut:o},e)}function wn(t,e){if(V(t)!=="playing")return t;let n=t.marks.map((r,s)=>De(r)?r:e[s]);return{...t,marks:n}}function $n(t,e){if(V(t)!=="playing"||De(t.marks[e]))return t;let n=[...t.marks];return pe(t.puzzle,e)?(n[e]="found",{...t,marks:n}):(n[e]="wrong",{...t,marks:n,mistakes:t.mistakes+1})}function Sn(t,e,n){let r=Math.floor(e/t),s=e%t,o=Math.floor(n/t),i=n%t,u=Math.abs(o-r),c=Math.abs(i-s),l=o>=r?1:-1,f=i>=s?1:-1,_=[r*t+s];for(let a=c-u;r!==o||s!==i;){let d=2*a;d>-u&&(a-=u,s+=f),d<c&&(a+=c,r+=l),_.push(r*t+s)}return _}var N={invalid:-1,found:20,wrong:-25,reset:-100,undo:-1,skip:-5};function Ge(t,e){let n=0;return e.forEach((r,s)=>{r===t[s]||r==="blank"||(n+=N[r])}),n}var qe=t=>t*N.found,ct=3;function $r(t){let e=qe(t),n=t*t-t,r=-N.wrong;return[e-n*-N.invalid-2*r,e-n*-N.invalid-r,e-.75*n*-N.invalid]}function Mn(t,e,n){let[r,s,o]=$r(e);return t>=o&&n===0?3:t>=s?2:t>=r?1:0}var xn=(t,e)=>t===qe(e);var Z,ft=!1,Sr=0,me=new Map,Rn=({size:t,difficulty:e,budgetMs:n})=>Le(t,Math.random,{difficulty:e,budgetMs:n});function Mr(){if(Z||ft||typeof Worker>"u")return Z;try{Z=new Worker(new URL("./generate.worker.js",import.meta.url),{type:"module"})}catch{ft=!0;return}return Z.onmessage=t=>{me.get(t.data.id)?.resolve(t.data.puzzle),me.delete(t.data.id)},Z.onerror=()=>{for(let{request:t,resolve:e}of me.values())e(Rn(t));me.clear(),Z?.terminate(),Z=void 0,ft=!0},Z}function _t(t,e,n,r){if(n)return Promise.resolve(Le(t,n,{difficulty:e,budgetMs:r}));let s={id:Sr++,size:t,difficulty:e,budgetMs:r},o=Mr();return o?new Promise(i=>{me.set(s.id,{request:s,resolve:i}),o.postMessage(s)}):Promise.resolve(Rn(s))}function xr(t){return`  ${t.split(`
`).join(`
  `)}`}function Rr(t){return String(t)}function Cr(t){return String(t).replace(/./g,"*")}function Er(t){return"[Redacted]"}var A=class t{static simpleErrorFactory(e){return(n,r)=>Object.assign(new e(n),r)}static get(e,n){return e===null||n===void 0||typeof e!="object"?e:Array.isArray(e)?Number.isInteger(Number(n))?e[Number(n)]:e:e[n]}static UUID_REGEX=/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;static field=new t().build();static boolean=t.field.boolean();static number=t.field.number();static required=t.field.require();static numericId=t.field.integer(10).is(">= 1",e=>e===void 0||e>=1);static string=t.field.string();static identifier=t.string.matches(/^[_a-z][_a-z0-9]+$/i);static hexNumber=t.string.matches(/^[0-9a-f]+$/i).integer(16);static uuid=t.string.matches(t.UUID_REGEX,"a UUID/GUID");static date=t.field.parse((e,n)=>{if(e==null)return e;let r;if(e instanceof Date)return e;if(typeof e=="number"&&(r=e),typeof e=="string"&&(r=Number(e),(Number.isNaN(r)||!Number.isFinite(r))&&(r=Date.parse(e))),typeof r=="number"&&!Number.isNaN(r))return new Date(r);throw n("a UNIX timestamp in milliseconds or an iso8601 date")});static distance=t.number.is("positive",e=>e===void 0||e>=0);processors;createError=t.simpleErrorFactory(TypeError);format=Rr;constructor(){this.processors=[]}display(e){return t.#e(this,{format:e})}sensitive(){return this.display(Cr)}redact(){return this.display(Er)}assertion(e,n){return(r,s={})=>{let{forRef:o="`${key}` must be",forValue:i='"${value}" is not',key:u=void 0}=s,c=this.format("value"in s?s.value:n),l=[e,u].filter(_=>_!==void 0).map((_,a)=>a===0?_:typeof _=="number"?`[${_}]`:`.${_}`),f=l.length?l.join(""):void 0;return this.createError(`${(f?o:i).replace(/\$\{(\w+)\}/g,(_,a)=>String({key:f,value:c}[a]??_))} ${r}`,{key:f,value:c,requirement:r,forRef:o,forValue:i})}}validate(e,n){let r=t.get(e,n);for(let s of this.processors)try{r=s(r,this.assertion(n,r))}catch(o){throw o instanceof Error&&Error.captureStackTrace(o,this.validate),o}return r}build(){let e=this.validate.bind(this),n=Object.getOwnPropertyNames(this.constructor.prototype).filter(s=>s in this&&typeof this[s]=="function"&&s!=="validate"&&s!=="build"&&s!=="constructor"),r=Object.fromEntries(n.map(s=>typeof this[s]=="function"?[s,this[s].bind(this)]:[s,this[s]]));return Object.assign(e,r)}parse(e){return t.#e(this,{parser:e})}require(){return this.parse((e,n)=>{if(e==null)throw n("",{forRef:"`${key}` is required",forValue:"Missing required value"});return e})}matches(e,n){return this.parse((r,s)=>{if(r==null)return r;if(!e.test(String(r)))throw s(n??e.source,{forRef:n?"`${key}` must be":"`${key}` must match",forValue:n?'"${value}" is not':'"${value}" does not match'});return r})}greaterThan(e){return this.is(`> ${e}`,n=>n>e)}lessThan(e){return this.is(`< ${e}`,n=>n<e)}atLeast(e){return this.is(`>= ${e}`,n=>n>=e)}atMost(e){return this.is(`<= ${e}`,n=>n<=e)}inRange(e,n){return this.is(`in range [${e}, ${n}]`,r=>r>=e&&r<=n)}between(e,n){return this.is(`between ${e} and ${n}`,r=>r>e&&r<n)}is(e,n){return this.parse((r,s)=>{if(r==null)return r;if(!n(r))throw s(e);return r})}throws(e){return this.errorFactory(t.simpleErrorFactory(e))}errorFactory(e){return t.#e(this,{createError:e})}boolean(e=["true","t","yes","y"],n=["false","f","no","n"]){let r=new Set(e),s=new Set(n),o=`"${[...e,...n].join('", "')}", 0, or 1`;return this.parse((i,u)=>{let c;if(i!=null){if(i===!0||i===!1)return i;if(typeof i=="number"&&(c=i),typeof i=="string"){let l=i.toLowerCase();if(r.has(l))return!0;if(s.has(l))return!1;c=Number(i)}if(c===1||c===0)return c===1;throw u(o)}})}string(){return this.parse((e,n)=>{if(e!=null){if(typeof e=="object")throw n("a string");return String(e)}})}number(){return this.parse((e,n)=>{if(e==null)return;let r=Number(e);if(Number.isNaN(r)||!Number.isFinite(r))throw n("a number");return r})}integer(e=10){let n="0123456789abcdefghijklmnopqrstuvwxyz".slice(0,e),r=new RegExp(`^[+-]?[${n}]+$`,"i");if(e>36||e<2||(e|0)!==e)throw new TypeError("`base` must be an integer from 2-36 inclusive");return this.parse((s,o)=>{if(s==null)return;let i=String(s).trim();if(!r.test(i))throw o(`an integer${e!==10?` in base ${e}`:""}`);return parseInt(i,e)})}struct(e){let n=Object.entries(e),r=Object.keys(e),s="an object",o=` with keys: \`${r.join("`, `").replace(/, (`\w+)$/,", and $1")}\``;return this.parse((i,u)=>{if(i==null)return;let c=i;if(typeof c=="string")try{c=JSON.parse(c)}catch{throw u(s)}let l={};try{for(let[f,_]of n)l[f]=(_.validate??_)(c,f)}catch(f){throw u(`${s}${"message"in f?`
${xr(f.message)}`:o}`)}return l})}json(){return this.parse((e,n)=>{if(e!=null){if(typeof e=="object")return e;try{return JSON.parse(String(e))}catch(r){throw n(`valid json${"message"in r?`; ${r.message}`:""}`)}}})}anyOf(...e){let n=new Set;return this.parse((r,s)=>{let o;for(let i of e)try{return(i.validate??i)(r)}catch(u){"requirement"in u&&n.add(u.requirement),o=u}throw n.size?s(`one of (${[...n.keys()].join(") | (")})`):o})}array(e,n){return this.parse((r,s)=>{if(r==null)return;let o;if(Array.isArray(r))o=r;else{if(!n)throw s("an array");o=[r]}return e?o.map((i,u)=>{try{return(e.validate??e)(o,u)}catch(c){throw"requirement"in c?s(`an array of ${c.requirement}`,{key:u,value:i}):s("an array",{key:u,value:i})}}):o})}tuple(...e){let n=`an array of length ${e.length}`;return this.parse((r,s)=>{if(r!=null){if(!Array.isArray(r)||r.length!==e.length)throw s(n);return e.map((o,i)=>(o.validate??o)(r,i))}})}static#e(e,n={}){let r=new t;return r.processors=[...e.processors,...n.parser?[n.parser]:[]],r.createError=n.createError??e.createError,r.format=n.format??e.format,r.build()}},W=A.field,so=A.boolean,io=A.number,ao=A.numericId,dt=A.string,uo=A.identifier,lo=A.hexNumber,co=A.uuid,fo=A.date,_o=A.distance,po=A.required,He=W.integer(),te=W.array.bind(W),mo=W.anyOf.bind(W),Ue=W.struct.bind(W),ho=W.tuple.bind(W);var pt=1,ne=He.require(),zr=t=>mn.includes(t),Cn=dt.require().parse((t,e)=>{if(!zr(t))throw e("a mark");return t}),En=t=>He.parse(e=>e??t),Pr=Ue({version:ne.is(`version ${pt}`,t=>t===pt),game:Ue({puzzle:Ue({size:ne.inRange(ee,se),winners:te(ne).require(),regions:te(ne).require(),colors:te(dt.require()).require(),difficulty:ne.inRange(1,X),grade:En(0).inRange(0,6)}).require(),marks:te(Cn).require(),mistakes:ne.atLeast(0),lives:ne.atLeast(1)}).require(),history:te(te(Cn).require()).require(),score:En(0),puzzleStart:He}).require().is("a consistent save",({game:{puzzle:t,marks:e},history:n})=>{let{size:r}=t,s=r*r,o=i=>i>=0&&i<r;return t.winners.length===r&&t.winners.every(o)&&t.regions.length===s&&t.regions.every(o)&&t.colors.length===r&&e.length===s&&n.every(i=>i.length===s)});function zn(){try{return globalThis.window?.localStorage}catch{return}}function Pn(t){try{let e=zn()?.getItem(t);if(!e)return;let{game:n,history:r,score:s,puzzleStart:o}=Pr(JSON.parse(e));return{game:n,history:r,score:s,puzzleStart:o??s}}catch{return}}function An(t,e){try{zn()?.setItem(t,JSON.stringify({version:pt,...e}))}catch{}}var Ar={toggle:[24],right:[50,70,50],wrong:[110,70,110]};function Fe(t){try{globalThis.navigator?.vibrate?.(Ar[t])}catch{}}var Ir=12e3,Tr=Array.from({length:48},(t,e)=>{let n=e%2,r=(e+Math.random()*.8)/48*2*Math.PI,s=28+Math.random()*22+n*14;return{dx:Math.cos(r)*s,dy:Math.sin(r)*s,size:6+Math.random()*8,delay:n*.25+Math.random()*.15}}),Nr=350,In="M6 6L18 18M18 6L6 18",Tn="M12 2.5l2.8 6.1 6.7.7-5 4.5 1.4 6.6L12 17l-5.9 3.4 1.4-6.6-5-4.5 6.7-.7z",Lr=t=>R`
  <svg class="hd-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path class="hd-icon-halo" d=${t} />
    <path class="hd-icon-mark" d=${t} />
  </svg>
`,Or={blank:void 0,invalid:In,found:Tn,wrong:In},mt=(t,e)=>t.some((n,r)=>n!==e[r]);function ht(t){let e=t?.closest?.("[data-cell]");return e?Number(e.dataset.cell):void 0}function Nn(t){let e=t.lives??3,n=t.storageKey??"huedoku",[r]=I(()=>t.dev??new URLSearchParams(globalThis.location?.search??"").has("dev")),[s]=I(()=>r&&(t.auto??new URLSearchParams(globalThis.location?.search??"").has("auto"))),o=p=>s?vn(p):p,[i]=I(()=>Pn(n)??{game:bn(t.size??ee,e,t.rng,t.difficulty??1),history:[],score:0,puzzleStart:0}),[u,c]=I(i.game),[l,f]=I(0),_=B(u),[a,d]=I(i.history),h=B(a),[y,k]=I(i.score),g=B(y),[b,v]=I(i.puzzleStart),[x,L]=I(!1),[q,he]=I(0),[j,H]=I(!1),E=B(null),T=B(null),J=B(null),ie=B(null),Be=B(null),ae=p=>{_.current=p,c(p)},be=p=>{h.current=p,d(p)},ge=p=>{g.current=p,k(p)},ye=p=>ge(g.current+p),gt=p=>be([...h.current,p]),yt=()=>{let p=h.current;p.length&&(ie.current=null,ye(N.undo),be(p.slice(0,-1)),ae(o(wn(_.current,p[p.length-1]))))},vt=p=>{let m=_.current,S=mt(m.marks,p.marks);return S&&(ye(Ge(m.marks,p.marks)),gt(m.marks),Fe("toggle")),ae(p),S},kt=(p,m)=>{let S=$n(p,m);S!==p&&(ye(Ge(p.marks,S.marks)),Fe(S.marks[m]==="found"?"right":"wrong"),V(S)==="playing"&&kn(p,m)&&he(P=>P+1)),ae(o(S))},wt=p=>{H(!1),J.current=null,ie.current=null,f(0),be([]),ae(p)},We=async(p,m)=>{let S=E.current&&E.current.level.size===p.size&&E.current.level.difficulty===p.difficulty?E.current.puzzle:_t(p.size,p.difficulty,t.rng);S===E.current?.puzzle&&(E.current=null),L(!0);try{let P=await S;m!==void 0&&ge(m),v(g.current),wt(Oe(P,e))}finally{L(!1)}},O=V(u),{puzzle:U,marks:$t}=u,St=()=>{ye(N.reset),wt(Oe(U,e))},ue=p=>We(p,b+N.skip),On=()=>(H(!1),We({size:Ne[0].sizes[0],difficulty:1},0)),{size:w,difficulty:D}=U,Mt={size:w,difficulty:D},z=gn(Mt);ze(()=>{An(n,{game:u,history:a,score:y,puzzleStart:b})},[n,u,a,y,b]),ze(()=>{let p=E.current;(!p||p.level.size!==z.size||p.level.difficulty!==z.difficulty)&&(E.current={level:{size:z.size,difficulty:z.difficulty},puzzle:_t(z.size,z.difficulty,t.rng,Ir)})},[z.size,z.difficulty,t.rng]),ze(()=>{(O!=="playing"||j)&&T.current?.focus()},[O,j]);let Dn=p=>{let m=ht(p.target);if(m===void 0||V(_.current)!=="playing"||p.pointerType==="mouse"&&p.button!==0)return;let S=_.current,P=g.current,Y=Date.now(),G=ie.current;if(ie.current=null,f(m),G&&G.cell===m&&Y-G.time<Nr){J.current=null,G.pushed&&be(h.current.slice(0,-1)),ge(G.scoreBefore),kt({...S,marks:G.before},m);return}let Xe=vt(lt(S,m));J.current={pointerId:p.pointerId,start:m,current:m,base:S.marks,path:[m],moved:!1,pushed:Xe,scoreBase:P};try{Be.current?.setPointerCapture?.(p.pointerId)}catch{}},Gn=p=>{let m=J.current;if(!m||m.pointerId!==p.pointerId)return;let S=ht(document.elementFromPoint?.(p.clientX,p.clientY)??null)??ht(p.target);if(S===void 0||S===m.current)return;m.path.push(...Sn(w,m.current,S).slice(1)),m.current=S,m.moved=!0;let P=yn(_.current,m.base,m.path);!m.pushed&&mt(m.base,P.marks)&&(gt(m.base),m.pushed=!0),mt(_.current.marks,P.marks)&&Fe("toggle"),ge(m.scoreBase+Ge(m.base,P.marks)),ae(P)},qn=p=>{let m=J.current;!m||m.pointerId!==p.pointerId||(J.current=null,m.moved||(ie.current={cell:m.start,time:Date.now(),before:m.base,pushed:m.pushed,scoreBefore:m.scoreBase}))},Hn=()=>{J.current=null},Un=p=>{p.cancelable&&p.preventDefault()},Fn=p=>{if((p.ctrlKey||p.metaKey)&&p.key.toLowerCase()==="z"){p.preventDefault(),yt();return}let m=Math.floor(l/w),S=l%w,P={ArrowUp:m>0?l-w:void 0,ArrowDown:m<w-1?l+w:void 0,ArrowLeft:S>0?l-1:void 0,ArrowRight:S<w-1?l+1:void 0};if(p.key in P){p.preventDefault();let Y=P[p.key];Y!==void 0&&(f(Y),Be.current?.querySelector(`[data-cell="${Y}"]`)?.focus())}else p.key===" "?(p.preventDefault(),vt(lt(_.current,l))):p.key==="Enter"&&(p.preventDefault(),kt(_.current,l))},Bn=$t.filter(p=>p==="found").length,je=y-b,Ke=Mn(je,w,u.mistakes),xt=xn(je,w),Wn=$t.map((p,m)=>{let S=Math.floor(m/w),P=m%w,Y=U.regions[m],G=O==="lost"&&p!=="found"&&pe(U,m),Xe=["hd-cell",`hd-cell--${p}`,G?"hd-cell--revealed":""],Ve=G?Tn:Or[p];return R`
      <div
        class=${Xe.filter(Boolean).join(" ")}
        role="button"
        data-cell=${m}
        tabindex=${m===l?0:-1}
        aria-label=${`Row ${S+1}, column ${P+1}: ${G?"winning cell":p}`}
        style=${`--cell-color: ${U.colors[Y]}`}
      >
        ${Ve?Lr(Ve):null}
      </div>
    `}),jn=x?"Building a puzzle\u2026":"Tap to rule out \xB7 drag to rule out a path \xB7 double-tap to submit";return R`
    <section
      class=${`huedoku huedoku--${O}${x?" huedoku--loading":""}`}
    >
      <div class="hd-toolbar">
        ${r?R`
                <span class="hd-spinner" role="group" aria-label="Board size">
                  <button
                    type="button"
                    aria-label="Smaller board"
                    disabled=${x||w<=ee}
                    onClick=${()=>ue({size:w-1,difficulty:D})}
                  >
                    −
                  </button>
                  <span>${w}×${w}</span>
                  <button
                    type="button"
                    aria-label="Bigger board"
                    disabled=${x||w>=se}
                    onClick=${()=>ue({size:w+1,difficulty:D})}
                  >
                    +
                  </button>
                </span>
                <span class="hd-spinner" role="group" aria-label="Level">
                  <button
                    type="button"
                    aria-label="Easier level"
                    disabled=${x||D<=1}
                    onClick=${()=>ue({size:w,difficulty:D-1})}
                  >
                    −
                  </button>
                  <span class="hd-level" title=${`grade ${U.grade}`}>
                    ${`Level ${D}/${X}`}
                  </span>
                  <button
                    type="button"
                    aria-label="Harder level"
                    disabled=${x||D>=X}
                    onClick=${()=>ue({size:w,difficulty:D+1})}
                  >
                    +
                  </button>
                </span>
              `:R`
                <span class="hd-level">
                  ${`${w}\xD7${w} \xB7 Level ${D}/${X}`}
                </span>
              `}
        <button
          type="button"
          disabled=${x}
          onClick=${()=>ue(Mt)}
        >
          New puzzle
        </button>
        <span class="hd-score" aria-label="Score" title="Score">${y}</span>
        <span class="hd-found" aria-label="Found">${Bn}/${w}</span>
        <span
          class="hd-lives"
          aria-label=${`${e-u.mistakes} of ${e} guesses left`}
        >
          ${"\u2665".repeat(Math.max(0,e-u.mistakes))}${"\u2661".repeat(Math.min(e,u.mistakes))}
        </span>
      </div>
      <div class="hd-board">
        ${q>0&&R`
            <div
              key=${q}
              class="hd-shimmer"
              aria-hidden="true"
              style=${`--colors: ${U.colors.join(", ")}, ${U.colors[0]}`}
            ></div>
            <p key=${`t${q}`} class="hd-nice" role="status">
              Nice move!
            </p>
          `}
        <div
          ref=${Be}
          class="hd-grid"
          role="group"
          aria-label="Board"
          style=${`--size: ${w}`}
          onPointerDown=${Dn}
          onPointerMove=${Gn}
          onPointerUp=${qn}
          onPointerCancel=${Hn}
          onTouchEnd=${Un}
          onKeyDown=${Fn}
        >
          ${Wn}
        </div>
      </div>
      <div class="hd-footer">
        <button
          type="button"
          class="hd-tool"
          onClick=${yt}
          disabled=${a.length===0||O!=="playing"}
          aria-label="Undo"
          title="Undo (Ctrl+Z)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 14L4 9l5-5" />
            <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
          </svg>
        </button>
        <p class="hd-message" role="status">${jn}</p>
        <button
          type="button"
          class="hd-tool"
          onClick=${()=>H(!0)}
          disabled=${x||O!=="playing"}
          aria-label="Restart puzzle"
          title="Restart puzzle"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>
      ${O==="playing"&&j&&R`
          <div
            class="hd-backdrop hd-backdrop--now"
            onKeyDown=${p=>{p.key==="Escape"&&H(!1)}}
          >
            <div
              class="hd-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="hd-dialog-title"
            >
              <h2 id="hd-dialog-title">Restart?</h2>
              <p>
                Clear this board and get your guesses back (${N.reset}
                points), or start over from level 1 with a fresh score.
              </p>
              <div class="hd-dialog-actions">
                <button type="button" onClick=${St}>This puzzle</button>
                <button type="button" onClick=${On}>From level 1</button>
                <button
                  type="button"
                  class="hd-secondary"
                  ref=${T}
                  onClick=${()=>H(!1)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        `}
      ${O!=="playing"&&R`
          <div class="hd-backdrop">
            ${O==="won"&&xt&&R`
                <div class="hd-burst" aria-hidden="true">
                  ${Tr.map((p,m)=>R`
                      <span
                        style=${`--dx: ${p.dx}vmin; --dy: ${p.dy}vmin; --size: ${p.size}px; --delay: ${p.delay}s; --color: ${U.colors[m%w]}`}
                      ></span>
                    `)}
                </div>
              `}
            <div
              class="hd-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="hd-dialog-title"
            >
              ${O==="won"?R`
                      <h2 id="hd-dialog-title">
                        ${xt?"Perfect!":"Solved!"}
                      </h2>
                      <p
                        class="hd-stars"
                        aria-label=${`${Ke} of ${ct} stars`}
                      >
                        ${Array.from({length:ct},(p,m)=>R`<span
                              class=${m<Ke?"hd-star":"hd-star hd-star--empty"}
                              style=${`--i: ${m}`}
                              >${m<Ke?"\u2605":"\u2606"}</span
                            >`)}
                      </p>
                      <p>
                        ${`You scored ${je} out of a possible ${qe(w)}.`}
                      </p>
                      <p>
                        ${z.difficulty>D?`Level up! Level ${z.difficulty} starts at ${z.size}\xD7${z.size}.`:z.size>w?`Up next: ${z.size}\xD7${z.size}.`:`Top level cleared! Back to ${z.size}\xD7${z.size}.`}
                      </p>
                      <button
                        type="button"
                        ref=${T}
                        disabled=${x}
                        onClick=${()=>We(z)}
                      >
                        ${x?"Building\u2026":"Next Level"}
                      </button>
                    `:R`
                      <h2 id="hd-dialog-title">Out of guesses</h2>
                      <p>Have another go at the same puzzle.</p>
                      <button
                        type="button"
                        ref=${T}
                        onClick=${St}
                      >
                        Try Again
                      </button>
                    `}
            </div>
          </div>
        `}
    </section>
  `}function bt(t){return R`
    <div class="app">
      <${jt} />
      <main>
        <${Nn} />
      </main>
    </div>
  `}var Ln=document.querySelector("div#root");Ln&&rt(R`<${bt} />`,Ln);
//# sourceMappingURL=index.js.map
