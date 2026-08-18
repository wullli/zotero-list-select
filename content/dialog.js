// Script is at bottom of <body> — DOM is already available, no event wrapper needed.
document.getElementById("value-list").focus();
document.getElementById("btn-cancel").addEventListener("click", () => window.close());
document.getElementById("btn-select").addEventListener("click", doSelect);

// RFC 4180-style parser; also splits on newlines (outside quotes).
function parseCSV(input) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          // escaped quote
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
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

function doSelect() {
  const checked = document.querySelector('input[name="field"]:checked');
  const field = checked ? checked.value : "title";
  const rawInput = document.getElementById("value-list").value.trim();
  const caseSensitive = document.getElementById("case-sensitive").checked;
  const values = parseCSV(rawInput);
  if (!values.length) return;
  window.opener.__listSelectSubmit(field, values, caseSensitive);
  window.close();
}
