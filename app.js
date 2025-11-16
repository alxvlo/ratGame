// PathFinder — shared logic for index.html (home), game.html (game), and admin.html (manage)

// -------------------- Config --------------------
const LOCAL_STORAGE_KEY = 'pathfinder_tree_v1';
const ADMIN_PASSWORD = 'bobby!';          // <<< change this to your real admin password if you want
const ADMIN_SESSION_KEY = 'pathfinder_is_admin';

// Admin helpers so HTML can check
window.PathFinder_isAdmin = () => sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
window.PathFinder_setAdmin = (on) => {
  if (on) sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
  else sessionStorage.removeItem(ADMIN_SESSION_KEY);
};
window.PathFinder_promptAdmin = () => {
  if (window.PathFinder_isAdmin()) return true;
  const pass = prompt('Admin password:');
  if (pass && pass === ADMIN_PASSWORD) {
    window.PathFinder_setAdmin(true);
    return true;
  }
  return false;
};

// -------------------- Seed Tree --------------------
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

// -------------------- State --------------------
let tree = defaultTree;        // will be replaced by global or local on init
let path = [];                 // stack of { node, choice }
let current = tree;
let awaitingConfirmation = false;

const $ = (sel) => document.querySelector(sel);

// -------------------- Persistence: Local --------------------
function saveTreeLocal() {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tree));
  } catch (e) {
    console.error('Failed to save tree to localStorage:', e);
  }
}

function loadTreeLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Failed to load tree from localStorage:', e);
    return null;
  }
}

// -------------------- Persistence: Firestore (Global) --------------------
function hasFirebase() {
  return !!(window._pfFirebase && window._pfFirebase.db);
}

async function loadTreeGlobal() {
  if (!hasFirebase()) {
    throw new Error('Firebase not available');
  }
  const { db, doc, getDoc, setDoc } = window._pfFirebase;
  const ref = doc(db, 'pathfinder', 'tree');
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    if (data && (data.type === 'q' || data.type === 'a')) {
      return data;
    }
  }
  // First time or invalid: seed with defaultTree
  await setDoc(ref, defaultTree);
  return defaultTree;
}

async function saveTreeGlobal() {
  if (!hasFirebase()) return;
  const { db, doc, setDoc } = window._pfFirebase;
  const ref = doc(db, 'pathfinder', 'tree');
  try {
    await setDoc(ref, tree);
  } catch (e) {
    console.error('Failed to save tree to Firestore:', e);
  }
}

// Unified save that writes to local + global (fire-and-forget)
function saveTree() {
  saveTreeLocal();
  // don’t block UI; log errors silently
  saveTreeGlobal().catch((e) => console.error('saveTreeGlobal error:', e));
}

// Initialise tree from Firestore (preferred) or localStorage, else default
async function initTree() {
  // Try global first
  try {
    if (hasFirebase()) {
      tree = await loadTreeGlobal();
      current = tree;
      saveTreeLocal(); // cache latest global version locally
      console.log('[PathFinder] Loaded tree from Firestore');
      return;
    }
  } catch (e) {
    console.warn('[PathFinder] Firestore load failed, falling back to local/default:', e);
  }

  // Fallback: localStorage
  const local = loadTreeLocal();
  if (local && (local.type === 'q' || local.type === 'a')) {
    tree = local;
    current = tree;
    console.log('[PathFinder] Loaded tree from localStorage');
    return;
  }

  // Final fallback: default
  tree = JSON.parse(JSON.stringify(defaultTree));
  current = tree;
  console.log('[PathFinder] Using defaultTree');
}

// -------------------- Game Rendering --------------------
function render() {
  const promptEl = $('#prompt');
  const statusEl = $('#status');
  if (!promptEl) return; // not on game page

  if (current.type === 'q') {
    awaitingConfirmation = false;
    promptEl.textContent = current.text;
    if (statusEl) statusEl.textContent = `Question node • depth ${path.length}`;
  } else {
    awaitingConfirmation = true;
    promptEl.textContent = `Are you thinking of: ${current.name}?`;
    if (statusEl) statusEl.textContent = `Guess leaf • depth ${path.length}`;
  }
}

