// PathFinder — deep traversal + learn modal + auto-merge + repair + admin debug + tree viewer

const STORAGE_KEY = 'pathfinder_tree_v1';
const ADMIN_PASSWORD = 'bobby!';
const ADMIN_SESSION_KEY = 'pathfinder_is_admin';

// ------------------ Admin helpers ------------------
window.PathFinder_isAdmin = () => sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
window.PathFinder_setAdmin = (on) => { if (on) sessionStorage.setItem(ADMIN_SESSION_KEY, '1'); else sessionStorage.removeItem(ADMIN_SESSION_KEY); };
window.PathFinder_promptAdmin = () => {
  if (window.PathFinder_isAdmin()) return true;
  const pass = prompt('Admin password:');
  if (pass && pass === ADMIN_PASSWORD) { window.PathFinder_setAdmin(true); return true; }
  return false;
};

// ------------------ Seed Tree ------------------
const defaultTree = {
  type: 'q',
  text: 'Is the person real (not fictional)?',
  yes: {
    type: 'q',
    text: 'Is the person primarily known for science/technology?',
    yes: { type: 'a', name: 'Albert Einstein' },
    no: {
      type: 'q',
      text: 'Is the person a musician?',
      yes: { type: 'a', name: 'Taylor Swift' },
      no: { type: 'a', name: 'LeBron James' }
    }
  },
  no: {
    type: 'q',
    text: 'Is the character from a comic book universe?',
    yes: {
      type: 'q',
      text: 'Is the character associated with Marvel?',
      yes: { type: 'a', name: 'Spider-Man' },
      no: { type: 'a', name: 'Batman' }
    },
    no: { type: 'a', name: 'Mario' }
  }
};

// ------------------ State ------------------
let tree = loadTree() ?? defaultTree;
let path = [];                 // stack of { node, choice }
let current = tree;
let awaitingConfirmation = false;

let isLearning = false;
let pendingWrongLeaf = null;   // the leaf we were "guessing" wrong (or placeholder when branch missing)

const $ = (sel) => document.querySelector(sel);

// ------------------ Utilities ------------------
const debounce = (fn, ms=150)=>{ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; };

function normalize(s){ return (s||'').trim().replace(/\s+/g,' '); }
function lower(s){ return normalize(s).toLowerCase(); }
function isYesNoQuestion(q){
  return /^(is|are|was|were|does|do|did|has|have|had|can|could|will|would|should)\b/i.test((q||'').trim());
}
function capQuestion(q){
  q = normalize(q);
  if (!q) return q;
  q = q[0].toUpperCase() + q.slice(1);
  if (!q.endsWith('?')) q += '?';
  return q;
}

// traverse and return reference path to a leaf by name; returns array of 'yes'/'no' or null
function findLeafPathByName(node, name){
  if(!node) return null;
  if(node.type==='a' && lower(node.name)===lower(name)) return [];
  if(node.type==='q'){
    const ly=findLeafPathByName(node.yes,name); if(ly) return ['yes',...ly];
    const ln=findLeafPathByName(node.no,name); if(ln) return ['no',...ln];
  }
  return null;
}
function getNodeByPath(root, pathArr){
  let n=root;
  for(const step of pathArr||[]){ if(!n || n.type!=='q') return null; n = n[step]; }
  return n;
}
function questionExists(node, text){
  if(!node) return false;
  if(node.type==='q' && lower(node.text)===lower(text)) return true;
  return node.type==='q' && (questionExists(node.yes,text) || questionExists(node.no,text));
}
function sameAsParentQuestion(qText){
  if(!path.length) return false;
  const parent = path[path.length-1].node;
  return parent?.type==='q' && lower(parent.text)===lower(qText);
}

