// Minimal secure backend for Queen of Shadows AI Studio.
// Set GEMINI_API_KEY in the server environment; never put it in browser JavaScript.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const MIME = {".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".webmanifest":"application/manifest+json",".svg":"image/svg+xml"};

function send(res, status, body, type="application/json; charset=utf-8") {
  res.writeHead(status, {"Content-Type":type,"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}
function readBody(req) {
  return new Promise((resolve,reject)=>{
    let data="";
    req.on("data",chunk=>{data+=chunk;if(data.length>100000) reject(new Error("Request too large"));});
    req.on("end",()=>{try{resolve(JSON.parse(data||"{}"));}catch{reject(new Error("Invalid JSON"));}});
    req.on("error",reject);
  });
}
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,"http://localhost");
  if(req.method==="GET" && url.pathname==="/api/health") return send(res,200,{ok:true,provider:"Google Lyria 3.5",configured:Boolean(process.env.GEMINI_API_KEY)});
  if(req.method==="POST" && url.pathname==="/api/generate"){
    if(!process.env.GEMINI_API_KEY) return send(res,503,{error:"На сервере ещё не добавлен ключ Google AI. Добавь GEMINI_API_KEY в переменные окружения."});
    try{
      const body=await readBody(req);
      const prompt=String(body.prompt||"").slice(0,12000);
      if(!prompt.trim()) return send(res,400,{error:"Добавь описание песни или текст."});
      const upstream=await fetch("https://generativelanguage.googleapis.com/v1beta/interactions",{
        method:"POST",
        headers:{"Content-Type":"application/json","x-goog-api-key":process.env.GEMINI_API_KEY},
        body:JSON.stringify({model:"lyria-3.5",input:prompt,response_format:{type:"audio"}})
      });
      const payload=await upstream.json();
      if(!upstream.ok) {
        const message=payload?.error?.message || "Google AI generation request failed";
        return send(res,upstream.status,{error:message});
      }
      let audio=payload?.output_audio?.data || null;
      let text=payload?.output_text || "";
      if(!audio && Array.isArray(payload?.steps)){
        for(const step of payload.steps){
          if(step.type==="model_output" && Array.isArray(step.content)){
            for(const block of step.content){
              if(block.type==="audio" && block.data) audio=block.data;
              if(block.type==="text" && block.text) text += (text?"\n":"")+block.text;
            }
          }
        }
      }
      if(!audio) return send(res,502,{error:"Google ответил, но аудиофайл не найден в ответе. Попробуй ещё раз."});
      return send(res,200,{title:String(body.title||"Queen of Shadows"),audioBase64:audio,lyrics:text});
    }catch(err){return send(res,500,{error:err.message||"Server error"});}
  }
  if(req.method==="GET"){
    let requested=decodeURIComponent(url.pathname==="/"?"/index.html":url.pathname);
    const file=path.resolve(ROOT,"."+requested);
    if(!file.startsWith(ROOT+path.sep) && file!==path.join(ROOT,"index.html")) return send(res,403,"Forbidden","text/plain");
    fs.readFile(file,(err,data)=>{
      if(err)return send(res,404,"Not found","text/plain; charset=utf-8");
      res.writeHead(200,{"Content-Type":MIME[path.extname(file)]||"application/octet-stream","X-Content-Type-Options":"nosniff"});
      res.end(data);
    });
    return;
  }
  send(res,405,{error:"Method not allowed"});
});
server.listen(PORT,()=>console.log(`Queen of Shadows AI Studio listening on ${PORT}`));