function choose(kind) {
  if (awaitingConfirmation) {
    if (kind === 'yes' || kind === 'prob') {
      alert('Nice! I guessed it 🎉');
      restart(false);
      return;
    }
    if (kind === 'no' || kind === 'pnot') {
      learnFlow();
      return;
    }
    if (kind === 'idk') {
      if (confirm('Not sure? Want to teach me the correct person?')) {
        learnFlow();
      } else {
        restart(false);
      }
      return;
    }
  } else {
    let branch;
    if (kind === 'yes' || kind === 'prob') branch = 'yes';
    else if (kind === 'no' || kind === 'pnot') branch = 'no';
    else branch = 'yes'; // idk heuristic
    path.push({ node: current, choice: branch });
    current = current[branch];
    render();
  }
}

function undo() {
  if (!path.length) return;
  const last = path.pop();
  current = last.node;
  render();
}

function restart(hard = false) {
  path = [];
  current = tree;
  if (hard) {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    tree = JSON.parse(JSON.stringify(defaultTree));
    current = tree;
    saveTree(); // also push reset to Firestore
  }
  render();
}

// -------------------- Learning --------------------
function learnFlow() {
  if (!current || current.type !== 'a') return;

  const correct = prompt("Who were you thinking of?");
  if (!correct) { alert('No changes made.'); restart(false); return; }

  let question = prompt(`Give me a yes/no question that distinguishes "${correct}" from "${current.name}".`);
  if (!question) { alert('No changes made.'); restart(false); return; }
  question = question.trim();

  const yesForNew = confirm(`For "${correct}", is the answer to:\n"${question}"\nYES? (OK = Yes, Cancel = No)`);

  const oldLeaf = { ...current };
  const newLeaf = { type: 'a', name: correct };
  const newQ = { type: 'q', text: question, yes: null, no: null };

  if (yesForNew) { newQ.yes = newLeaf; newQ.no = oldLeaf; }
  else { newQ.yes = oldLeaf; newQ.no = newLeaf; }

  if (path.length === 0) {
    tree = newQ; // replace root if we started at a leaf
  } else {
    const parent = path[path.length - 1].node;
    const branch = path[path.length - 1].choice;
    parent[branch] = newQ;
  }

  saveTree();
  alert('Thanks! I learned something new.');
  restart(false);
}

// -------------------- Admin: character helpers (delete + rename) --------------------
function collectAnswerNames(node, acc) {
  if (!node) return;
  if (node.type === 'a' && node.name) {
    acc.add(node.name);
  } else if (node.type === 'q') {
    collectAnswerNames(node.yes, acc);
    collectAnswerNames(node.no, acc);
  }
}
function getAllAnswerNames() {
  const set = new Set();
  collectAnswerNames(tree, set);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

// Recursively remove all leaves whose name == targetName.
function pruneTreeByName(node, targetName) {
  if (!node) return null;

  if (node.type === 'a') {
    return node.name === targetName ? null : node;
  }

  if (node.type === 'q') {
    const yes = pruneTreeByName(node.yes, targetName);
    const no = pruneTreeByName(node.no, targetName);

    if (!yes && !no) return null;  // no children left
    if (!yes) return no;           // only no remains
    if (!no) return yes;           // only yes remains

    node.yes = yes;
    node.no = no;
    return node;
  }

  return node;
}

function adminDeleteCharacterByName(name) {
  if (!window.PathFinder_isAdmin || !window.PathFinder_isAdmin()) {
    alert('Admin only.');
    return;
  }
  if (!name) {
    alert('Please select a character to delete.');
    return;
  }

  const confirmed = confirm(
    `Delete all guesses for "${name}" from this global tree?\n` +
    'This cannot be undone.'
  );
  if (!confirmed) return;

  const newRoot = pruneTreeByName(tree, name);
  if (!newRoot) {
    alert('Deleting this character would remove the entire tree. Resetting to default.');
    tree = JSON.parse(JSON.stringify(defaultTree));
  } else {
    tree = newRoot;
  }

  saveTree();
  restart(false);
  alert(`"${name}" removed from the tree.`);
  setupAdminCharacterUI();
}

// Rename all leaves with a given name
function adminRenameCharacter(oldName, newName) {
  if (!window.PathFinder_isAdmin || !window.PathFinder_isAdmin()) {
    alert('Admin only.');
    return;
  }
  if (!oldName || !newName || !newName.trim()) {
    alert('Provide a valid new name.');
    return;
  }
  const trimmed = newName.trim();

  let changed = 0;
  function walk(node) {
    if (!node) return;
    if (node.type === 'a' && node.name === oldName) {
      node.name = trimmed;
      changed++;
    } else if (node.type === 'q') {
      walk(node.yes);
      walk(node.no);
    }
  }
  walk(tree);

  if (!changed) {
    alert(`No leaves found with name "${oldName}".`);
    return;
  }

  saveTree();
  restart(false);
  alert(`Renamed ${changed} leaf/leaves from "${oldName}" to "${trimmed}".`);
  setupAdminCharacterUI();
}

// Populate delete + rename selects
function setupAdminCharacterUI() {
  const deleteSelect = document.getElementById('deleteNameSelect');
  const deleteBtn = document.getElementById('btnDeleteCharacter');
  const renameSelect = document.getElementById('renameNameSelect');
  const renameBtn = document.getElementById('btnRenameCharacter');

  const names = getAllAnswerNames();

  if (deleteSelect) {
    deleteSelect.innerHTML = '';
    if (!names.length) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '(no characters found)';
      deleteSelect.appendChild(opt);
      if (deleteBtn) deleteBtn.disabled = true;
    } else {
      names.forEach((name) => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        deleteSelect.appendChild(opt);
      });
      if (deleteBtn) deleteBtn.disabled = false;
    }
    if (deleteBtn) {
      deleteBtn.onclick = () => {
        const selected = deleteSelect.value;
        adminDeleteCharacterByName(selected);
      };
    }
  }

  if (renameSelect) {
    renameSelect.innerHTML = '';
    if (!names.length) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '(no characters found)';
      renameSelect.appendChild(opt);
      if (renameBtn) renameBtn.disabled = true;
    } else {
      names.forEach((name) => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        renameSelect.appendChild(opt);
      });
      if (renameBtn) renameBtn.disabled = false;
    }
    const renameInput = document.getElementById('renameNewName');
    if (renameBtn && renameInput) {
      renameBtn.onclick = () => {
        const selected = renameSelect.value;
        const newName = renameInput.value;
        adminRenameCharacter(selected, newName);
      };
    }
  }
}

