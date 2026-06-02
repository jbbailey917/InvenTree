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

/* ---- main ---- */

export function renderPage(element, context) {
  element.innerHTML = '<div id="lh-bulk-root" style="padding:16px;font-family:-apple-system,BlinkMacSystemFont,Roboto,sans-serif"><div style="text-align:center;padding:32px;color:#888">Loading locations...</div></div>';
  var root = element.querySelector('#lh-bulk-root');

  _fetch('/plugin/location-hours/hours/overview/').then(function(data) {
    var locations = data.locations || [];
    var googleAcct = data.google_account_id || '';
    _renderGrid(root, locations, googleAcct);
  }).catch(function(err) {
    root.innerHTML = '<div style="color:#c62828;padding:16px">Failed to load: ' + _esc(err.message || err) + '</div>';
  });
}

/* ---- render ---- */

function _renderGrid(root, locations, googleAcct) {
  if (locations.length === 0) {
    root.innerHTML = '<div style="text-align:center;padding:32px;color:#888">No locations found.</div>';
    return;
  }

  var h = '';

  /* google account id warning */
  if (!googleAcct) {
    h += '<div style="background:#fff3e0;border:1px solid #ffcc02;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px">';
    h += '<strong style="color:#e65100">Google Account ID not configured.</strong> ';
    h += 'Set it in <em>Settings &rarr; Plugins &rarr; Location Hours Manager</em> to enable Google Location ID fields.';
    h += '</div>';
  }

  h += '<h2 style="margin:0 0 4px;font-size:20px;font-weight:700">Location Hours</h2>';
  h += '<p style="color:#666;font-size:13px;margin:0 0 16px">Click any hour cell to edit. Inline Google IDs save on blur.</p>';

  /* table */
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

    /* google location id */
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

  /* popup editor (same as before) */
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

  /* cell click -> popup */
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

  /* save per row */
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

  /* push per row */
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
        _toast(locName + ': ' + parts.join(', '), 'success');
        btn.disabled = false;
        btn.textContent = 'Push';
      }).catch(function(err) {
        _toast('Push failed: ' + (err.message || err), 'error');
        btn.disabled = false;
        btn.textContent = 'Push';
      });
    });
  }

  /* google location id auto-save on blur */
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
