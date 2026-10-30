const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
let lang="ru", pendingInstall=null, lastPrompt="", currentAudioUrl=null;
const translations={
ru:{eyebrow:"ТВОЯ ТЁМНАЯ МУЗЫКАЛЬНАЯ ВСЕЛЕННАЯ",heroTitle:"Создавай музыку.<br><em>Повелевай тенями.</em>",heroSub:"Песни, тексты и обложки — в одном готическом пространстве.",startCreating:"Начать создавать",music:"Музыка",lyrics:"Тексты",covers:"Обложки",library:"Библиотека",musicTitle:"Создать композицию",trackName:"Название композиции",genre:"Жанр",vocal:"Вокал",songIdea:"Опиши звучание и идею песни",lyricsOptional:"Текст песни (необязательно)",generateTrack:"Создать песню ♫",audioHint:"Песня создаётся искусственным интеллектом. После генерации её можно будет слушать здесь и скачать в MP3.",playerTitle:"Твой готовый трек",playerHint:"Здесь появится песня, созданная по твоему тексту и настройкам.",readyToPlay:"Готово к прослушиванию",downloadAudio:"↓ Скачать MP3",lyricsTitle:"Мастерская текстов",lyricTheme:"Тема песни",lyricGenre:"Стиль",lyricLang:"Язык текста",makeLyrics:"Создать черновик текста",lyricsHint:"Черновик — отправная точка. Его можно редактировать.",yourLyrics:"Твой текст",saveLyrics:"Сохранить текст в библиотеку",coversTitle:"Обложка альбома",albumTitle:"Название релиза",coverIdea:"Описание образа",updateCover:"Обновить надпись на обложке",makeCoverPrompt:"Подготовить промпт для AI-обложки",libraryTitle:"Моя библиотека",clear:"Очистить",emptyLibrary:"Пока здесь пусто. Создай первый проект.",footer:"Создано в темноте. Звучит по-твоему."},
en:{eyebrow:"YOUR DARK MUSICAL UNIVERSE",heroTitle:"Create music.<br><em>Command the shadows.</em>",heroSub:"Songs, lyrics and covers in one gothic space.",startCreating:"Start creating",music:"Music",lyrics:"Lyrics",covers:"Covers",library:"Library",musicTitle:"Create a composition",trackName:"Track title",genre:"Genre",vocal:"Vocals",songIdea:"Describe the sound and idea",lyricsOptional:"Lyrics (optional)",generateTrack:"Generate song ♫",audioHint:"AI will create your song. When it is ready, you can listen here and download the MP3.",playerTitle:"Your finished track",playerHint:"Your generated song will appear here.",readyToPlay:"Ready to play",downloadAudio:"↓ Download MP3",lyricsTitle:"Lyrics workshop",lyricTheme:"Song theme",lyricGenre:"Style",lyricLang:"Lyrics language",makeLyrics:"Create a lyric draft",lyricsHint:"The draft is a starting point. You can edit it.",yourLyrics:"Your lyrics",saveLyrics:"Save lyrics to library",coversTitle:"Album cover",albumTitle:"Release title",coverIdea:"Visual concept",updateCover:"Update cover lettering",makeCoverPrompt:"Prepare AI cover prompt",libraryTitle:"My library",clear:"Clear",emptyLibrary:"Nothing here yet. Create your first project.",footer:"Created in darkness. Sounds like you."}
};
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2300)}
function switchTab(name){$$(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));$$(".panel").forEach(p=>p.classList.toggle("active",p.id===name));}
$$(".tab").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.tab)));
$$("[data-go]").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.go)));
$("#langToggle").addEventListener("click",()=>{lang=lang==="ru"?"en":"ru";$("#langToggle").textContent=lang.toUpperCase();$$("[data-i18n]").forEach(el=>{const key=el.dataset.i18n;if(translations[lang][key])el.innerHTML=translations[lang][key]});});
function buildPrompt(){
 const title=$("#trackName").value.trim()||"Untitled";
 const genre=$("#genre").value, vocal=$("#vocal").value, idea=$("#songIdea").value.trim(), lyrics=$("#songLyrics").value.trim();
 const instrumental=vocal==="Без вокала";
 return {title,genre,vocal,idea,lyrics,instrumental};
}
$("#musicForm").addEventListener("submit",async e=>{
 e.preventDefault();
 const data=buildPrompt();
 const status=$("#generationStatus"), msg=$("#generationMessage"), title=$("#generationTitle"), btn=$("#generateButton");
 if(currentAudioUrl){URL.revokeObjectURL(currentAudioUrl);currentAudioUrl=null;}
 $("#audioPlayerArea").hidden=true; status.hidden=false; btn.disabled=true;
 title.textContent=lang==="ru"?"Создаём твою песню…":"Creating your song…";
 msg.textContent=lang==="ru"?"Это может занять несколько минут. Не закрывай страницу.":"This may take a few minutes. Keep this page open.";
 const style=`${data.genre}, ${data.vocal}, dark gothic atmosphere, powerful drums, electric guitars, deep bass, cinematic arrangement, polished studio production`;
 const prompt=`Create an original ${data.genre} song titled "${data.title}". Musical style: ${style}. Concept: ${data.idea}. ${data.instrumental?"Instrumental only, no vocals.":"Include expressive vocals matching the selected vocal style."} Aim for a complete song with intro, verses, chorus and bridge, around two minutes. ${data.lyrics?`Use these exact user-provided lyrics as the sung lyrics, preserving their wording and section labels:\n${data.lyrics}`:"Write original lyrics that fit the concept."} Do not imitate any specific artist or existing song.`;
 lastPrompt=prompt;
 try{
   const response=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,title:data.title})});
   const result=await response.json();
   if(!response.ok) throw new Error(result.error||"Generation failed");
   const bytes=Uint8Array.from(atob(result.audioBase64),c=>c.charCodeAt(0));
   const blob=new Blob([bytes],{type:"audio/mpeg"});
   currentAudioUrl=URL.createObjectURL(blob);
   const player=$("#audioPlayer"); player.pause(); player.src=currentAudioUrl; player.load();
   $("#audioFileName").textContent=result.title||data.title;
   $("#downloadAudio").href=currentAudioUrl;
   $("#downloadAudio").download=(data.title||"queen-of-shadows").replace(/[^\w\-]+/g,"-")+".mp3";
   $("#audioPlayerArea").hidden=false;
   $("#audioStatus").textContent=lang==="ru"?"Песня готова! Нажми ▶ на плеере.":"Your song is ready! Press play.";
   title.textContent=lang==="ru"?"Песня готова ♫":"Your song is ready ♫";
   msg.textContent=lang==="ru"?"Можешь слушать её здесь или скачать MP3.":"Listen here or download the MP3.";
   saveItem({type:"TRACK",title:data.title,detail:data.genre+" · "+data.vocal,prompt:lastPrompt});
 }catch(err){
   title.textContent=lang==="ru"?"Не удалось создать песню":"Could not generate song";
   msg.textContent=err.message+(lang==="ru"?" Проверь подключение сервера и API-ключ.":" Check the server connection and API key.");
 }finally{btn.disabled=false;}
});
const audioPlayer=$("#audioPlayer");
audioPlayer.addEventListener("error",()=>{$("#audioStatus").textContent=lang==="ru"?"Не удалось воспроизвести MP3. Попробуй скачать файл.":"Could not play the MP3. Try downloading it.";});
function getLibrary(){try{return JSON.parse(localStorage.getItem("qos-library")||"[]")}catch{return []}}
function saveItem(item){const items=getLibrary();items.unshift({...item,id:Date.now(),date:new Date().toLocaleDateString()});localStorage.setItem("qos-library",JSON.stringify(items));renderLibrary();toast(lang==="ru"?"Сохранено в библиотеку":"Saved to library");}
$("#makeLyrics").addEventListener("click",()=>{const theme=$("#lyricTheme").value.trim()||"a queen finding strength in the darkness";const english=$("#lyricLang").value==="English";const title=english?"CROWN OF NIGHT":"КОРОНА НОЧИ";const draft=english?`[Verse 1]\nThe moon is hanging, pale and cold,\nI wear the stories left untold.\nThrough silent halls, I claim my name,\nA quiet heart becomes a flame.\n\n[Pre-Chorus]\nNo chains can hold what storms set free,\nThe dark reveals the strength in me.\n\n[Chorus]\nI am the crown, I am the night,\nA crimson spark, a fearless light.\nI rise above the fading flame,\nThe shadows know and speak my name.\n\n[Verse 2]\n${theme}\nI turn the silence into sound,\nMy lost horizon can be found.\n\n[Bridge]\nLet the midnight open wide,\nI have nothing left to hide.\n\n[Final Chorus]\nI am the crown, I am the night,\nA crimson spark, a fearless light.`:`[Куплет 1]\nЛуна застыла в вышине,\nИ тени шепчут обо мне.\nСквозь тишину я слышу зов,\nЯ больше не боюсь оков.\n\n[Предприпев]\nПускай бушует тёмный ветер,\nМоя звезда за всё в ответе.\n\n[Припев]\nЯ — королева этой ночи,\nМой дух сильнее темноты.\nПускай весь мир вокруг молчит —\nВо мне огонь ещё горит.\n\n[Куплет 2]\n${theme}\nЯ превращаю боль в рассвет,\nИ страху больше места нет.\n\n[Бридж]\nОткрой мне небо цвета сна,\nЯ здесь теперь сама себе весна.\n\n[Финальный припев]\nЯ — королева этой ночи,\nМой дух сильнее темноты.\nПускай весь мир вокруг молчит —\nВо мне огонь ещё горит.`;$("#lyricsOutput").value=`# ${title}\n\n${draft}`;});
$("#saveLyrics").addEventListener("click",()=>saveItem({type:"LYRICS",title:$("#lyricTheme").value.trim()||"Untitled lyrics",detail:$("#lyricGenre").value,prompt:$("#lyricsOutput").value}));
function updateCover(){const t=$("#albumTitle").value.trim()||"Untitled";$("#coverTitlePreview").innerHTML=t.toUpperCase().replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replace(/\s+/g,"<br>");}
$("#updateCover").addEventListener("click",updateCover);
$("#coverPrompt").addEventListener("click",()=>{const p=`Square gothic darkwave album cover, title "${$("#albumTitle").value}", ${$("#coverIdea").value}. Black and crimson palette, cinematic moonlight, elegant gothic composition, high detail, no logos, legible typography.`;$("#coverPromptResult").textContent=p;});
$("#clearLibrary").addEventListener("click",()=>{if(confirm(lang==="ru"?"Удалить все сохранённые проекты?":"Delete all saved projects?")){localStorage.removeItem("qos-library");renderLibrary();}});
function renderLibrary(){const items=getLibrary();const box=$("#libraryList");box.innerHTML="";if(!items.length){box.innerHTML=`<p class="empty-state">${translations[lang].emptyLibrary}</p>`;return;}items.forEach(item=>{const row=document.createElement("div");row.className="library-item";const info=document.createElement("div");const title=document.createElement("strong");title.textContent=item.title;const small=document.createElement("small");small.textContent=`${item.type} · ${item.detail||""} · ${item.date}`;info.append(title,small);const del=document.createElement("button");del.className="text-button";del.textContent="×";del.setAttribute("aria-label","Delete "+item.title);del.addEventListener("click",()=>{localStorage.setItem("qos-library",JSON.stringify(getLibrary().filter(x=>x.id!==item.id)));renderLibrary()});row.append(info,del);box.append(row);});}
renderLibrary();
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();pendingInstall=e;$("#installBtn").hidden=false;});
$("#installBtn").addEventListener("click",async()=>{if(pendingInstall){pendingInstall.prompt();await pendingInstall.userChoice;pendingInstall=null;}else toast("On iPhone: Share → Add to Home Screen");});
if("serviceWorker" in navigator && location.protocol.startsWith("http"))window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
