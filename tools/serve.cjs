/* Dependency-free preview of the exact deployment folder. */
'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.cjs':'text/plain; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.wasm':'application/wasm','.md':'text/plain; charset=utf-8','.py':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8'};
function createServer(root){
 root=path.resolve(root);
 return http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','SAMEORIGIN');res.setHeader('Content-Security-Policy',"frame-ancestors 'self'; base-uri 'self'; object-src 'none'");res.setHeader('Cache-Control','no-store');
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch(_){res.writeHead(400);res.end();return;}
  if(pathname==='/api/review'){
   res.status=n=>{res.statusCode=n;return res;};res.json=value=>{res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(value));return res;};
   if(req.method==='POST'){
    let bytes=0;const chunks=[];
    try{for await(const chunk of req){bytes+=chunk.length;if(bytes<=128*1024)chunks.push(chunk);}if(bytes>128*1024){res.status(413).json({error:'요청이 너무 커요. 코드와 질문을 줄여 주세요.'});return;}req.body=Buffer.concat(chunks).toString('utf8');}catch(_){res.status(400).json({error:'요청을 읽지 못했어요. 다시 시도해 주세요.'});return;}
   }
   try{await require(path.join(root,'api/review.js'))(req,res);}catch(_){if(!res.writableEnded)res.status(503).json({error:'앱 서버의 AI 연결이 준비되지 않았어요.'});}return;
  }
  if(req.method!=='GET'&&req.method!=='HEAD'){res.setHeader('Allow','GET, HEAD');res.writeHead(405);res.end();return;}
  if(pathname.startsWith('/api/')||pathname.split(/[\\/]/).some(part=>part.startsWith('.')&&part!=='')){res.writeHead(404);res.end();return;}
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(404);res.end();return;}
  try{const stat=await fs.promises.stat(file);if(!stat.isFile())throw new Error();res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.setHeader('Content-Length',stat.size);if(req.method==='HEAD'){res.end();return;}fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);}catch(_){res.writeHead(404);res.end('File not found');}
 });
}
module.exports={createServer};
if(require.main===module){const root=fs.existsSync(path.join(__dirname,'index.html'))?__dirname:path.resolve(__dirname,'..');const port=Number(process.env.PORT)||4173;createServer(root).listen(port,'127.0.0.1',()=>console.log('CodeRun: http://127.0.0.1:'+port));}
