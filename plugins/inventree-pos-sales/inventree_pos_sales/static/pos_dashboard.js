/* POS Sales — Terminal Management Dashboard
 *
 * Renders a full terminal-management page with CRUD operations,
 * location/customer pickers, and webhook reference.
 *
 * Exports:
 *   renderPage(element, context)   — full-page terminal manager
 *   renderPosDashboard(context)    — compact dashboard widget (legacy)
 */

/* ──────────────────────────────────────────────── Utility helpers ─── */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function csrfToken() {
  var m = document.cookie.match(/csrftoken=([a-zA-Z0-9\-]+)/);
  return m ? m[1] : '';
}

async function apiFetch(url, opts) {
  opts = opts || {};
  opts.headers = opts.headers || {};
  opts.headers['X-CSRFToken'] = csrfToken();
  opts.headers['Accept'] = 'application/json';
  if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
    opts.body = JSON.stringify(opts.body);
    opts.headers['Content-Type'] = 'application/json';
  }
  var res = await fetch(url, opts);
  if (!res.ok) {
    var detail = '';
    try { var j = await res.json(); detail = j.detail || j.message || JSON.stringify(j); }
    catch (e) { detail = res.statusText; }
    throw new Error(detail || 'Request failed');
  }
  return res.json();
}

/* ────────────────────────────────────────────── Inline modal helpers ─── */

function showModal(html) {
  var overlay = document.createElement('div');
  overlay.style.cssText =
    'position:fixed;z-index:9999;inset:0;background:rgba(0,0,0,0.35);' +
    'display:flex;align-items:center;justify-content:center;' +
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  /* Click close button or outside backdrop to close */
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay || e.target.closest('.pos-modal-close')) closeModal(overlay);
  });

  /* Trap Escape key */
  var keyHandler = function (e) {
    if (e.key === 'Escape') { closeModal(overlay); document.removeEventListener('keydown', keyHandler); }
  };
  document.addEventListener('keydown', keyHandler);

  return overlay;
}

function closeModal(overlay) {
  if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
}

/* Build the inner modal box (the white card) */
function modalBox(title, bodyHtml, wide) {
  var w = wide ? '560px' : '460px';
  return (
    '<div style="background:#fff;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,0.18);' +
    'width:' + w + ';max-width:94vw;max-height:90vh;overflow-y:auto;">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;' +
    'padding:16px 20px 0 20px;">' +
    '<h2 style="margin:0;font-size:17px;font-weight:600;color:#1a1a1a;">' +
    escapeHtml(title) + '</h2>' +
    '<button class="pos-modal-close" style="background:none;border:none;font-size:20px;cursor:pointer;color:#888;padding:0;line-height:1">&times;</button></div>' +
    '<div style="padding:12px 20px 20px 20px;">' + bodyHtml + '</div></div>'
  );
}

/* ────────────────────────────────────────────── Confirm dialog ─── */

function confirmDelete(terminalName) {
  return new Promise(function (resolve) {
    var body =
      '<p style="margin:0 0 12px 0;font-size:14px;color:#444;line-height:1.5;">' +
      'Are you sure you want to delete terminal <strong>' +
      escapeHtml(terminalName) + '</strong>? This action cannot be undone.</p>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
      '<button class="pos-btn-cancel" style="padding:7px 16px;border:1px solid #d0d0d0;' +
      'background:#fff;border-radius:6px;cursor:pointer;font-size:13px;color:#444;">Cancel</button>' +
      '<button class="pos-btn-confirm" style="padding:7px 16px;border:none;' +
      'background:#d32f2f;border-radius:6px;cursor:pointer;font-size:13px;color:#fff;font-weight:600;">' +
      'Delete</button></div>';
    var ov = showModal(modalBox('Confirm Delete', body, false));
    ov.querySelector('.pos-btn-cancel').onclick = function () { closeModal(ov); resolve(false); };
    ov.querySelector('.pos-btn-confirm').onclick = function () { closeModal(ov); resolve(true); };
  });
}

/* ────────────────────────────────────────── Toast notification ─── */

function showToast(message, type) {
  type = type || 'info';
  var bg = type === 'error' ? '#d32f2f' : type === 'success' ? '#2e7d32' : '#1565c0';
  var el = document.createElement('div');
  el.textContent = message;
  el.style.cssText =
    'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);' +
    'background:' + bg + ';color:#fff;padding:10px 22px;border-radius:8px;' +
    'font-size:13px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
    'box-shadow:0 4px 12px rgba(0,0,0,0.2);z-index:10000;' +
    'transition:opacity 0.3s ease;opacity:1;';
  document.body.appendChild(el);
  setTimeout(function () {
    el.style.opacity = '0';
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 350);
  }, 3200);
}

