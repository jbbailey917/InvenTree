/**
 * Bulk Barcode Scanner — standalone page.
 *
 * Dependencies: none (vanilla JS).
 *
 * Entry point: initBulkScan(containerId)
 *
 * The page renders a full barcode-scanning workflow that relies solely on
 * InvenTree REST API endpoints.  No custom backend is needed beyond the
 * Django view that serves this HTML page.
 */

/* ================================================================== */
/*  STYLE INJECTION                                                     */
/* ================================================================== */
(function injectStyles() {
  var css = document.createElement('style');
  css.textContent =
    /* reset / base */
    '*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}' +
    'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen,Ubuntu,sans-serif;' +
    'background:#f5f5f5;color:#333;line-height:1.5;}' +
    /* scanner bar */
    '.bs-header{margin-bottom:16px}' +
    '.bs-header h1{font-size:22px;font-weight:700;color:#1a1a1a;margin-bottom:16px}' +
    '.bs-scan-row{display:flex;gap:8px;align-items:stretch}' +
    '.bs-scan-row input{flex:1;padding:10px 14px;font-size:16px;border:2px solid #ccc;border-radius:8px;outline:none;' +
    'transition:border-color .15s}' +
    '.bs-scan-row input:focus{border-color:#1976d2}' +
    '.bs-scan-row button{padding:10px 24px;font-size:15px;font-weight:600;border:none;border-radius:8px;' +
    'cursor:pointer;transition:background .15s,opacity .15s}' +
    '.bs-btn-add{background:#1976d2;color:#fff}' +
    '.bs-btn-add:hover{background:#1565c0}' +
    '.bs-btn-add:disabled{opacity:.5;cursor:not-allowed}' +
    /* action buttons */
    '.bs-actions{display:flex;gap:8px;margin:16px 0;flex-wrap:wrap}' +
    '.bs-actions button{padding:9px 18px;font-size:14px;font-weight:600;border:none;border-radius:6px;' +
    'cursor:pointer;transition:background .15s,opacity .15s}' +
    '.bs-btn-action{background:#e3f2fd;color:#1565c0}' +
    '.bs-btn-action:hover{background:#bbdefb}' +
    '.bs-btn-action:disabled{opacity:.4;cursor:not-allowed}' +
    '.bs-btn-danger{background:#ffebee;color:#c62828}' +
    '.bs-btn-danger:hover{background:#ffcdd2}' +
    /* table */
    '.bs-table-wrap{background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.08);overflow-x:auto}' +
    'table.bs-table{width:100%;border-collapse:collapse;font-size:14px}' +
    'table.bs-table th{background:#fafafa;padding:10px 12px;text-align:left;font-weight:600;color:#555;' +
    'font-size:12px;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #e0e0e0}' +
    'table.bs-table td{padding:10px 12px;border-bottom:1px solid #f0f0f0;vertical-align:middle}' +
    'table.bs-table tr:last-child td{border-bottom:none}' +
    'table.bs-table tr:hover td{background:#fafafa}' +
    /* badges */
    '.bs-badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600}' +
    '.bs-badge-stockitem{background:#e3f2fd;color:#1565c0}' +
    '.bs-badge-part{background:#e8f5e9;color:#2e7d32}' +
    '.bs-badge-stocklocation{background:#fff3e0;color:#e65100}' +
    '.bs-badge-po{background:#f3e5f5;color:#7b1fa2}' +
    '.bs-qty-input{width:70px;padding:4px 6px;border:1px solid #ccc;border-radius:4px;font-size:14px;text-align:center}' +
    /* delete btn */
    '.bs-del-btn{background:none;border:none;color:#c62828;cursor:pointer;font-size:16px;padding:2px 6px;' +
    'border-radius:4px;transition:background .15s}' +
    '.bs-del-btn:hover{background:#ffebee}' +
    '.bs-checkbox{width:18px;height:18px;cursor:pointer}' +
    /* footer bar */
    '.bs-footer{display:flex;justify-content:space-between;align-items:center;margin-top:12px;font-size:13px;color:#888}' +
    '.bs-footer a{color:#1976d2;cursor:pointer;text-decoration:none}' +
    '.bs-footer a:hover{text-decoration:underline}' +
    /* generic button in modals */
    '.bs-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 20px;font-size:14px;font-weight:600;' +
    'border:none;border-radius:6px;cursor:pointer;transition:background .15s,opacity .15s}' +
    '.bs-btn-primary{background:#1976d2;color:#fff}' +
    '.bs-btn-primary:hover{background:#1565c0}' +
    '.bs-btn-primary:disabled{opacity:.5;cursor:not-allowed}' +
    '.bs-btn-secondary{background:#e0e0e0;color:#333}' +
    '.bs-btn-secondary:hover{background:#d0d0d0}' +
    /* modal overlay */
    '.bs-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.35);' +
    'z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px}' +
    '.bs-modal{background:#fff;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.15);' +
    'width:100%;max-width:640px;max-height:80vh;display:flex;flex-direction:column}' +
    '.bs-modal-head{padding:16px 20px;border-bottom:1px solid #e0e0e0;font-size:17px;font-weight:700}' +
    '.bs-modal-body{padding:16px 20px;overflow-y:auto;flex:1}' +
    '.bs-modal-foot{padding:12px 20px;border-top:1px solid #e0e0e0;display:flex;gap:8px;justify-content:flex-end}' +
    /* form elements inside modals */
    '.bs-field{margin-bottom:12px}' +
    '.bs-field label{display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:4px}' +
    '.bs-field select,.bs-field input[type=text],.bs-field input[type=number]{width:100%;' +
    'padding:8px 10px;font-size:14px;border:1px solid #ccc;border-radius:6px;outline:none}' +
    '.bs-field select:focus,.bs-field input:focus{border-color:#1976d2}' +
    '.bs-item-list{list-style:none;padding:0;margin:0 0 12px}' +
    '.bs-item-list li{padding:6px 0;border-bottom:1px solid #f0f0f0;font-size:14px;display:flex;justify-content:space-between;align-items:center}' +
    '.bs-item-list li:last-child{border-bottom:none}' +
    '.bs-field-row{display:flex;gap:8px;align-items:end}' +
    '.bs-field-row .bs-field{flex:1;margin-bottom:0}' +
    /* loading spinner */
    '.bs-spinner{display:inline-block;width:16px;height:16px;border:2px solid #ccc;border-top-color:#1976d2;' +
    'border-radius:50%;animation:bs-spin .6s linear infinite}' +
    '@keyframes bs-spin{to{transform:rotate(360deg)}}' +
    '.bs-loading{text-align:center;padding:32px;color:#888}' +
    '.bs-empty{text-align:center;padding:40px 16px;color:#aaa}' +
    '.bs-empty p{font-size:16px;margin-bottom:8px}' +
    '.bs-empty small{font-size:13px}' +
    /* toast */
    '.bs-toast{position:fixed;bottom:24px;right:24px;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:500;' +
    'z-index:2000;box-shadow:0 4px 12px rgba(0,0,0,.15);transition:opacity .3s;max-width:400px}' +
    '.bs-toast-success{background:#2e7d32;color:#fff}' +
    '.bs-toast-error{background:#c62828;color:#fff}' +
    '.bs-toast-info{background:#1565c0;color:#fff}' +
    '.bs-toast-warn{background:#e65100;color:#fff}' +
    /* responsive */
    '@media(max-width:640px){.bs-scan-row{flex-direction:column}' +
    '.bs-modal{margin:0;border-radius:0;max-height:100vh;height:100%}' +
    '.bs-overlay{padding:0}}';
  document.head.appendChild(css);
})();

/* ================================================================== */
/*  CSRF TOKEN                                                         */
/* ================================================================== */
function getCSRFToken() {
  var row =
    document.cookie
      .split('; ')
      .find(function (r) {
        return r.startsWith('csrftoken=');
      });
  return row ? row.split('=')[1] : '';
}

/* ================================================================== */
/*  TOAST NOTIFICATION                                                 */
/* ================================================================== */
function showToast(message, type) {
  type = type || 'info';
  var el = document.createElement('div');
  el.className = 'bs-toast bs-toast-' + type;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(function () {
    el.style.opacity = '0';
    setTimeout(function () { el.remove(); }, 300);
  }, 3000);
}

/* ================================================================== */
/*  STATE                                                              */
/* ================================================================== */
var STORAGE_KEY = 'inventree_bulk_scan_items';

function loadItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (_) {
    return [];
  }
}

function saveItems(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (_) {
    /* storage full – silently ignore */
  }
}

/* ================================================================== */
/*  MAIN STATE OBJECT                                                  */
/* ================================================================== */
var state = {
  items: loadItems(),
  selected: {},   // pk-index for O(1) lookups of selected item keys
  container: null,
  rootEl: null,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function esc(s) {
  if (typeof s !== 'string') return '';
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(s));
  return d.innerHTML;
}

/* ------------------------------------------------------------------ */
/*  API helpers                                                        */
/* ------------------------------------------------------------------ */
function apiUrl(path) {
  return window.location.origin + path;
}

function apiFetch(url, opts) {
  opts = opts || {};
  opts.headers = opts.headers || {};
  opts.headers['Accept'] = 'application/json';
  opts.headers['X-CSRFToken'] = getCSRFToken();
  opts.credentials = 'include';

  if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
    opts.body = JSON.stringify(opts.body);
    opts.headers['Content-Type'] = 'application/json';
  }

  return fetch(url, opts).then(function (res) {
    if (!res.ok) {
      return res.json().then(function (err) {
        // Collect all error fields for a detailed message
        var parts = [];
        if (err.detail) parts.push(err.detail);
        if (err.non_field_errors) parts = parts.concat(err.non_field_errors);
        // Include per-field errors (e.g. "items": [...], "location": [...])
        for (var key in err) {
          if (key === 'detail' || key === 'non_field_errors') continue;
          var fieldErr = err[key];
          var fieldMsg = key + ': ' + (Array.isArray(fieldErr) ? fieldErr.join(', ') : fieldErr);
          parts.push(fieldMsg);
        }
        var msg = parts.length > 0 ? parts.join(' | ') : res.statusText;
        console.error('API 400/500 for ' + url + ':', msg, '(payload:', opts.body, ')');
        throw new Error(msg);
      }).catch(function(jsonErr) {
        // If response body isn't JSON, use status text
        throw new Error(res.statusText || 'Request failed');
      });
    }
    // Some endpoints return empty (204) on success
    var ct = res.headers.get('Content-Type') || '';
    if (ct.indexOf('json') !== -1) return res.json();
    return null;
  });
}