// -------------------- Admin: questions + tree helpers --------------------
function countLeaves(node) {
  if (!node) return 0;
  if (node.type === 'a') return 1;
  if (node.type === 'q') {
    return countLeaves(node.yes) + countLeaves(node.no);
  }
  return 0;
}

function collectQuestions(node, pathStr = '', depth = 0, acc = []) {
  if (!node) return acc;
  if (node.type === 'q') {
    acc.push({
      path: pathStr,
      depth,
      text: node.text,
      leafCount: countLeaves(node)
    });
    collectQuestions(node.yes, pathStr + 'Y', depth + 1, acc);
    collectQuestions(node.no, pathStr + 'N', depth + 1, acc);
  }
  return acc;
}

function getNodeAtPath(pathStr) {
  let node = tree;
  for (const ch of pathStr) {
    if (!node || node.type !== 'q') return null;
    if (ch === 'Y') node = node.yes;
    else if (ch === 'N') node = node.no;
    else return null;
  }
  return node;
}

function deleteBranchAtPath(pathStr) {
  if (!pathStr) {
    alert('Deleting the root question is not supported here. Use reset/import instead.');
    return;
  }

  let parent = tree;
  for (let i = 0; i < pathStr.length - 1; i++) {
    const ch = pathStr[i];
    if (!parent || parent.type !== 'q') return;
    parent = ch === 'Y' ? parent.yes : parent.no;
  }
  if (!parent || parent.type !== 'q') return;

  const last = pathStr[pathStr.length - 1];
  const key = last === 'Y' ? 'yes' : 'no';

  parent[key] = { type: 'a', name: '(empty slot)' };
  saveTree();
  restart(false);
}