/* ──────────────────────────────────────── Terminal CRUD ─── */

var BASE = '/plugin/pos-sales/terminals/';

async function loadTerminals() {
  return apiFetch(BASE);
}

async function createTerminal(data) {
  return apiFetch(BASE, { method: 'POST', body: data });
}

async function updateTerminal(pk, data) {
  return apiFetch(BASE + pk + '/', { method: 'PUT', body: data });
}

async function deleteTerminal(pk) {
  return apiFetch(BASE + pk + '/', { method: 'DELETE' });
}

/* ──────────────────────────────────────── API Key store CRUD ─── */

var KEYS_BASE = '/plugin/pos-sales/api-keys/';

async function loadApiKeys() {
  return apiFetch(KEYS_BASE);
}

async function createApiKey(data) {
  return apiFetch(KEYS_BASE, { method: 'POST', body: data });
}

async function updateApiKey(pk, data) {
  return apiFetch(KEYS_BASE + pk + '/', { method: 'PUT', body: data });
}

async function deleteApiKey(pk) {
  return apiFetch(KEYS_BASE + pk + '/', { method: 'DELETE' });
}

/* ────────────────────────────────────── Dropdown data sources ─── */

var _locationCache = null;
async function fetchLocations() {
  if (_locationCache) return _locationCache;
  var data = await apiFetch('/api/stock/location/?structural=false&page_size=1000');
  var results = data.results || data || [];
  _locationCache = results;
  return results;
}

var _customerCache = null;
async function fetchCustomers() {
  if (_customerCache) return _customerCache;
  var data = await apiFetch('/api/company/?is_customer=true&page_size=1000');
  var results = data.results || data || [];
  _customerCache = results;
  return results;
}

function clearCaches() {
  _locationCache = null;
  _customerCache = null;
}

/* ─────────────────────────────────────── Terminal table row ─── */

function terminalRow(t, index) {
  var statusColor = t.active ? '#2e7d32' : '#9e9e9e';
  var statusLabel = t.active ? 'Active' : 'Inactive';
  var locationName = '';
  if (t.location_detail && t.location_detail.name) {
    locationName = t.location_detail.name;
  } else if (t.location_name) {
    locationName = t.location_name;
  } else if (t.location) {
    locationName = String(t.location);
  }

  return (
    '<div style="display:grid;grid-template-columns:1fr 130px 100px 80px;' +
    'align-items:center;gap:8px;padding:10px 14px;' +
    (index % 2 === 0 ? 'background:#fafafa;' : '') +
    'border-bottom:1px solid #eee;font-size:13px;">' +

    /* Name + terminal ID */
    '<div>' +
    '<div style="font-weight:600;color:#1a1a1a;">' + escapeHtml(t.name) + '</div>' +
    '<div style="font-size:11px;color:#888;font-family:monospace;margin-top:1px;">' +
    escapeHtml(t.terminal_id) + '</div></div>' +

    /* Location */
    '<div style="color:#555;">' + escapeHtml(locationName) + '</div>' +

    /* Status */
    '<div style="display:flex;align-items:center;gap:5px;">' +
    '<span style="width:8px;height:8px;border-radius:50%;background:' + statusColor + ';display:inline-block;"></span>' +
    '<span style="color:' + statusColor + ';font-weight:500;">' + statusLabel + '</span></div>' +

    /* Actions */
    '<div style="display:flex;gap:4px;justify-content:flex-end;">' +
    '<button data-pk="' + t.pk + '" class="pos-btn-edit" ' +
    'style="padding:4px 10px;border:1px solid #d0d0d0;background:#fff;border-radius:4px;' +
    'cursor:pointer;font-size:11px;color:#444;">Edit</button>' +
    '<button data-pk="' + t.pk + '" class="pos-btn-delete" ' +
    'style="padding:4px 10px;border:1px solid #e0e0e0;background:#fff;border-radius:4px;' +
    'cursor:pointer;font-size:11px;color:#b71c1c;">Delete</button></div></div>'
  );
}

/* ─────────────────────────────────────── Build the add/edit modal body ─── */

