/**
 * Location Hours Bulk Editor.
 * Export: renderPage(element, context)
 */

var DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function _csrf() {
  var r = document.cookie.split('; ').find(function(c) { return c.startsWith('csrftoken='); });
  return r ? r.split('=')[1] : '';
}

function _fetch(url, opts) {
  opts = opts || {};
  opts.headers = opts.headers || {};
  opts.headers['Accept'] = 'application/json';
  opts.headers['X-CSRFToken'] = _csrf();
  opts.credentials = 'same-origin';
  if (opts.body && typeof opts.body === 'object') { opts.body = JSON.stringify(opts.body); opts.headers['Content-Type'] = 'application/json'; }
  return fetch(url, opts).then(function(r) { if (!r.ok) return r.json().then(function(e) { throw new Error((e.detail) || r.statusText); }); return r.json(); });
}

function _esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function _toast(msg, type) {
  var el = document.createElement('div');
  el.style.cssText = 'position:fixed;bottom:24px;right:24px;padding:10px 18px;border-radius:6px;font-size:13px;font-weight:500;z-index:99999;color:#fff;' + (type === 'error' ? 'background:#c62828' : 'background:#2e7d32');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(function() { el.remove(); }, 3000);
}

/* ─── Modal helpers ─── */

function _modal(title, bodyHtml) {
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;z-index:9999;inset:0;background:rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,Roboto,sans-serif;';
  overlay.innerHTML = '<div style="background:#fff;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,0.18);width:460px;max-width:94vw;max-height:90vh;overflow-y:auto;">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px 0 20px;">' +
    '<h2 style="margin:0;font-size:17px;font-weight:600;color:#1a1a1a;">' + _esc(title) + '</h2>' +
    '<button class="lh-modal-close" style="background:none;border:none;font-size:20px;cursor:pointer;color:#888;padding:0;line-height:1">&times;</button></div>' +
    '<div style="padding:12px 20px 20px 20px;">' + bodyHtml + '</div></div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay || e.target.closest('.lh-modal-close')) { overlay.remove(); }
  });
  return overlay;
}

/* ─── API Key Store CRUD ─── */

function _apiKeyRow(k) {
  return '<div style="display:grid;grid-template-columns:1fr 1fr 80px;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid #eee;font-size:12px;">' +
    '<div><div style="font-weight:600;color:#1a1a1a;">' + _esc(k.name) + '</div></div>' +
    '<div style="color:#888;">' + _esc(k.description || '—') + '</div>' +
    '<div style="display:flex;gap:4px;justify-content:flex-end;">' +
    '<button data-id="' + k.id + '" class="lh-key-edit" style="padding:3px 8px;border:1px solid #d0d0d0;background:#fff;border-radius:4px;cursor:pointer;font-size:11px;color:#444;">Edit</button>' +
    '<button data-id="' + k.id + '" class="lh-key-delete" style="padding:3px 8px;border:1px solid #e0e0e0;background:#fff;border-radius:4px;cursor:pointer;font-size:11px;color:#b71c1c;">Del</button></div></div>';
}

function _keyForm(key) {
  var k = key || {};
  return '<div style="display:flex;flex-direction:column;gap:10px;">' +
    '<div><label style="display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:2px;">Name</label>' +
    '<input name="name" value="' + _esc(k.name || '') + '" style="width:100%;padding:7px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:13px;box-sizing:border-box;"></div>' +
    '<div><label style="display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:2px;">Description</label>' +
    '<input name="description" value="' + _esc(k.description || '') + '" style="width:100%;padding:7px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:13px;box-sizing:border-box;"></div>' +
    '<div><label style="display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:2px;">API Key</label>' +
    '<input name="api_key" type="password" value="" placeholder="' + (k.id ? 'Leave blank to keep existing' : '') + '" style="width:100%;padding:7px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:13px;box-sizing:border-box;"></div>' +
    '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
    '<button class="lh-btn-cancel" style="padding:7px 16px;border:1px solid #d0d0d0;background:#fff;border-radius:6px;cursor:pointer;font-size:13px;color:#444;">Cancel</button>' +
    '<button class="lh-btn-save" style="padding:7px 16px;border:none;background:#1565c0;border-radius:6px;cursor:pointer;font-size:13px;color:#fff;font-weight:600;">Save</button></div></div>';
}