function buildTreeDom(node, pathStr = '') {
  const ul = document.createElement('ul');
  const li = document.createElement('li');
  ul.appendChild(li);

  if (!node) {
    li.textContent = '(empty)';
    return ul;
  }

  if (node.type === 'q') {
    const label = document.createElement('div');
    label.textContent = `Q [${pathStr || 'root'}]: ${node.text}`;
    li.appendChild(label);

    const childrenUl = document.createElement('ul');

    const yesLi = document.createElement('li');
    const yesLabel = document.createElement('div');
    yesLabel.textContent = 'YES →';
    yesLi.appendChild(yesLabel);
    yesLi.appendChild(buildTreeDom(node.yes, (pathStr || '') + 'Y'));

    const noLi = document.createElement('li');
    const noLabel = document.createElement('div');
    noLabel.textContent = 'NO →';
    noLi.appendChild(noLabel);
    noLi.appendChild(buildTreeDom(node.no, (pathStr || '') + 'N'));

    childrenUl.appendChild(yesLi);
    childrenUl.appendChild(noLi);
    li.appendChild(childrenUl);
  } else {
    const label = document.createElement('div');
    label.textContent = `A [${pathStr || 'root'}]: ${node.name}`;
    li.appendChild(label);
  }

  return ul;
}

function initQuestionAdminUI(forceRerenderOnly = false) {
  const tableBody = document.querySelector('#questions-table tbody');
  const treeContainer = document.getElementById('treeView');
  const dialog = document.getElementById('branch-delete-dialog');
  const summaryEl = document.getElementById('branch-delete-summary');
  const previewEl = document.getElementById('branch-delete-preview');
  const confirmBtn = document.getElementById('branch-delete-confirm');
  const cancelBtn = document.getElementById('branch-delete-cancel');

  if (!tableBody || !treeContainer || !dialog || !summaryEl || !previewEl || !confirmBtn || !cancelBtn) {
    return;
  }

  let pendingDeletePath = null;

  function renderQuestionsTable() {
    const questions = collectQuestions(tree);
    tableBody.innerHTML = '';

    if (!questions.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.textContent = 'No question nodes found in the current tree.';
      tr.appendChild(td);
      tableBody.appendChild(tr);
      return;
    }

    questions.forEach(({ path: p, depth, text, leafCount }) => {
      const tr = document.createElement('tr');

      const pathTd = document.createElement('td');
      pathTd.textContent = p || 'root';
      tr.appendChild(pathTd);

      const textTd = document.createElement('td');
      textTd.textContent = text;
      tr.appendChild(textTd);

      const depthTd = document.createElement('td');
      depthTd.textContent = String(depth);
      tr.appendChild(depthTd);

      const leavesTd = document.createElement('td');
      leavesTd.textContent = String(leafCount);
      tr.appendChild(leavesTd);

      const actionsTd = document.createElement('td');

      const viewBtn = document.createElement('button');
      viewBtn.type = 'button';
      viewBtn.textContent = 'View subtree';
      viewBtn.className = 'btn-view-subtree';
      viewBtn.dataset.path = p;
      actionsTd.appendChild(viewBtn);

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.textContent = 'Edit question';
      editBtn.className = 'btn-edit-question';
      editBtn.style.marginLeft = '4px';
      editBtn.dataset.path = p;
      actionsTd.appendChild(editBtn);

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.textContent = 'Delete branch';
      delBtn.className = 'btn-delete-branch';
      delBtn.style.marginLeft = '4px';
      delBtn.dataset.path = p;
      actionsTd.appendChild(delBtn);

      tr.appendChild(actionsTd);
      tableBody.appendChild(tr);
    });

    attachQuestionRowHandlers();
  }

  function renderTreeView() {
    treeContainer.innerHTML = '';
    const dom = buildTreeDom(tree, '');
    treeContainer.appendChild(dom);
  }

  function openDeleteDialog(pathStr) {
    const node = getNodeAtPath(pathStr);
    if (!node) {
      alert('Node not found for this path.');
      return;
    }
    if (!pathStr) {
      alert('Deleting the root question is not supported. Use reset/import instead.');
      return;
    }

    pendingDeletePath = pathStr;
    summaryEl.textContent =
      `You are about to delete the entire branch at path "${pathStr}".\n` +
      `All questions and answers under this node will be removed and replaced with a single empty leaf.`;

    previewEl.innerHTML = '';
    const subtreeDom = buildTreeDom(node, pathStr);
    previewEl.appendChild(subtreeDom);

    dialog.style.display = 'block';
  }

  function attachQuestionRowHandlers() {
    tableBody.querySelectorAll('.btn-view-subtree').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = btn.dataset.path || '';
        const node = getNodeAtPath(p);
        if (!node) {
          alert('Node not found for this path.');
          return;
        }
        previewEl.innerHTML = '';
        const subtreeDom = buildTreeDom(node, p || 'root');
        previewEl.appendChild(subtreeDom);
        summaryEl.textContent =
          `Subtree at path "${p || 'root'}" (view only, no deletion yet).`;
        dialog.style.display = 'block';
        pendingDeletePath = null;
      });
    });

    tableBody.querySelectorAll('.btn-edit-question').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = btn.dataset.path || '';
        const node = getNodeAtPath(p);
        if (!node || node.type !== 'q') {
          alert('Question node not found for this path.');
          return;
        }
        const newText = prompt('Edit question text:', node.text);
        if (!newText || !newText.trim()) return;
        node.text = newText.trim();
        saveTree();
        renderQuestionsTable();
        renderTreeView();
        setupAdminCharacterUI();
      });
    });

    tableBody.querySelectorAll('.btn-delete-branch').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = btn.dataset.path || '';
        openDeleteDialog(p);
      });
    });
  }

  if (!forceRerenderOnly) {
    confirmBtn.addEventListener('click', () => {
      if (!pendingDeletePath) {
        alert('No branch selected for deletion (you may be in view-only mode).');
        return;
      }
      deleteBranchAtPath(pendingDeletePath);
      pendingDeletePath = null;
      dialog.style.display = 'none';
      renderQuestionsTable();
      renderTreeView();
      setupAdminCharacterUI();
    });

    cancelBtn.addEventListener('click', () => {
      pendingDeletePath = null;
      dialog.style.display = 'none';
    });
  }

  renderQuestionsTable();
  renderTreeView();
}