function terminalFormFields(terminal, locations, customers, allTerminals, allSavedKeys) {
  var t = terminal || {};
  var activeChecked = t.active !== false;

  var locOpts = '<option value="">-- None --</option>';
  for (var i = 0; i < locations.length; i++) {
    var sel = String(locations[i].pk) === String(t.location) ? ' selected' : '';
    locOpts += '<option value="' + locations[i].pk + '"' + sel + '>' +
      escapeHtml(locations[i].name) + '</option>';
  }

  var custOpts = '<option value="">-- None --</option>';
  for (var j = 0; j < customers.length; j++) {
    var sel2 = String(customers[j].pk) === String(t.customer) ? ' selected' : '';
    custOpts += '<option value="' + customers[j].pk + '"' + sel2 + '>' +
      escapeHtml(customers[j].name) + '</option>';
  }

  var copyKeyOpts = '<option value="">-- Select source --</option>';
  var savedKeys = allSavedKeys || [];
  if (savedKeys.length) {
    copyKeyOpts += '<optgroup label="Saved Keys">';
    for (var k = 0; k < savedKeys.length; k++) {
      copyKeyOpts += '<option value="key:' + savedKeys[k].id + '">' +
        escapeHtml(savedKeys[k].name) + '</option>';
    }
    copyKeyOpts += '</optgroup>';
  }
  var terminals = allTerminals || [];
  if (terminals.length) {
    copyKeyOpts += '<optgroup label="From Terminals">';
    for (var m = 0; m < terminals.length; m++) {
      copyKeyOpts += '<option value="term:' + terminals[m].id + '">' +
        escapeHtml(terminals[m].name) + ' (' + escapeHtml(terminals[m].terminal_id) + ')</option>';
    }
    copyKeyOpts += '</optgroup>';
  }

  return (
    '<div style="display:flex;flex-direction:column;gap:12px;">' +

    /* Name */
    '<div><label style="display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:3px;">Name</label>' +
    '<input name="name" value="' + escapeHtml(t.name || '') + '" ' +
    'style="width:100%;padding:8px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:13px;box-sizing:border-box;"></div>' +

    /* Terminal ID */
    '<div><label style="display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:3px;">Terminal ID</label>' +
    '<input name="terminal_id" value="' + escapeHtml(t.terminal_id || '') + '" ' +
    'style="width:100%;padding:8px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:13px;box-sizing:border-box;"></div>' +

    /* Location */
    '<div><label style="display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:3px;">Location</label>' +
    '<select name="location" style="width:100%;padding:8px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:13px;background:#fff;box-sizing:border-box;">' +
    locOpts + '</select></div>' +

    /* Customer */
    '<div><label style="display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:3px;">Customer</label>' +
    '<select name="customer" style="width:100%;padding:8px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:13px;background:#fff;box-sizing:border-box;">' +
    custOpts + '</select></div>' +

    /* Receipt URL */
    '<div><label style="display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:3px;">Receipt URL</label>' +
    '<input name="receipt_api_endpoint" value="' + escapeHtml(t.receipt_api_endpoint || '') + '" ' +
    'style="width:100%;padding:8px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:13px;box-sizing:border-box;"></div>' +

    /* API Key (select from saved keys — resolved server-side) */
    '<div><label style="display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:3px;">API Key</label>' +
    '<select name="key_source" ' +
    'style="width:100%;padding:8px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:13px;background:#fff;box-sizing:border-box;color:#555;">' +
    copyKeyOpts + '</select></div>' +

    /* Service User */
    '<div><label style="display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:3px;">Service User</label>' +
    '<input name="service_user" value="' + escapeHtml(t.service_user || 'admin') + '" ' +
    'style="width:100%;padding:8px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:13px;box-sizing:border-box;"></div>' +

    /* Active checkbox */
    '<div style="display:flex;align-items:center;gap:8px;">' +
    '<input name="active" type="checkbox" ' + (activeChecked ? 'checked' : '') + ' ' +
    'style="width:16px;height:16px;margin:0;">' +
    '<label style="font-size:13px;color:#444;">Active</label></div>' +

    /* Buttons */
    '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px;">' +
    '<button class="pos-btn-cancel" ' +
    'style="padding:8px 20px;border:1px solid #d0d0d0;background:#fff;border-radius:6px;cursor:pointer;font-size:13px;color:#444;">Cancel</button>' +
    '<button class="pos-btn-save" ' +
    'style="padding:8px 20px;border:none;background:#1565c0;border-radius:6px;cursor:pointer;font-size:13px;color:#fff;font-weight:600;">Save</button></div>' +

    '</div>'
  );
}