function _openKeyModal(key) {
  var isEdit = !!key;
  var ov = _modal(isEdit ? 'Edit API Key' : 'Add API Key', _keyForm(key));
  ov.querySelector('.lh-btn-cancel').onclick = function() { ov.remove(); };
  ov.querySelector('.lh-btn-save').onclick = async function() {
    var fields = ov.querySelectorAll('[name]');
    var data = {};
    for (var i = 0; i < fields.length; i++) { data[fields[i].name] = fields[i].value; }
    if (!data.api_key) delete data.api_key;
    var btn = ov.querySelector('.lh-btn-save');
    btn.textContent = 'Saving...'; btn.disabled = true;
    try {
      if (isEdit) {
        await _fetch('/plugin/location-hours/api-keys/' + key.id + '/', { method: 'PUT', body: data });
      } else {
        await _fetch('/plugin/location-hours/api-keys/', { method: 'POST', body: data });
      }
      ov.remove();
      _renderApiKeys();
      _refreshKeyOptions();
      _toast('API key ' + (isEdit ? 'updated' : 'created'), 'success');
    } catch (err) {
      _toast('Error: ' + (err.message || err), 'error');
      btn.textContent = 'Save'; btn.disabled = false;
    }
  };
}

var _apiKeyCache = [];

function _refreshKeyOptions() {
  return _fetch('/plugin/location-hours/api-keys/').then(function(keys) {
    _apiKeyCache = (keys.results || keys) || [];
  });
}

async function _renderApiKeys() {
  var container = document.getElementById('lh-apikey-section-body');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:16px;color:#999;font-size:12px;">Loading...</div>';
  try {
    var keys = await _fetch('/plugin/location-hours/api-keys/');
    var list = (keys.results || keys) || [];
    _apiKeyCache = list;
    var html = '';
    if (list.length === 0) {
      html = '<div style="text-align:center;padding:16px;color:#888;font-size:12px;">No API keys stored yet. Add one to enable push.</div>';
    } else {
      for (var i = 0; i < list.length; i++) { html += _apiKeyRow(list[i]); }
    }
    container.innerHTML = html;

    var edits = container.querySelectorAll('.lh-key-edit');
    for (var e = 0; e < edits.length; e++) {
      edits[e].onclick = (function(id) { return function() {
        var k = _apiKeyCache.find(function(x) { return String(x.id) === String(id); });
        if (k) _openKeyModal(k);
      }; })(edits[e].getAttribute('data-id'));
    }
    var dels = container.querySelectorAll('.lh-key-delete');
    for (var d = 0; d < dels.length; d++) {
      dels[d].onclick = (function(id) { return async function() {
        if (!confirm('Delete this API key? It will stop working for any push destinations using it.')) return;
        try {
          await _fetch('/plugin/location-hours/api-keys/' + id + '/', { method: 'DELETE' });
          _toast('API key deleted', 'success');
          _renderApiKeys();
          _refreshKeyOptions();
        } catch (err) { _toast('Error: ' + (err.message || err), 'error'); }
      }; })(dels[d].getAttribute('data-id'));
    }
  } catch (err) {
    container.innerHTML = '<div style="color:#c62828;padding:8px;font-size:12px;">Failed: ' + _esc(err.message) + '</div>';
  }
}

/* ─── Google connection bar ─── */

function _googleBar() {
  return '<div id="lh-google-bar" style="margin-bottom:16px;padding:10px 14px;border:1px solid #e0e0e0;border-radius:8px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13px;">' +
    '<span style="font-weight:600;color:#333;white-space:nowrap;">Google:</span>' +
    '<span id="lh-google-status" style="color:#888;">Checking...</span>' +
    '<button id="lh-google-connect" style="padding:6px 16px;border:none;background:#1565c0;border-radius:6px;cursor:pointer;font-size:13px;color:#fff;font-weight:600;white-space:nowrap;display:none;">Connect Google</button>' +
    '<button id="lh-google-disconnect" style="padding:6px 16px;border:1px solid #ccc;border-radius:6px;cursor:pointer;font-size:13px;color:#888;background:#fff;white-space:nowrap;display:none;">Disconnect</button></div>';
}