// ------------------ UI helpers ------------------
function showError(id,msg){
  const el = document.getElementById(id);
  if(!el) return;
  el.textContent = msg || '';
  el.classList.toggle('hidden', !msg);
}
function setLearning(on){
  isLearning = !!on;
  document.body.classList.toggle('learning', !!on);
  $('#learnModal')?.classList.toggle('hidden', !on);
  if(on){ $('#lmName')?.focus(); showError('lmError',''); }
}
function showResult(msg){
  $('#resultMsg').textContent = msg;
  $('.buttons')?.classList.add('hidden');
  $('.secondary')?.classList.add('hidden');
  $('#resultBar')?.classList.remove('hidden');
}
function hideResult(){
  $('.buttons')?.classList.remove('hidden');
  $('.secondary')?.classList.remove('hidden');
  $('#resultBar')?.classList.add('hidden');
}

// ------------------ Render & Flow ------------------
function render(){
  const promptEl = $('#prompt');
  if(!promptEl) return;
  if(current && current.type==='q'){
    awaitingConfirmation=false;
    promptEl.textContent=current.text;
  }else if(current && current.type==='a'){
    awaitingConfirmation=true;
    promptEl.textContent=`Are you thinking of: ${current.name}?`;
  }else{
    awaitingConfirmation=true;
    promptEl.textContent='I don’t know yet. Help me learn?';
  }
}
function asBranch(kind){
  if(kind==='yes' || kind==='prob') return 'yes';
  if(kind==='no' || kind==='pnot') return 'no';
  return 'yes'; // idk heuristic
}

function choose(kind){
  if(awaitingConfirmation){
    if(kind==='yes' || kind==='prob'){ 
      showResult('🎉 I guessed it!'); 
      refreshTreeViewIfOpen();                 // <-- live update
      return; 
    }
    if(kind==='no' || kind==='pnot' || kind==='idk'){
      pendingWrongLeaf = (current && current.type==='a') ? current : { type:'a', name:'(unknown)' };
      setLearning(true);
      refreshTreeViewIfOpen();                 // <-- live update
      return;
    }
  }else{
    const branch = asBranch(kind);
    if(!current || current.type!=='q'){ 
      showResult('Hmm, something went wrong. Let’s restart.'); 
      refreshTreeViewIfOpen();                 // <-- live update
      return; 
    }
    path.push({ node: current, choice: branch });
    if(!current[branch]){
      current = { type:'a', name:'(unknown)' };
      awaitingConfirmation = true;
      render();
      refreshTreeViewIfOpen();                 // <-- live update
      return;
    }
    current = current[branch];
    render();
  }
  refreshTreeViewIfOpen();                     // <-- live update
}

function undo(){ 
  if(!path.length) return; 
  const last = path.pop(); 
  current = last.node; 
  render(); 
  refreshTreeViewIfOpen();                     // <-- live update
}

// ------------------ Learn form (auto-merge) ------------------
function handleLearnSubmit(e){
  e.preventDefault();
  const name = normalize($('#lmName').value);
  let qText  = normalize($('#lmQuestion').value);
  const ans  = (new FormData($('#learnForm')).get('lmAnswer') || 'yes').toString();

  if(name.length<2){ showError('lmError','Please enter a valid name.'); return; }
  if(qText.length<6){ showError('lmError','Please enter a longer yes/no question.'); return; }
  if(!isYesNoQuestion(qText)){ showError('lmError','Please phrase a yes/no question (Is, Does, Was, Has, Can...).'); return; }
  qText = capQuestion(qText);
  if(questionExists(tree,qText)){ showError('lmError',`Question "${qText}" already exists.`); return; }
  if(sameAsParentQuestion(qText)){ showError('lmError','That question is identical to the current one.'); return; }

  if(!pendingWrongLeaf || pendingWrongLeaf.type!=='a'){ pendingWrongLeaf = {type:'a', name:'(unknown)'}; }

  // auto-merge by reusing existing leaf if found
  const existingPath = findLeafPathByName(tree, name);
  let newLeafRef = null;
  if(existingPath){
    const existingLeaf = getNodeByPath(tree, existingPath);
    if(existingLeaf && existingLeaf.type==='a'){ newLeafRef = existingLeaf; }
  }
  if(!newLeafRef){ newLeafRef = { type:'a', name }; }

  const oldLeaf = { ...pendingWrongLeaf };
  const newQ = { type:'q', text:qText, yes:null, no:null };
  if(ans==='yes'){ newQ.yes = newLeafRef; newQ.no = oldLeaf; }
  else{ newQ.yes = oldLeaf; newQ.no = newLeafRef; }

  if(path.length===0){ tree = newQ; }
  else{
    const parent = path[path.length-1].node;
    const branch = path[path.length-1].choice;
    parent[branch] = newQ;
  }

  saveTreeClean();
  showError('lmError','');
  setLearning(false);
  pendingWrongLeaf = null;
  showResult('Thanks! I learned something new.');
  refreshTreeViewIfOpen();
}
function handleLearnCancel(){ setLearning(false); pendingWrongLeaf=null; showError('lmError',''); }