/* Fetch all pages from a paginated API endpoint */
function fetchAllPages(url) {
  var allResults = [];

  function fetchPage(pageUrl) {
    return apiFetch(pageUrl).then(function (data) {
      var results = data.results || data || [];
      allResults = allResults.concat(results);
      if (data.next) {
        return fetchPage(data.next);
      }
      return allResults;
    });
  }

  return fetchPage(url);
}

/* ------------------------------------------------------------------ */
/*  Barcode resolution: try InvenTree barcode API, then search        */
/* ------------------------------------------------------------------ */

function resolveBarcode(barcode) {
  return new Promise(function (resolve, reject) {
    // Try the proper barcode scan endpoint first.
    // This uses InvenTree's barcode plugins to match against barcode_hash
    // and correctly resolves linked/assigned external barcodes.
    apiFetch(apiUrl('/api/barcode/'), {
      method: 'POST',
      body: { barcode: barcode },
    })
      .then(function (res) {
        if (res && res.success) {
          var match = extractBarcodeMatch(barcode, res);
          if (match) {
            resolve(match);
            return;
          }
        }
        // No match from barcode endpoint — fall through to search
        resolveBarcodeViaSearch(barcode, resolve, reject);
      })
      .catch(function () {
        // Barcode endpoint unavailable (e.g. no plugins) — fall back to search
        resolveBarcodeViaSearch(barcode, resolve, reject);
      });
  });
}

function extractBarcodeMatch(barcode, res) {
  if (res.stockitem) {
    var si = res.stockitem;
    var detail = si.instance || {};
    return {
      barcode: barcode,
      type: 'stockitem',
      type_label: 'Stock Item',
      pk: si.pk,
      part_pk: detail.part_detail ? detail.part_detail.pk : null,
      part_name: detail.part_detail ? detail.part_detail.name : 'Unknown Part',
      part_ipn: detail.part_detail ? detail.part_detail.IPN || '' : '',
      location: detail.location_detail ? detail.location_detail.name : '',
      location_pk: detail.location_detail ? detail.location_detail.pk : null,
      quantity: detail.quantity || 1,
      stock: detail,
    };
  }
  if (res.part) {
    var p = res.part;
    var detail = p.instance || {};
    return {
      barcode: barcode,
      type: 'part',
      type_label: 'Part',
      pk: p.pk,
      part_pk: p.pk,
      part_name: detail.name || 'Unknown Part',
      part_ipn: detail.IPN || '',
      location: '',
      location_pk: null,
      quantity: 1,
      part: detail,
    };
  }
  if (res.stocklocation) {
    var loc = res.stocklocation;
    var detail = loc.instance || {};
    return {
      barcode: barcode,
      type: 'stocklocation',
      type_label: 'Location',
      pk: loc.pk,
      part_pk: null,
      part_name: detail.name || 'Location',
      part_ipn: '',
      location: detail.name || '',
      location_pk: loc.pk,
      quantity: 1,
      location_detail: detail,
    };
  }
  if (res.purchaseorder) {
    var po = res.purchaseorder;
    var detail = po.instance || {};
    return {
      barcode: barcode,
      type: 'po',
      type_label: 'Purchase Order',
      pk: po.pk,
      part_pk: null,
      part_name: 'PO #' + (detail.reference || po.pk) + ' — ' + (detail.supplier_name || ''),
      part_ipn: '',
      location: '',
      location_pk: null,
      quantity: 1,
      po: detail,
    };
  }
  return null;
}

function resolveBarcodeViaSearch(barcode, resolve, reject) {
  apiFetch(
    apiUrl(
      '/api/stock/?search=' +
        encodeURIComponent(barcode) +
        '&location_detail=true&part_detail=true'
    )
  )
    .then(function (stockRes) {
      if (stockRes && stockRes.results && stockRes.results.length > 0) {
        var si = stockRes.results[0];
        resolve({
          barcode: barcode,
          type: 'stockitem',
          type_label: 'Stock Item',
          pk: si.pk,
          part_pk: si.part_detail ? si.part_detail.pk : null,
          part_name: si.part_detail ? si.part_detail.name : 'Unknown Part',
          part_ipn: si.part_detail ? si.part_detail.IPN || '' : '',
          location: si.location_detail ? si.location_detail.name : '',
          location_pk: si.location_detail ? si.location_detail.pk : null,
          quantity: si.quantity || 1,
          stock: si,
        });
        return;
      }
      // Try stock locations
      return apiFetch(apiUrl('/api/stock/location/?search=' + encodeURIComponent(barcode)));
    })
    .then(function (locRes) {
      if (!locRes) return; // already resolved
      if (locRes && locRes.results && locRes.results.length > 0) {
        var loc = locRes.results[0];
        resolve({
          barcode: barcode,
          type: 'stocklocation',
          type_label: 'Location',
          pk: loc.pk,
          part_pk: null,
          part_name: loc.name || 'Location',
          part_ipn: '',
          location: loc.name || '',
          location_pk: loc.pk,
          quantity: 1,
          location_detail: loc,
        });
        return;
      }
      // Try parts
      return apiFetch(apiUrl('/api/part/?search=' + encodeURIComponent(barcode)));
    })
    .then(function (partRes) {
      if (!partRes) return; // already resolved
      if (partRes && partRes.results && partRes.results.length > 0) {
        var p = partRes.results[0];
        resolve({
          barcode: barcode,
          type: 'part',
          type_label: 'Part',
          pk: p.pk,
          part_pk: p.pk,
          part_name: p.name || 'Unknown Part',
          part_ipn: p.IPN || '',
          location: '',
          location_pk: null,
          quantity: 1,
          part: p,
        });
        return;
      }
      // Try purchase orders
      return apiFetch(apiUrl('/api/order/po/?search=' + encodeURIComponent(barcode)));
    })
    .then(function (poRes) {
      if (!poRes) return;
      if (poRes && poRes.results && poRes.results.length > 0) {
        var po = poRes.results[0];
        resolve({
          barcode: barcode,
          type: 'po',
          type_label: 'Purchase Order',
          pk: po.pk,
          part_pk: null,
          part_name: 'PO #' + po.reference + ' — ' + (po.supplier_name || ''),
          part_ipn: '',
          location: '',
          location_pk: null,
          quantity: 1,
          po: po,
        });
        return;
      }
      reject(new Error('No matching item found for barcode: ' + barcode));
    })
    .catch(function (err) {
      reject(err);
    });
}

/* ================================================================== */
/*  RENDER                                                             */
/* ================================================================== */
function render() {
  if (!state.rootEl) return;
  state.rootEl.innerHTML = buildHTML();
  bindEvents();
}

function buildHTML() {
  var items = state.items;
  var selCount = Object.keys(state.selected).length;

  var header =
    '<div class="bs-header">' +
    '<h1>Bulk Barcode Scan</h1>' +
    '<div class="bs-scan-row">' +
    '<input type="text" id="bs-scanner-input" placeholder="Scan barcode or type to search…" autofocus />' +
    '<button class="bs-btn-add" id="bs-btn-add">Add</button>' +
    '</div>' +
    '</div>';

  var actionBtns =
    '<div class="bs-actions">' +
    '<button class="bs-btn-action" id="bs-action-move" ' +
    (selCount === 0 ? 'disabled' : '') +
    '>' +
    'Move Stock</button>' +
    '<button class="bs-btn-action" id="bs-action-receive" ' +
    (selCount === 0 ? 'disabled' : '') +
    '>' +
    'Receive Stock</button>' +
    '<button class="bs-btn-action" id="bs-action-reconcile" ' +
    (selCount === 0 ? 'disabled' : '') +
    '>' +
    'Reconcile Stock</button>' +
    (selCount > 0
      ? '<button class="bs-btn-danger" id="bs-action-deselect">Deselect All</button>'
      : '') +
    '</div>';

  var table;
  if (items.length === 0) {
    table =
      '<div class="bs-empty">' +
      '<p>No items scanned yet</p>' +
      '<small>Scan a barcode above or type a search term and click Add.</small>' +
      '</div>';
  } else {
    var rows = '';
    items.forEach(function (item, idx) {
      var checked = state.selected[item.id] ? 'checked' : '';
      var badgeCls =
        item.type === 'stockitem'
          ? 'bs-badge-stockitem'
          : item.type === 'part'
            ? 'bs-badge-part'
            : item.type === 'stocklocation'
              ? 'bs-badge-stocklocation'
              : 'bs-badge-po';
      rows +=
        '<tr>' +
        '<td><input type="checkbox" class="bs-checkbox" data-idx="' +
        idx +
        '" ' +
        checked +
        ' /></td>' +
        '<td style="font-family:monospace;font-size:13px;max-width:160px;word-break:break-all">' +
        esc(item.barcode) +
        '</td>' +
        '<td>' +
        esc(item.part_name) +
        (item.part_ipn ? ' <span style="color:#999;font-size:12px">(' + esc(item.part_ipn) + ')</span>' : '') +
        '</td>' +
        '<td><span class="bs-badge ' +
        badgeCls +
        '">' +
        esc(item.type_label) +
        '</span></td>' +
        '<td>' +
        esc(item.location || '-') +
        '</td>' +
        '<td>' +
        (item.type === 'stockitem' ? Number(item.quantity).toLocaleString() : '-') +
        '</td>' +
        '<td><button class="bs-del-btn" data-idx="' +
        idx +
        '" title="Remove item">&times;</button></td>' +
        '</tr>';
    });
    table =
      '<div class="bs-table-wrap">' +
      '<table class="bs-table">' +
      '<thead><tr>' +
      '<th style="width:40px"><input type="checkbox" id="bs-select-all" ' +
      (selCount === items.length && items.length > 0 ? 'checked' : '') +
      ' /></th>' +
      '<th>Barcode</th>' +
      '<th>Part Name</th>' +
      '<th>Type</th>' +
      '<th>Location</th>' +
      '<th>Quantity</th>' +
      '<th style="width:44px"></th>' +
      '</tr></thead>' +
      '<tbody>' +
      rows +
      '</tbody>' +
      '</table>' +
      '</div>';
  }

  var selInfo =
    selCount > 0
      ? selCount + ' of ' + items.length + ' selected'
      : items.length + ' item' + (items.length !== 1 ? 's' : '');

  var footer =
    '<div class="bs-footer">' +
    '<span>' +
    selInfo +
    '</span>' +
    (items.length > 0
      ? '<a id="bs-clear-all">Clear All</a>'
      : '') +
    '</div>';

  return header + actionBtns + table + footer;
}