/* ────────────────────────────────────── Open add/edit modal ─── */

function openTerminalModal(terminal, locations, customers, allTerminals, allSavedKeys) {
  var isEdit = !!terminal;
  var title = isEdit ? 'Edit Terminal' : 'Add Terminal';

  var body = terminalFormFields(terminal, locations, customers, allTerminals, allSavedKeys);
  var ov = showModal(modalBox(title, body, false));

  ov.querySelector('.pos-btn-cancel').onclick = function () { closeModal(ov); };
  ov.querySelector('.pos-btn-save').onclick = async function () {
    var fields = ov.querySelectorAll('[name]');
    var data = {};
    for (var i = 0; i < fields.length; i++) {
      var el = fields[i];
      if (el.type === 'checkbox') {
        data[el.name] = el.checked;
      } else if (el.tagName === 'SELECT') {
        data[el.name] = el.value || null;
      } else {
        data[el.name] = el.value;
      }
    }

    /* Remove empty-ish strings for optional fields */
    if (!data.location) data.location = null;
    if (!data.customer) data.customer = null;
    if (!data.key_source) delete data.key_source;

    var saveBtn = ov.querySelector('.pos-btn-save');
    var origText = saveBtn.textContent;
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

    try {
      if (isEdit) {
        await updateTerminal(terminal.pk, data);
        showToast('Terminal updated', 'success');
      } else {
        await createTerminal(data);
        showToast('Terminal created', 'success');
      }
      closeModal(ov);
      await renderTerminalList(); /* re-render table */
    } catch (err) {
      showToast(err.message, 'error');
      saveBtn.textContent = origText;
      saveBtn.disabled = false;
    }
  };
}

/* ─────────────────────────────────────── API Key table row ─── */

function apiKeyRow(k, index) {
  var created = k.created ? new Date(k.created).toLocaleDateString() : '—';
  return (
    '<div style="display:grid;grid-template-columns:1fr 1fr 110px 80px;' +
    'align-items:center;gap:8px;padding:10px 14px;' +
    (index % 2 === 0 ? 'background:#fafafa;' : '') +
    'border-bottom:1px solid #eee;font-size:13px;">' +

    '<div>' +
    '<div style="font-weight:600;color:#1a1a1a;">' + escapeHtml(k.name) + '</div></div>' +

    '<div style="color:#555;">' + escapeHtml(k.description || '—') + '</div>' +

    '<div style="color:#888;font-size:11px;">' + created + '</div>' +

    '<div style="display:flex;gap:4px;justify-content:flex-end;">' +
    '<button data-id="' + k.id + '" class="pos-key-edit" ' +
    'style="padding:4px 10px;border:1px solid #d0d0d0;background:#fff;border-radius:4px;' +
    'cursor:pointer;font-size:11px;color:#444;">Edit</button>' +
    '<button data-id="' + k.id + '" class="pos-key-delete" ' +
    'style="padding:4px 10px;border:1px solid #e0e0e0;background:#fff;border-radius:4px;' +
    'cursor:pointer;font-size:11px;color:#b71c1c;">Delete</button></div></div>'
  );
}

/* ─────────────────────────────────────── API Key form ─── */

function apiKeyFormFields(key) {
  var k = key || {};
  return (
    '<div style="display:flex;flex-direction:column;gap:12px;">' +

    '<div><label style="display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:3px;">Name</label>' +
    '<input name="name" value="' + escapeHtml(k.name || '') + '" ' +
    'style="width:100%;padding:8px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:13px;box-sizing:border-box;"></div>' +

    '<div><label style="display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:3px;">Description</label>' +
    '<input name="description" value="' + escapeHtml(k.description || '') + '" ' +
    'style="width:100%;padding:8px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:13px;box-sizing:border-box;"></div>' +

    '<div><label style="display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:3px;">API Key</label>' +
    '<input name="api_key" type="password" value="" placeholder="' +
    (k.id ? 'Leave blank to keep existing' : '') + '" ' +
    'style="width:100%;padding:8px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:13px;box-sizing:border-box;"></div>' +

    '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px;">' +
    '<button class="pos-btn-cancel" ' +
    'style="padding:8px 20px;border:1px solid #d0d0d0;background:#fff;border-radius:6px;cursor:pointer;font-size:13px;color:#444;">Cancel</button>' +
    '<button class="pos-btn-save" ' +
    'style="padding:8px 20px;border:none;background:#1565c0;border-radius:6px;cursor:pointer;font-size:13px;color:#fff;font-weight:600;">Save</button></div>' +

    '</div>'
  );
}

