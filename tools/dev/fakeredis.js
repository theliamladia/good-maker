// A tiny in-memory stand-in for the Upstash REST API, for local tests only.
const http=require('http');const kv=new Map();
const get=(k,d)=>kv.has(k)?kv.get(k):d;
const C={
 GET:([k])=>{const v=kv.get(k);return v===undefined||typeof v==='object'?null:v;},
 SET:([k,v,...o])=>{const nx=o.includes('NX');if(nx&&kv.has(k))return null;kv.set(k,String(v));return 'OK';},
 INCR:([k])=>{const n=(+get(k,0))+1;kv.set(k,String(n));return n;},
 DEL:(ks)=>{let n=0;for(const k of ks)if(kv.delete(k))n++;return n;},
 MGET:(ks)=>ks.map((k)=>C.GET([k])),
 SADD:([k,...m])=>{const s=get(k,new Set());kv.set(k,s);let n=0;for(const x of m)if(!s.has(String(x))){s.add(String(x));n++;}return n;},
 SREM:([k,...m])=>{const s=get(k,new Set());let n=0;for(const x of m)if(s.delete(String(x)))n++;return n;},
 SMEMBERS:([k])=>[...get(k,new Set())],
 SISMEMBER:([k,m])=>get(k,new Set()).has(String(m))?1:0,
 SCARD:([k])=>get(k,new Set()).size,
 LPUSH:([k,...v])=>{const l=get(k,[]);kv.set(k,l);for(const x of v)l.unshift(String(x));return l.length;},
 LRANGE:([k,a,b])=>{const l=get(k,[]);b=+b<0?l.length+ +b:+b;return l.slice(+a,b+1);},
 LLEN:([k])=>get(k,[]).length,
 LSET:([k,i,v])=>{get(k,[])[+i]=String(v);return 'OK';},
 SCAN:()=>['0',[...kv.keys()].filter((k)=>/^user:.*:inv$/.test(k))],
 EXPIRE:()=>1, TTL:()=>100,
 EXISTS:(ks)=>ks.filter((k)=>kv.has(k)).length,
 HSET:([k,...fv])=>{const h=get(k,new Map());kv.set(k,h);let n=0;for(let i=0;i<fv.length;i+=2){if(!h.has(String(fv[i])))n++;h.set(String(fv[i]),String(fv[i+1]));}return n;},
 HGET:([k,f])=>{const h=kv.get(k);return h instanceof Map&&h.has(String(f))?h.get(String(f)):null;},
 HDEL:([k,...fs])=>{const h=kv.get(k);if(!(h instanceof Map))return 0;let n=0;for(const f of fs)if(h.delete(String(f)))n++;return n;},
 HGETALL:([k])=>{const h=kv.get(k);return h instanceof Map?[...h].flat():[];},
 LREM:([k,c,v])=>{const l=get(k,[]);const i=l.indexOf(String(v));if(i<0)return 0;l.splice(i,1);return 1;},
 LTRIM:([k,a,b])=>{const l=get(k,[]);kv.set(k,l.slice(+a,+b+1));return 'OK';},
};
http.createServer((req,res)=>{let b='';req.on('data',d=>b+=d).on('end',()=>{const [cmd,...a]=JSON.parse(b);const f=C[String(cmd).toUpperCase()];
 res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(f?{result:f(a)}:{error:'unknown '+cmd}));});}).listen(+process.env.FAKEREDIS_PORT || 8797);
module.exports={kv};