/* ================================================================== */
/*  EVENT BINDING                                                      */
/* ================================================================== */
function bindEvents() {
  var input = document.getElementById('bs-scanner-input');
  var addBtn = document.getElementById('bs-btn-add');
  var clearAll = document.getElementById('bs-clear-all');
  var selectAll = document.getElementById('bs-select-all');
  var deselect = document.getElementById('bs-action-deselect');

  /* ---- scanner input ---- */
  if (input) {
    input.focus();

    // Debounce timer for distinguishing barcode scanners from human typing.
    // Barcode scanners send all characters of a barcode within ~50ms;
    // if 200ms elapses without a new keystroke the buffer is submitted.
    // To avoid false triggers during human typing we only auto-submit
    // when ALL inter-keystroke gaps have been below the threshold.
    var scanTimer = null;
    var scanBuffer = '';
    var scanTimeout = 200; // ms (barcode scanners send at ~10-30ms/char; humans at ~100-300ms/char)
    var lastKeyTime = 0;
    var allFast = true; // true if every key so far arrived within the threshold

    input.addEventListener('keydown', function (e) {
      var now = Date.now();

      // Enter key — submit the input immediately (scanner or manual)
      if (e.key === 'Enter') {
        e.preventDefault();
        var val = scanBuffer || input.value.trim();
        scanBuffer = '';
        allFast = true;
        lastKeyTime = 0;
        if (scanTimer) { clearTimeout(scanTimer); scanTimer = null; }
        if (val) handleScanInput(val);
        return;
      }

      // Tab key — some scanners send Tab instead of Enter
      if (e.key === 'Tab') {
        var val = scanBuffer || input.value.trim();
        scanBuffer = '';
        allFast = true;
        lastKeyTime = 0;
        if (scanTimer) { clearTimeout(scanTimer); scanTimer = null; }
        if (val) handleScanInput(val);
        // Let Tab proceed naturally for focus management
        return;
      }

      // For printable characters, accumulate into a scan buffer
      // and reset the debounce timer.
      if (e.key && e.key.length === 1) {
        if (lastKeyTime > 0 && (now - lastKeyTime) > scanTimeout) {
          allFast = false; // human-typing gap detected
        }
        lastKeyTime = now;
        scanBuffer += e.key;

        if (scanTimer) clearTimeout(scanTimer);
        scanTimer = setTimeout(function () {
          if (scanBuffer && allFast && scanBuffer.length >= 3) {
            // All keystrokes arrived fast = barcode scanner
            handleScanInput(scanBuffer);
          }
          // else: human typing — wait for Enter/Tab
          scanBuffer = '';
          allFast = true;
          lastKeyTime = 0;
          scanTimer = null;
        }, scanTimeout);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        // Human editing — clear the buffer
        scanBuffer = '';
        allFast = true;
        lastKeyTime = 0;
        if (scanTimer) { clearTimeout(scanTimer); scanTimer = null; }
      }
    });

    // Handle paste events (some scanners paste the barcode)
    input.addEventListener('paste', function () {
      scanBuffer = '';
      allFast = true;
      lastKeyTime = 0;
      if (scanTimer) { clearTimeout(scanTimer); scanTimer = null; }
      var _this = this;
      setTimeout(function () {
        var val = _this.value.trim();
        if (val) handleScanInput(val);
      }, 10);
    });

    // On blur, clear the scan buffer to avoid stale submissions
    input.addEventListener('blur', function () {
      scanBuffer = '';
      allFast = true;
      lastKeyTime = 0;
      if (scanTimer) { clearTimeout(scanTimer); scanTimer = null; }
    });
  }

  /* ---- add button ---- */
  if (addBtn) {
    addBtn.addEventListener('click', function () {
      var val = input ? input.value.trim() : '';
      if (val) handleScanInput(val);
    });
  }

  /* ---- clear all ---- */
  if (clearAll) {
    clearAll.addEventListener('click', function () {
      if (state.items.length === 0) return;
      if (confirm('Remove all scanned items?')) {
        state.items = [];
        state.selected = {};
        persistAndRender();
      }
    });
  }

  /* ---- select-all checkbox ---- */
  if (selectAll) {
    selectAll.addEventListener('change', function () {
      var checked = selectAll.checked;
      state.selected = {};
      if (checked) {
        state.items.forEach(function (item) {
          state.selected[item.id] = true;
        });
      }
      render();
    });
  }

  /* ---- individual checkboxes ---- */
  var checkboxes = document.querySelectorAll('.bs-checkbox[data-idx]');
  checkboxes.forEach(function (cb) {
    cb.addEventListener('change', function () {
      var idx = parseInt(cb.getAttribute('data-idx'), 10);
      var item = state.items[idx];
      if (!item) return;
      if (cb.checked) {
        state.selected[item.id] = true;
      } else {
        delete state.selected[item.id];
      }
      render();
    });
  });

  /* ---- delete buttons ---- */
  var delBtns = document.querySelectorAll('.bs-del-btn[data-idx]');
  delBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var idx = parseInt(btn.getAttribute('data-idx'), 10);
      removeItem(idx);
    });
  });

  /* ---- deselect ---- */
  if (deselect) {
    deselect.addEventListener('click', function () {
      state.selected = {};
      render();
    });
  }

  /* ---- action buttons ---- */
  var moveBtn = document.getElementById('bs-action-move');
  var receiveBtn = document.getElementById('bs-action-receive');
  var reconcileBtn = document.getElementById('bs-action-reconcile');

  if (moveBtn) moveBtn.addEventListener('click', openMoveModal);
  if (receiveBtn) receiveBtn.addEventListener('click', openReceiveModal);
  if (reconcileBtn) reconcileBtn.addEventListener('click', openReconcileModal);

  /* ---- close overlays on backdrop click ---- */
  document.querySelectorAll('.bs-overlay').forEach(function (ov) {
    ov.addEventListener('click', function (e) {
      if (e.target === ov) ov.remove();
    });
  });
}

/* ================================================================== */
/*  SCAN INPUT HANDLER                                                 */
/* ================================================================== */
function handleScanInput(value) {
  if (!value) return;

  var input = document.getElementById('bs-scanner-input');
  if (input) input.value = '';

  // Show brief loading state on the add button
  var addBtn = document.getElementById('bs-btn-add');
  var origText = addBtn ? addBtn.textContent : '';
  if (addBtn) {
    addBtn.disabled = true;
    addBtn.innerHTML = '<span class="bs-spinner"></span>';
  }

  resolveBarcode(value)
    .then(function (resolved) {
      // Check for duplicates by barcode + type
      var dup = state.items.find(function (i) {
        return i.barcode === resolved.barcode && i.type === resolved.type;
      });
      if (dup) {
        showToast(
          'Duplicate: ' +
            esc(resolved.part_name) +
            ' already in list',
          'warn'
        );
        return;
      }
      resolved.id = uid();
      resolved.timestamp = Date.now();
      state.items.push(resolved);
      persistAndRender();
      showToast('Added: ' + esc(resolved.part_name), 'success');
    })
    .catch(function (err) {
      showToast(err.message || 'Could not resolve barcode', 'error');
    })
    .finally(function () {
      if (addBtn) {
        addBtn.disabled = false;
        addBtn.textContent = origText || 'Add';
      }
      if (input) input.focus();
    });
}

/* ================================================================== */
/*  REMOVE ITEM                                                        */
/* ================================================================== */
function removeItem(idx) {
  if (idx < 0 || idx >= state.items.length) return;
  var item = state.items[idx];
  delete state.selected[item.id];
  state.items.splice(idx, 1);
  persistAndRender();
}

/* ================================================================== */
/*  PERSIST & RE-RENDER                                                */
/* ================================================================== */
function persistAndRender() {
  saveItems(state.items);
  render();
}

/* ================================================================== */
/*  GET SELECTED ITEMS                                                 */
/* ================================================================== */
function getSelectedItems() {
  return state.items.filter(function (item) {
    return state.selected[item.id];
  });
}

/* ================================================================== */
/*  MODAL: MOVE STOCK                                                  */
/* ================================================================== */

function openMoveModal() {
  var selected = getSelectedItems();
  if (selected.length === 0) {
    showToast('No items selected', 'warn');
    return;
  }

  // Extract part IDs from selected items (part or stockitem)
  var partIds = [];
  var seen = {};
  selected.forEach(function(item) {
    var pk = null;
    if (item.type === 'part' && item.part_pk) pk = item.part_pk;
    else if (item.type === 'stockitem' && item.part_pk) pk = item.part_pk;
    if (pk && !seen[pk]) { seen[pk] = true; partIds.push(pk); }
  });

  if (partIds.length === 0) {
    showToast('Select a scanned part or stock item to move', 'warn');
    return;
  }

  // Auto-detect source location from stock location items scanned before selection
  var defaultSourcePk = null;
  for (var i = state.items.length - 1; i >= 0; i--) {
    if (state.selected[state.items[i].id]) break;
    if (state.items[i].type === 'stocklocation' && state.items[i].location_pk) {
      defaultSourcePk = state.items[i].location_pk;
      break;
    }
  }

  var modalState = {
    partIds: partIds,
    allStockItems: [],
    locationCache: [],
    partPackageSizes: {},
    stockGroups: [],
    moveState: {},
    sourceLocation: null,
    destLocation: null,
    loading: true,
    submitting: false
  };

  var overlayId = 'bs-mv-' + uid();
  var html =
    '<div class="bs-overlay" id="' + overlayId + '">' +
    '<div class="bs-modal" style="max-width:95vw">' +
    '<div class="bs-modal-head">Move Stock (' + partIds.length + ' part' + (partIds.length !== 1 ? 's' : '') + ')</div>' +
    '<div class="bs-modal-body" id="' + overlayId + '-body">' +
    '<div class="bs-loading"><span class="bs-spinner"></span> Loading stock data...</div>' +
    '</div>' +
    '<div class="bs-modal-foot" id="' + overlayId + '-foot">' +
    '<button class="bs-btn bs-btn-secondary" id="' + overlayId + '-cancel">Cancel</button>' +
    '<button class="bs-btn bs-btn-primary" id="' + overlayId + '-submit" disabled>Move Stock</button>' +
    '</div>' +
    '</div>' +
    '</div>';

  document.body.insertAdjacentHTML('beforeend', html);

  // Event delegation: change events (selects + number inputs)
  document.getElementById(overlayId).addEventListener('change', function(e) {
    var t = e.target;
    if (t.id === overlayId + '-source-loc') {
      modalState.sourceLocation = t.value ? Number(t.value) : null;
      _renderMoveBody(modalState, overlayId);
      _renderMoveFoot(modalState, overlayId);
    } else if (t.id === overlayId + '-dest-loc') {
      modalState.destLocation = t.value ? Number(t.value) : null;
      _renderMoveFoot(modalState, overlayId);
    } else if (t.classList.contains('bs-mv-pkg')) {
      var key = t.getAttribute('data-key');
      var val = parseInt(t.value, 10) || 0;
      if (val < 0) val = 0;
      if (!modalState.moveState[key]) modalState.moveState[key] = { packages: 0, units: 0 };
      modalState.moveState[key].packages = val;
      _renderMoveBody(modalState, overlayId);
      _renderMoveFoot(modalState, overlayId);
    } else if (t.classList.contains('bs-mv-unit')) {
      var key = t.getAttribute('data-key');
      var val = parseInt(t.value, 10) || 0;
      if (val < 0) val = 0;
      if (!modalState.moveState[key]) modalState.moveState[key] = { packages: 0, units: 0 };
      modalState.moveState[key].units = val;
      _renderMoveFoot(modalState, overlayId);
    }
  });

  // Event delegation: click events (buttons)
  document.getElementById(overlayId).addEventListener('click', function(e) {
    var t = e.target;
    if (t.id === overlayId + '-cancel') {
      document.getElementById(overlayId).remove();
    } else if (t.id === overlayId + '-submit') {
      _submitMoveStock(modalState, overlayId);
    }
  });

  // Close on backdrop click
  document.getElementById(overlayId).addEventListener('click', function(e) {
    if (e.target === this) this.remove();
  });

  // Fetch all stock for the selected parts + all locations
  var fetches = partIds.map(function(partId) {
    return fetchAllPages(apiUrl('/api/stock/?part=' + partId + '&in_stock=true&part_detail=true&location_detail=true'));
  });
  fetches.push(loadAllLocations());

  Promise.all(fetches)
    .then(function(results) {
      var locations = results.pop();
      modalState.locationCache = locations;
      var allItems = [];
      results.forEach(function(items) { allItems = allItems.concat(items); });
      if (allItems.length === 0) {
        showToast('No stock found for the selected parts', 'info');
        document.getElementById(overlayId).remove();
        return;
      }
      modalState.allStockItems = allItems;
      modalState.partPackageSizes = _computePackageSizes(allItems);
      modalState.stockGroups = _buildStockGroups(allItems, modalState.partPackageSizes);
      _initMoveState(modalState);
      modalState.loading = false;
      _renderMoveBody(modalState, overlayId);
      _renderMoveFoot(modalState, overlayId);
    })
    .catch(function(err) {
      showToast('Failed to load stock: ' + err.message, 'error');
      document.getElementById(overlayId).remove();
    });
}