// ------------------ Storage + Clean/Repair ------------------
const debouncedSave = debounce(()=>{ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(tree)); }catch(e){ console.error(e); } }, 120);
function saveTree(){ debouncedSave(); }
function saveTreeClean(){
  const backup = JSON.stringify(tree, null, 2);
  try{ tree = cleanTree(tree); } catch(e){ console.warn('Clean failed; restoring.', e); tree = JSON.parse(backup); }
  saveTree();
}
function cleanTree(node){
  if(!node || typeof node!=='object') return null;
  if(node.type==='a'){
    const nm = normalize(node.name||''); if(!nm) return null;
    return { type:'a', name: nm };
  }
  if(node.type==='q'){
    let txt = capQuestion(node.text||'');
    const y = cleanTree(node.yes);
    const n = cleanTree(node.no);
    if(!isYesNoQuestion(txt)){
      return y ?? n ?? null;
    }
    if(!y && !n) return null;
    if(y && !n) return y;
    if(!y && n) return n;
    if(JSON.stringify(y)===JSON.stringify(n)) return y;
    return { type:'q', text: txt, yes: y, no: n };
  }
  return null;
}

// ------------------ Export/Import (+ backup) ------------------
function downloadBackup(filename='pathfinder_backup.json'){
  const blob=new Blob([JSON.stringify(tree,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename;
  document.body.appendChild(a); a.click(); a.remove();
}
function exportTree(){
  if(!window.PathFinder_isAdmin()){ alert('Admin only.'); return; }
  const blob=new Blob([JSON.stringify(tree,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='pathfinder_tree.json';
  document.body.appendChild(a); a.click(); a.remove();
}

function importTree(file){
  if(!window.PathFinder_isAdmin()){ alert('Admin only.'); return; }
  downloadBackup('pathfinder_backup_before_import.json');

  const r = new FileReader();
  r.onload = () => {
    try {
      const obj = JSON.parse(r.result);
      if (!obj || (obj.type !== 'q' && obj.type !== 'a')) throw new Error('Invalid root');
      const newBranch = cleanTree(obj);
      if (!newBranch) throw new Error('After repair, tree became empty (file invalid).');

      // Ask admin: merge or replace
      const mode = prompt(
        "Type 'replace' to overwrite entire tree,\n" +
        "or enter merge path (like 'real>sports' or 'fictional>comics'):"
      );
      if (!mode) { alert('Cancelled.'); return; }

      if (mode.trim().toLowerCase() === 'replace') {
        tree = newBranch;
        saveTree();
        restart(false);
        alert('Tree replaced successfully.');
        refreshTreeViewIfOpen();
        return;
      }

      // Parse path like "real>sports" or "fictional>comics"
      const segments = mode.split('>').map(s => s.trim().toLowerCase()).filter(Boolean);
      if (!segments.length) throw new Error('Invalid path.');

      let cursor = tree;
      let lastQ = null;
      for (const seg of segments) {
        if (!cursor || cursor.type !== 'q') throw new Error(`Path stopped at "${seg}". Node not found.`);
        const yesMatch = cursor.text.toLowerCase().includes(seg);
        lastQ = cursor;
        cursor = yesMatch ? cursor.yes : cursor.no;
      }

      if (!lastQ) throw new Error('Could not locate merge point.');

      const choice = confirm("Merge as YES branch? (Cancel = NO branch)");
      if (choice) lastQ.yes = newBranch;
      else lastQ.no = newBranch;

      saveTreeClean();
      restart(false);
      alert(`Merged under path: ${segments.join(' > ')} (${choice ? 'YES' : 'NO'} branch)`);
      refreshTreeViewIfOpen();
    } catch (e) {
      alert('Import failed: ' + e.message);
      console.error(e);
    }
  };
  r.readAsText(file);
}


// ------------------ Debug (admin-only, optional via ?debug=true) ------------------
function isDebug(){ return /(^|\?)debug=true($|&)/.test(location.search); }
function buildDebugPanel(){
  if(!window.PathFinder_isAdmin()) return;
  if(!isDebug()) return;

  const panel = document.createElement('div');
  panel.style.cssText = `
    position: fixed; right: 10px; bottom: 10px; z-index: 99;
    width: min(420px, 92vw); max-height: 60vh; overflow: auto;
    background: #ffffff; color: #0b1426; border:1px solid #e0e6f2; border-radius: 10px; 
    box-shadow: 0 8px 24px rgba(0,0,0,.15); padding: 10px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px;
  `;
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <strong>Debug (admin)</strong>
      <div>
        <button id="dbgClean" style="margin-right:6px">Clean & Compact</button>
        <button id="dbgBackup">Download Backup</button>
      </div>
    </div>
    <div><em>Depth:</em> <span id="dbgDepth">0</span> &nbsp;|&nbsp; <em>Path:</em> <span id="dbgPath">/</span></div>
    <pre id="dbgTree" style="white-space:pre-wrap;margin-top:8px;"></pre>
  `;
  document.body.appendChild(panel);

  $('#dbgClean').onclick = ()=>{
    downloadBackup('pathfinder_backup_before_clean.json');
    tree = cleanTree(tree);
    saveTree();
    render();
    refreshDebug();
    refreshTreeViewIfOpen();
  };
  $('#dbgBackup').onclick = ()=> downloadBackup('pathfinder_backup.json');

  function refreshDebug(){
    $('#dbgDepth').textContent = String(path.length);
    $('#dbgPath').textContent  = '/' + path.map(p=>p.choice).join('/');
    $('#dbgTree').textContent  = JSON.stringify(tree, null, 2);
  }
  refreshDebug();
  const obs = new MutationObserver(refreshDebug);
  obs.observe(document.body, { childList:true, subtree:true });
  setInterval(refreshDebug, 1000);
}

// ------------------ Tree Viewer (SVG, no libs) ------------------
// Smooth toggle + live redraw + active-path highlighting

// reuse a single resize handler so we can add/remove it cleanly
window._treeResizeHandler = window._treeResizeHandler || debounce(() => {
  try { drawDecisionTree(); } catch {}
}, 150);

function toggleTreePanel(show){
  const panel = document.getElementById('treePanel');
  if(!panel) return;

  const wantOpen = (typeof show === 'boolean')
    ? show
    : panel.classList.contains('hidden'); // if hidden, we want to open

  const btnToggle = document.getElementById('btnToggleTree');

  if (wantOpen) {
    panel.classList.remove('hidden');
    requestAnimationFrame(() => panel.classList.add('open'));
    try { drawDecisionTree(); } catch {}
    window.addEventListener('resize', window._treeResizeHandler, { passive: true });
    btnToggle?.setAttribute('aria-expanded', 'true');
    document.getElementById('btnTreeClose')?.focus?.({ preventScroll: true });
  } else {
    panel.classList.remove('open');
    const onEnd = (e) => {
      if (e.propertyName === 'transform' || e.propertyName === 'opacity') {
        panel.classList.add('hidden');
        panel.removeEventListener('transitionend', onEnd);
      }
    };
    panel.addEventListener('transitionend', onEnd);
    window.removeEventListener('resize', window._treeResizeHandler);
    btnToggle?.setAttribute('aria-expanded', 'false');
  }
}

function refreshTreeViewIfOpen(){
  const p = document.getElementById('treePanel');
  if(p && !p.classList.contains('hidden')) {
    try { drawDecisionTree(); } catch {}
  }
}

function drawDecisionTree(){
  const svg   = document.getElementById('treeSvg');
  const panel = document.getElementById('treePanel');
  if(!svg || !tree) return;
  if (panel?.classList.contains('hidden')) return;

  // Clear previous render
  while(svg.firstChild) svg.removeChild(svg.firstChild);

  // Layout constants
  const levelHeight = 90;
  const nodeWidth   = 220;
  const nodeHeight  = 44;
  const hGap        = 40;
  const padding     = 24;

  // Helpers
  function countLeaves(n){
    if(!n) return 0;
    if(n.type==='a') return 1;
    if(n.type==='q') return countLeaves(n.yes)+countLeaves(n.no);
    return 0;
  }
  function depthOf(n){
    if(!n) return 0;
    if(n.type==='a') return 0;
    return 1 + Math.max(depthOf(n.yes), depthOf(n.no));
  }

  // Build "active path" sets from current global path + current node
  const idMap = new WeakMap(); let idSeq = 1;
  const getId = (obj)=>{ if(!obj) return 'x'; if(!idMap.has(obj)) idMap.set(obj, String(idSeq++)); return idMap.get(obj); };

  const activeNodes = new Set();
  const activeEdges = new Set(); // key: "parentId>childId"

  // walk down the recorded path to mark visited nodes/edges
  (function markActive(){
    let n = tree;
    if(!n) return;
    activeNodes.add(n);
    for(const step of path){
      if(!n || n.type!=='q') break;
      const child = n[step.choice]; // 'yes' or 'no'
      const pid = getId(n), cid = getId(child);
      activeEdges.add(pid+'>'+cid);
      n = child;
      if(n) activeNodes.add(n);
    }
    if(current) activeNodes.add(current); // also include current node explicitly
  })();

  const leaves = Math.max(1, countLeaves(tree));
  const totalWidth  = Math.max(520, leaves * (nodeWidth + hGap)) + padding*2;
  const totalHeight = Math.max(420, (depthOf(tree)+1) * levelHeight) + padding*2;
  svg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);

  let nextX = padding;
  function layout(n, depth){
    if(!n) return null;
    if(n.type==='a'){
      const x = nextX + nodeWidth/2;
      const y = padding + depth*levelHeight;
      nextX += nodeWidth + hGap;
      return { x, y, node:n, children:[] };
    }
    const left  = layout(n.yes, depth+1);
    const right = layout(n.no,  depth+1);
    let x;
    if(left && right) x = (left.x + right.x)/2;
    else if(left)     x = left.x;
    else if(right)    x = right.x;
    else              x = nextX + nodeWidth/2;
    const y = padding + depth*levelHeight;
    return { x, y, node:n, children:[left, right].filter(Boolean) };
  }
  const root = layout(tree, 0);

  function drawEdges(parent){
    if(!parent) return;
    for(const child of parent.children){
      if(!child) continue;
      const isYes = (child.node === parent.node.yes);
      const pid = getId(parent.node), cid = getId(child.node);
      const isActive = activeEdges.has(pid+'>'+cid);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', parent.x);
      line.setAttribute('y1', parent.y + nodeHeight/2);
      line.setAttribute('x2', child.x);
      line.setAttribute('y2', child.y - nodeHeight/2);
      line.setAttribute('class', (isYes ? 'edge edgeYes' : 'edge edgeNo') + (isActive ? ' active' : ''));
      svg.appendChild(line);

      const lbl = document.createElementNS('http://www.w3.org/2000/svg','text');
      const midx = (parent.x + child.x)/2;
      const midy = (parent.y + child.y)/2;
      lbl.setAttribute('x', midx);
      lbl.setAttribute('y', midy - 6);
      lbl.setAttribute('text-anchor', 'middle');
      lbl.setAttribute('class', 'edgeLbl' + (isActive ? ' active' : ''));
      lbl.textContent = isYes ? 'Yes' : 'No';
      svg.appendChild(lbl);

      drawEdges(child);
    }
  }

  function drawNodes(n){
    if(!n) return;
    const isLeaf   = (n.node.type === 'a');
    const isActive = activeNodes.has(n.node);

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', n.x - nodeWidth/2);
    rect.setAttribute('y', n.y - nodeHeight/2);
    rect.setAttribute('width', nodeWidth);
    rect.setAttribute('height', nodeHeight);
    rect.setAttribute('rx', 10);
    rect.setAttribute('ry', 10);
    rect.setAttribute('class', (isLeaf ? 'leafRect' : 'nodeRect') + (isActive ? ' activeNode' : ''));
    svg.appendChild(rect);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', n.x);
    text.setAttribute('y', n.y);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('class', 'nodeText' + (isActive ? ' activeNode' : ''));
    text.textContent = isLeaf ? n.node.name : n.node.text;
    svg.appendChild(text);

    for(const c of n.children) drawNodes(c);
  }

  drawEdges(root);
  drawNodes(root);
}

// ------------------ Boot ------------------
document.addEventListener('DOMContentLoaded',()=>{
  const isGame  = !!$('#game');
  const isAdmin = !!$('#manage');

  if(isAdmin){
    if(!window.PathFinder_isAdmin() && !window.PathFinder_promptAdmin()){ alert('Admin required.'); location.href='index.html'; return; }
    $('#btnExport')?.addEventListener('click', exportTree);
    $('#fileImport')?.addEventListener('change', e => { const f=e.target.files?.[0]; if(f) importTree(f); e.target.value=''; });
    buildDebugPanel();
  }

  if(isGame){
    $('#btnYes')?.addEventListener('click', ()=>choose('yes'));
    $('#btnNo')?.addEventListener('click',  ()=>choose('no'));
    $('#btnProb')?.addEventListener('click',()=>choose('prob'));
    $('#btnPNot')?.addEventListener('click',()=>choose('pnot'));
    $('#btnIDK')?.addEventListener('click', ()=>choose('idk'));
    $('#btnUndo')?.addEventListener('click', undo);
    $('#btnRestart')?.addEventListener('click', ()=>{ restart(false); refreshTreeViewIfOpen(); });
    $('#playAgain')?.addEventListener('click', ()=>{ hideResult(); restart(false); refreshTreeViewIfOpen(); });

    $('#lmCancel')?.addEventListener('click', handleLearnCancel);
    $('#learnForm')?.addEventListener('submit', handleLearnSubmit);

    $('#btnAdminLogin')?.addEventListener('click', ()=>{
      if(window.PathFinder_isAdmin() || window.PathFinder_promptAdmin()){
        location.href = isDebug() ? 'admin.html?debug=true' : 'admin.html';
      }
    });

    // Tree viewer buttons
    $('#btnToggleTree')?.addEventListener('click', ()=> toggleTreePanel());
    $('#btnTreeClose')?.addEventListener('click', ()=> toggleTreePanel(false));
    $('#btnTreeRefresh')?.addEventListener('click', ()=> drawDecisionTree());

    render();
    buildDebugPanel(); // admin + ?debug=true
  }
});

// ------------------ Restart function ------------------
function restart(clearStorage = false) {
  if (clearStorage) {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { console.warn(e); }
  }
  // Reset the decision state
  path = [];
  current = tree;
  awaitingConfirmation = false;
  pendingWrongLeaf = null;
  isLearning = false;

  // Hide any result or modal
  hideResult();
  setLearning(false);

  // Re-render the first question
  render();
  refreshTreeViewIfOpen();
  console.log('PathFinder restarted.');
}



// ------------------ Persistence ------------------
function saveTreeToLocal(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(tree)); }catch(e){ console.error(e); } }
function loadTree(){
  try{ const r=localStorage.getItem(STORAGE_KEY); return r?JSON.parse(r):null; }catch{ return null; }
}
