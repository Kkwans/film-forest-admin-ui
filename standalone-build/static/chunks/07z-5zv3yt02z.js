(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,33525,(e,r,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"warnOnce",{enumerable:!0,get:function(){return n}});let n=e=>{}},18967,(e,r,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n={DecodeError:function(){return h},MiddlewareNotFoundError:function(){return j},MissingStaticPage:function(){return P},NormalizeError:function(){return b},PageNotFoundError:function(){return x},SP:function(){return p},ST:function(){return y},WEB_VITALS:function(){return i},execOnce:function(){return a},getDisplayName:function(){return l},getLocationOrigin:function(){return u},getURL:function(){return f},isAbsoluteUrl:function(){return c},isResSent:function(){return d},loadGetInitialProps:function(){return m},normalizeRepeatedSlashes:function(){return g},stringifyError:function(){return v}};for(var o in n)Object.defineProperty(t,o,{enumerable:!0,get:n[o]});let i=["CLS","FCP","FID","INP","LCP","TTFB"];function a(e){let r,t=!1;return(...n)=>(t||(t=!0,r=e(...n)),r)}let s=/^[a-zA-Z][a-zA-Z\d+\-.]*?:/,c=e=>s.test(e);function u(){let{protocol:e,hostname:r,port:t}=window.location;return`${e}//${r}${t?":"+t:""}`}function f(){let{href:e}=window.location,r=u();return e.substring(r.length)}function l(e){return"string"==typeof e?e:e.displayName||e.name||"Unknown"}function d(e){return e.finished||e.headersSent}function g(e){let r=e.split("?");return r[0].replace(/\\/g,"/").replace(/\/\/+/g,"/")+(r[1]?`?${r.slice(1).join("?")}`:"")}async function m(e,r){let t=r.res||r.ctx&&r.ctx.res;if(!e.getInitialProps)return r.ctx&&r.Component?{pageProps:await m(r.Component,r.ctx)}:{};let n=await e.getInitialProps(r);if(t&&d(t))return n;if(!n)throw Object.defineProperty(Error(`"${l(e)}.getInitialProps()" should resolve to an object. But found "${n}" instead.`),"__NEXT_ERROR_CODE",{value:"E1025",enumerable:!1,configurable:!0});return n}let p="u">typeof performance,y=p&&["mark","measure","getEntriesByName"].every(e=>"function"==typeof performance[e]);class h extends Error{}class b extends Error{}class x extends Error{constructor(e){super(),this.code="ENOENT",this.name="PageNotFoundError",this.message=`Cannot find module for page: ${e}`}}class P extends Error{constructor(e,r){super(),this.message=`Failed to load static file for page: ${e} ${r}`}}class j extends Error{constructor(){super(),this.code="ENOENT",this.message="Cannot find the middleware module"}}function v(e){return JSON.stringify({message:e.message,stack:e.stack})}},98183,(e,r,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n={assign:function(){return c},searchParamsToUrlQuery:function(){return i},urlQueryToSearchParams:function(){return s}};for(var o in n)Object.defineProperty(t,o,{enumerable:!0,get:n[o]});function i(e){let r={};for(let[t,n]of e.entries()){let e=r[t];void 0===e?r[t]=n:Array.isArray(e)?e.push(n):r[t]=[e,n]}return r}function a(e){return"string"==typeof e?e:("number"!=typeof e||isNaN(e))&&"boolean"!=typeof e?"":String(e)}function s(e){let r=new URLSearchParams;for(let[t,n]of Object.entries(e))if(Array.isArray(n))for(let e of n)r.append(t,a(e));else r.set(t,a(n));return r}function c(e,...r){for(let t of r){for(let r of t.keys())e.delete(r);for(let[r,n]of t.entries())e.append(r,n)}return e}},63491,e=>{"use strict";var r=e.i(43476);e.s(["default",0,function({error:e,reset:t}){return(0,r.jsxs)("html",{lang:"zh-CN",children:[(0,r.jsx)("head",{children:(0,r.jsx)("style",{children:`
          :root {
            --err-bg: #fafafa;
            --err-fg: #1a1a1a;
            --err-card: #f0f0f0;
            --err-muted: #666;
            --err-accent: #2563eb;
            --err-accent-fg: #fff;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --err-bg: #0a0a0a;
              --err-fg: #e5e5e5;
              --err-card: #1a1a1a;
              --err-muted: #999;
              --err-accent: #2563eb;
              --err-accent-fg: #fff;
            }
          }
          .dark {
            --err-bg: #0a0a0a;
            --err-fg: #e5e5e5;
            --err-card: #1a1a1a;
            --err-muted: #999;
            --err-accent: #2563eb;
            --err-accent-fg: #fff;
          }
        `})}),(0,r.jsx)("body",{style:{margin:0,fontFamily:'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',backgroundColor:"var(--err-bg)",color:"var(--err-fg)",display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"},children:(0,r.jsxs)("div",{style:{textAlign:"center",padding:"2rem"},children:[(0,r.jsx)("div",{style:{width:"80px",height:"80px",borderRadius:"50%",backgroundColor:"var(--err-card)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1.5rem",fontSize:"2.5rem"},children:"💥"}),(0,r.jsx)("h1",{style:{fontSize:"1.5rem",fontWeight:700,marginBottom:"0.75rem"},children:"管理后台发生严重错误"}),(0,r.jsx)("p",{style:{fontSize:"0.875rem",color:"var(--err-muted)",marginBottom:"1.5rem",maxWidth:"24rem"},children:e.message||"应用遇到了意外错误，请尝试刷新页面"}),(0,r.jsx)("button",{onClick:t,style:{padding:"0.75rem 2rem",borderRadius:"0.5rem",border:"none",backgroundColor:"var(--err-accent)",color:"var(--err-accent-fg)",fontSize:"1rem",fontWeight:500,cursor:"pointer"},children:"刷新页面"})]})})]})}])}]);