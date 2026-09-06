var o=globalThis.browser??globalThis.chrome,s=e=>o.storage.local.get(e);var t=Object.freeze({get:e=>o.storage.session.get(e),set:e=>o.storage.session.set(e)}),r=o;export{s as a,r as b};
