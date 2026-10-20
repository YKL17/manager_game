import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const mime = { '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml' };
const port = Number(process.env.PORT || 5173);
const server = http.createServer((req,res)=>{
  try{
    const url = new URL(req.url,'http://localhost');
    let pathname = decodeURIComponent(url.pathname);
    if(pathname === '/') pathname='/index.html';
    const file=path.resolve(root,'.'+pathname);
    if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
    const content=fs.readFileSync(file);
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(content);
  }catch {res.writeHead(404);res.end('Not found');}
});
server.listen(port,()=>console.log(`Golden Agent 1996 is running at http://localhost:${port}`));