/* -- helpers -- */

function _computePackageSizes(items) {
  var freq = {};
  items.forEach(function(item) {
    var qty = item.quantity || 0;
    if (qty <= 1) return;
    var part = item.part || (item.part_detail && item.part_detail.pk);
    if (!part) return;
    if (!freq[part]) freq[part] = {};
    freq[part][qty] = (freq[part][qty] || 0) + 1;
  });
  var sizes = {};
  Object.keys(freq).forEach(function(partStr) {
    var partPk = Number(partStr);
    var qtyMap = freq[partStr];
    var bestQty = 0, bestCount = 0;
    Object.keys(qtyMap).forEach(function(qtyStr) {
      var qty = Number(qtyStr);
      var count = qtyMap[qtyStr];
      if (count > bestCount || (count === bestCount && qty > bestQty)) {
        bestCount = count;
        bestQty = qty;
      }
    });
    if (bestQty > 0) sizes[partPk] = bestQty;
  });
  return sizes;
}

function _buildStockGroups(items, packageSizes) {
  var map = {};
  items.forEach(function(item) {
    var locPk = item.location || (item.location_detail && item.location_detail.pk) || null;
    var part = item.part || (item.part_detail && item.part_detail.pk);
    if (!part) return;
    var key = part + '_' + locPk;
    var pkgQty = packageSizes[part] || 0;
    var allocated = item.allocated || 0;
    var availableQty = (item.quantity || 0) - allocated;
    var isPkg = pkgQty > 0 && availableQty === pkgQty && allocated === 0;
    if (!map[key]) {
      map[key] = {
        partPk: part,
        partDetail: item.part_detail,
        locationPk: locPk,
        locationDetail: item.location_detail,
        packageQty: pkgQty,
        packageCount: 0,
        looseQty: 0,
        packageItems: [],
        looseItems: []
      };
    }
    var g = map[key];
    if (isPkg) {
      g.packageCount++;
      g.packageItems.push(item);
    } else {
      g.looseQty += availableQty;
      g.looseItems.push(item);
    }
  });
  return Object.keys(map).map(function(k) { return map[k]; });
}

function _initMoveState(state) {
  state.moveState = {};
  state.stockGroups.forEach(function(g) {
    state.moveState[g.partPk + '_' + g.locationPk] = { packages: 0, units: 0 };
  });
}

function _getPartName(state, partPk) {
  for (var i = 0; i < state.allStockItems.length; i++) {
    var d = state.allStockItems[i].part_detail;
    var p = state.allStockItems[i].part || (d && d.pk);
    if (p == partPk && d && d.name) return d.name;
  }
  return 'Part #' + partPk;
}

/* -- render -- */

function _renderMoveBody(state, overlayId) {
  var bodyEl = document.getElementById(overlayId + '-body');
  if (!bodyEl) return;
  if (state.loading) {
    bodyEl.innerHTML = '<div class="bs-loading"><span class="bs-spinner"></span> Loading stock data...</div>';
    return;
  }

  var html = '';

  // Selected parts summary
  html += '<div class="bs-field"><label>Selected Parts</label><ul class="bs-item-list">';
  state.partIds.forEach(function(partPk) {
    html += '<li><span>' + esc(_getPartName(state, partPk)) + '</span></li>';
  });
  html += '</ul></div>';

  // Source location filter
  html += '<div class="bs-field"><label>Source Location (filter)</label>' +
    '<select id="' + overlayId + '-source-loc">' +
    '<option value="">All locations</option>';
  state.locationCache.forEach(function(loc) {
    var sel = state.sourceLocation === loc.pk ? ' selected' : '';
    html += '<option value="' + loc.pk + '"' + sel + '>' + esc(loc.path || loc.name) + '</option>';
  });
  html += '</select></div>';

  var filtered = state.sourceLocation
    ? state.stockGroups.filter(function(g) { return g.locationPk === state.sourceLocation; })
    : state.stockGroups;

  if (state.sourceLocation && filtered.length === 0) {
    html += '<div class="bs-empty"><p>No stock found in the selected source location.</p></div>';
  } else if (state.stockGroups.length === 0) {
    html += '<div class="bs-empty"><p>No stock found for the selected parts.</p></div>';
  } else {
    html += '<div class="bs-table-wrap" style="margin-bottom:12px">' +
      '<table class="bs-table">' +
      '<thead><tr>' +
      '<th>Part</th><th>Location</th><th>Available Packages</th>' +
      '<th>Available Loose Units</th><th>Packages to Move</th><th>Units to Move</th>' +
      '</tr></thead><tbody>';
    state.stockGroups.forEach(function(g) {
      var key = g.partPk + '_' + g.locationPk;
      var willMove = !state.sourceLocation || g.locationPk === state.sourceLocation;
      var move = state.moveState[key] || { packages: 0, units: 0 };
      var maxPkgs = g.packageCount;
      var maxUnits = g.looseQty + (g.packageCount - move.packages) * g.packageQty;
      var opacity = willMove ? '' : ' style="opacity:0.4"';
      html += '<tr' + opacity + '>' +
        '<td>' + esc(_getPartName(state, g.partPk)) + '</td>' +
        '<td>' + (g.locationDetail ? esc(g.locationDetail.name) : '-') + '</td>' +
        '<td>' + (g.packageCount > 0 ? g.packageCount + ' &times; ' + g.packageQty : '-') + '</td>' +
        '<td>' + (g.looseQty > 0 ? g.looseQty : '-') + '</td>' +
        '<td>';
      if (willMove && maxPkgs > 0) {
        html += '<input type="number" class="bs-qty-input bs-mv-pkg" data-key="' + key + '" value="' + move.packages + '" min="0" max="' + maxPkgs + '" step="1" />';
      } else {
        html += '<span style="color:#aaa;font-size:13px">-</span>';
      }
      html += '</td><td>';
      if (willMove && maxUnits > 0) {
        html += '<input type="number" class="bs-qty-input bs-mv-unit" data-key="' + key + '" value="' + move.units + '" min="0" max="' + maxUnits + '" step="1" />';
      } else {
        html += '<span style="color:#aaa;font-size:13px">-</span>';
      }
      html += '</td></tr>';
    });
    html += '</tbody></table></div>';
  }

  // Destination location
  html += '<div class="bs-field"><label>Destination Location <span style="color:#c00">*</span></label>' +
    '<select id="' + overlayId + '-dest-loc">' +
    '<option value="">Select destination location...</option>';
  state.locationCache.forEach(function(loc) {
    var sel = state.destLocation === loc.pk ? ' selected' : '';
    html += '<option value="' + loc.pk + '"' + sel + '>' + esc(loc.path || loc.name) + '</option>';
  });
  html += '</select></div>';

  bodyEl.innerHTML = html;
}

function _renderMoveFoot(state, overlayId) {
  var footEl = document.getElementById(overlayId + '-foot');
  if (!footEl) return;
  var totalUnits = 0, activeCount = 0;
  state.stockGroups.forEach(function(g) {
    if (state.sourceLocation && g.locationPk !== state.sourceLocation) return;
    var key = g.partPk + '_' + g.locationPk;
    var move = state.moveState[key] || { packages: 0, units: 0 };
    var gu = (move.packages * g.packageQty) + move.units;
    if (gu > 0) { activeCount++; totalUnits += gu; }
  });
  var disabled = (!state.destLocation || totalUnits === 0) ? ' disabled' : '';
  var label = totalUnits > 0
    ? 'Move ' + totalUnits + ' unit(s) from ' + activeCount + ' location(s)'
    : 'Move Stock';
  footEl.innerHTML =
    '<button class="bs-btn bs-btn-secondary" id="' + overlayId + '-cancel">Cancel</button>' +
    '<button class="bs-btn bs-btn-primary" id="' + overlayId + '-submit"' + disabled + '>' + esc(label) + '</button>';
}

/* -- submit -- */