function _loadGoogleStatus() {
  var urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('oauth') === 'connected') {
    _toast('Google account connected', 'success');
    window.history.replaceState({}, '', window.location.pathname);
  } else if (urlParams.get('oauth') === 'denied') {
    _toast('Google authorization was denied', 'error');
    window.history.replaceState({}, '', window.location.pathname);
  } else if (urlParams.get('oauth') === 'error') {
    _toast('Failed to connect Google account', 'error');
    window.history.replaceState({}, '', window.location.pathname);
  }

  _fetch('/plugin/location-hours/google-auth/status/').then(function(data) {
    var status = document.getElementById('lh-google-status');
    var connectBtn = document.getElementById('lh-google-connect');
    var disconBtn = document.getElementById('lh-google-disconnect');

    if (data.connected) {
      status.textContent = 'Connected as ' + (data.email || 'unknown');
      status.style.color = '#2e7d32';
      connectBtn.style.display = 'none';
      disconBtn.style.display = '';
    } else {
      status.textContent = 'Not connected';
      status.style.color = '#888';
      connectBtn.style.display = '';
      disconBtn.style.display = 'none';
    }
  }).catch(function() {
    document.getElementById('lh-google-status').textContent = 'Could not check status';
  });
}

/* ─── Collapsible section ─── */

function _section(id, title, addLabel, helpUrl) {
  var helpLink = '';
  if (helpUrl) {
    helpLink = '<a href="' + helpUrl + '" target="_blank" rel="noopener" title="Setup help" style="font-size:11px;color:#1565c0;text-decoration:none;margin-right:12px;">How to get a token &nearr;</a>';
  }
  return '<div style="margin-bottom:16px;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">' +
    '<div class="lh-section-hdr" data-section="' + id + '" style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#fafafa;cursor:pointer;border-bottom:1px solid #e0e0e0;">' +
    '<span style="font-weight:600;font-size:14px;">' + _esc(title) + '</span>' +
    '<span style="display:flex;align-items:center;gap:4px;">' + helpLink + '<span style="font-size:18px;color:#888;" class="lh-section-arrow">&#x25BC;</span></span></div>' +
    '<div id="' + id + '" style="padding:0;"></div>' +
    '<div style="padding:8px 14px;border-top:1px solid #f0f0f0;">' +
    '<button id="' + id + '-add" style="padding:5px 14px;border:none;background:#1565c0;border-radius:4px;cursor:pointer;font-size:12px;color:#fff;font-weight:600;">+ ' + _esc(addLabel) + '</button></div></div>';
}

/* ---- main ---- */

export function renderPage(element, context) {
  element.innerHTML = '<div id="lh-bulk-root" style="padding:16px;font-family:-apple-system,BlinkMacSystemFont,Roboto,sans-serif">' +
    _section('lh-apikey-section-body', 'API Keys', 'Add Key', 'https://developers.google.com/my-business/content/basic-setup') +
    _googleBar() +
    '<div id="lh-grid-area"><div style="text-align:center;padding:32px;color:#888">Loading locations...</div></div></div>';
  var root = element.querySelector('#lh-bulk-root');

  /* Wire collapsible section */
  var hdrs = root.querySelectorAll('.lh-section-hdr');
  for (var h = 0; h < hdrs.length; h++) {
    hdrs[h].addEventListener('click', function() {
      var body = document.getElementById(this.dataset.section);
      if (body) {
        var hidden = body.style.display === 'none';
        body.style.display = hidden ? 'block' : 'none';
        this.querySelector('.lh-section-arrow').textContent = hidden ? '▼' : '▶';
      }
    });
  }

  /* Wire Add Key button */
  document.getElementById('lh-apikey-section-body-add').addEventListener('click', function() { _openKeyModal(null); });

  /* Wire Google connect / disconnect */
  document.getElementById('lh-google-connect').addEventListener('click', function() {
    window.location.href = '/plugin/location-hours/google-auth/';
  });
  document.getElementById('lh-google-disconnect').addEventListener('click', function() {
    if (!confirm('Disconnect Google? You will need to re-connect before pushing hours.')) return;
    _fetch('/plugin/location-hours/google-disconnect/', { method: 'POST' }).then(function() {
      _loadGoogleStatus();
      _toast('Google disconnected', 'success');
    }).catch(function(err) {
      _toast('Error: ' + (err.message || err), 'error');
    });
  });

  /* Load keys and google status */
  _refreshKeyOptions().then(function() {
    _renderApiKeys();
  });
  _loadGoogleStatus();

  _fetch('/plugin/location-hours/hours/overview/').then(function(data) {
    var locations = data.locations || [];
    var googleAcct = data.google_account_id || '';
    _renderGrid(root.querySelector('#lh-grid-area'), locations, googleAcct);
  }).catch(function(err) {
    root.querySelector('#lh-grid-area').innerHTML = '<div style="color:#c62828;padding:16px">Failed to load: ' + _esc(err.message || err) + '</div>';
  });
}

