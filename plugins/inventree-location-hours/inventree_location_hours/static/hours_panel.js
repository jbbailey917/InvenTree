/**
 * Location Hours Panel — rendered on StockLocation detail pages.
 *
 * Export: renderPanel(element, context)
 * Context: { location_id, timezone, google_account_id }
 */

var DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function getCSRFToken() {
  var r = document.cookie.split('; ').find(function(c) { return c.startsWith('csrftoken='); });
  return r ? r.split('=')[1] : '';
}

function apiFetch(url, opts) {
  opts = opts || {};
  opts.headers = opts.headers || {};
  opts.headers['Accept'] = 'application/json';
  opts.headers['X-CSRFToken'] = getCSRFToken();
  opts.credentials = 'same-origin';
  if (opts.body && typeof opts.body === 'object') { opts.body = JSON.stringify(opts.body); opts.headers['Content-Type'] = 'application/json'; }
  return fetch(url, opts).then(function(r) { if (!r.ok) return r.json().then(function(e) { throw new Error((e.detail) || r.statusText); }); return r.json(); });
}

/* ---- main ---- */

export function renderPanel(element, context) {
  var locId = (context && (context.location_id || (context.context && context.context.location_id))) || 0;
  var tz = (context && (context.timezone || (context.context && context.context.timezone))) || 'America/Chicago';
  var googleAcct = (context && (context.google_account_id || (context.context && context.context.google_account_id))) || '';

  element.innerHTML = '<div id="loc-hours-panel" class="lh-panel"></div>';
  var root = element.querySelector('#loc-hours-panel');
  root.innerHTML = '<div class="lh-loading">Loading...</div>';

  /* state */
  var state = { locId: locId, tz: tz, googleAcct: googleAcct, hours: [], endpoints: [], pushResult: null };

  /* fetch all data */
  var fetches = [
    apiFetch('/plugin/location-hours/hours/?location=' + locId).catch(function() { return []; }),
    apiFetch('/plugin/location-hours/endpoints/').catch(function() { return []; }),
  ];
  if (googleAcct) {
    fetches.push(apiFetch('/api/stock/location/' + locId + '/').catch(function() { return {}; }));
  }
  Promise.all(fetches).then(function(results) {
    var rawHours = results[0];
    var hoursList = Array.isArray(rawHours) ? rawHours : (rawHours.results || []);
    var endpoints = Array.isArray(results[1]) ? results[1] : (results[1].results || []);
    if (results[2]) {
      var meta = results[2].metadata || {};
      state.googleId = meta.google_location_id || '';
    }
    state.hours = _normalizeHours(hoursList, locId);
    state.endpoints = endpoints;
    _render(state, root);
  }).catch(function(err) {
    root.innerHTML = '<div style="color:#c62828;padding:16px">Failed to load: ' + (err.message || err) + '</div>';
  });
}

/* ---- data ---- */

function _normalizeHours(list, locId) {
  var map = {};
  for (var i = 0; i < list.length; i++) { map[list[i].day] = list[i]; }
  var out = [];
  for (var d = 0; d < 7; d++) {
    if (map[d]) { out.push(map[d]); }
    else { out.push({ location: locId, day: d, open_time: null, close_time: null, is_closed: true }); }
  }
  return out;
}

/* ---- render ---- */