/* ─────────────────────────────────────── Open API key modal ─── */

function openApiKeyModal(key) {
  var isEdit = !!key;
  var title = isEdit ? 'Edit API Key' : 'Add API Key';
  var body = apiKeyFormFields(key);
  var ov = showModal(modalBox(title, body, false));

  ov.querySelector('.pos-btn-cancel').onclick = function () { closeModal(ov); };
  ov.querySelector('.pos-btn-save').onclick = async function () {
    var fields = ov.querySelectorAll('[name]');
    var data = {};
    for (var i = 0; i < fields.length; i++) {
      var el = fields[i];
      data[el.name] = el.value;
    }
    if (!data.api_key) delete data.api_key;

    var saveBtn = ov.querySelector('.pos-btn-save');
    var origText = saveBtn.textContent;
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

    try {
      if (isEdit) {
        await updateApiKey(key.id, data);
        showToast('API key updated', 'success');
      } else {
        await createApiKey(data);
        showToast('API key created', 'success');
      }
      closeModal(ov);
      await renderApiKeyList();
    } catch (err) {
      showToast(err.message, 'error');
      saveBtn.textContent = origText;
      saveBtn.disabled = false;
    }
  };
}

/* ──────────────────────────────────── Render API key list section ─── */

var _currentKeyContainer = null;

async function renderApiKeyList() {
  if (!_currentKeyContainer) return;
  var container = _currentKeyContainer;
  container.innerHTML =
    '<div style="text-align:center;padding:30px 0;color:#999;font-size:13px;">Loading keys...</div>';

  try {
    var keys = await loadApiKeys();
    var list = keys.results || keys;
    if (!Array.isArray(list)) list = [];

    var html = '';

    if (list.length === 0) {
      html =
        '<div style="text-align:center;padding:28px 0;color:#888;font-size:13px;">' +
        'No API keys stored yet. Click [+ Add Key] to save one.</div>';
    } else {
      html +=
        '<div style="display:grid;grid-template-columns:1fr 1fr 110px 80px;' +
        'align-items:center;gap:8px;padding:8px 14px;' +
        'font-size:11px;font-weight:600;color:#888;text-transform:uppercase;' +
        'letter-spacing:0.5px;border-bottom:2px solid #e0e0e0;">' +
        '<div>Name</div><div>Description</div><div>Created</div><div style="text-align:right;">Actions</div></div>';

      for (var i = 0; i < list.length; i++) {
        html += apiKeyRow(list[i], i);
      }
    }

    container.innerHTML = html;

    /* Wire edit buttons */
    var edits = container.querySelectorAll('.pos-key-edit');
    for (var e = 0; e < edits.length; e++) {
      edits[e].onclick = (function (pk) {
        return function () { openEditKeyModal(pk); };
      })(edits[e].getAttribute('data-id'));
    }

    /* Wire delete buttons */
    var deletes = container.querySelectorAll('.pos-key-delete');
    for (var d = 0; d < deletes.length; d++) {
      deletes[d].onclick = (function (pk, name) {
        return async function () {
          var confirmed = await confirmDelete(name);
          if (!confirmed) return;
          try {
            await deleteApiKey(pk);
            showToast('API key deleted', 'success');
            await renderApiKeyList();
          } catch (err) {
            showToast(err.message, 'error');
          }
        };
      })(deletes[d].getAttribute('data-id'), 'API key');
    }

    /* Cache list for edit modal lookup */
    window._posApiKeyList = list;

  } catch (err) {
    container.innerHTML =
      '<div style="text-align:center;padding:28px 0;color:#b71c1c;font-size:13px;">' +
      'Failed to load keys: ' + escapeHtml(err.message) + '</div>';
  }
}

async function openEditKeyModal(pk) {
  var list = window._posApiKeyList || [];
  var key = null;
  for (var i = 0; i < list.length; i++) {
    if (String(list[i].id) === String(pk)) { key = list[i]; break; }
  }
  if (!key) {
    showToast('API key not found', 'error');
    return;
  }
  openApiKeyModal(key);
}

/* ──────────────────────────────────── Render terminal list section ─── */

var _currentContainer = null;