function _submitMoveStock(state, overlayId) {
  if (!state.destLocation) {
    showToast('Select a destination location', 'warn');
    return;
  }

  var transferItems = [];
  state.stockGroups.forEach(function(group) {
    if (state.sourceLocation && group.locationPk !== state.sourceLocation) return;
    var key = group.partPk + '_' + group.locationPk;
    var move = state.moveState[key];
    if (!move || (move.packages === 0 && move.units === 0)) return;

    // Allocate packages
    var pkgsRem = move.packages;
    for (var i = 0; i < group.packageItems.length && pkgsRem > 0; i++) {
      transferItems.push({ item: group.packageItems[i].pk, quantity: group.packageItems[i].quantity });
      pkgsRem--;
    }

    // Allocate loose units from loose items
    var unitsRem = move.units;
    for (var i = 0; i < group.looseItems.length && unitsRem > 0; i++) {
      var take = Math.min(unitsRem, (group.looseItems[i].quantity || 0) - (group.looseItems[i].allocated || 0));
      if (take > 0) { transferItems.push({ item: group.looseItems[i].pk, quantity: take }); unitsRem -= take; }
    }

    // Still need units? Split from remaining package items
    for (var i = 0; i < group.packageItems.length && unitsRem > 0; i++) {
      if (move.packages > 0 && i < move.packages) continue;
      var take = Math.min(unitsRem, group.packageItems[i].quantity || 0);
      if (take > 0) { transferItems.push({ item: group.packageItems[i].pk, quantity: take }); unitsRem -= take; }
    }
  });

  if (transferItems.length === 0) {
    showToast('Enter a quantity to move', 'warn');
    return;
  }

  state.submitting = true;
  var submitBtn = document.getElementById(overlayId + '-submit');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Moving...'; }

  apiFetch(apiUrl('/api/stock/transfer/'), {
    method: 'POST',
    body: { items: transferItems, location: state.destLocation }
  })
    .then(function() {
      var totalQty = 0;
      transferItems.forEach(function(i) { totalQty += i.quantity; });
      showToast(transferItems.length + ' stock item(s) (' + totalQty + ' units) moved successfully', 'success');
      document.getElementById(overlayId).remove();
    })
    .catch(function(err) {
      showToast('Move failed: ' + err.message, 'error');
      state.submitting = false;
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Move Stock'; }
    });
}

/* ================================================================== */
/*  MODAL: RECEIVE STOCK                                               */
/* ================================================================== */

function openReceiveModal() {
  var selected = getSelectedItems();
  if (selected.length === 0) {
    showToast('No items selected', 'warn');
    return;
  }

  // Extract part ID from selected items (only single part supported)
  var partId = null;
  for (var i = 0; i < selected.length; i++) {
    var item = selected[i];
    if (item.type === 'part' && item.part_pk) { partId = item.part_pk; break; }
    if (item.type === 'stockitem' && item.part_pk) { partId = item.part_pk; break; }
  }
  if (!partId) {
    showToast('Select a scanned part or stock item to receive', 'warn');
    return;
  }

  var modalState = {
    partId: partId,
    purchaseOrders: [],
    matchingLines: [],
    posWithMatchingPart: {},    // poPk -> true
    selectedPoPk: null,
    selectedLinePk: null,
    quantity: 0,
    destLocation: null,
    locationCache: [],
    loading: true,
    submitting: false
  };

  var overlayId = 'bs-rec-' + uid();
  var html =
    '<div class="bs-overlay" id="' + overlayId + '">' +
    '<div class="bs-modal" style="max-width:720px">' +
    '<div class="bs-modal-head">Receive Stock</div>' +
    '<div class="bs-modal-body" id="' + overlayId + '-body">' +
    '<div class="bs-loading"><span class="bs-spinner"></span> Loading purchase orders...</div>' +
    '</div>' +
    '<div class="bs-modal-foot" id="' + overlayId + '-foot">' +
    '<button class="bs-btn bs-btn-secondary" id="' + overlayId + '-cancel">Cancel</button>' +
    '<button class="bs-btn bs-btn-primary" id="' + overlayId + '-submit" disabled>Receive Stock</button>' +
    '</div>' +
    '</div>' +
    '</div>';

  document.body.insertAdjacentHTML('beforeend', html);

  // Event delegation: change events
  document.getElementById(overlayId).addEventListener('change', function(e) {
    var t = e.target;
    if (t.id === overlayId + '-po-select') {
      var v = t.value;
      modalState.selectedPoPk = v === '__none__' ? null : v;
      modalState.selectedLinePk = null;
      modalState.quantity = 0;
      _renderRecBody(modalState, overlayId);
      _renderRecFoot(modalState, overlayId);
    } else if (t.id === overlayId + '-rec-loc') {
      modalState.destLocation = t.value ? Number(t.value) : null;
      _renderRecFoot(modalState, overlayId);
    } else if (t.classList.contains('bs-rec-qty')) {
      modalState.quantity = parseFloat(t.value) || 0;
      _renderRecFoot(modalState, overlayId);
    }
  });

  // Event delegation: click events
  document.getElementById(overlayId).addEventListener('click', function(e) {
    var t = e.target;
    if (t.id === overlayId + '-cancel') {
      document.getElementById(overlayId).remove();
    } else if (t.id === overlayId + '-submit') {
      _submitReceiveStock(modalState, overlayId);
    } else if (t.classList.contains('bs-rec-line')) {
      var linePk = parseInt(t.getAttribute('data-pk'), 10);
      modalState.selectedLinePk = linePk;
      // Auto-fill remaining quantity
      for (var i = 0; i < modalState.matchingLines.length; i++) {
        if (modalState.matchingLines[i].pk === linePk) {
          var rem = Math.max(0, modalState.matchingLines[i].quantity - (modalState.matchingLines[i].received || 0));
          modalState.quantity = rem;
          break;
        }
      }
      _renderRecBody(modalState, overlayId);
      _renderRecFoot(modalState, overlayId);
    }
  });

  // Close on backdrop
  document.getElementById(overlayId).addEventListener('click', function(e) {
    if (e.target === this) this.remove();
  });

  // Fetch POs, matching lines, and locations in parallel
  var poPromise = fetchAllPages(apiUrl('/api/order/po/?outstanding=true&supplier_detail=true'));
  var linePromise = fetchAllPages(apiUrl('/api/order/po-line/?base_part=' + partId + '&order_status=20&part_detail=true&supplier_part_detail=true'));
  var locPromise = loadAllLocations();

  Promise.all([poPromise, linePromise, locPromise])
    .then(function(results) {
      var pos = results[0];
      var lines = results[1];
      var locs = results[2];

      // Build set of PO PKs that have a matching part line
      var matching = {};
      lines.forEach(function(l) { matching[l.order] = true; });

      // Sort POs: matching first, then by reference
      var poArray = pos.slice();
      poArray.sort(function(a, b) {
        var aM = matching[a.pk] ? 0 : 1;
        var bM = matching[b.pk] ? 0 : 1;
        if (aM !== bM) return aM - bM;
        return (a.reference || '').localeCompare(b.reference || '');
      });

      modalState.purchaseOrders = poArray;
      modalState.matchingLines = lines;
      modalState.posWithMatchingPart = matching;
      modalState.locationCache = locs;
      modalState.loading = false;
      _renderRecBody(modalState, overlayId);
      _renderRecFoot(modalState, overlayId);
    })
    .catch(function(err) {
      showToast('Failed to load purchase data: ' + err.message, 'error');
      document.getElementById(overlayId).remove();
    });
}

/* -- render -- */

function _renderRecBody(state, overlayId) {
  var bodyEl = document.getElementById(overlayId + '-body');
  if (!bodyEl) return;
  if (state.loading) {
    bodyEl.innerHTML = '<div class="bs-loading"><span class="bs-spinner"></span> Loading purchase orders...</div>';
    return;
  }

  var html = '';

  // PO dropdown
  html += '<div class="bs-field"><label>Purchase Order</label>' +
    '<select id="' + overlayId + '-po-select">' +
    '<option value="">Select a purchase order...</option>';
  state.purchaseOrders.forEach(function(po) {
    var hasPart = !!state.posWithMatchingPart[po.pk];
    var label = po.reference + ' — ' + (po.supplier_detail ? po.supplier_detail.name : po.supplier || '?');
    var sel = state.selectedPoPk === String(po.pk) ? ' selected' : '';
    var prefix = hasPart ? '● ' : '  ';
    html += '<option value="' + po.pk + '"' + sel + '>' + esc(prefix + label) + '</option>';
  });
  // "Receive without PO" option
  html += '<option value="__none__"' + (state.selectedPoPk === '__none__' ? ' selected' : '') + '>+ Receive without PO (add directly to stock)</option>';
  html += '</select></div>';

  if (state.purchaseOrders.length === 0) {
    html += '<div class="bs-empty"><p>No open purchase orders found.</p></div>';
  }

  // Show content based on selected PO
  if (state.selectedPoPk && state.selectedPoPk !== '__none__') {
    var selectedPo = null;
    for (var i = 0; i < state.purchaseOrders.length; i++) {
      if (String(state.purchaseOrders[i].pk) === state.selectedPoPk) {
        selectedPo = state.purchaseOrders[i];
        break;
      }
    }

    if (selectedPo) {
      // PO status not placed
      if (selectedPo.status !== 20) {
        html += '<div style="margin:8px 0;padding:8px 12px;background:#fff3e0;border-radius:6px;font-size:13px;color:#e65100">' +
          'This order is not yet placed. Only placed orders can receive stock.</div>';
      }

      // Placed PO with matching line items
      if (selectedPo.status === 20) {
        var linesForPo = [];
        for (var i = 0; i < state.matchingLines.length; i++) {
          if (String(state.matchingLines[i].order) === state.selectedPoPk) {
            linesForPo.push(state.matchingLines[i]);
          }
        }

        if (linesForPo.length > 0) {
          html += '<div style="margin:8px 0;font-size:13px;font-weight:600">Line Items</div>' +
            '<div class="bs-table-wrap" style="margin-bottom:12px">' +
            '<table class="bs-table">' +
            '<thead><tr><th>Line</th><th>Expected</th><th>Received</th><th>Remaining</th></tr></thead><tbody>';
          for (var i = 0; i < linesForPo.length; i++) {
            var line = linesForPo[i];
            var rem = Math.max(0, line.quantity - (line.received || 0));
            var isSelected = state.selectedLinePk === line.pk;
            var bgStyle = isSelected ? ' style="background:#e3f2fd;cursor:pointer"' : ' style="cursor:pointer"';
            html += '<tr class="bs-rec-line" data-pk="' + line.pk + '"' + bgStyle + '>' +
              '<td><span class="bs-badge" style="background:' + (isSelected ? '#1976d2;color:#fff' : '#e0e0e0;color:#333') + '">#' + line.pk + '</span></td>' +
              '<td>' + (line.quantity || 0) + '</td>' +
              '<td>' + (line.received || 0) + '</td>' +
              '<td><strong>' + (rem > 0 ? rem : '<span style="color:#aaa">0</span>') + '</strong></td>' +
              '</tr>';
          }
          html += '</tbody></table></div>';
        } else {
          // PO has no matching lines for this part
          html += '<div style="margin:8px 0;padding:8px 12px;background:#e3f2fd;border-radius:6px;font-size:13px;color:#1565c0">' +
            'This part is not listed on this purchase order. Stock will be added directly to inventory, linked to this PO.</div>';
        }
      }
    }
  } else if (state.selectedPoPk === '__none__') {
    // Receive without PO
    html += '<div style="margin:8px 0;padding:8px 12px;background:#e3f2fd;border-radius:6px;font-size:13px;color:#1565c0">' +
      'Stock will be added directly to inventory without linking to a purchase order.</div>';
  }

  // Quantity and location fields (show when receiving against placed PO or without PO)
  var showFields = state.selectedPoPk && (state.selectedPoPk === '__none__' || (function() {
    for (var i = 0; i < state.purchaseOrders.length; i++) {
      if (String(state.purchaseOrders[i].pk) === state.selectedPoPk) {
        return state.purchaseOrders[i].status === 20;
      }
    }
    return false;
  })());

  if (showFields) {
    html += '<div class="bs-field-row" style="margin-top:12px">';

    // Quantity
    var remainingHint = '';
    if (state.selectedLinePk) {
      for (var i = 0; i < state.matchingLines.length; i++) {
        if (state.matchingLines[i].pk === state.selectedLinePk) {
          var rem = Math.max(0, state.matchingLines[i].quantity - (state.matchingLines[i].received || 0));
          remainingHint = '<div style="font-size:11px;color:#888;margin-bottom:2px">Remaining on order: ' + rem + '</div>';
          break;
        }
      }
    }
    html += '<div class="bs-field" style="flex:0 0 160px">' +
      '<label>Quantity to Receive</label>' +
      remainingHint +
      '<input type="number" class="bs-rec-qty" value="' + (state.quantity || 0) + '" min="0" step="1" style="width:100%" />' +
      '</div>';

    // Destination location
    html += '<div class="bs-field">' +
      '<label>Destination Location</label>' +
      '<select id="' + overlayId + '-rec-loc">' +
      '<option value="">Select location...</option>';
    state.locationCache.forEach(function(loc) {
      var sel = state.destLocation === loc.pk ? ' selected' : '';
      html += '<option value="' + loc.pk + '"' + sel + '>' + esc(loc.path || loc.name) + '</option>';
    });
    html += '</select></div>';

    html += '</div>'; // end field-row
  }

  bodyEl.innerHTML = html;
}

