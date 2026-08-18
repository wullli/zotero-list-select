var Services = globalThis.Services;
if (!Services) {
  try {
    ({ Services } = ChromeUtils.importESModule("resource://gre/modules/Services.sys.mjs"));
  } catch (_) {
    ({ Services } = ChromeUtils.import("resource://gre/modules/Services.jsm"));
  }
}

var menuItems = new Map();

function log(msg) {
  Zotero.debug("[List Select] " + msg);
}

function install(data, reason) {}
function uninstall(data, reason) {}

async function startup({ id, version, rootURI }, reason) {
  await Zotero.initializationPromise;
  for (const win of Services.wm.getEnumerator("navigator:browser")) {
    addToWindow(win);
  }
  Services.wm.addListener(windowListener);
}

function shutdown(data, reason) {
  Services.wm.removeListener(windowListener);
  for (const [, item] of menuItems) {
    item.remove();
  }
  menuItems.clear();
}

const windowListener = {
  onOpenWindow(aWindow) {
    const win = aWindow.docShell.domWindow;
    win.addEventListener("load", function onLoad() {
      win.removeEventListener("load", onLoad);
      addToWindow(win);
    });
  },
  onCloseWindow() {},
  onStatusChange() {},
};

function addToWindow(win) {
  const doc = win.document;
  const popup = doc.getElementById("menu_ToolsPopup");
  if (!popup) return;

  const menuitem = (doc.createXULElement || doc.createElement).call(doc, "menuitem");
  menuitem.id = "zotero-list-select-menuitem";
  menuitem.setAttribute("label", "Select Items by List…");
  menuitem.addEventListener("command", () => openSelectDialog(win));
  popup.appendChild(menuitem);
  menuItems.set(win, menuitem);
}

const FIELD_LABELS = ["Title", "DOI", "Year", "Extra"];
const FIELD_KEYS   = ["title", "DOI", "year", "extra"];

function openSelectDialog(win) {
  const idx = { value: 0 };
  if (!Services.prompt.select(win, "Select Items by List", "Match field:", FIELD_LABELS, idx)) return;

  const rawInput = { value: "" };
  const caseSensitive = { value: false };
  if (!Services.prompt.prompt(
    win,
    "Select Items by List",
    'Values — comma-separated or one per line.\nWrap values containing commas in double-quotes.',
    rawInput,
    "Case-sensitive matching",
    caseSensitive
  )) return;

  const values = parseCSV(rawInput.value);
  if (!values.length) return;

  doSelectItems(win, FIELD_KEYS[idx.value], values, caseSensitive.value);
}

function parseCSV(input) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === "," || ch === "\n" || ch === "\r") {
        const v = current.trim();
        if (v) values.push(v);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  const last = current.trim();
  if (last) values.push(last);
  return values;
}

async function doSelectItems(win, field, values, caseSensitive) {
  try {
    const ZP = Zotero.getActiveZoteroPane();
    const libraryID = ZP.getSelectedLibraryID();

    let items;
    const collection = ZP.getSelectedCollection();
    if (collection) {
      items = collection.getChildItems();
    } else {
      const s = new Zotero.Search();
      s.libraryID = libraryID;
      const ids = await s.search();
      items = await Zotero.Items.getAsync(ids);
    }

    items = items.filter(item => !item.isNote() && !item.isAttachment());

    const normalize = field === "DOI" ? normalizeDOI : v => v.trim();
    const needles = new Set(
      values.map(v => {
        const n = normalize(v);
        return caseSensitive ? n : n.toLowerCase();
      })
    );

    const matchingIDs = [];
    for (const item of items) {
      let val = (item.getField(field) || "").trim();
      if (field === "DOI") val = normalizeDOI(val);
      const compare = caseSensitive ? val : val.toLowerCase();
      if (needles.has(compare)) matchingIDs.push(item.id);
    }

    if (!matchingIDs.length) {
      Services.prompt.alert(win, "List Select", "No matching items found.");
      return;
    }

    await ZP.itemsView.selectItems(matchingIDs);
    log(`Selected ${matchingIDs.length} item(s).`);
  } catch (e) {
    log("Error: " + e);
    Services.prompt.alert(win, "List Select", "Error: " + e.message);
  }
}

function normalizeDOI(doi) {
  return doi
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .toLowerCase()
    .trim();
}
