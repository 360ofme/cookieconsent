/*!
* CookieConsent 3.0.0-rc.13
* https://github.com/orestbida/cookieconsent
* Author Orest Bida
* Released under the MIT License
*/
const e='opt-in',t='opt-out',o='show--consent',n='show--preferences',a='disable--interaction',s='data-category',c='div',r='button',i='aria-hidden',l='btn-group',d='click',f='data-role',_='consentModal',u='preferencesModal';class p{constructor(){this.t={mode:e,revision:0,autoShow:!0,lazyHtmlGeneration:!0,autoClearCookies:!0,manageScriptTags:!0,hideFromBots:!0,cookie:{name:'cc_cookie',expiresAfterDays:182,domain:'',path:'/',sameSite:'Lax'}},this.o={i:{},l:'',_:{},u:{},p:{},m:[],g:!1,v:null,h:null,C:null,S:'',M:!0,D:!1,T:!1,A:!1,k:!1,N:[],H:!1,F:!0,V:[],j:!1,P:'',I:!1,O:[],R:[],B:[],G:[],J:!1,L:!1,U:!1,$:[],q:[],K:null,W:[],X:[],Y:{},Z:{},ee:{},te:{},oe:{},ne:[]},this.ae={se:{},ce:{}},this.re={},this.ie={le:'cc:onFirstConsent',de:'cc:onConsent',fe:'cc:onChange',_e:'cc:onModalShow',ue:'cc:onModalHide',pe:'cc:onModalReady'}}}const m=new p,g=(e,t)=>e.indexOf(t),b=(e,t)=>-1!==g(e,t),v=e=>Array.isArray(e),y=e=>'string'==typeof e,h=e=>!!e&&'object'==typeof e&&!v(e),C=e=>'function'==typeof e,w=e=>Object.keys(e),S=e=>Array.from(new Set(e)),x=()=>document.activeElement,M=e=>e.preventDefault(),D=(e,t)=>e.querySelectorAll(t),T=e=>e.dispatchEvent(new Event('change')),E=e=>{const t=document.createElement(e);return e===r&&(t.type=e),t},A=(e,t,o)=>e.setAttribute(t,o),k=(e,t,o)=>{e.removeAttribute(o?'data-'+t:t)},N=(e,t,o)=>e.getAttribute(o?'data-'+t:t),H=(e,t)=>e.appendChild(t),F=(e,t)=>e.classList.add(t),V=(e,t)=>F(e,'cm__'+t),j=(e,t)=>F(e,'pm__'+t),P=(e,t)=>e.classList.remove(t),I=e=>{if('object'!=typeof e)return e;if(e instanceof Date)return new Date(e.getTime());let t=Array.isArray(e)?[]:{};for(let o in e){let n=e[o];t[o]=I(n)}return t},O=()=>{const e={},{O:t,Y:o,Z:n}=m.o;for(const a of t)e[a]=J(n[a],w(o[a]));return e},R=(e,t)=>dispatchEvent(new CustomEvent(e,{detail:t})),B=(e,t,o,n)=>{e.addEventListener(t,o),n&&m.o.m.push({me:e,ge:t,be:o})},G=()=>{const e=m.t.cookie.expiresAfterDays;return C(e)?e(m.o.P):e},J=(e,t)=>{const o=e||[],n=t||[];return o.filter((e=>!b(n,e))).concat(n.filter((e=>!b(o,e))))},L=e=>{m.o.R=S(e),m.o.P=(()=>{let e='custom';const{R:t,O:o,B:n}=m.o,a=t.length;return a===o.length?e='all':a===n.length&&(e='necessary'),e})()},U=(e,t,o,n)=>{const a='accept-',{show:s,showPreferences:c,hide:r,hidePreferences:i,acceptCategory:l}=t,f=e||document,_=e=>D(f,`[data-cc="${e}"]`),u=(e,t)=>{M(e),l(t),i(),r()},p=_('show-preferencesModal'),g=_('show-consentModal'),b=_(a+'all'),v=_(a+'necessary'),y=_(a+'custom'),h=m.t.lazyHtmlGeneration;for(const e of p)A(e,'aria-haspopup','dialog'),B(e,d,(e=>{M(e),c()})),h&&(B(e,'mouseenter',(e=>{M(e),m.o.k||o(t,n)}),!0),B(e,'focus',(()=>{m.o.k||o(t,n)})));for(let e of g)A(e,'aria-haspopup','dialog'),B(e,d,(e=>{M(e),s(!0)}),!0);for(let e of b)B(e,d,(e=>{u(e,'all')}),!0);for(let e of y)B(e,d,(e=>{u(e)}),!0);for(let e of v)B(e,d,(e=>{u(e,[])}),!0)},z=(e,t)=>{e?.focus(),t&&(m.o.K=1===t?m.ae.ve:m.ae.ye,m.o.W=1===t?m.o.$:m.o.q)};let $;const q=e=>{clearTimeout($),e?F(m.ae.he,a):$=setTimeout((()=>{P(m.ae.he,a)}),500)},K=['[href]',r,'input','details','[tabindex]'].map((e=>e+':not([tabindex="-1"])')).join(','),Q=e=>{const{o:t,ae:o}=m,n=(e,t)=>{const o=D(e,K);t[0]=o[0],t[1]=o[o.length-1]};1===e&&t.D&&n(o.Ce,t.$),2===e&&t.k&&n(o.we,t.q)},W=(e,t,o)=>{const{fe:n,de:a,le:s,ue:c,pe:r,_e:i}=m.re,l=m.ie,d={cookie:m.o.p};if(t){const n={modalName:t};return e===l._e?C(i)&&i(n):e===l.ue?C(c)&&c(n):(n.modal=o,C(r)&&r(n)),R(e,n)}e===l.le?C(s)&&s(I(d)):e===l.de?C(a)&&a(I(d)):(d.changedCategories=m.o.V,d.changedServices=m.o.te,C(n)&&n(I(d))),R(e,I(d))},X=e=>{const{Z:t,te:o,O:n,Y:a,ne:c,p:r,V:i}=m.o;for(const e of n){const n=o[e]||t[e]||[];for(const o of n){const n=a[e][o];if(!n)continue;const{onAccept:s,onReject:c}=n;!n.Se&&b(t[e],o)&&C(s)?(n.Se=!0,s()):n.Se&&!b(t[e],o)&&C(c)&&(n.Se=!1,c())}}if(!m.t.manageScriptTags)return;const l=c,d=e||r.categories||[],f=(e,n)=>{if(n>=e.length)return;const a=c[n];if(a.xe)return f(e,n+1);const r=a.Me,l=a.De,_=a.Te,u=b(d,l),p=!!_&&b(t[l],_);if(!_&&!a.Ee&&u||!_&&a.Ee&&!u&&b(i,l)||_&&!a.Ee&&p||_&&a.Ee&&!p&&b(o[l]||[],_)){a.xe=!0;const t=N(r,'type',!0);k(r,'type',!!t),k(r,s);let o=N(r,'src',!0);o&&k(r,'src',!0);const c=E('script');c.textContent=r.innerHTML;for(const{nodeName:e}of r.attributes)A(c,e,r[e]||N(r,e));t&&(c.type=t),o?c.src=o:o=r.src;const i=!!o&&(!t||['text/javascript','module'].includes(t));if(i&&(c.onload=c.onerror=()=>{f(e,++n)}),r.replaceWith(c),i)return}f(e,++n)};f(l,0)},Y='bottom',Z='left',ee='center',te='right',oe='inline',ne='wide',ae='pm--',se=['middle','top',Y],ce=[Z,ee,te],re={box:{Ae:[ne,oe],ke:se,Ne:ce,He:Y,Fe:te},cloud:{Ae:[oe],ke:se,Ne:ce,He:Y,Fe:ee},bar:{Ae:[oe],ke:se.slice(1),Ne:[],He:Y,Fe:''}},ie={box:{Ae:[],ke:[],Ne:[],He:'',Fe:''},bar:{Ae:[ne],ke:[],Ne:[Z,te],He:'',Fe:Z}},le=e=>{const t=m.o.i.guiOptions,o=t?.consentModal,n=t?.preferencesModal;0===e&&de(m.ae.Ce,re,o,'cm--','box','cm'),1===e&&de(m.ae.we,ie,n,ae,'box','pm')},de=(e,t,o,n,a,s)=>{e.className=s;const c=o?.layout,r=o?.position,i=o?.flipButtons,l=!1!==o?.equalWeightButtons,d=c?.split(' ')||[],f=d[0],_=d[1],u=f in t?f:a,p=t[u],g=b(p.Ae,_)&&_,v=r?.split(' ')||[],y=v[0],h=n===ae?v[0]:v[1],C=b(p.ke,y)?y:p.He,w=b(p.Ne,h)?h:p.Fe,S=t=>F(e,n+t);S(u),S(g),S(C),S(w),i&&S('flip');const x=s+'__btn--secondary';if('cm'===s){const{Ve:e,je:t}=m.ae;e&&(l?P(e,x):F(e,x)),t&&(l?P(t,x):F(t,x))}else{const{Pe:e}=m.ae;e&&(l?P(e,x):F(e,x))}},fe=(e,t)=>{const o=m.o,n=m.ae,{hide:a,hidePreferences:s,acceptCategory:_}=e,p=e=>{_(e),s(),a()},g=o.u&&o.u.preferencesModal;if(!g)return;const b=g.title,v=g.closeIconLabel,C=g.acceptAllBtn,S=g.acceptNecessaryBtn,x=g.savePreferencesBtn,M=g.sections,D=C||S||x;if(n.ye)n.Ie=E(c),j(n.Ie,'body');else{n.ye=E(c),F(n.ye,'pm-wrapper'),n.ye.tabIndex=-1;const e=E('div');F(e,'pm-overlay'),H(n.ye,e),B(e,d,s),n.we=E(c),n.we.style.visibility='hidden',F(n.we,'pm'),A(n.we,'role','dialog'),A(n.we,i,!0),A(n.we,'aria-modal',!0),A(n.we,'aria-labelledby','pm__title'),B(n.he,'keydown',(e=>{27===e.keyCode&&s()}),!0),n.Oe=E(c),j(n.Oe,'header'),n.Re=E(c),j(n.Re,'title'),n.Re.id='pm__title',A(n.Re,'role','heading'),A(n.Re,'aria-level','2'),n.Be=E(r),j(n.Be,'close-btn'),A(n.Be,'aria-label',g.closeIconLabel||''),B(n.Be,d,s),n.Ge=E('span'),n.Ge.tabIndex=-1,H(n.Be,n.Ge),n.Je=E(c),j(n.Je,'body'),n.Le=E(c),j(n.Le,'footer');var T=E(c);F(T,'btns');var k=E(c),N=E(c);j(k,l),j(N,l),H(n.Le,k),H(n.Le,N),H(n.Oe,n.Re),H(n.Oe,n.Be),H(n.we,n.Oe),H(n.we,n.Je),D&&H(n.we,n.Le),H(n.ye,n.we)}let V;b&&(n.Re.innerHTML=b,v&&A(n.Be,'aria-label',v)),M?.forEach(((e,t)=>{const a=e.title,s=e.description,l=e.linkedCategory,f=l&&o.I[l],_=e.cookieTable,u=_?.body,p=_?.caption,m=u?.length>0,b=!!f,v=b&&o.Y[l],C=h(v)&&w(v)||[],S=b&&(!!s||!!m||w(v).length>0);var x=E(c);if(j(x,'section'),S||s){var M=E(c);j(M,'section-desc-wrapper')}let D=C.length;if(S&&D>0){const e=E(c);j(e,'section-services');for(const t of C){const o=v[t],n=o?.label||t,a=E(c),s=E(c),r=E(c),i=E(c);j(a,'service'),j(i,'service-title'),j(s,'service-header'),j(r,'service-icon');const d=_e(n,t,f,!0,l);i.innerHTML=n,H(s,r),H(s,i),H(a,s),H(a,d),H(e,a)}H(M,e)}if(a){var T=E(c),k=E(b?r:c);if(j(T,'section-title-wrapper'),j(k,'section-title'),k.innerHTML=a,H(T,k),b){const e=E('span');j(e,'section-arrow'),H(T,e),x.className+='--toggle';const t=_e(a,l,f);let o=g.serviceCounterLabel;if(D>0&&y(o)){let e=E('span');j(e,'badge'),j(e,'service-counter'),A(e,i,!0),A(e,'data-servicecounter',D),o&&(o=o.split('|'),o=o.length>1&&D>1?o[1]:o[0],A(e,'data-counterlabel',o)),e.innerHTML=D+(o?' '+o:''),H(k,e)}if(S){j(x,'section--expandable');var N=l+'-desc';A(k,'aria-expanded',!1),A(k,'aria-controls',N)}H(T,t)}else A(k,'role','heading'),A(k,'aria-level','3');H(x,T)}if(s){var I=E(c);j(I,'section-desc'),I.innerHTML=s,H(M,I)}if(S&&(A(M,i,'true'),M.id=N,((e,t,o)=>{B(k,d,(()=>{t.classList.contains('is-expanded')?(P(t,'is-expanded'),A(o,'aria-expanded','false'),A(e,i,'true')):(F(t,'is-expanded'),A(o,'aria-expanded','true'),A(e,i,'false'))}))})(M,x,k),m)){const e=E('table'),o=E('thead'),a=E('tbody');if(p){const t=E('caption');j(t,'table-caption'),t.innerHTML=p,e.appendChild(t)}j(e,'section-table'),j(o,'table-head'),j(a,'table-body');const s=_.headers,r=w(s),i=n.Ue.createDocumentFragment(),l=E('tr');A(l,'role','row');for(const e of r){const o=s[e],n=E('th');n.id='cc__row-'+o+t,A(n,'scope','col'),j(n,'table-th'),n.innerHTML=o,H(i,n)}H(l,i),H(o,l);const d=n.Ue.createDocumentFragment();for(const e of u){const o=E('tr');A(o,'role','row'),j(o,'table-tr');for(const n of r){const a=s[n],r=e[n],i=E('td'),l=E(c);j(i,'table-td'),A(i,'data-column',a),A(i,'headers','cc__row-'+a+t),l.insertAdjacentHTML('beforeend',r),H(i,l),H(o,i)}H(d,o)}H(a,d),H(e,o),H(e,a),H(M,e)}(S||s)&&H(x,M);const O=n.Ie||n.Je;b?(V||(V=E(c),j(V,'section-toggles')),V.appendChild(x)):V=null,H(O,V||x)})),(C||S)&&(S&&(n.Pe||(n.Pe=E(r),j(n.Pe,'btn'),A(n.Pe,f,'necessary'),H(k,n.Pe),B(n.Pe,d,(()=>p([])))),n.Pe.innerHTML=S),C&&(n.ze||(n.ze=E(r),j(n.ze,'btn'),A(n.ze,f,'all'),H(k,n.ze),B(n.ze,d,(()=>p('all')))),n.ze.innerHTML=C)),x&&(n.$e||(n.$e=E(r),j(n.$e,'btn'),j(n.$e,'btn--secondary'),A(n.$e,f,'save'),H(N,n.$e),B(n.$e,d,(()=>p()))),n.$e.innerHTML=x),n.Ie&&(n.we.replaceChild(n.Ie,n.Je),n.Je=n.Ie),le(1),o.k||(o.k=!0,W(m.ie.pe,u,n.we),t(e),H(n.qe,n.ye),setTimeout((()=>F(n.ye,'cc--anim')),100)),Q(2)};function _e(e,o,n,a,c){const r=m.o,l=m.ae,f=E('label'),_=E('input'),u=E('span'),p=E('span'),g=E('span'),v=E('span');if(_.type='checkbox',F(f,'section__toggle-wrapper'),F(_,'section__toggle'),F(g,'toggle__icon-on'),F(v,'toggle__icon-off'),F(u,'toggle__icon'),F(p,'toggle__label'),A(u,i,'true'),a?(F(f,'toggle-service'),A(_,s,c),l.ce[c][o]=_):l.se[o]=_,a?(e=>{B(_,'change',(()=>{const t=l.ce[e],o=l.se[e];r.ee[e]=[];for(let o in t){const n=t[o];n.checked&&r.ee[e].push(n.value)}o.checked=r.ee[e].length>0}))})(c):(e=>{B(_,d,(()=>{const t=l.ce[e],o=_.checked;r.ee[e]=[];for(let n in t)t[n].checked=o,o&&r.ee[e].push(n)}))})(o),_.value=o,p.textContent=e.replace(/<.*>.*<\/.*>/gm,''),H(u,v),H(u,g),r.M)(n.readOnly||r.i.mode===t&&n.enabled)&&(_.checked=!0);else if(a){const e=r.Z[c];_.checked=n.readOnly||b(e,o)}else b(r.R,o)&&(_.checked=!0);return n.readOnly&&(_.disabled=!0),H(f,_),H(f,u),H(f,p),f}const ue=()=>{const e=E('span');return e.tabIndex=-1,m.ae.Ke||(m.ae.Ke=e),e},pe=(e,t)=>{const o=m.o,n=m.ae,{hide:a,showPreferences:s,acceptCategory:u}=e,p=o.u&&o.u.consentModal;if(!p)return;const g=p.acceptAllBtn,b=p.acceptNecessaryBtn,v=p.showPreferencesBtn,y=p.closeIconLabel,h=p.footer,C=p.label,w=p.title,S=e=>{a(),u(e)};if(!n.ve){n.ve=E(c),n.Ce=E(c),n.Qe=E(c),n.We=E(c),n.Xe=E(c),F(n.ve,'cm-wrapper'),F(n.Ce,'cm'),V(n.Qe,'body'),V(n.We,'texts'),V(n.Xe,'btns'),n.ve.tabIndex=-1,A(n.Ce,'role','dialog'),A(n.Ce,'aria-modal','true'),A(n.Ce,i,'false'),A(n.Ce,'aria-describedby','cm__desc'),C?A(n.Ce,'aria-label',C):w&&A(n.Ce,'aria-labelledby','cm__title'),n.Ce.style.visibility='hidden';const e='box',t=o.i.guiOptions,a=t?.consentModal,s=(a?.layout||e).split(' ')[0]===e;w&&y&&s&&(n.je||(n.je=E(r),V(n.je,'btn'),V(n.je,'btn--close'),B(n.je,d,(()=>{S([])})),H(n.Qe,n.je)),A(n.je,'aria-label',y)),H(n.Qe,n.We),(g||b||v)&&H(n.Qe,n.Xe),H(n.Ce,n.Qe),H(n.ve,n.Ce)}w&&(n.Ye||(n.Ye=E(c),n.Ye.className=n.Ye.id='cm__title',A(n.Ye,'role','heading'),A(n.Ye,'aria-level','2'),H(n.We,n.Ye)),n.Ye.innerHTML=w);let x=p.description;if(x&&(o.H&&(x=x.replace('{{revisionMessage}}',o.F?'':p.revisionMessage||'')),n.Ze||(n.Ze=E(c),n.Ze.className=n.Ze.id='cm__desc',H(n.We,n.Ze)),n.Ze.innerHTML=x),g&&(n.et||(n.et=E(r),H(n.et,ue()),V(n.et,'btn'),A(n.et,f,'all'),B(n.et,d,(()=>{S('all')}))),n.et.firstElementChild.innerHTML=g),b&&(n.Ve||(n.Ve=E(r),H(n.Ve,ue()),V(n.Ve,'btn'),A(n.Ve,f,'necessary'),B(n.Ve,d,(()=>{S([])}))),n.Ve.firstElementChild.innerHTML=b),v&&(n.tt||(n.tt=E(r),H(n.tt,ue()),V(n.tt,'btn'),V(n.tt,'btn--secondary'),A(n.tt,f,'show'),B(n.tt,'mouseenter',(()=>{o.k||fe(e,t)})),B(n.tt,d,s)),n.tt.firstElementChild.innerHTML=v),n.ot||(n.ot=E(c),V(n.ot,l),b&&H(n.ot,n.Ve),g&&H(n.ot,n.et),(g||b)&&H(n.Qe,n.ot),H(n.Xe,n.ot)),n.tt&&!n.nt&&(n.nt=E(c),n.Ve&&n.et?(V(n.nt,l),H(n.nt,n.tt),H(n.Xe,n.nt)):(H(n.ot,n.tt),V(n.ot,l+'--uneven'))),h){if(!n.st){let e=E(c),t=E(c);n.st=E(c),V(e,'footer'),V(t,'links'),V(n.st,'link-group'),H(t,n.st),H(e,t),H(n.Ce,e)}n.st.innerHTML=h}le(0),o.D||(o.D=!0,W(m.ie.pe,_,n.Ce),t(e),H(n.qe,n.ve),setTimeout((()=>F(n.ve,'cc--anim')),100)),Q(1),U(n.Qe,e,fe,t)},me=e=>y(e)&&e in m.o._,ge=()=>m.o.l||m.o.i.language.default,be=e=>{e&&(m.o.l=e)},ve=async e=>{const t=m.o;let o=me(e)?e:ge(),n=t._[o];if(!n)return!1;if(y(n)){const e=await(async e=>{try{const t=await fetch(e);return!!t?.ok&&await t.json()}catch(e){return!1}})(n);if(!e)return!1;n=e}return t.u=n,be(o),!0},ye=()=>{let e=m.o.i.language.rtl,t=m.ae.qe;e&&t&&(v(e)||(e=[e]),b(e,m.o.l)?F(t,'cc--rtl'):P(t,'cc--rtl'))},he=()=>{const e=m.ae;if(!e.qe){e.qe=E(c),e.qe.id='cc-main',ye();let t=m.o.i.root;t&&y(t)&&(t=document.querySelector(t)),(t||e.Ue.body).appendChild(e.qe)}},Ce=e=>{const{hostname:t,protocol:o}=location,{name:n,path:a,domain:s,sameSite:c}=m.t.cookie,r=encodeURIComponent(JSON.stringify(m.o.p)),i=e?(()=>{const e=m.o.C,t=e?new Date-e:0;return 864e5*G()-t})():864e5*G(),l=new Date;l.setTime(l.getTime()+i);let d=n+'='+r+(0!==i?'; expires='+l.toUTCString():'')+'; Path='+a+'; SameSite='+c;b(t,'.')&&(d+='; Domain='+s),'https:'===o&&(d+='; Secure'),document.cookie=d,m.o.p},we=(e,t,o)=>{const n=o||m.t.cookie.domain,a=t||m.t.cookie.path,s='www.'===n.slice(0,4),c=s&&n.substring(4),r=(e,t)=>{document.cookie=e+'=; path='+a+(t?'; domain=.'+t:'')+'; expires=Thu, 01 Jan 1970 00:00:01 GMT;'};for(const t of e)r(t),r(t,n),s&&r(t,c)},Se=e=>(e=>{let t;try{t=JSON.parse(decodeURIComponent(e))}catch(e){t={}}return t})(xe(e||m.t.cookie.name,!0)),xe=(e,t)=>{const o=document.cookie.match('(^|;)\\s*'+e+'\\s*=\\s*([^;]+)');return o?t?o.pop():e:''},Me=e=>{const t=document.cookie.split(/;\s*/),o=[];for(const n of t){let t=n.split('=')[0];if(e)try{e.test(t)&&o.push(t)}catch(e){}else o.push(t)}return o},De=(o,n=[])=>{((e,t)=>{const{O:o,R:n,B:a,k:s,ee:c,Y:r}=m.o;let i=[];if(e){v(e)?i.push(...e):y(e)&&(i='all'===e?o:[e]);for(const e of o)c[e]=b(i,e)?w(r[e]):[]}else i=s?(()=>{const e=m.ae.se;if(!e)return[];let t=[];for(let o in e)e[o].checked&&t.push(o);return t})():n;i=i.filter((e=>!b(o,e)||!b(t,e))),i.push(...a),L(i)})(o,n),(e=>{const t=m.o,{ee:o,B:n,Z:a,Y:s,O:c}=t,r=c;t.oe=I(a);for(const e of r){const t=s[e],c=w(t),r=o[e]?.length>0,i=b(n,e);if(0!==c.length){if(a[e]=[],i)a[e].push(...c);else if(r){const t=o[e];a[e].push(...t)}else a[e]=[];a[e]=S(a[e])}}})(),(()=>{const o=m.o;m.t.mode===t&&o.M?o.V=J(o.G,o.R):o.V=J(o.R,o.p.categories);let n=o.V.length>0,a=!1;for(const e of o.O)o.te[e]=J(o.Z[e],o.oe[e]),o.te[e].length>0&&(a=!0);const s=m.ae.se;for(let e in s)s[e].checked=b(o.R,e);for(const e of o.O){const t=m.ae.ce[e],n=o.Z[e];for(const e in t)t[e].checked=b(n,e)}o.h||(o.h=new Date),o.S||(o.S=([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,(e=>(e^crypto.getRandomValues(new Uint8Array(1))[0]&15>>e/4).toString(16)))),o.p={categories:I(o.R),revision:m.t.revision,data:o.v,consentTimestamp:o.h.toISOString(),consentId:o.S,services:I(o.Z)};let c=!1;(o.M||n||a)&&(o.M&&(o.M=!1,c=!0),o.C?o.C=new Date:o.C=o.h,o.p.lastConsentTimestamp=o.C.toISOString(),Ce(),m.t.autoClearCookies&&(c||!o.M&&n)&&(e=>{const t=m.o,o=Me();t.j=!1;let n=e?t.O:t.V;n=n.filter((e=>{let o=t.I[e];return!!o&&!o.readOnly&&!!o.autoClear}));for(const a of n){const n=t.I[a].autoClear,s=n?.cookies||[],c=b(t.V,a),r=!b(t.R,a),i=c&&r;if(e&&r||!e&&i){!0===n.reloadPage&&i&&(t.j=!0);for(const e of s){let t=[];const n=e.name,a=e.domain,s=e.path;if(n instanceof RegExp)for(let e of o)n.test(e)&&t.push(e);else{let e=g(o,n);e>-1&&t.push(o[e])}t.length>0&&we(t,s,a)}}}})(c),X()),c&&(W(m.ie.le),W(m.ie.de),m.t.mode===e)||((n||a)&&W(m.ie.fe),o.j&&location.reload())})()},Te=e=>{const t=m.o.M?[]:m.o.R;return b(t,e)},Ee=(e,t)=>{const{O:o,Y:n}=m.o;if(!(e&&t&&y(t)&&b(o,t)&&0!==w(n[t]).length))return!1;((e,t)=>{const o=m.o,{Y:n,ee:a,k:s}=o,c=m.ae.ce[t]||{},r=m.ae.se[t]||{},i=w(n[t]);if(a[t]=[],y(e)){if('all'===e){if(a[t].push(...i),s)for(let e in c)c[e].checked=!0,T(c[e])}else if(b(i,e)&&a[t].push(e),s)for(let t in c)c[t].checked=e===t,T(c[t])}else if(v(e))for(let o of i){const n=b(e,o);n&&a[t].push(o),s&&(c[o].checked=n,T(c[o]))}const l=0===a[t].length;o.R=l?o.R.filter((e=>e!==t)):S([...o.R,t]),s&&(r.checked=!l,T(r))})(e,t),De()},Ae=(e,t)=>{const o=m.o.M?[]:m.o.Z[t];return b(o,e)},ke=e=>''!==xe(e,!0),Ne=(e,t,o)=>{let n=[];const a=e=>{if(y(e)){let t=xe(e);''!==t&&n.push(t)}else n.push(...Me(e))};if(v(e))for(let t of e)a(t);else a(e);we(n,t,o)},He=e=>{const{ae:t,o:n}=m;if(!n.T){if(!n.D){if(!e)return;pe(Pe,he)}n.T=!0,n.L=x(),n.g&&q(!0),F(t.he,o),A(t.Ce,i,'false'),z(t.ve,1),W(m.ie._e,_)}},Fe=()=>{const{ae:e,o:t,ie:n}=m;t.T&&(t.T=!1,t.g&&q(),z(e.Ke),P(e.he,o),A(e.Ce,i,'true'),z(t.L),t.L=null,W(n.ue,_))},Ve=()=>{const e=m.o;e.A||(e.k||fe(Pe,he),e.A=!0,F(m.ae.he,n),A(m.ae.we,i,'false'),e.T?e.U=x():e.L=x(),z(m.ae.ye,2),W(m.ie._e,u))},je=()=>{const e=m.o;e.A&&(e.A=!1,(()=>{const e=Le(),o=m.o.I,n=m.ae.se,a=m.ae.ce,s=e=>m.o.i.mode===t&&!!o[e].enabled;for(const t in n){const c=!!o[t].readOnly;n[t].checked=c||(e?Te(t):s(t));for(const o in a[t])a[t][o].checked=c||(e?Ae(o,t):s(t))}})(),z(m.ae.Ge),P(m.ae.he,n),A(m.ae.we,i,'true'),e.T?(z(e.U,1),e.U=null):(z(e.L),e.L=null),W(m.ie.ue,u))};var Pe={show:He,hide:Fe,showPreferences:Ve,hidePreferences:je,acceptCategory:De};const Ie=async(e,t)=>{if(!me(e))return!1;const o=m.o;return!(e===ge()&&!0!==t||!await ve(e)||(be(e),o.D&&pe(Pe,he),o.k&&fe(Pe,he),ye(),0))},Oe=()=>{const{P:e,Z:t}=m.o,{accepted:o,rejected:n}=(()=>{const{M:e,R:t,O:o}=m.o;return{accepted:t,rejected:e?[]:o.filter((e=>!b(t,e)))}})();return I({acceptType:e,acceptedCategories:o,rejectedCategories:n,acceptedServices:t,rejectedServices:O()})},Re=(e,t)=>{let o=document.querySelector('script[src="'+e+'"]');return new Promise((n=>{if(o)return n(!0);if(o=E('script'),h(t))for(const e in t)A(o,e,t[e]);o.onload=()=>n(!0),o.onerror=()=>{o.remove(),n(!1)},o.src=e,H(document.head,o)}))},Be=e=>{let t,o=e.value,n=e.mode,a=!1;const s=m.o;if('update'===n){s.v=t=Ge('data');const e=typeof t==typeof o;if(e&&'object'==typeof t){!t&&(t={});for(let e in o)t[e]!==o[e]&&(t[e]=o[e],a=!0)}else!e&&t||t===o||(t=o,a=!0)}else t=o,a=!0;return a&&(s.v=t,s.p.data=t,Ce(!0)),a},Ge=(e,t)=>{const o=Se(t);return e?o[e]:o},Je=e=>{const t=m.t,o=m.o.i;return e?t[e]||o[e]:{...t,...o,cookie:{...t.cookie}}},Le=()=>!m.o.M,Ue=async e=>{const{o:o,t:n,ie:a}=m,c=window;if(!c._ccRun){if(c._ccRun=!0,(e=>{const{ae:o,t:n,o:a}=m,c=n,r=a,{cookie:i}=c,l=m.re,d=e.cookie,f=e.categories,_=w(f)||[],u=navigator,p=document;o.Ue=p,o.he=p.documentElement,i.domain=location.hostname,r.i=e,r.I=f,r.O=_,r._=e.language.translations,r.g=!!e.disablePageInteraction,l.le=e.onFirstConsent,l.de=e.onConsent,l.fe=e.onChange,l.ue=e.onModalHide,l._e=e.onModalShow,l.pe=e.onModalReady;const{mode:g,autoShow:v,lazyHtmlGeneration:y,autoClearCookies:C,revision:S,manageScriptTags:x,hideFromBots:M}=e;g===t&&(c.mode=g),'boolean'==typeof C&&(c.autoClearCookies=C),'boolean'==typeof x&&(c.manageScriptTags=x),'number'==typeof S&&S>=0&&(c.revision=S,r.H=!0),'boolean'==typeof v&&(c.autoShow=v),'boolean'==typeof y&&(c.lazyHtmlGeneration=y),!1===M&&(c.hideFromBots=!1),!0===c.hideFromBots&&u&&(r.J=u.userAgent&&/bot|crawl|spider|slurp|teoma/i.test(u.userAgent)||u.webdriver),h(d)&&(c.cookie={...i,...d}),c.autoClearCookies,r.H,c.manageScriptTags,(e=>{const{I:t,Y:o,Z:n,ee:a,B:s}=m.o;for(let c of e){const e=t[c],r=e.services||{},i=h(r)&&w(r)||[];o[c]={},n[c]=[],a[c]=[],e.readOnly&&(s.push(c),n[c]=i),m.ae.ce[c]={};for(let e of i){const t=r[e];t.Se=!1,o[c][e]=t}}})(_),(()=>{if(!m.t.manageScriptTags)return;const e=m.o,t=D(document,'script['+s+']');for(const o of t){let t=N(o,s),n=o.dataset.service||'',a=!1;if(t&&'!'===t.charAt(0)&&(t=t.slice(1),a=!0),'!'===n.charAt(0)&&(n=n.slice(1),a=!0),b(e.O,t)&&(e.ne.push({Me:o,xe:!1,Ee:a,De:t,Te:n}),n)){const o=e.Y[t];o[n]||(o[n]={Se:!1})}}})(),be((()=>{const e=m.o.i.language.autoDetect;if(e){let t;if('browser'===e?t=navigator.language.slice(0,2).toLowerCase():'document'===e&&(t=document.documentElement.lang),me(t))return t}return ge()})())})(e),o.J)return;(()=>{const e=m.o,o=m.t,n=Se(),{categories:a,services:s,consentId:c,consentTimestamp:r,lastConsentTimestamp:i,data:l,revision:d}=n,f=v(a);e.p=n,e.S=c;const _=!!c&&y(c);e.h=r,e.h&&(e.h=new Date(r)),e.C=i,e.C&&(e.C=new Date(i)),e.v=void 0!==l?l:null,e.H&&_&&d!==o.revision&&(e.F=!1),e.M=!(_&&e.F&&e.h&&e.C&&f),e.M,e.M?o.mode===t&&((()=>{const e=m.o;for(const o of e.O){const n=e.I[o];if(n.readOnly||n.enabled&&e.i.mode===t){e.G.push(o);const t=e.Y[o]||{};for(let n in t)e.Z[o].push(n)}}})(),e.R=[...e.G]):(e.Z={...e.Z,...s},L([...e.B,...a])),e.ee={...e.Z}})();const i=Le();if(!await ve())return!1;if(U(null,r=Pe,fe,he),m.o.M&&pe(r,he),m.t.lazyHtmlGeneration||fe(r,he),(()=>{const e=m.ae,t=m.o;B(e.he,'keydown',(e=>{if('Tab'!==e.key)return;if(!t.A&&!t.T)return;const o=t.W,n=t.K;if(o.length>0){const t=x();e.shiftKey?t!==o[0]&&n.contains(t)||(M(e),z(o[1])):t!==o[1]&&n.contains(t)||(M(e),z(o[0]))}}),!0)})(),n.autoShow&&!i&&He(!0),i)return X(),W(a.de);n.mode===t&&X(o.G)}var r},ze=e=>{const{qe:t,he:s}=m.ae,{name:c,path:r,domain:i}=m.t.cookie;e&&Ne(c,r,i);for(const{me:e,ge:t,be:o}of m.o.m)e.removeEventListener(t,o);t?.remove(),s?.classList.remove(a,n,o);const l=new p;for(const e in m)m[e]=l[e];window._ccRun=!1};export{De as acceptCategory,Ee as acceptService,Te as acceptedCategory,Ae as acceptedService,Ne as eraseCookies,Je as getConfig,Ge as getCookie,Oe as getUserPreferences,Fe as hide,je as hidePreferences,Re as loadScript,ze as reset,Ue as run,Be as setCookieData,Ie as setLanguage,He as show,Ve as showPreferences,Le as validConsent,ke as validCookie};