function _renderRecFoot(state, overlayId) {
  var footEl = document.getElementById(overlayId + '-foot');
  if (!footEl) return;

  var canSubmit = state.quantity > 0;
  var btnLabel = 'Receive Stock';

  if (state.selectedLinePk) {
    btnLabel = 'Receive ' + state.quantity + ' unit(s)';
  } else if (state.selectedPoPk && state.selectedPoPk !== '__none__') {
    btnLabel = 'Add ' + state.quantity + ' unit(s) (unexpected)';
  } else if (state.selectedPoPk === '__none__') {
    btnLabel = 'Add ' + state.quantity + ' unit(s) to stock';
  }

  // Check if selected PO is placed (if one is selected)
  var poPlaced = true;
  if (state.selectedPoPk && state.selectedPoPk !== '__none__') {
    poPlaced = false;
    for (var i = 0; i < state.purchaseOrders.length; i++) {
      if (String(state.purchaseOrders[i].pk) === state.selectedPoPk) {
        poPlaced = state.purchaseOrders[i].status === 20;
        break;
      }
    }
  }

  var disabled = (!canSubmit || !poPlaced) ? ' disabled' : '';

  footEl.innerHTML =
    '<button class="bs-btn bs-btn-secondary" id="' + overlayId + '-cancel">Cancel</button>' +
    '<button class="bs-btn bs-btn-primary" id="' + overlayId + '-submit"' + disabled + '>' + esc(btnLabel) + '</button>';
}

/* -- submit -- */

function _submitReceiveStock(state, overlayId) {
  if (state.quantity <= 0) {
    showToast('Enter a positive quantity to receive', 'warn');
    return;
  }

  state.submitting = true;
  var submitBtn = document.getElementById(overlayId + '-submit');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting...'; }

  var doReceive = function(url, payload) {
    apiFetch(apiUrl(url), { method: 'POST', body: payload })
      .then(function() {
        var msg = state.selectedLinePk
          ? state.quantity + ' unit(s) received successfully'
          : state.quantity + ' unit(s) added to inventory';
        showToast(msg, 'success');
        document.getElementById(overlayId).remove();
      })
      .catch(function(err) {
        showToast('Receive failed: ' + err.message, 'error');
        state.submitting = false;
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Receive Stock'; }
      });
  };

  if (state.selectedLinePk) {
    // Receive against a specific PO line
    // Check for pack_quantity on the supplier part to optionally split into packages
    var line = null;
    for (var i = 0; i < state.matchingLines.length; i++) {
      if (state.matchingLines[i].pk === state.selectedLinePk) {
        line = state.matchingLines[i];
        break;
      }
    }
    var totalQty = state.quantity;
    var packSize = 1;
    if (line && line.supplier_part_detail) {
      var rawPack = line.supplier_part_detail.pack_quantity_native || line.supplier_part_detail.pack_quantity;
      if (rawPack && Number(rawPack) > 1) {
        packSize = Number(rawPack);
      }
    }

    if (packSize > 1 && totalQty >= packSize) {
      // Split into package-sized chunks, sent sequentially
      var fullPackages = Math.floor(totalQty / packSize);
      var remainder = totalQty % packSize;
      var recUrl = '/api/order/po/' + state.selectedPoPk + '/receive/';

      function makeRecCall(qty) {
        var payload = { items: [{ line_item: state.selectedLinePk, quantity: qty }] };
        if (state.destLocation) {
          payload.items[0].location = state.destLocation;
        }
        return apiFetch(apiUrl(recUrl), { method: 'POST', body: payload });
      }

      var chain = Promise.resolve();
      for (var p = 0; p < fullPackages; p++) {
        chain = chain.then(makeRecCall.bind(null, packSize));
      }
      if (remainder > 0) {
        chain = chain.then(makeRecCall.bind(null, remainder));
      }
      chain
        .then(function() {
          showToast(state.quantity + ' unit(s) received in ' +
            (fullPackages + (remainder > 0 ? 1 : 0)) + ' shipment(s)', 'success');
          document.getElementById(overlayId).remove();
        })
        .catch(function(err) {
          showToast('Receive failed: ' + err.message, 'error');
          state.submitting = false;
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Receive Stock'; }
        });
    } else {
      var itemsPayload = [{ line_item: state.selectedLinePk, quantity: state.quantity }];
      if (state.destLocation) {
        itemsPayload[0].location = state.destLocation;
      }
      doReceive('/api/order/po/' + state.selectedPoPk + '/receive/', { items: itemsPayload });
    }
  } else {
    // Add stock directly
    var payload = { part: state.partId, quantity: state.quantity };
    if (state.destLocation) payload.location = state.destLocation;
    if (state.selectedPoPk && state.selectedPoPk !== '__none__') {
      payload.purchase_order = parseInt(state.selectedPoPk, 10);
      payload.notes = 'Unexpected receipt — not on original PO line items';
    }
    doReceive('/api/stock/', payload);
  }
}

/* ================================================================== */
/*  MODAL: RECONCILE STOCK                                             */
/* ================================================================== */

function openReconcileModal() {
  var selected = getSelectedItems();
  if (selected.length === 0) {
    showToast('No items selected', 'warn');
    return;
  }

  // Extract part ID from selected items
  var partId = null;
  var partName = '';
  for (var i = 0; i < selected.length; i++) {
    var item = selected[i];
    if (item.type === 'part' && item.part_pk) { partId = item.part_pk; partName = item.part_name; break; }
    if (item.type === 'stockitem' && item.part_pk) { partId = item.part_pk; partName = item.part_name; break; }
  }
  if (!partId) {
    showToast('Select a scanned part or stock item to reconcile', 'warn');
    return;
  }

  var modalState = {
    partId: partId,
    partName: partName,
    selectedLocationPk: null,
    destLocationPk: null,
    reconcileToDifferent: false,
    packageSize: 1,
    systemPackages: 0,
    systemLoose: 0,
    brokenPackageCount: 0,
    brokenAllocatedUnits: 0,
    packageItems: [],
    looseItems: [],
    physicalPackages: 0,
    physicalLoose: 0,
    locationCache: [],
    lostStolenPk: null,
    dataLoaded: false,
    loading: true,
    submitting: false
  };

  var overlayId = 'bs-rcn-' + uid();
  var html =
    '<div class="bs-overlay" id="' + overlayId + '">' +
    '<div class="bs-modal" style="max-width:700px">' +
    '<div class="bs-modal-head">Reconcile Stock &mdash; ' + esc(partName) + '</div>' +
    '<div class="bs-modal-body" id="' + overlayId + '-body">' +
    '<div class="bs-loading"><span class="bs-spinner"></span> Loading...</div>' +
    '</div>' +
    '<div class="bs-modal-foot" id="' + overlayId + '-foot">' +
    '<button class="bs-btn bs-btn-secondary" id="' + overlayId + '-cancel">Cancel</button>' +
    '<button class="bs-btn bs-btn-primary" id="' + overlayId + '-submit" disabled>Reconcile Stock</button>' +
    '</div>' +
    '</div>' +
    '</div>';

  document.body.insertAdjacentHTML('beforeend', html);

  // Fetch/create Lost/Stolen location
  _ensureLostStolen()
    .then(function(pk) {
      modalState.lostStolenPk = pk;
    })
    .catch(function(err) {
      showToast('Failed to setup Lost/Stolen location: ' + err.message, 'error');
    });

  // Load all locations
  loadAllLocations()
    .then(function(locs) {
      modalState.locationCache = locs;
      modalState.loading = false;
      _renderReconcileBody(modalState, overlayId);
      _renderReconcileFoot(modalState, overlayId);
    })
    .catch(function(err) {
      showToast('Failed to load locations: ' + err.message, 'error');
      document.getElementById(overlayId).remove();
    });

  // Event delegation: change events
  document.getElementById(overlayId).addEventListener('change', function(e) {
    var t = e.target;
    if (t.id === overlayId + '-reconcile-loc') {
      modalState.selectedLocationPk = t.value ? Number(t.value) : null;
      if (modalState.selectedLocationPk) {
        modalState.dataLoaded = false;
        _renderReconcileBody(modalState, overlayId);
        _fetchReconcileData(modalState, overlayId);
      } else {
        modalState.dataLoaded = false;
        modalState.physicalPackages = 0;
        modalState.physicalLoose = 0;
        _renderReconcileBody(modalState, overlayId);
        _renderReconcileFoot(modalState, overlayId);
      }
    } else if (t.id === overlayId + '-reconcile-dest-loc') {
      modalState.destLocationPk = t.value ? Number(t.value) : null;
      _updateReconcileVariance(modalState, overlayId);
      _renderReconcileFoot(modalState, overlayId);
    } else if (t.id === overlayId + '-reconcile-dest-cb') {
      modalState.reconcileToDifferent = t.checked;
      _renderReconcileBody(modalState, overlayId);
      _renderReconcileFoot(modalState, overlayId);
    } else if (t.classList.contains('bs-reconcile-pkg-input')) {
      modalState.physicalPackages = parseInt(t.value, 10) || 0;
      if (modalState.physicalPackages < 0) modalState.physicalPackages = 0;
      _updateReconcileVariance(modalState, overlayId);
      _renderReconcileFoot(modalState, overlayId);
    } else if (t.classList.contains('bs-reconcile-loose-input')) {
      modalState.physicalLoose = parseInt(t.value, 10) || 0;
      if (modalState.physicalLoose < 0) modalState.physicalLoose = 0;
      _updateReconcileVariance(modalState, overlayId);
      _renderReconcileFoot(modalState, overlayId);
    }
  });

  // Event delegation: click events
  document.getElementById(overlayId).addEventListener('click', function(e) {
    var t = e.target;
    if (t.id === overlayId + '-cancel') {
      document.getElementById(overlayId).remove();
    } else if (t.id === overlayId + '-submit') {
      _submitReconcileStock(modalState, overlayId);
    }
  });

  // Close on backdrop
  document.getElementById(overlayId).addEventListener('click', function(e) {
    if (e.target === this) this.remove();
  });
}