async function renderTerminalList() {
  if (!_currentContainer) return;
  var container = _currentContainer;
  container.innerHTML =
    '<div style="text-align:center;padding:40px 0;color:#999;font-size:13px;">Loading terminals...</div>';

  try {
    var terminals = await loadTerminals();
    /* Support both paginated and direct array responses */
    var list = terminals.results || terminals;
    if (!Array.isArray(list)) list = [];

    /* Build table */
    var html = '';

    if (list.length === 0) {
      html =
        '<div style="text-align:center;padding:36px 0;color:#888;font-size:13px;">' +
        'No terminals configured yet. Click [+ Add Terminal] to get started.</div>';
    } else {
      /* Column header row */
      html +=
        '<div style="display:grid;grid-template-columns:1fr 130px 100px 80px;' +
        'align-items:center;gap:8px;padding:8px 14px;' +
        'font-size:11px;font-weight:600;color:#888;text-transform:uppercase;' +
        'letter-spacing:0.5px;border-bottom:2px solid #e0e0e0;">' +
        '<div>Terminal</div><div>Location</div><div>Status</div><div style="text-align:right;">Actions</div></div>';

      for (var i = 0; i < list.length; i++) {
        html += terminalRow(list[i], i);
      }
    }

    container.innerHTML = html;

    /* Attach event listeners to edit / delete buttons */
    var edits = container.querySelectorAll('.pos-btn-edit');
    for (var e = 0; e < edits.length; e++) {
      edits[e].onclick = (function (pk) {
        return function () { openEditModal(pk); };
      })(edits[e].getAttribute('data-pk'));
    }

    var deletes = container.querySelectorAll('.pos-btn-delete');
    for (var d = 0; d < deletes.length; d++) {
      deletes[d].onclick = (function (pk, name) {
        return async function () {
          var confirmed = await confirmDelete(name);
          if (!confirmed) return;
          try {
            await deleteTerminal(pk);
            showToast('Terminal deleted', 'success');
            await renderTerminalList();
          } catch (err) {
            showToast(err.message, 'error');
          }
        };
      })(deletes[d].getAttribute('data-pk'), 'Terminal');
    }

    /* Cache full list so edit modal can find terminal by pk */
    window._posTerminalList = list;

  } catch (err) {
    container.innerHTML =
      '<div style="text-align:center;padding:36px 0;color:#b71c1c;font-size:13px;">' +
      'Failed to load terminals: ' + escapeHtml(err.message) + '</div>';
  }
}

async function openEditModal(pk) {
  var list = window._posTerminalList || [];
  var terminal = null;
  for (var i = 0; i < list.length; i++) {
    if (String(list[i].pk) === String(pk)) { terminal = list[i]; break; }
  }
  if (!terminal) {
    showToast('Terminal not found', 'error');
    return;
  }

  try {
    var [locations, customers] = await Promise.all([fetchLocations(), fetchCustomers()]);
    openTerminalModal(terminal, locations, customers, list, window._posApiKeyList || []);
  } catch (err) {
    showToast('Failed to load form data: ' + err.message, 'error');
  }
}

/* ──────────────────────────────────── Webhook reference section ─── */

function webhookSection(webhookUrl) {
  var url = webhookUrl || '/plugin/pos-sales/pos-webhook/';
  var samplePayload = JSON.stringify(
    { terminal_id: 'stand-a-register-1', receipt_id: 'RCP-001234' },
    null,
    2
  );

  return (
    '<div style="margin-top:24px;">' +

    '<h3 style="margin:0 0 8px 0;font-size:14px;font-weight:600;color:#333;">' +
    'Webhook URL (for POS config)</h3>' +

    /* Copyable URL */
    '<div style="background:#f5f5f5;border:1px solid #e0e0e0;border-radius:6px;padding:10px 14px;' +
    'font-family:\'SFMono-Regular\',Consolas,\'Liberation Mono\',Menlo,monospace;font-size:12px;' +
    'display:flex;align-items:center;gap:10px;margin-bottom:8px;">' +
    '<span style="background:#1565c0;color:#fff;font-size:10px;font-weight:700;padding:2px 7px;' +
    'border-radius:3px;text-transform:uppercase;flex-shrink:0;">POST</span>' +
    '<code style="flex:1;color:#333;word-break:break-all;">' + escapeHtml(url) + '</code>' +
    '<button class="pos-copy-btn" data-copy="' + escapeHtml(url) + '" ' +
    'style="flex-shrink:0;background:none;border:1px solid #ccc;border-radius:4px;cursor:pointer;' +
    'font-size:13px;padding:3px 8px;line-height:1.4;color:#444;" title="Copy URL">' +
    '⎘</button></div>' +

    /* Example payload */
    '<div style="background:#f5f5f5;border:1px solid #e0e0e0;border-radius:6px;padding:10px 14px;' +
    'font-family:\'SFMono-Regular\',Consolas,\'Liberation Mono\',Menlo,monospace;font-size:11px;line-height:1.5;">' +
    '<div style="font-size:10px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">' +
    'Payload</div>' +
    '<pre style="margin:0;white-space:pre-wrap;color:#333;overflow-x:auto;">' +
    escapeHtml(samplePayload) + '</pre>' +
    '<button class="pos-copy-btn" data-copy="' + escapeHtml(samplePayload) + '" ' +
    'style="margin-top:6px;background:none;border:1px solid #ccc;border-radius:4px;cursor:pointer;' +
    'font-size:11px;padding:3px 10px;color:#444;" title="Copy payload">Copy payload</button></div>' +

    '</div>'
  );
}