function _render(state, root) {
  var h = '';
  h += '<table class="lh-table"><thead><tr><th>Day</th><th>Open</th><th>Close</th><th>Status</th></tr></thead><tbody>';
  for (var i = 0; i < state.hours.length; i++) {
    var hr = state.hours[i];
    var closed = hr.is_closed;
    h += '<tr>';
    h += '<td style="font-weight:600">' + DAYS[i] + '</td>';
    h += '<td><input type="time" class="lh-time" id="lh-open-' + i + '" value="' + (hr.open_time || '') + '" ' + (closed ? 'disabled' : '') + '></td>';
    h += '<td><input type="time" class="lh-time" id="lh-close-' + i + '" value="' + (hr.close_time || '') + '" ' + (closed ? 'disabled' : '') + '></td>';
    h += '<td><label class="lh-toggle"><input type="checkbox" id="lh-closed-' + i + '" ' + (closed ? 'checked' : '') + ' onchange="_toggleDay(' + i + ')"> Closed</label></td>';
    h += '</tr>';
  }
  h += '</tbody></table>';

  /* google location id */
  h += '<div class="lh-field"><label>Google Location ID</label>';
  if (!state.googleAcct) {
    h += '<div style="font-size:11px;color:#e65100;margin-bottom:4px">Set <em>Google Account ID</em> in plugin settings to enable.</div>';
    h += '<input type="text" disabled placeholder="Unavailable — configure plugin first" style="width:100%;padding:6px 8px;border:1px solid #ccc;border-radius:4px;font-size:13px;background:#f5f5f5">';
  } else {
    h += '<input type="text" id="lh-google-id" placeholder="locations/..." value="' + _esc(state.googleId || '') + '" style="width:100%;padding:6px 8px;border:1px solid #ccc;border-radius:4px;font-size:13px">';
  }
  h += '</div>';

  /* webhook status */
  if (state.endpoints.length > 0) {
    h += '<div class="lh-field"><label>Webhooks</label>';
    for (var j = 0; j < state.endpoints.length; j++) {
      var ep = state.endpoints[j];
      var dot = ep.active ? '#2e7d32' : '#999';
      var lbl = ep.trigger === 'on_save' ? 'auto' : 'manual';
      h += '<div style="font-size:12px;margin:2px 0"><span style="color:' + dot + ';margin-right:6px">&#9679;</span>' + _esc(ep.name) + ' <span style="color:#888;font-size:11px">(' + lbl + ')</span></div>';
    }
  }

  /* buttons */
  h += '<div class="lh-buttons"><button class="lh-btn lh-btn-primary" id="lh-save">Save Hours</button>';
  h += '<button class="lh-btn lh-btn-secondary" id="lh-push">Push to Webhooks</button></div>';

  /* last push result */
  if (state.pushResult) {
    h += '<div class="lh-push-result">Last push: ' + _esc(state.pushResult) + '</div>';
  }

  root.innerHTML = h;

  /* events */
  document.getElementById('lh-save').addEventListener('click', function() { _save(state, root); });
  document.getElementById('lh-push').addEventListener('click', function() { _push(state, root); });
  /* store toggle handler on window so it's accessible from inline onclick */
  window._toggleDay = function(idx) {
    var cb = document.getElementById('lh-closed-' + idx);
    var closed = cb.checked;
    document.getElementById('lh-open-' + idx).disabled = closed;
    document.getElementById('lh-close-' + idx).disabled = closed;
    state.hours[idx].is_closed = closed;
  };

  /* inject styles once */
  if (!document.getElementById('lh-styles')) {
    var s = document.createElement('style');
    s.id = 'lh-styles';
    s.textContent = '.lh-panel{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:4px 0}' +
      '.lh-table{width:100%;border-collapse:collapse;font-size:13px}' +
      '.lh-table th{background:#fafafa;padding:8px 10px;text-align:left;font-weight:600;color:#555;font-size:11px;text-transform:uppercase;border-bottom:1px solid #e0e0e0}' +
      '.lh-table td{padding:6px 10px;border-bottom:1px solid #f0f0f0}' +
      '.lh-time{width:120px;padding:6px 8px;border:1px solid #ccc;border-radius:4px;font-size:13px}' +
      '.lh-time:disabled{background:#f5f5f5;color:#999}' +
      '.lh-toggle{font-size:12px;color:#666;cursor:pointer;display:flex;align-items:center;gap:4px}' +
      '.lh-field{margin:12px 0}' +
      '.lh-field label{display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:4px}' +
      '.lh-field input[type=text]{width:100%;padding:6px 8px;border:1px solid #ccc;border-radius:4px;font-size:13px}' +
      '.lh-buttons{display:flex;gap:8px;margin:12px 0}' +
      '.lh-btn{padding:7px 16px;font-size:13px;font-weight:600;border:none;border-radius:6px;cursor:pointer}' +
      '.lh-btn-primary{background:#1976d2;color:#fff}' +
      '.lh-btn-primary:hover{background:#1565c0}' +
      '.lh-btn-secondary{background:#e0e0e0;color:#333}' +
      '.lh-btn-secondary:hover{background:#d0d0d0}' +
      '.lh-loading{text-align:center;padding:24px;color:#888}' +
      '.lh-push-result{font-size:11px;color:#666;margin-top:8px;padding:8px;background:#f5f5f5;border-radius:4px}';
    document.head.appendChild(s);
  }
}