/* -- helpers -- */

function _ensureLostStolen() {
  return apiFetch(apiUrl('/api/stock/location/?search=Lost/Stolen'))
    .then(function(res) {
      var results = res.results || res || [];
      if (Array.isArray(results) && results.length > 0) {
        return results[0].pk;
      }
      return apiFetch(apiUrl('/api/stock/location/'), {
        method: 'POST',
        body: { name: 'Lost/Stolen', description: 'Auto-created for stock reconciliation' }
      }).then(function(newLoc) {
        return newLoc.pk;
      });
    });
}

function _fetchReconcileData(state, overlayId) {
  var supplierPromise = apiFetch(apiUrl('/api/company/part/?part=' + state.partId + '&supplier_detail=true'));
  var stockPromise = fetchAllPages(apiUrl('/api/stock/?part=' + state.partId + '&location=' + state.selectedLocationPk + '&in_stock=true&part_detail=true&location_detail=true'));

  Promise.all([supplierPromise, stockPromise])
    .then(function(results) {
      var supplierData = results[0];
      var stockItems = results[1];

      // Determine package size from supplier parts
      var packageSize = 1;
      var supplierParts = supplierData.results || supplierData || [];
      if (!Array.isArray(supplierParts)) supplierParts = [];
      for (var i = 0; i < supplierParts.length; i++) {
        var sp = supplierParts[i];
        if (sp.pack_quantity && Number(sp.pack_quantity) > 1) {
          packageSize = Number(sp.pack_quantity);
          break;
        }
      }
      state.packageSize = packageSize;

      // Categorize stock items
      var packageItems = [];
      var looseItems = [];
      var systemPackages = 0;
      var systemLoose = 0;
      var brokenPackageCount = 0;
      var brokenAllocatedUnits = 0;

      for (var i = 0; i < stockItems.length; i++) {
        var item = stockItems[i];
        var qty = item.quantity || 0;
        var allocated = item.allocated || 0;
        var availableQty = qty - allocated;
        if (packageSize > 1 && availableQty === packageSize && allocated === 0) {
          packageItems.push(item);
          systemPackages++;
        } else {
          looseItems.push(item);
          systemLoose += availableQty;
          if (packageSize > 1 && qty === packageSize && allocated > 0) {
            brokenPackageCount++;
            brokenAllocatedUnits += allocated;
          }
        }
      }

      state.packageItems = packageItems;
      state.looseItems = looseItems;
      state.systemPackages = systemPackages;
      state.systemLoose = systemLoose;
      state.brokenPackageCount = brokenPackageCount;
      state.brokenAllocatedUnits = brokenAllocatedUnits;
      state.physicalPackages = 0;
      state.physicalLoose = 0;
      state.dataLoaded = true;

      _renderReconcileBody(state, overlayId);
      _renderReconcileFoot(state, overlayId);
    })
    .catch(function(err) {
      showToast('Failed to fetch reconciliation data: ' + err.message, 'error');
      state.dataLoaded = false;
      _renderReconcileBody(state, overlayId);
    });
}

function _getLocName(state, pk) {
  for (var i = 0; i < state.locationCache.length; i++) {
    if (state.locationCache[i].pk === pk) {
      return state.locationCache[i].name || state.locationCache[i].path || '';
    }
  }
  return '';
}

/* -- variance -- */

function _ensureVarianceStyles() {
  if (!document.getElementById('bs-rcn-variance-styles')) {
    var s = document.createElement('style');
    s.id = 'bs-rcn-variance-styles';
    s.textContent =
      '.bs-rcn-surplus{color:#2e7d32;font-weight:600}' +
      '.bs-rcn-shortfall{color:#c62828;font-weight:600}' +
      '.bs-rcn-neutral{color:#888;font-size:13px}';
    document.head.appendChild(s);
  }
}

function _buildReconcileVarianceHtml(state) {
  _ensureVarianceStyles();

  if (!state.dataLoaded) return '';

  var pkgDiff = state.physicalPackages - state.systemPackages;
  var looseDiff = state.physicalLoose - state.systemLoose;

  // Determine effective destination for display
  var effDestName = '';
  if (state.reconcileToDifferent && state.destLocationPk) {
    effDestName = _getLocName(state, state.destLocationPk) || 'selected destination';
  } else if (state.selectedLocationPk) {
    effDestName = _getLocName(state, state.selectedLocationPk) || 'current location';
  }

  var lines = [];

  if (pkgDiff > 0) {
    lines.push({
      html: '+' + pkgDiff + ' package' + (pkgDiff !== 1 ? 's' : '') +
        ' → create ' + pkgDiff + ' new stock item' + (pkgDiff !== 1 ? 's' : '') +
        ' (' + state.packageSize + ' unit' + (state.packageSize !== 1 ? 's' : '') + ' each) in ' + esc(effDestName),
      cls: 'bs-rcn-surplus'
    });
  } else if (pkgDiff < 0) {
    var absPkg = -pkgDiff;
    lines.push({
      html: pkgDiff + ' package' + (absPkg !== 1 ? 's' : '') +
        ' → move ' + absPkg + ' package' + (absPkg !== 1 ? 's' : '') +
        ' to Lost/Stolen',
      cls: 'bs-rcn-shortfall'
    });
  }

  if (looseDiff > 0) {
    lines.push({
      html: '+' + looseDiff + ' loose → create ' + looseDiff + ' new loose unit' + (looseDiff !== 1 ? 's' : '') +
        ' in ' + esc(effDestName),
      cls: 'bs-rcn-surplus'
    });
  } else if (looseDiff < 0) {
    var absLoose = -looseDiff;
    lines.push({
      html: looseDiff + ' loose → move ' + absLoose + ' unit' + (absLoose !== 1 ? 's' : '') +
        ' to Lost/Stolen',
      cls: 'bs-rcn-shortfall'
    });
  }

  if (lines.length === 0) {
    return '<div class="bs-rcn-neutral">No variance — stock counts match.</div>';
  }

  var html = '';
  for (var i = 0; i < lines.length; i++) {
    html += '<div class="' + lines[i].cls + '" style="font-size:13px;margin-bottom:2px;padding:2px 0">' + lines[i].html + '</div>';
  }
  return html;
}

function _updateReconcileVariance(state, overlayId) {
  var container = document.getElementById(overlayId + '-variance');
  if (container) {
    container.innerHTML = '<div style="font-size:14px;font-weight:600;margin-bottom:6px">Variance:</div>' +
      _buildReconcileVarianceHtml(state);
  }
}

/* -- render body -- */

function _renderReconcileBody(state, overlayId) {
  var bodyEl = document.getElementById(overlayId + '-body');
  if (!bodyEl) return;
  if (state.loading) {
    bodyEl.innerHTML = '<div class="bs-loading"><span class="bs-spinner"></span> Loading locations...</div>';
    return;
  }

  var html = '';

  // Location selector
  html += '<div class="bs-field"><label>Which location are you reconciling? <span style="color:#c00">*</span></label>' +
    '<select id="' + overlayId + '-reconcile-loc">' +
    '<option value="">Select location...</option>';
  for (var i = 0; i < state.locationCache.length; i++) {
    var loc = state.locationCache[i];
    var sel = state.selectedLocationPk === loc.pk ? ' selected' : '';
    html += '<option value="' + loc.pk + '"' + sel + '>' + esc(loc.path || loc.name) + '</option>';
  }
  html += '</select></div>';

  if (!state.selectedLocationPk) {
    html += '<div class="bs-empty" style="margin-top:12px"><p>Select a location to load stock counts for reconciliation.</p></div>';
    bodyEl.innerHTML = html;
    return;
  }

  if (!state.dataLoaded) {
    html += '<div class="bs-loading" style="margin-top:12px"><span class="bs-spinner"></span> Fetching stock and supplier data...</div>';
    bodyEl.innerHTML = html;
    return;
  }

  // Stock reconciliation table
  var labelPkg = state.packageSize > 1
    ? 'Packages (&times;' + state.packageSize + ')'
    : 'Packages';
  var systemPkgUnits = state.systemPackages * state.packageSize;

  html += '<div style="margin-top:16px;margin-bottom:4px;font-weight:600;font-size:14px">Stock Counts</div>';
  html += '<div class="bs-table-wrap">' +
    '<table class="bs-table">' +
    '<thead><tr><th></th><th>System Count</th><th>Physical Count</th></tr></thead><tbody>' +
    '<tr>' +
    '<td style="font-weight:600">' + labelPkg + '</td>' +
    '<td>' + state.systemPackages +
      (state.packageSize > 1 ? ' (' + systemPkgUnits + ' unit' + (systemPkgUnits !== 1 ? 's' : '') + ')' : '') +
    '</td>' +
    '<td><input type="number" class="bs-reconcile-pkg-input bs-qty-input" value="' + state.physicalPackages + '" min="0" step="1" /></td>' +
    '</tr>' +
    '<tr>' +
    '<td style="font-weight:600">Loose units</td>' +
    '<td>' + state.systemLoose + '</td>' +
    '<td><input type="number" class="bs-reconcile-loose-input bs-qty-input" value="' + state.physicalLoose + '" min="0" step="1" /></td>' +
    '</tr>' +
    '</tbody></table></div>';

  // Broken packages note
  if (state.brokenPackageCount && state.brokenPackageCount > 0) {
    html += '<div style="margin-top:6px;font-size:12px;color:#888">(' +
      state.brokenPackageCount + ' package' + (state.brokenPackageCount !== 1 ? 's' : '') +
      ' opened &mdash; ' + state.brokenAllocatedUnits + ' unit' + (state.brokenAllocatedUnits !== 1 ? 's' : '') +
      ' allocated)</div>';
  }

  // Destination location checkbox
  html += '<div style="margin-top:14px">' +
    '<label style="display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer">' +
    '<input type="checkbox" id="' + overlayId + '-reconcile-dest-cb"' +
    (state.reconcileToDifferent ? ' checked' : '') + ' /> ' +
    'Reconcile to a different location</label></div>';

  if (state.reconcileToDifferent) {
    html += '<div class="bs-field" style="margin-top:8px"><label>Destination Location <span style="color:#c00">*</span></label>' +
      '<select id="' + overlayId + '-reconcile-dest-loc">' +
      '<option value="">Select destination location...</option>';
    for (var i = 0; i < state.locationCache.length; i++) {
      var loc = state.locationCache[i];
      if (loc.pk === state.lostStolenPk) continue;
      var sel = state.destLocationPk === loc.pk ? ' selected' : '';
      html += '<option value="' + loc.pk + '"' + sel + '>' + esc(loc.path || loc.name) + '</option>';
    }
    html += '</select></div>';
  }

  // Variance
  html += '<div id="' + overlayId + '-variance" style="margin-top:12px;padding:12px 14px;background:#f9f9f9;border:1px solid #e0e0e0;border-radius:6px">' +
    '<div style="font-size:14px;font-weight:600;margin-bottom:6px">Variance:</div>' +
    _buildReconcileVarianceHtml(state) +
    '</div>';

  bodyEl.innerHTML = html;
}

