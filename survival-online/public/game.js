import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const socket = io();
const game = document.querySelector("#game");
const start = document.querySelector("#start");
const hud = document.querySelector("#hud");
const playBtn = document.querySelector("#playBtn");
const nameInput = document.querySelector("#nameInput");
const toast = document.querySelector("#toast");
const feed = document.querySelector("#feed");
const targetLabel = document.querySelector("#targetLabel");

let myId = null;
let worldSize = 220;
let self = { hp:100, food:100, water:100, stamina:100, inv:{} };
let playing = false;
let yaw = 0, pitch = 0;
let selected = "hands";
let buildType = null;
let sprinting = false;
let mobileMove = {x:0,y:0};

const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:"high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
game.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x90a78c);
scene.fog = new THREE.FogExp2(0x879781, 0.0055);

const camera = new THREE.PerspectiveCamera(72, innerWidth/innerHeight, .08, 850);
camera.position.set(0, 1.72, 0);
scene.add(camera);

const hemi = new THREE.HemisphereLight(0xbfd1c8, 0x3c3325, 1.25);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1c7, 2.1);
sun.position.set(70, 110, 35);
sun.castShadow = true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left = -140;
sun.shadow.camera.right = 140;
sun.shadow.camera.top = 140;
sun.shadow.camera.bottom = -140;
scene.add(sun);