/* ─────────────────────────────────────────────── Full page render ─── */

export function renderPage(element, context) {
  element.innerHTML = '';
  element.style.padding = '24px';
  element.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  var webhookUrl = (context && context.webhook_url) || '/plugin/pos-sales/pos-webhook/';

  /* Outer container */
  var outer = document.createElement('div');
  outer.style.cssText =
    'max-width:820px;margin:0 auto;background:#fff;border-radius:10px;' +
    'box-shadow:0 1px 4px rgba(0,0,0,0.08);overflow:hidden;';

  /* ─── Header ─── */
  var header = document.createElement('div');
  header.style.cssText =
    'display:flex;align-items:center;justify-content:space-between;' +
    'padding:16px 20px;border-bottom:1px solid #eee;';
  header.innerHTML =
    '<div style="display:flex;align-items:center;gap:10px;">' +
    '<span style="font-size:20px;">&#x1f4b3;</span>' +
    '<div><div style="font-weight:600;font-size:16px;color:#1a1a1a;">POS Terminals</div>' +
    '<div style="font-size:12px;color:#888;">Manage point-of-sale terminal registrations</div></div></div>' +
    '<button id="pos-add-terminal-btn" ' +
    'style="padding:7px 16px;border:none;background:#1565c0;border-radius:6px;cursor:pointer;' +
    'font-size:13px;color:#fff;font-weight:600;display:flex;align-items:center;gap:5px;">' +
    '<span style="font-size:16px;line-height:1;">+</span> Add Terminal</button>';
  outer.appendChild(header);

  /* ─── Terminal table area ─── */
  var tableArea = document.createElement('div');
  tableArea.style.cssText = 'padding:0;';
  tableArea.innerHTML =
    '<div style="text-align:center;padding:40px 0;color:#999;font-size:13px;">Loading...</div>';
  outer.appendChild(tableArea);

  /* ─── API Keys section ─── */
  var keysHeader = document.createElement('div');
  keysHeader.style.cssText =
    'display:flex;align-items:center;justify-content:space-between;' +
    'padding:14px 20px;border-top:1px solid #eee;border-bottom:1px solid #eee;';
  keysHeader.innerHTML =
    '<div style="display:flex;align-items:center;gap:10px;">' +
    '<span style="font-size:16px;">&#x1f511;</span>' +
    '<div><div style="font-weight:600;font-size:15px;color:#1a1a1a;">API Keys</div>' +
    '<div style="font-size:11px;color:#888;">Store and reuse keys across terminals</div></div></div>' +
    '<button id="pos-add-key-btn" ' +
    'style="padding:7px 16px;border:none;background:#1565c0;border-radius:6px;cursor:pointer;' +
    'font-size:13px;color:#fff;font-weight:600;display:flex;align-items:center;gap:5px;">' +
    '<span style="font-size:16px;line-height:1;">+</span> Add Key</button>';
  outer.appendChild(keysHeader);

  var keyTableArea = document.createElement('div');
  keyTableArea.style.cssText = 'padding:0;';
  keyTableArea.innerHTML =
    '<div style="text-align:center;padding:30px 0;color:#999;font-size:13px;">Loading...</div>';
  outer.appendChild(keyTableArea);

  /* ─── Webhook section ─── */
  var webhookArea = document.createElement('div');
  webhookArea.style.cssText =
    'padding:0 20px 20px 20px;border-top:1px solid #eee;padding-top:20px;margin-top:0;';
  webhookArea.innerHTML = webhookSection(webhookUrl);
  outer.appendChild(webhookArea);

  element.appendChild(outer);

  /* ─── Wire up copy buttons (delegated) ─── */
  outer.addEventListener('click', function (e) {
    var btn = e.target.closest('.pos-copy-btn');
    if (!btn) return;
    var text = btn.getAttribute('data-copy');
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast('Copied to clipboard', 'success');
      }, function () {});
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); showToast('Copied to clipboard', 'success'); } catch (e) {}
      document.body.removeChild(ta);
    }
  });

  /* ─── Wire up Add Terminal button ─── */
  document.getElementById('pos-add-terminal-btn').onclick = async function () {
    try {
      var [locations, customers] = await Promise.all([fetchLocations(), fetchCustomers()]);
      openTerminalModal(null, locations, customers, window._posTerminalList || [], window._posApiKeyList || []);
    } catch (err) {
      showToast('Failed to load form data: ' + err.message, 'error');
    }
  };

  /* ─── Wire up Add Key button ─── */
  document.getElementById('pos-add-key-btn').onclick = function () {
    openApiKeyModal(null);
  };

  /* ─── Set container references and load data ─── */
  _currentContainer = tableArea;
  _currentKeyContainer = keyTableArea;
  renderTerminalList();
  renderApiKeyList();
}

