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
    text: 'Is the person primarily known for science or technology?',
    yes: {
      type: 'q',
      text: 'Is the person associated with theoretical physics?',
      yes: {
        type: 'q',
        text: 'Did this physicist develop the theory of relativity?',
        yes: { type: 'a', name: 'Albert Einstein' },
        no: { type: 'a', name: 'Stephen Hawking' }
      },
      no: {
        type: 'q',
        text: 'Is the person known for inventing electric devices?',
        yes: {
          type: 'q',
          text: 'Did this inventor create the light bulb?',
          yes: { type: 'a', name: 'Thomas Edison' },
          no: { type: 'a', name: 'Nikola Tesla' }
        },
        no: {
          type: 'q',
          text: 'Is the person a tech entrepreneur?',
          yes: {
            type: 'q',
            text: 'Did this person co-found Microsoft?',
            yes: { type: 'a', name: 'Bill Gates' },
            no: {
              type: 'q',
              text: 'Is this person the CEO of Tesla and SpaceX?',
              yes: { type: 'a', name: 'Elon Musk' },
              no: {
                type: 'q',
                text: 'Did this person co-found Apple?',
                yes: { type: 'a', name: 'Steve Jobs' },
                no: { type: 'a', name: 'Mark Zuckerberg' }
              }
            }
          },
          no: { type: 'a', name: 'Marie Curie' }
        }
      }
    },
    no: {
      type: 'q',
      text: 'Is the person an entertainer (musician, actor, comedian)?',
      yes: {
        type: 'q',
        text: 'Is the person a musician?',
        yes: {
          type: 'q',
          text: 'Is the musician primarily a pop artist?',
          yes: {
            type: 'q',
            text: 'Did this pop star start as a country singer before switching to pop?',
            yes: { type: 'a', name: 'Taylor Swift' },
            no: {
              type: 'q',
              text: 'Is this pop star known as the "King of Pop"?',
              yes: { type: 'a', name: 'Michael Jackson' },
              no: {
                type: 'q',
                text: 'Is this pop star from Barbados?',
                yes: { type: 'a', name: 'Rihanna' },
                no: {
                  type: 'q',
                  text: 'Is this pop star known for "Bad Guy"?',
                  yes: { type: 'a', name: 'Billie Eilish' },
                  no: { type: 'a', name: 'Ariana Grande' }
                }
              }
            }
          },
          no: {
            type: 'q',
            text: 'Is the musician a rock artist?',
            yes: {
              type: 'q',
              text: 'Was this rock artist the lead guitarist of Queen?',
              yes: { type: 'a', name: 'Freddie Mercury' },
              no: {
                type: 'q',
                text: 'Is this rock artist known for "Stairway to Heaven"?',
                yes: { type: 'a', name: 'Robert Plant' },
                no: { type: 'a', name: 'Kurt Cobain' }
              }
            },
            no: {
              type: 'q',
              text: 'Is the musician a classical composer?',
              yes: {
                type: 'q',
                text: 'Did this composer write Symphony No. 5?',
                yes: { type: 'a', name: 'Ludwig van Beethoven' },
                no: { type: 'a', name: 'Wolfgang Amadeus Mozart' }
              },
              no: {
                type: 'q',
                text: 'Is the musician a rapper?',
                yes: {
                  type: 'q',
                  text: 'Is this rapper from Toronto, Canada?',
                  yes: { type: 'a', name: 'Drake' },
                  no: {
                    type: 'q',
                    text: 'Was this rapper known as Slim Shady?',
                    yes: { type: 'a', name: 'Eminem' },
                    no: { type: 'a', name: 'Kendrick Lamar' }
                  }
                },
                no: { type: 'a', name: 'Ed Sheeran' }
              }
            }
          }
        },
        no: {
          type: 'q',
          text: 'Is the person an actor?',
          yes: {
            type: 'q',
            text: 'Did this actor play Iron Man in the MCU?',
            yes: { type: 'a', name: 'Robert Downey Jr.' },
            no: {
              type: 'q',
              text: 'Is this actor known for playing Jack Sparrow?',
              yes: { type: 'a', name: 'Johnny Depp' },
              no: {
                type: 'q',
                text: 'Did this actor star in Titanic?',
                yes: { type: 'a', name: 'Leonardo DiCaprio' },
                no: {
                  type: 'q',
                  text: 'Is this actress known for playing Hermione Granger?',
                  yes: { type: 'a', name: 'Emma Watson' },
                  no: { type: 'a', name: 'Tom Hanks' }
                }
              }
            }
          },
          no: { type: 'a', name: 'Kevin Hart' }
        }
      },
      no: {
        type: 'q',
        text: 'Is the person a professional athlete?',
        yes: {
          type: 'q',
          text: 'Is the athlete known for basketball?',
          yes: {
            type: 'q',
            text: 'Did this basketball player play for the LA Lakers and Miami Heat?',
            yes: { type: 'a', name: 'LeBron James' },
            no: {
              type: 'q',
              text: 'Is this basketball player known as "His Airness"?',
              yes: { type: 'a', name: 'Michael Jordan' },
              no: { type: 'a', name: 'Stephen Curry' }
            }
          },
          no: {
            type: 'q',
            text: 'Is the athlete known for soccer (football)?',
            yes: {
              type: 'q',
              text: 'Does this soccer player play for Inter Miami and won the World Cup in 2022?',
              yes: { type: 'a', name: 'Lionel Messi' },
              no: {
                type: 'q',
                text: 'Is this soccer player from Portugal?',
                yes: { type: 'a', name: 'Cristiano Ronaldo' },
                no: { type: 'a', name: 'Neymar Jr.' }
              }
            },
            no: {
              type: 'q',
              text: 'Is the athlete known for tennis?',
              yes: {
                type: 'q',
                text: 'Is this tennis player known for 23 Grand Slam titles?',
                yes: { type: 'a', name: 'Serena Williams' },
                no: { type: 'a', name: 'Roger Federer' }
              },
              no: {
                type: 'q',
                text: 'Is the athlete known for boxing?',
                yes: {
                  type: 'q',
                  text: 'Is this boxer known as "The Greatest"?',
                  yes: { type: 'a', name: 'Muhammad Ali' },
                  no: { type: 'a', name: 'Floyd Mayweather' }
                },
                no: { type: 'a', name: 'Usain Bolt' }
              }
            }
          }
        },
        no: {
          type: 'q',
          text: 'Is the person a political leader or historical figure?',
          yes: {
            type: 'q',
            text: 'Was this person a U.S. President?',
            yes: {
              type: 'q',
              text: 'Was this president the first African American U.S. President?',
              yes: { type: 'a', name: 'Barack Obama' },
              no: {
                type: 'q',
                text: 'Did this president serve during the Civil War?',
                yes: { type: 'a', name: 'Abraham Lincoln' },
                no: { type: 'a', name: 'George Washington' }
              }
            },
            no: {
              type: 'q',
              text: 'Was this person a civil rights leader?',
              yes: {
                type: 'q',
                text: 'Did this leader deliver the "I Have a Dream" speech?',
                yes: { type: 'a', name: 'Martin Luther King Jr.' },
                no: { type: 'a', name: 'Nelson Mandela' }
              },
              no: {
                type: 'q',
                text: 'Was this person a queen of the United Kingdom?',
                yes: { type: 'a', name: 'Queen Elizabeth II' },
                no: { type: 'a', name: 'Mahatma Gandhi' }
              }
            }
          },
          no: { type: 'a', name: 'Oprah Winfrey' }
        }
      }
    }
  },
  no: {
    type: 'q',
    text: 'Is the character from a comic book universe?',
    yes: {
      type: 'q',
      text: 'Is the character associated with Marvel Comics?',
      yes: {
        type: 'q',
        text: 'Does this Marvel character have spider-based powers?',
        yes: { type: 'a', name: 'Spider-Man' },
        no: {
          type: 'q',
          text: 'Does this Marvel character wield a shield with a star?',
          yes: { type: 'a', name: 'Captain America' },
          no: {
            type: 'q',
            text: 'Is this Marvel character a billionaire in a powered suit?',
            yes: { type: 'a', name: 'Iron Man' },
            no: {
              type: 'q',
              text: 'Does this Marvel character turn green when angry?',
              yes: { type: 'a', name: 'The Hulk' },
              no: {
                type: 'q',
                text: 'Is this Marvel character the God of Thunder?',
                yes: { type: 'a', name: 'Thor' },
                no: {
                  type: 'q',
                  text: 'Is this Marvel character known for breaking the fourth wall?',
                  yes: { type: 'a', name: 'Deadpool' },
                  no: { type: 'a', name: 'Black Widow' }
                }
              }
            }
          }
        }
      },
      no: {
        type: 'q',
        text: 'Is the character from DC Comics?',
        yes: {
          type: 'q',
          text: 'Is this DC character known as the Dark Knight from Gotham?',
          yes: { type: 'a', name: 'Batman' },
          no: {
            type: 'q',
            text: 'Does this DC character have an "S" symbol and fly?',
            yes: { type: 'a', name: 'Superman' },
            no: {
              type: 'q',
              text: 'Is this DC character an Amazonian warrior princess?',
              yes: { type: 'a', name: 'Wonder Woman' },
              no: {
                type: 'q',
                text: 'Is this DC character known for super speed?',
                yes: { type: 'a', name: 'The Flash' },
                no: { type: 'a', name: 'Aquaman' }
              }
            }
          }
        },
        no: { type: 'a', name: 'Spawn' }
      }
    },
    no: {
      type: 'q',
      text: 'Is the character primarily from video games?',
      yes: {
        type: 'q',
        text: 'Is this character a plumber who wears red and a mustache?',
        yes: { type: 'a', name: 'Mario' },
        no: {
          type: 'q',
          text: 'Is this character a blue hedgehog known for speed?',
          yes: { type: 'a', name: 'Sonic the Hedgehog' },
          no: {
            type: 'q',
            text: 'Is this character a hero in green tunic from Hyrule?',
            yes: { type: 'a', name: 'Link' },
            no: {
              type: 'q',
              text: 'Is this character a yellow creature that says "Pika Pika"?',
              yes: { type: 'a', name: 'Pikachu' },
              no: {
                type: 'q',
                text: 'Is this character a Spartan super-soldier in green armor?',
                yes: { type: 'a', name: 'Master Chief' },
                no: { type: 'a', name: 'Lara Croft' }
              }
            }
          }
        }
      },
      no: {
        type: 'q',
        text: 'Is the character from an animated series or movie?',
        yes: {
          type: 'q',
          text: 'Is this character a yellow sponge who lives in a pineapple?',
          yes: { type: 'a', name: 'SpongeBob SquarePants' },
          no: {
            type: 'q',
            text: 'Is this character a mouse associated with Disney?',
            yes: { type: 'a', name: 'Mickey Mouse' },
            no: {
              type: 'q',
              text: 'Is this character a snowman who likes warm hugs?',
              yes: { type: 'a', name: 'Olaf' },
              no: {
                type: 'q',
                text: 'Is this character a yellow character with spiky head from The Simpsons?',
                yes: { type: 'a', name: 'Bart Simpson' },
                no: {
                  type: 'q',
                  text: 'Is this character a cat and mouse duo where the cat chases the mouse?',
                  yes: { type: 'a', name: 'Tom' },
                  no: { type: 'a', name: 'Bugs Bunny' }
                }
              }
            }
          }
        },
        no: {
          type: 'q',
          text: 'Is the character from a book or novel?',
          yes: {
            type: 'q',
            text: 'Is this character a young wizard with a lightning scar?',
            yes: { type: 'a', name: 'Harry Potter' },
            no: {
              type: 'q',
              text: 'Is this character a detective living on Baker Street?',
              yes: { type: 'a', name: 'Sherlock Holmes' },
              no: {
                type: 'q',
                text: 'Is this character a hobbit who carried the One Ring?',
                yes: { type: 'a', name: 'Frodo Baggins' },
                no: {
                  type: 'q',
                  text: 'Is this character a vampire from Transylvania?',
                  yes: { type: 'a', name: 'Count Dracula' },
                  no: { type: 'a', name: 'Katniss Everdeen' }
                }
              }
            }
          },
          no: { type: 'a', name: 'Darth Vader' }
        }
      }
    }
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