// -------------------- Page Boot --------------------
async function initPage() {
  const isAdminPage = !!document.getElementById('manage') && !!document.getElementById('fileImport');
  const isGamePage = !!document.getElementById('game');
  const isIndexPage = !!document.querySelector('main section') && !isGamePage && !isAdminPage;

  // Load tree once for pages that need it
  if (isAdminPage || isGamePage) {
    await initTree();
  }

  if (isAdminPage) {
    if (!window.PathFinder_isAdmin()) {
      const ok = window.PathFinder_promptAdmin();
      if (!ok) {
        alert('Admin required.');
        location.href = 'index.html';
        return;
      }
    }

    // Import/Export tree buttons (JSON)
    const btnExport = document.getElementById('btnExport');
    const fileImport = document.getElementById('fileImport');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(tree, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pathfinder_tree.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });
    }
    if (fileImport) {
      fileImport.addEventListener('change', (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const obj = JSON.parse(reader.result);
            if (!obj || (obj.type !== 'q' && obj.type !== 'a')) {
              throw new Error('Invalid root node');
            }
            tree = obj;
            saveTree();
            restart(false);
            alert('Import successful.');
            setupAdminCharacterUI();
            initQuestionAdminUI(true);
          } catch (err) {
            alert('Import failed: ' + err.message);
          }
        };
        reader.readAsText(f);
        e.target.value = '';
      });
    }

    // Character management + question/tree admin
    setupAdminCharacterUI();
    initQuestionAdminUI(false);
  } else if (isGamePage) {
    const byId = (id) => document.getElementById(id);
    byId('btnYes')?.addEventListener('click', () => choose('yes'));
    byId('btnNo')?.addEventListener('click', () => choose('no'));
    byId('btnProb')?.addEventListener('click', () => choose('prob'));
    byId('btnPNot')?.addEventListener('click', () => choose('pnot'));
    byId('btnIDK')?.addEventListener('click', () => choose('idk'));
    byId('btnUndo')?.addEventListener('click', undo);
    byId('btnRestart')?.addEventListener('click', () => restart(false));

    const adminBtn = document.getElementById('btnAdminLogin');
    if (adminBtn) {
      adminBtn.addEventListener('click', () => {
        if (window.PathFinder_isAdmin() || window.PathFinder_promptAdmin()) {
          location.href = 'admin.html';
        }
      });
    }

    if (location.hash.replace('#', '') === 'admin') {
      if (window.PathFinder_isAdmin() || window.PathFinder_promptAdmin()) {
        location.href = 'admin.html';
      }
    }

    render();
  } else if (isIndexPage) {
    const adminBtn = document.getElementById('btnAdminLogin');
    if (adminBtn) {
      adminBtn.addEventListener('click', () => {
        if (window.PathFinder_isAdmin() || window.PathFinder_promptAdmin()) {
          location.href = 'admin.html';
        }
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initPage();
});