function _renderReconcileFoot(state, overlayId) {
  var footEl = document.getElementById(overlayId + '-foot');
  if (!footEl) return;

  var hasVariance = (state.physicalPackages !== state.systemPackages) ||
                    (state.physicalLoose !== state.systemLoose);
  var destOk = !state.reconcileToDifferent || !!state.destLocationPk;
  var disabled = (!state.dataLoaded || !hasVariance || !destOk) ? ' disabled' : '';

  footEl.innerHTML =
    '<button class="bs-btn bs-btn-secondary" id="' + overlayId + '-cancel">Cancel</button>' +
    '<button class="bs-btn bs-btn-primary" id="' + overlayId + '-submit"' + disabled + '>Reconcile Stock</button>';
}

/* -- compute actions -- */

function _computeReconcileActions(state, destPk) {
  var surplusCreates = [];
  var lsTransfer = [];
  var destTransfer = [];
  var locPk = state.selectedLocationPk;
  var destDiff = destPk !== locPk;

  // ---- Package operations ----
  var pkgShortfall = Math.max(0, state.systemPackages - state.physicalPackages);
  var pkgSurplus = Math.max(0, state.physicalPackages - state.systemPackages);

  // Create surplus packages
  for (var i = 0; i < pkgSurplus; i++) {
    surplusCreates.push({
      part: state.partId,
      quantity: state.packageSize,
      location: destPk
    });
  }

  // Package items: shortfall -> LS, remaining -> dest (if different)
  var pkgUsed = 0;
  for (var i = 0; i < state.packageItems.length; i++) {
    if (pkgUsed < pkgShortfall) {
      lsTransfer.push({ item: state.packageItems[i].pk, quantity: state.packageSize });
      pkgUsed++;
    } else if (destDiff) {
      destTransfer.push({ item: state.packageItems[i].pk, quantity: state.packageSize });
    }
  }

  // ---- Loose operations ----
  var looseShortfall = Math.max(0, state.systemLoose - state.physicalLoose);
  var looseSurplus = Math.max(0, state.physicalLoose - state.systemLoose);

  // Create surplus loose
  if (looseSurplus > 0) {
    surplusCreates.push({
      part: state.partId,
      quantity: looseSurplus,
      location: destPk
    });
  }

  // Loose items: shortfall -> LS, remaining -> dest (if different)
  var lsLooseRemaining = looseShortfall;
  for (var i = 0; i < state.looseItems.length; i++) {
    var item = state.looseItems[i];
    var qty = (item.quantity || 0) - (item.allocated || 0);

    if (lsLooseRemaining > 0) {
      var take = Math.min(lsLooseRemaining, qty);
      if (take > 0) {
        lsTransfer.push({ item: item.pk, quantity: take });
        lsLooseRemaining -= take;
        // If dest differs and there's leftover on this item, transfer remainder
        if (destDiff && qty > take) {
          destTransfer.push({ item: item.pk, quantity: qty - take });
        }
      }
    } else if (destDiff) {
      destTransfer.push({ item: item.pk, quantity: qty });
    }
  }

  return {
    surplusCreates: surplusCreates,
    lsTransfer: lsTransfer,
    destTransfer: destTransfer
  };
}

/* -- submit -- */

function _submitReconcileStock(state, overlayId) {
  var destPk = (state.reconcileToDifferent && state.destLocationPk)
    ? state.destLocationPk
    : state.selectedLocationPk;

  if (!destPk) {
    showToast('No destination location selected', 'warn');
    return;
  }
  if (!state.lostStolenPk) {
    showToast('Lost/Stolen location not available', 'error');
    return;
  }

  // If reconciling to a different location, validate it already has stock of this part
  if (state.reconcileToDifferent && state.destLocationPk && state.destLocationPk !== state.selectedLocationPk) {
    var submitBtnPre = document.getElementById(overlayId + '-submit');
    if (submitBtnPre) { submitBtnPre.disabled = true; submitBtnPre.textContent = 'Checking destination...'; }

    apiFetch(apiUrl('/api/stock/?part=' + state.partId + '&location=' + state.destLocationPk + '&in_stock=true'))
      .then(function(res) {
        var destCount = (res && res.count !== undefined) ? res.count : (Array.isArray(res) ? res.length : 0);
        if (destCount === 0) {
          var destName = _getLocName(state, state.destLocationPk) || 'the selected location';
          showToast('Cannot reconcile to ' + destName + ' — no existing stock of ' + state.partName + ' found there. Use Add Stock instead.', 'warn');
          if (submitBtnPre) { submitBtnPre.disabled = false; submitBtnPre.textContent = 'Reconcile Stock'; }
          return;
        }
        // Destination has stock — proceed
        _doSubmitReconcile(state, overlayId, destPk);
      })
      .catch(function(err) {
        showToast('Failed to check destination: ' + (err.message || err), 'error');
        if (submitBtnPre) { submitBtnPre.disabled = false; submitBtnPre.textContent = 'Reconcile Stock'; }
      });
    return;
  }

  _doSubmitReconcile(state, overlayId, destPk);
}

function _doSubmitReconcile(state, overlayId, destPk) {
  var actions = _computeReconcileActions(state, destPk);

  if (actions.surplusCreates.length === 0 && actions.lsTransfer.length === 0 && actions.destTransfer.length === 0) {
    showToast('Nothing to reconcile — counts already match', 'info');
    return;
  }

  state.submitting = true;
  var submitBtn = document.getElementById(overlayId + '-submit');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Reconciling...'; }

  // Phase 1: Create surplus stock + transfer shortfall to Lost/Stolen (parallel)
  var phase1 = [];

  // Create surplus items
  for (var i = 0; i < actions.surplusCreates.length; i++) {
    phase1.push(apiFetch(apiUrl('/api/stock/'), {
      method: 'POST',
      body: actions.surplusCreates[i]
    }));
  }

  // Transfer to Lost/Stolen
  if (actions.lsTransfer.length > 0) {
    phase1.push(apiFetch(apiUrl('/api/stock/transfer/'), {
      method: 'POST',
      body: { items: actions.lsTransfer, location: state.lostStolenPk, notes: 'Reconciliation shortfall' }
    }));
  }

  Promise.all(phase1)
    .then(function() {
      // Phase 2: Transfer remaining stock to destination (if different)
      if (actions.destTransfer.length > 0) {
        return apiFetch(apiUrl('/api/stock/transfer/'), {
          method: 'POST',
          body: { items: actions.destTransfer, location: destPk }
        });
      }
    })
    .then(function() {
      var totalCreated = actions.surplusCreates.length;
      var totalTransferred = actions.lsTransfer.length + actions.destTransfer.length;
      var parts = [];
      if (totalCreated > 0) parts.push(totalCreated + ' item' + (totalCreated !== 1 ? 's' : '') + ' created');
      if (totalTransferred > 0) parts.push(totalTransferred + ' transfer' + (totalTransferred !== 1 ? 's' : '') + ' completed');
      showToast('Reconciliation complete: ' + parts.join(', '), 'success');
      document.getElementById(overlayId).remove();
    })
    .catch(function(err) {
      showToast('Reconciliation failed: ' + err.message, 'error');
      state.submitting = false;
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Reconcile Stock'; }
    });
}

/* ================================================================== */
/*  LOCATION HELPERS                                                   */
/* ================================================================== */
function loadLocationsIntoSelect(selectId) {
  var sel = document.getElementById(selectId);
  if (!sel) return;

  fetchAllPages(apiUrl('/api/stock/location/'))
    .then(function (locs) {
      sel.innerHTML = '<option value="">Select location…</option>';
      locs.forEach(function (loc) {
        var opt = document.createElement('option');
        opt.value = loc.pk;
        opt.textContent = loc.path || loc.name || 'Location #' + loc.pk;
        sel.appendChild(opt);
      });
      // If there's only one location, auto-select it
      if (locs.length === 1) {
        sel.value = locs[0].pk;
      }
    })
    .catch(function (err) {
      sel.innerHTML = '<option value="">Failed to load locations</option>';
      showToast('Failed to load locations', 'error');
    });
}

function loadAllLocations() {
  return fetchAllPages(apiUrl('/api/stock/location/'));
}

/* ================================================================== */
/*  ENTRY POINT                                                        */
/* ================================================================== */
function initBulkScan(containerId) {
  var el = document.getElementById(containerId);
  if (!el) {
    console.error('initBulkScan: container #' + containerId + ' not found');
    return;
  }
  state.rootEl = el;
  state.container = containerId;

  // If there are persisted items from a previous session, show them
  render();

  // Focus the scanner input after render
  var input = document.getElementById('bs-scanner-input');
  if (input) input.focus();
}

/* Export for external consumption */
if (typeof window !== 'undefined') {
  window.initBulkScan = initBulkScan;
}

/**
 * ES module export for InvenTree RemoteComponent.
 * Called with (element, context) — the legacy 2-arg pattern.
 */
export function renderPage(element, context) {
  state.rootEl = element;
  state.container = element.id || 'bulk-scan-root';

  // Store the InvenTree API client from context if available
  if (context && context.api) {
    state.inventreeApi = context.api;
  }

  // Store user info
  if (context && context.user) {
    state.user = context.user;
  }

  render();
}