/* ---- render ---- */

function _renderGrid(root, locations, googleAcct) {
  if (locations.length === 0) {
    root.innerHTML = '<div style="text-align:center;padding:32px;color:#888">No locations found.</div>';
    return;
  }

  var h = '';

  if (!googleAcct) {
    h += '<div style="background:#fff3e0;border:1px solid #ffcc02;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px">';
    h += '<strong style="color:#e65100">Google Account ID not configured.</strong> ';
    h += 'Set it in <em>Settings → Plugins → Location Hours Manager</em> to enable Google Location ID fields.';
    h += '</div>';
  }

  h += '<h2 style="margin:0 0 4px;font-size:20px;font-weight:700">Location Hours</h2>';
  h += '<p style="color:#666;font-size:13px;margin:0 0 16px">Click any hour cell to edit. Save the row, then push to send updates.</p>';

  h += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">';
  h += '<thead><tr>';
  h += '<th style="padding:8px 10px;text-align:left;background:#fafafa;border-bottom:1px solid #e0e0e0;font-weight:600">Location</th>';
  for (var d = 0; d < 7; d++) { h += '<th style="padding:8px 6px;text-align:center;background:#fafafa;border-bottom:1px solid #e0e0e0;font-weight:600;min-width:80px;font-size:11px">' + DAY_LABELS[d] + '</th>'; }
  if (googleAcct) h += '<th style="padding:8px 10px;text-align:left;background:#fafafa;border-bottom:1px solid #e0e0e0;font-weight:600;min-width:140px">Google Location ID</th>';
  h += '<th style="padding:8px 10px;text-align:center;background:#fafafa;border-bottom:1px solid #e0e0e0;min-width:110px">Actions</th>';
  h += '</tr></thead><tbody>';

  for (var i = 0; i < locations.length; i++) {
    var loc = locations[i];
    h += '<tr id="lh-row-' + i + '" data-locpk="' + loc.location_pk + '">';
    h += '<td style="padding:8px 10px;font-weight:600;white-space:nowrap;border-bottom:1px solid #f0f0f0">' + _esc(loc.location_name) + '</td>';

    for (var d = 0; d < 7; d++) {
      var dayData = loc[d] || {};
      var closed = dayData.closed !== false;
      var text = closed ? '—' : (dayData.open || '?') + '–' + (dayData.close || '?');
      var bg = closed ? '#fff3e0' : '#e8f5e9';
      h += '<td class="lh-cell" style="padding:4px 6px;text-align:center;border-bottom:1px solid #f0f0f0;cursor:pointer;font-size:11px;background:' + bg + '" data-row="' + i + '" data-day="' + d + '">' + _esc(text) + '</td>';
    }

    if (googleAcct) {
      var gid = loc.google_location_id || '';
      h += '<td style="padding:4px 6px;border-bottom:1px solid #f0f0f0"><input type="text" class="lh-gid-input" data-locpk="' + loc.location_pk + '" value="' + _esc(gid) + '" placeholder="locations/..." style="width:100%;padding:4px 6px;border:1px solid #ccc;border-radius:4px;font-size:11px"></td>';
    }

    h += '<td style="padding:4px 6px;text-align:center;border-bottom:1px solid #f0f0f0;white-space:nowrap">';
    h += '<button class="lh-save-row" data-row="' + i + '" style="padding:4px 8px;font-size:11px;font-weight:600;border:none;border-radius:4px;background:#1976d2;color:#fff;cursor:pointer;margin-right:4px">Save</button>';
    h += '<button class="lh-push-row" data-row="' + i + '" data-locpk="' + loc.location_pk + '" style="padding:4px 8px;font-size:11px;font-weight:600;border:1px solid #ccc;border-radius:4px;background:#fff;color:#333;cursor:pointer">Push</button>';
    h += '</td>';
    h += '</tr>';
  }
  h += '</tbody></table></div>';

  h += '<div id="lh-popup" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.3);z-index:9999;align-items:center;justify-content:center">';
  h += '<div style="background:#fff;border-radius:8px;padding:20px;min-width:280px;box-shadow:0 4px 20px rgba(0,0,0,.15)">';
  h += '<div style="font-weight:700;margin-bottom:12px" id="lh-popup-title"></div>';
  h += '<div style="margin-bottom:8px"><label style="font-size:12px;color:#666"><input type="checkbox" id="lh-popup-closed"> Closed</label></div>';
  h += '<div style="display:flex;gap:8px;margin-bottom:12px">';
  h += '<div><label style="font-size:11px;color:#888;display:block">Open</label><input type="time" id="lh-popup-open" style="padding:6px;border:1px solid #ccc;border-radius:4px;width:120px"></div>';
  h += '<div><label style="font-size:11px;color:#888;display:block">Close</label><input type="time" id="lh-popup-close" style="padding:6px;border:1px solid #ccc;border-radius:4px;width:120px"></div>';
  h += '</div>';
  h += '<div style="display:flex;gap:8px;justify-content:flex-end"><button id="lh-popup-cancel" style="padding:6px 14px;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer;font-size:13px">Cancel</button><button id="lh-popup-ok" style="padding:6px 14px;border:none;border-radius:4px;background:#1976d2;color:#fff;cursor:pointer;font-size:13px">OK</button></div>';
  h += '</div></div>';

  root.innerHTML = h;

  var edits = {};

  var cells = root.querySelectorAll('.lh-cell');
  for (var c = 0; c < cells.length; c++) {
    cells[c].addEventListener('click', function() {
      var row = parseInt(this.dataset.row);
      var day = parseInt(this.dataset.day);
      var dayData = locations[row][day] || {};
      var key = row + '-' + day;
      var edit = edits[key] || dayData;
      var closed = edit.closed !== false;
      document.getElementById('lh-popup').style.display = 'flex';
      document.getElementById('lh-popup').dataset.row = row;
      document.getElementById('lh-popup').dataset.day = day;
      document.getElementById('lh-popup-title').textContent = locations[row].location_name + ' — ' + DAY_LABELS[day];
      document.getElementById('lh-popup-closed').checked = closed;
      document.getElementById('lh-popup-open').value = (!closed && edit.open) ? edit.open : '';
      document.getElementById('lh-popup-close').value = (!closed && edit.close) ? edit.close : '';
      document.getElementById('lh-popup-open').disabled = closed;
      document.getElementById('lh-popup-close').disabled = closed;
    });
  }

  document.getElementById('lh-popup-cancel').addEventListener('click', function() { document.getElementById('lh-popup').style.display = 'none'; });
  document.getElementById('lh-popup-ok').addEventListener('click', function() {
    var closed = document.getElementById('lh-popup-closed').checked;
    var open = document.getElementById('lh-popup-open').value;
    var close = document.getElementById('lh-popup-close').value;
    if (!closed) {
      if (!open && !close) { alert('Please set both open and close times, or check Closed.'); return; }
      if (!open) { alert('Open time is required (or check Closed).'); return; }
      if (!close) { alert('Close time is required (or check Closed).'); return; }
      if (open >= close) { alert('Close time must be after open time.'); return; }
    }
    var row = parseInt(document.getElementById('lh-popup').dataset.row);
    var day = parseInt(document.getElementById('lh-popup').dataset.day);
    edits[row + '-' + day] = { open: closed ? null : open, close: closed ? null : close, closed: closed };
    _updateCell(row, day, closed, open, close, locations);
    document.getElementById('lh-popup').style.display = 'none';
  });

  var saveBtns = root.querySelectorAll('.lh-save-row');
  for (var s = 0; s < saveBtns.length; s++) {
    saveBtns[s].addEventListener('click', function() {
      var row = parseInt(this.dataset.row);
      var loc = locations[row];
      var btn = this;
      btn.disabled = true;
      btn.textContent = '...';
      var payload = [];
      for (var d = 0; d < 7; d++) {
        var key = row + '-' + d;
        var edit = edits[key] || {};
        var existing = loc[d] || {};
        var entry = { location: loc.location_pk, day: d };
        if (existing.id) entry.id = existing.id;
        if (edits.hasOwnProperty(key)) {
          entry.open_time = edit.open ? edit.open + ':00' : null;
          entry.close_time = edit.close ? edit.close + ':00' : null;
        } else {
          entry.open_time = existing.open ? existing.open + ':00' : null;
          entry.close_time = existing.close ? existing.close + ':00' : null;
        }
        payload.push(entry);
      }
      _fetch('/plugin/location-hours/hours/bulk/', { method: 'POST', body: payload }).then(function(data) {
        var all = (data.updated || []).concat(data.created || []);
        for (var i = 0; i < all.length; i++) {
          var h = all[i];
          loc[h.day] = { id: h.id, open: h.open_time ? h.open_time.slice(0,5) : null, close: h.close_time ? h.close_time.slice(0,5) : null, closed: h.is_closed };
        }
        edits = {};
        for (var d2 = 0; d2 < 7; d2++) { _updateCell(row, d2, loc[d2].closed, loc[d2].open, loc[d2].close, locations); }
        _toast('Hours saved for ' + loc.location_name, 'success');
        btn.disabled = false;
        btn.textContent = 'Save';
      }).catch(function(err) {
        _toast('Save failed: ' + (err.message || err), 'error');
        btn.disabled = false;
        btn.textContent = 'Save';
      });
    });
  }

  var pushBtns = root.querySelectorAll('.lh-push-row');
  for (var p = 0; p < pushBtns.length; p++) {
    pushBtns[p].addEventListener('click', function() {
      var locPk = parseInt(this.dataset.locpk);
      var locData = locations.find(function(l) { return l.location_pk === locPk; });
      var locName = locData ? locData.location_name : 'Location ' + locPk;
      var btn = this;
      btn.disabled = true;
      btn.textContent = '...';
      _fetch('/plugin/location-hours/push/' + locPk + '/', { method: 'POST' }).then(function(data) {
        var parts = [];
        for (var i = 0; i < (data.results || []).length; i++) {
          parts.push(data.results[i].webhook + ': ' + (data.results[i].success ? 'OK' : 'FAIL'));
        }
        _toast(locName + ': ' + (parts.length ? parts.join(', ') : 'No endpoints configured'), parts.length ? 'success' : 'error');
        btn.disabled = false;
        btn.textContent = 'Push';
      }).catch(function(err) {
        _toast('Push failed: ' + (err.message || err), 'error');
        btn.disabled = false;
        btn.textContent = 'Push';
      });
    });
  }

  if (googleAcct) {
    var gidInputs = root.querySelectorAll('.lh-gid-input');
    for (var g = 0; g < gidInputs.length; g++) {
      gidInputs[g].addEventListener('blur', function() {
        var locPk = parseInt(this.dataset.locpk);
        var val = this.value.trim();
        var inp = this;
        _fetch('/api/stock/location/' + locPk + '/', {
          method: 'PATCH',
          body: { metadata: { google_location_id: val } }
        }).then(function() {
          inp.style.borderColor = '#2e7d32';
          setTimeout(function() { inp.style.borderColor = '#ccc'; }, 1500);
        }).catch(function(err) {
          inp.style.borderColor = '#c62828';
          _toast('Failed to save Google ID: ' + (err.message || err), 'error');
        });
      });
    }
  }
}

function _updateCell(row, day, closed, open, close, locs) {
  var text = closed ? '—' : (open || '?') + '–' + (close || '?');
  var bg = closed ? '#fff3e0' : '#e8f5e9';
  var cell = document.querySelector('.lh-cell[data-row="' + row + '"][data-day="' + day + '"]');
  if (cell) { cell.textContent = text; cell.style.background = bg; }
  if (!locs[row][day]) locs[row][day] = {};
  locs[row][day].open = open;
  locs[row][day].close = close;
  locs[row][day].closed = closed;
}