const groundMat = new THREE.MeshStandardMaterial({ color:0x667b52, roughness:.96 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(500,500,1,1), groundMat);
ground.rotation.x = -Math.PI/2;
ground.receiveShadow = true;
scene.add(ground);

const water = new THREE.Mesh(
  new THREE.PlaneGeometry(76,50),
  new THREE.MeshPhysicalMaterial({color:0x456f78,transparent:true,opacity:.82,roughness:.23,metalness:.02})
);
water.rotation.x = -Math.PI/2;
water.position.set(0,.04,90);
scene.add(water);

const sand = new THREE.Mesh(new THREE.PlaneGeometry(88,62), new THREE.MeshStandardMaterial({color:0xa99568,roughness:1}));
sand.rotation.x = -Math.PI/2;
sand.position.set(0,.015,90);
scene.add(sand);
water.position.y = .035;

function hill(x,z,sx,sy,sz,color=0x566a45){
  const m = new THREE.Mesh(new THREE.SphereGeometry(1,18,12), new THREE.MeshStandardMaterial({color,roughness:1}));
  m.scale.set(sx,sy,sz); m.position.set(x,-sy*.72,z); m.receiveShadow=true; m.castShadow=true; scene.add(m);
}
for(let i=0;i<38;i++){
  const a=Math.random()*Math.PI*2, r=110+Math.random()*120;
  hill(Math.cos(a)*r,Math.sin(a)*r,18+Math.random()*28,7+Math.random()*15,18+Math.random()*28);
}

const resourceMeshes = new Map();
const creatureMeshes = new Map();
const playerMeshes = new Map();
const structureMeshes = new Map();

const geo = {
  trunk:new THREE.CylinderGeometry(.28,.42,4.6,7),
  crown:new THREE.ConeGeometry(2.0,5.3,8),
  rock:new THREE.DodecahedronGeometry(1.15,0),
  bush:new THREE.IcosahedronGeometry(1.0,1),
  body:new THREE.BoxGeometry(1.5,.85,2.4),
  head:new THREE.BoxGeometry(.82,.68,.92),
  leg:new THREE.BoxGeometry(.28,.85,.28),
  human:new THREE.CapsuleGeometry(.42,1.0,5,8)
};
const mats = {
  trunk:new THREE.MeshStandardMaterial({color:0x55402f,roughness:1}),
  leaves:new THREE.MeshStandardMaterial({color:0x315c37,roughness:1}),
  rock:new THREE.MeshStandardMaterial({color:0x696c64,roughness:.92}),
  bush:new THREE.MeshStandardMaterial({color:0x477945,roughness:1}),
  player:new THREE.MeshStandardMaterial({color:0x8fa68e,roughness:.75}),
  enemy:new THREE.MeshStandardMaterial({color:0x6c5645,roughness:.9}),
  passive:new THREE.MeshStandardMaterial({color:0x738064,roughness:.9}),
  neutral:new THREE.MeshStandardMaterial({color:0x7d6b4e,roughness:.9})
};

function addResource(r){
  if(resourceMeshes.has(r.id)) return;
  const g = new THREE.Group();
  if(r.type==="tree"){
    const t=new THREE.Mesh(geo.trunk,mats.trunk); t.position.y=2.3; t.castShadow=true; g.add(t);
    const c=new THREE.Mesh(geo.crown,mats.leaves); c.position.y=6; c.castShadow=true; g.add(c);
    const c2=new THREE.Mesh(geo.crown,mats.leaves); c2.scale.set(.75,.75,.75); c2.position.set(.7,7.6,.2); c2.castShadow=true; g.add(c2);
  } else if(r.type==="rock"){
    const m=new THREE.Mesh(geo.rock,mats.rock); m.position.y=.85; m.scale.set(1.25,.8,1); m.rotation.set(.2,.5,.1); m.castShadow=true; g.add(m);
  } else {
    const m=new THREE.Mesh(geo.bush,mats.bush); m.position.y=.7; m.scale.set(1.3,.8,1.3); m.castShadow=true; g.add(m);
  }
  g.position.set(r.x,0,r.z); g.userData={kind:"resource",id:r.id,type:r.type}; scene.add(g); resourceMeshes.set(r.id,g);
}

function creatureMaterial(kind){
  return kind==="ridgeclaw"?mats.enemy:kind==="mossback"?mats.passive:mats.neutral;
}
function addCreature(c){
  if(creatureMeshes.has(c.id)) return;
  const g=new THREE.Group(), mat=creatureMaterial(c.kind);
  const body=new THREE.Mesh(geo.body,mat); body.position.y=1.25; body.castShadow=true; g.add(body);
  const head=new THREE.Mesh(geo.head,mat); head.position.set(0,1.5,1.45); head.castShadow=true; g.add(head);
  for(const x of [-.5,.5]) for(const z of [-.72,.72]){
    const leg=new THREE.Mesh(geo.leg,mat); leg.position.set(x,.55,z); leg.castShadow=true; g.add(leg);
  }
  if(c.kind==="ridgeclaw"){
    const tail=new THREE.Mesh(new THREE.ConeGeometry(.25,2.2,7),mat); tail.rotation.x=Math.PI/2; tail.position.set(0,1.25,-2); g.add(tail);
    g.scale.set(.85,1.05,1.15);
  } else if(c.kind==="mossback"){
    g.scale.set(1.4,1.25,1.55);
  }
  g.position.set(c.x,0,c.z); g.rotation.y=c.yaw||0; g.userData={kind:"creature",id:c.id,species:c.kind}; scene.add(g); creatureMeshes.set(c.id,g);
}

function addPlayer(p){
  if(p.id===myId || playerMeshes.has(p.id)) return;
  const m=new THREE.Mesh(geo.human,mats.player.clone()); m.position.set(p.x,1.0,p.z); m.castShadow=true; m.userData={kind:"player",id:p.id}; scene.add(m); playerMeshes.set(p.id,m);
}
function structureMesh(s){
  let mesh;
  if(s.type==="foundation"){
    mesh=new THREE.Mesh(new THREE.BoxGeometry(4,.45,4),new THREE.MeshStandardMaterial({color:0x75553a,roughness:1}));
    mesh.position.y=.225;
  }else if(s.type==="wall"){
    mesh=new THREE.Mesh(new THREE.BoxGeometry(4,2.8,.28),new THREE.MeshStandardMaterial({color:0x6c4b31,roughness:1}));
    mesh.position.y=1.4;
  }else{
    const g=new THREE.Group();
    for(let i=0;i<7;i++){
      const a=i/7*Math.PI*2;
      const r=new THREE.Mesh(new THREE.DodecahedronGeometry(.26,0),mats.rock); r.position.set(Math.cos(a)*.65,.2,Math.sin(a)*.65); g.add(r);
    }
    const flame=new THREE.Mesh(new THREE.ConeGeometry(.35,1.05,7),new THREE.MeshBasicMaterial({color:0xe78a34}));
    flame.position.y=.75; g.add(flame); return g;
  }
  mesh.castShadow=true; mesh.receiveShadow=true; return mesh;
}
function addStructure(s){
  if(structureMeshes.has(s.id)) return;
  const m=structureMesh(s); m.position.x=s.x; m.position.z=s.z; m.rotation.y=s.yaw||0; m.userData={kind:"structure",id:s.id}; scene.add(m); structureMeshes.set(s.id,m);
}

let worldReady=false;
socket.on("init", data=>{
  myId=data.id; worldSize=data.worldSize||220;
  camera.position.set(data.player.x,1.72,data.player.z);
  data.resources.forEach(addResource);
  data.creatures.forEach(addCreature);
  data.structures.forEach(addStructure);
  worldReady=true;
});
socket.on("self", s=>{ self=s; updateHud(); });
socket.on("snapshot", snap=>{
  document.querySelector("#playersOnline").textContent=snap.players.length+" ONLINE";
  const seen=new Set();
  for(const p of snap.players){
    if(p.id===myId) continue;
    seen.add(p.id); addPlayer(p);
    const m=playerMeshes.get(p.id); if(m){ m.position.lerp(new THREE.Vector3(p.x,1,p.z),.35); m.rotation.y=p.yaw||0; }
  }
  for(const [id,m] of playerMeshes) if(!seen.has(id)){scene.remove(m); playerMeshes.delete(id);}
  for(const c of snap.creatures){ addCreature(c); const m=creatureMeshes.get(c.id); if(m){m.position.lerp(new THREE.Vector3(c.x,0,c.z),.35);m.rotation.y=c.yaw||0;}}
});
socket.on("playerGone",id=>{const m=playerMeshes.get(id);if(m)scene.remove(m);playerMeshes.delete(id);});
socket.on("resourceGone",id=>{const m=resourceMeshes.get(id);if(m)scene.remove(m);resourceMeshes.delete(id);});
socket.on("resourceSpawn",addResource);
socket.on("creatureGone",id=>{const m=creatureMeshes.get(id);if(m)scene.remove(m);creatureMeshes.delete(id);});
socket.on("creatureSpawn",addCreature);
socket.on("structureSpawn",addStructure);
socket.on("feed",msg=>{
  const el=document.createElement("div"); el.textContent=msg; feed.prepend(el);
  while(feed.children.length>5) feed.lastChild.remove();
});
socket.on("toast",showToast);

function updateHud(){
  const pairs=[["hp",self.hp],["food",self.food],["water",self.water],["stamina",self.stamina]];
  for(const [k,v] of pairs){
    document.querySelector("#"+k+"Bar").style.width=Math.max(0,v)+"%";
    document.querySelector("#"+k+"Text").textContent=Math.round(v);
  }
  const inv=self.inv||{};
  for(const k of ["wood","stone","fiber","berries","hide"]) document.querySelector("#"+k).textContent=inv[k]||0;
  for(const k of ["axe","spear","foundation","wall","campfire"]){
    const e=document.querySelector("#"+k+"Count"); if(e)e.textContent=inv[k]||0;
  }
}
function showToast(msg){
  toast.textContent=msg; toast.classList.add("show"); clearTimeout(showToast.t);
  showToast.t=setTimeout(()=>toast.classList.remove("show"),1700);
}

playBtn.onclick=()=>{
  playing=true; start.classList.add("hidden"); hud.classList.remove("hidden");
  socket.emit("setName",nameInput.value);
  if(matchMedia("(pointer:fine)").matches) renderer.domElement.requestPointerLock?.();
};

document.addEventListener("pointerlockchange",()=>{});
renderer.domElement.addEventListener("click",()=>{ if(playing && matchMedia("(pointer:fine)").matches && document.pointerLockElement!==renderer.domElement) renderer.domElement.requestPointerLock?.(); });
document.addEventListener("mousemove",e=>{
  if(document.pointerLockElement!==renderer.domElement) return;
  yaw-=e.movementX*.0022; pitch-=e.movementY*.002; pitch=Math.max(-1.45,Math.min(1.45,pitch));
});

const keys={};
addEventListener("keydown",e=>{
  keys[e.code]=true;
  if(e.code==="Digit1") select("hands");
  if(e.code==="Digit2") select("axe");
  if(e.code==="Digit3") select("spear");
  if(e.code==="KeyE") interact();
  if(e.code==="KeyF") socket.emit("eat");
  if(e.code==="KeyR") socket.emit("drink");
  if(e.code==="KeyB") toggleBuild();
  if(e.code==="KeyC") toggleCraft();
});
addEventListener("keyup",e=>keys[e.code]=false);

function select(x){
  selected=x; document.querySelectorAll(".slot").forEach(b=>b.classList.toggle("active",b.dataset.slot===x));
}
document.querySelectorAll(".slot[data-slot]").forEach(b=>b.onclick=()=>select(b.dataset.slot));
document.querySelector("#craftToggle").onclick=toggleCraft;
function toggleCraft(){
  document.querySelector("#inventory").classList.toggle("hidden");
}
function toggleBuild(){
  const bm=document.querySelector("#buildMenu"); bm.classList.toggle("hidden");
  if(!bm.classList.contains("hidden")) document.querySelector("#inventory").classList.add("hidden");
  else buildType=null;
}
document.querySelectorAll("[data-craft]").forEach(b=>b.onclick=()=>socket.emit("craft",b.dataset.craft));
document.querySelectorAll("[data-build]").forEach(b=>b.onclick=()=>{buildType=b.dataset.build;showToast("Placing "+buildType);});

const raycaster=new THREE.Raycaster();
function centerHit(max=5){
  raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
  const roots=[...resourceMeshes.values(),...creatureMeshes.values()];
  const hits=raycaster.intersectObjects(roots,true);
  for(const h of hits){
    let o=h.object;
    while(o.parent && !o.userData.kind) o=o.parent;
    if(o.userData.kind && h.distance<=max) return {root:o,distance:h.distance};
  }
  return null;
}
function interact(){
  const hit=centerHit(4.8); if(!hit)return;
  if(hit.root.userData.kind==="resource") socket.emit("gather",{id:hit.root.userData.id,tool:selected});
}
function attack(){
  if(buildType){
    const dir=new THREE.Vector3(); camera.getWorldDirection(dir); dir.y=0; dir.normalize();
    const x=camera.position.x+dir.x*4, z=camera.position.z+dir.z*4;
    socket.emit("place",{type:buildType,x,z,yaw});
    return;
  }
  const hit=centerHit(4.8); if(!hit)return;
  if(hit.root.userData.kind==="creature") socket.emit("attack",{creatureId:hit.root.userData.id,weapon:selected});
  else if(hit.root.userData.kind==="resource") socket.emit("gather",{id:hit.root.userData.id,tool:selected});
}
renderer.domElement.addEventListener("mousedown",e=>{ if(e.button===0 && playing) attack(); });

const clock=new THREE.Clock();
function updateMovement(dt){
  if(!playing||!worldReady)return;
  const forward=(keys["KeyW"]?1:0)-(keys["KeyS"]?1:0)-mobileMove.y;
  const side=(keys["KeyD"]?1:0)-(keys["KeyA"]?1:0)+mobileMove.x;
  sprinting=!!keys["ShiftLeft"]||!!keys["ShiftRight"]||document.querySelector("#mobileSprint").dataset.down==="1";
  let speed=sprinting&&self.stamina>2?9.2:5.3;
  const len=Math.hypot(forward,side)||1;
  const f=forward/len,s=side/len;
  const dx=Math.sin(yaw)*f+Math.cos(yaw)*s;
  const dz=Math.cos(yaw)*f-Math.sin(yaw)*s;
  camera.position.x+=dx*speed*dt;
  camera.position.z+=dz*speed*dt;
  camera.position.x=Math.max(-worldSize,Math.min(worldSize,camera.position.x));
  camera.position.z=Math.max(-worldSize,Math.min(worldSize,camera.position.z));
  camera.position.y=1.72;
  if(sprinting&&(Math.abs(forward)+Math.abs(side)>.05)) self.stamina=Math.max(0,self.stamina-dt*13);
  else self.stamina=Math.min(100,self.stamina+dt*8);

  camera.rotation.order="YXZ"; camera.rotation.y=yaw; camera.rotation.x=pitch;
}

let sendAcc=0;
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.05);
  updateMovement(dt);
  sendAcc+=dt;
  if(sendAcc>.05&&playing){
    sendAcc=0;
    socket.emit("move",{x:camera.position.x,z:camera.position.z,yaw,pitch,stamina:self.stamina});
  }
  const hit=centerHit(5.2);
  if(hit){
    const d=hit.root.userData;
    targetLabel.textContent=d.kind==="resource"?(d.type.toUpperCase()+" · E gather"):d.kind==="creature"?(d.species.toUpperCase()+" · click attack"):"";
  }else targetLabel.textContent="";
  renderer.render(scene,camera);
}
animate();

addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight);
});

const joy=document.querySelector("#joy"),stick=document.querySelector("#stick");
let joyId=null;
joy.addEventListener("pointerdown",e=>{joyId=e.pointerId;joy.setPointerCapture(e.pointerId);});
joy.addEventListener("pointermove",e=>{
  if(e.pointerId!==joyId)return; const r=joy.getBoundingClientRect();
  let x=e.clientX-(r.left+r.width/2), y=e.clientY-(r.top+r.height/2);
  const l=Math.hypot(x,y),m=34;if(l>m){x=x/l*m;y=y/l*m;}
  stick.style.transform="translate("+x+"px,"+y+"px)"; mobileMove={x:x/m,y:y/m};
});
function joyEnd(){joyId=null;mobileMove={x:0,y:0};stick.style.transform="translate(0,0)";}
joy.addEventListener("pointerup",joyEnd);joy.addEventListener("pointercancel",joyEnd);

const lookPad=document.querySelector("#lookPad"); let lookId=null,lx=0,ly=0;
lookPad.addEventListener("pointerdown",e=>{lookId=e.pointerId;lx=e.clientX;ly=e.clientY;lookPad.setPointerCapture(e.pointerId);});
lookPad.addEventListener("pointermove",e=>{if(e.pointerId!==lookId)return; yaw-=(e.clientX-lx)*.007; pitch-=(e.clientY-ly)*.006; pitch=Math.max(-1.45,Math.min(1.45,pitch));lx=e.clientX;ly=e.clientY;});
lookPad.addEventListener("pointerup",()=>lookId=null);
document.querySelector("#mobileHit").onclick=attack;
document.querySelector("#mobileUse").onclick=interact;
const runBtn=document.querySelector("#mobileSprint");
runBtn.addEventListener("pointerdown",()=>runBtn.dataset.down="1");
runBtn.addEventListener("pointerup",()=>runBtn.dataset.down="0");
runBtn.addEventListener("pointercancel",()=>runBtn.dataset.down="0");
