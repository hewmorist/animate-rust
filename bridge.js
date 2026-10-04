'use strict';
const assetVersion=document.querySelector('meta[name="gallery-build"]').content;
const assetUrl=path=>`${path}?v=${encodeURIComponent(assetVersion)}`;
const names=['Albrecht Dürer','Alexander Calder','Amedeo Modigliani','Andy Warhol','Claude Monet','Diego Rivera','Edgar Degas','Edvard Munch','Egon Schiele','Ernst Ludwig Kirchner','Francis Bacon','Francisco Goya','Frida Kahlo','Georges Seurat','Georgia O’Keeffe','Gustav Klimt','Henri Matisse','Henry Moore','Jackson Pollock','James McNeill Whistler','Jan van Eyck','Jean-Michel Basquiat','Johannes Vermeer','Katsushika Hokusai','Leonardo da Vinci','Louise Bourgeois','Marc Chagall','Michelangelo','Otto Dix','Pablo Picasso','Paul Cézanne','Paul Klee','Paul Gauguin','Piet Mondrian','Raphael','Rembrandt','René Magritte','Salvador Dalí','Sandro Botticelli','Vincent van Gogh','Wassily Kandinsky','William Turner'];
const labels=['North painting','East painting','South painting','West painting','Ceiling mobile'];
const $=id=>document.getElementById(id), held=new Set(), keys=new Set();
let ready=false,preview=false,currentTarget=-1,score=0,lastReport=0,lastSignature='',mapState={x:5,z:4.5,yaw:-Math.PI/2},viewPointer=null,mapPointer=null;
names.forEach((name,i)=>$('artist').add(new Option(name,i)));
function call(name,...args){if(ready)wasm_exports[name](...args);}
function updateInput(){let mask=0;for(const bit of held)mask|=1<<bit;for(const bit of keys)mask|=1<<bit;call('gallery_input',mask);}
function clearInput(){held.clear();keys.clear();updateInput();viewPointer=null;mapPointer=null;}
function drawMap(){const c=$('map'),g=c.getContext('2d');g.fillStyle='#101820';g.fillRect(0,0,400,320);g.strokeStyle='#40515e';g.lineWidth=1;for(let x=20;x<=380;x+=36){g.beginPath();g.moveTo(x,16);g.lineTo(x,304);g.stroke();}for(let y=16;y<=304;y+=36){g.beginPath();g.moveTo(20,y);g.lineTo(380,y);g.stroke();}g.strokeStyle='#b2a488';g.lineWidth=6;g.strokeRect(20,16,360,288);g.strokeStyle='#deac67';g.lineWidth=8;for(const [a,b] of [[[168,18],[232,18]],[[378,128],[378,192]],[[168,302],[232,302]],[[22,128],[22,192]]]){g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke();}for(const [cx,cy,inward] of [[20+1.2*36,16,1],[20+8.8*36,304,-1]]){g.strokeStyle='#101820';g.lineWidth=9;g.beginPath();g.moveTo(cx-0.6*36,cy);g.lineTo(cx+0.6*36,cy);g.stroke();g.strokeStyle='#d4c5ad';g.lineWidth=2;g.beginPath();for(const sign of [-1,1]){g.moveTo(cx+sign*0.6*36,cy);g.lineTo(cx+sign*0.6*36,cy+inward*12);}g.stroke();}g.fillStyle='#c37a65';g.beginPath();g.arc(20+7.2*36,16+2.2*36,6,0,Math.PI*2);g.fill();const x=20+mapState.x*36,y=16+mapState.z*36;g.strokeStyle='#8cddf0';g.lineWidth=3;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(mapState.yaw)*23,y+Math.sin(mapState.yaw)*23);g.stroke();g.fillStyle='#8cddf0';g.beginPath();g.arc(x,y,7,0,Math.PI*2);g.fill();}
miniquad_add_plugin({name:'gallery_bridge',version:'0.1.0',register_plugin(imports){imports.env.gallery_report=(x,z,yaw,eye,target,count,lights,isPreview,fps,ptr)=>{
    if(!ready){ready=true;$('loading').hidden=true;$('reset').disabled=false;}
    const now=performance.now();if(now-lastReport<80)return;lastReport=now;
    mapState={x,z,yaw};drawMap();$('fps').textContent=`${fps} FPS`;preview=!!isPreview;score=count;
    const answers=Array.from(new Int32Array(wasm_memory.buffer,ptr,5));
    const signature=JSON.stringify([target,count,isPreview,answers]);if(signature===lastSignature)return;lastSignature=signature;
    if(target!==currentTarget){currentTarget=target;$('artist').value=target<0||answers[target]<0?'':String(answers[target]);}
    $('target').textContent=count===5?'All five artists identified — power restored!':target<0?'Center an artwork in the flashlight beam.':`${labels[target]} acquired`;
    $('artist').disabled=target<0||count===5;$('submit').disabled=target<0||!$('artist').value||count===5;
    $('score').textContent=`${count} / 5 identified`;
    $('records').replaceChildren(...answers.flatMap((a,i)=>{if(a<0)return[];const li=document.createElement('li');li.textContent=`${labels[i]}: ${names[a]} — ${wasm_exports.gallery_feedback(i)===1?'correct':'try again'}`;return[li];}));
};},on_init(){drawMap();}});
document.querySelectorAll('[data-bit]').forEach(button=>{const bit=Number(button.dataset.bit);button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);held.add(bit);updateInput();});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>{held.delete(bit);updateInput();});button.addEventListener('contextmenu',e=>e.preventDefault());});
const bindings={KeyW:0,ArrowUp:0,KeyS:1,ArrowDown:1,KeyA:2,ArrowLeft:2,KeyD:3,ArrowRight:3,KeyQ:4,KeyE:5,KeyT:6,KeyG:7,KeyR:8,KeyF:9};
const physicalKeys=new Set();
document.addEventListener('keydown',e=>{if($('artDialog').open||e.target.matches('select,input,button'))return;const bit=bindings[e.code];if(bit===undefined)return;e.preventDefault();physicalKeys.add(e.code);keys.clear();for(const key of physicalKeys)keys.add(bindings[key]);updateInput();});
document.addEventListener('keyup',e=>{physicalKeys.delete(e.code);keys.clear();for(const key of physicalKeys)keys.add(bindings[key]);updateInput();});
window.addEventListener('blur',()=>{physicalKeys.clear();clearInput();});document.addEventListener('visibilitychange',()=>{if(document.hidden){physicalKeys.clear();clearInput();}});
$('artist').onchange=()=>{$('submit').disabled=currentTarget<0||!$('artist').value||score===5;};
// Browser media playback avoids iPhone's separate Web Audio mute behavior.
const winAudio=new Audio(assetUrl('win-chime.wav'));winAudio.preload='auto';
let chimeSession=false;
function restoreAudioSession(){if(chimeSession){try{navigator.audioSession.type='auto';}catch{}chimeSession=false;}}
winAudio.addEventListener('ended',restoreAudioSession);
function stopChime(){winAudio.pause();winAudio.currentTime=0;restoreAudioSession();$('replayChime').hidden=true;}
function playWinChime(){
    try{if(navigator.audioSession){navigator.audioSession.type='playback';chimeSession=true;}}catch{}
    winAudio.currentTime=0;
    // Invoke play synchronously from the answer/replay tap, preserving user activation.
    const playing=winAudio.play();
    $('replayChime').hidden=false;
    if(playing)playing.catch(()=>{restoreAudioSession();$('replayChime').textContent='Play victory chime';});
}
$('replayChime').onclick=playWinChime;
$('submit').onclick=()=>{if(currentTarget>=0&&$('artist').value){const before=wasm_exports.gallery_won();call('gallery_submit',Number($('artist').value));if(!before&&wasm_exports.gallery_won()){if(matchMedia('(prefers-reduced-motion: reduce)').matches)call('gallery_stop_celebration');playWinChime();}}};
function inspectArt(i){if(i<0||i>=4)return;clearInput();physicalKeys.clear();$('artTitle').textContent=labels[i];$('artFull').src=assetUrl(`assets/art-${i}.jpg`);$('artDialog').showModal();}
$('closeDialog').onclick=()=>$('artDialog').close();
$('artDialog').addEventListener('close',()=>{clearInput();physicalKeys.clear();view.focus();});
$('reset').onclick=()=>{stopChime();clearInput();physicalKeys.clear();currentTarget=-1;lastSignature='';$('artist').value='';call('gallery_reset');};
const view=$('glcanvas');view.addEventListener('pointerdown',e=>{if(!ready)return;e.preventDefault();view.focus();view.setPointerCapture(e.pointerId);viewPointer={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};});
view.addEventListener('pointermove',e=>{if(viewPointer?.id!==e.pointerId)return;const dx=e.clientX-viewPointer.x,dy=e.clientY-viewPointer.y;viewPointer={...viewPointer,x:e.clientX,y:e.clientY,moved:viewPointer.moved||Math.hypot(e.clientX-viewPointer.startX,e.clientY-viewPointer.startY)>8};call('gallery_look',dx*0.005,-dy*0.005);});
view.addEventListener('pointerup',e=>{if(viewPointer?.id===e.pointerId&&!viewPointer.moved){const rect=view.getBoundingClientRect();const i=wasm_exports.gallery_pick((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2,rect.width/rect.height);inspectArt(i);}viewPointer=null;});
for(const event of ['pointercancel','lostpointercapture'])view.addEventListener(event,()=>{viewPointer=null;});
const map=$('map');function mapMove(e){const r=map.getBoundingClientRect();call('gallery_position',((e.clientX-r.left)/r.width*400-20)/36,((e.clientY-r.top)/r.height*320-16)/36);}
map.addEventListener('pointerdown',e=>{e.preventDefault();mapPointer=e.pointerId;map.setPointerCapture(e.pointerId);mapMove(e);});map.addEventListener('pointermove',e=>{if(mapPointer===e.pointerId)mapMove(e);});for(const event of ['pointerup','pointercancel','lostpointercapture'])map.addEventListener(event,()=>{mapPointer=null;});
function fail(message){$('loading').hidden=false;$('loading').replaceChildren();const p=document.createElement('p');p.textContent=message;$('loading').append(p);}
window.addEventListener('error',e=>{if(!ready)fail(`The Rust engine could not start: ${e.message}`);});window.addEventListener('unhandledrejection',e=>{if(!ready)fail(`The Rust engine could not load: ${e.reason}`);});
if(!window.WebAssembly)fail('This browser does not support WebAssembly.');else load(assetUrl('gallery.wasm'));

setTimeout(()=>{if(!ready)fail('The engine has not started. Reload this page to try again.');},20000);