function _esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* ---- actions ---- */

function _save(state, root) {
  /* gather hours data from DOM */
  var payload = [];
  for (var i = 0; i < state.hours.length; i++) {
    var hr = state.hours[i];
    var closed = document.getElementById('lh-closed-' + i).checked;
    var openVal = document.getElementById('lh-open-' + i).value;
    var closeVal = document.getElementById('lh-close-' + i).value;
    /* validate: if not closed, both times required */
    if (!closed) {
      if (!openVal && !closeVal) { closed = true; /* treat as closed */ }
      else if (!openVal) { _showToast(DAYS[i] + ': Open time is required (or check Closed)', 'error'); return; }
      else if (!closeVal) { _showToast(DAYS[i] + ': Close time is required (or check Closed)', 'error'); return; }
      else if (openVal >= closeVal) { _showToast(DAYS[i] + ': Close must be after open', 'error'); return; }
    }
    var entry = { day: hr.day, location: state.locId };
    if (hr.id) entry.id = hr.id;
    if (closed) { entry.open_time = null; entry.close_time = null; }
    else { entry.open_time = openVal + ':00'; entry.close_time = closeVal + ':00'; }
    payload.push(entry);
  }

  /* optionally save google location id */
  var promises = [apiFetch('/plugin/location-hours/hours/bulk/', { method: 'POST', body: payload })];
  if (state.googleAcct) {
    var googleId = document.getElementById('lh-google-id').value.trim();
    promises.push(apiFetch('/api/stock/location/' + state.locId + '/', {
      method: 'PATCH',
      body: { metadata: { google_location_id: googleId } }
    }));
  }

  Promise.all(promises).then(function() {
    _showToast('Hours saved', 'success');
    /* refresh state */
    return apiFetch('/plugin/location-hours/hours/?location=' + state.locId);
  }).then(function(data) {
    var list = Array.isArray(data) ? data : (data.results || []);
    state.hours = _normalizeHours(list, state.locId);
    _render(state, root);
  }).catch(function(err) {
    _showToast('Save failed: ' + (err.message || err), 'error');
  });
}

function _push(state, root) {
  var btn = document.getElementById('lh-push');
  btn.disabled = true;
  btn.textContent = 'Pushing...';
  apiFetch('/plugin/location-hours/push/' + state.locId + '/', { method: 'POST' }).then(function(data) {
    var results = data.results || [];
    var parts = [];
    for (var i = 0; i < results.length; i++) {
      parts.push(results[i].webhook + ': ' + (results[i].success ? 'OK ' + results[i].code : 'FAIL'));
    }
    state.pushResult = parts.join(' | ') + ' (' + new Date().toLocaleTimeString() + ')';
    _render(state, root);
  }).catch(function(err) {
    state.pushResult = 'Error: ' + (err.message || err);
    _render(state, root);
  });
}

function _showToast(msg, type) {
  var el = document.createElement('div');
  el.style.cssText = 'position:fixed;bottom:24px;right:24px;padding:10px 18px;border-radius:6px;font-size:13px;font-weight:500;z-index:9999;color:#fff;' +
    (type === 'success' ? 'background:#2e7d32' : 'background:#c62828');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(function() { el.remove(); }, 3000);
}