/* ═════════════════════════════════════════════════════════════════════
 * Legacy dashboard widget (used by the dashboard card, kept for compat)
 * ═════════════════════════════════════════════════════════════════════ */

export function renderPosDashboard(context) {
  var endpointConfigured = context && context.endpoint_configured;
  var serviceUser = (context && context.service_user) || 'admin';
  var webhookUrl = (context && context.webhook_url) || '/plugin/pos-sales/pos-webhook/';

  var html = '';
  html += '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; padding: 0; height: 100%; display: flex; flex-direction: column;">';

  /* Header */
  html += '<div style="display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid #e0e0e0;">';
  html += '  <span style="font-size: 20px;">&#x1f4b3;</span>';
  html += '  <div>';
  html += '    <div style="font-weight: 600; font-size: 15px; color: #1a1a1a;">POS Sales</div>';
  html += '    <div style="font-size: 12px; color: #666;">Webhook integration status</div>';
  html += '  </div>';
  html += '  <span style="margin-left: auto; font-size: 11px; padding: 3px 10px; border-radius: 10px; ' +
    (endpointConfigured ? 'background: #e8f5e9; color: #2e7d32;' : 'background: #fff3e0; color: #e65100;') +
    '">' + (endpointConfigured ? 'Configured' : 'Not configured') + '</span>';
  html += '</div>';

  if (!endpointConfigured) {
    /* Unconfigured state */
    html += '<div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 16px; text-align: center;">';
    html += '  <div style="font-size: 36px; margin-bottom: 12px; opacity: 0.4;">&#x26a0;</div>';
    html += '  <div style="font-size: 13px; color: #555; max-width: 260px; line-height: 1.5;">';
    html += '    Configure API endpoint and key in plugin settings to enable';
    html += '  </div>';
    html += '  <div style="margin-top: 16px; font-size: 12px; color: #999;">';
    html += '    Settings &rarr; Plugins &rarr; POS Sales Automation';
    html += '  </div>';
    html += '</div>';
  } else {
    /* Configured state -- show details */
    html += '<div style="flex: 1; padding: 14px 16px; overflow-y: auto;">';

    /* Service User */
    html += '<div style="margin-bottom: 12px;">';
    html += '  <div style="font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Service User</div>';
    html += '  <div style="font-size: 13px; color: #333;">' + escapeHtml(serviceUser) + '</div>';
    html += '</div>';

    /* Webhook URL */
    html += '<div style="margin-bottom: 12px;">';
    html += '  <div style="font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Webhook Endpoint</div>';
    html += '  <div style="background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 6px; padding: 10px 12px; font-family: \'SFMono-Regular\', Consolas, \'Liberation Mono\', Menlo, monospace; font-size: 12px; display: flex; align-items: center; gap: 8px;">';
    html += '    <span style="background: #1565c0; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 3px; text-transform: uppercase;">POST</span>';
    html += '    <code style="flex: 1; color: #333; word-break: break-all;">' + escapeHtml(webhookUrl) + '</code>';
    html += '  </div>';
    html += '</div>';

    html += '</div>';
  }

  html += '</div>';
  return html;
}
