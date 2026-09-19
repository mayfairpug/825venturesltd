import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.xml':'application/xml','.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp','.txt':'text/plain'};
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 let name;try{name=decodeURIComponent(url.pathname);}catch{res.writeHead(400);res.end();return;}
 const target=path.resolve(root,'.'+name+(name.endsWith('/')?'index.html':''));
 if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{const data=await fs.readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex'});res.end(await fs.readFile(root+'/404.html'));}
}).listen(4173,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4173 (noindex response headers)'));
