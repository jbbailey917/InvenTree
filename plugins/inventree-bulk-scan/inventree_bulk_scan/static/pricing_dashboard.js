/**
 * Pricing Dashboard Widget for InvenTree.
 *
 * Renders a compact card showing aggregate pricing/markup data
 * fetched from the plugin's own API endpoint.
 *
 * Expected function signature (per InvenTree dashboard convention):
 *   renderDashboardItem(target, data)
 *
 * - target: DOM element to render into
 * - data:   context object passed by the dashboard framework
 */

export function renderDashboardItem(target, data) {
  if (!target) {
    console.error('renderDashboardItem: no target element');
    return;
  }

  // Show a loading state immediately
  target.innerHTML = `
    <div style="padding:16px;text-align:center;color:#888;">
      Loading pricing data...
    </div>
  `;

  // Build the API URL relative to the current host
  const baseUrl =
    data?.context?.base_url ??
    window.location.origin;
  const pricingUrl = `${baseUrl}/plugin/bulk-scan/api/pricing/`;

  fetch(pricingUrl, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
    .then(function (res) {
      if (!res.ok) {
        throw new Error('HTTP ' + res.status);
      }
      return res.json();
    })
    .then(function (d) {
      render(target, d);
    })
    .catch(function (err) {
      target.innerHTML = `
        <div style="padding:16px;text-align:center;color:#c00;">
          Failed to load pricing data: ${err.message}
        </div>
      `;
    });
}

/* ------------------------------------------------------------------ */
/*  Internal render helpers                                           */
/* ------------------------------------------------------------------ */

function fmt(n) {
  if (n == null) return '-';
  return '$' + Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function render(target, data) {
  var retail = data.total_retail_value || 0;
  var cost = data.total_stock_cost || 0;
  var markup = data.overall_markup_pct || 0;
  var top = data.top_parts || [];

  var topRows = '';
  if (top.length === 0) {
    topRows =
      '<div style="grid-column:1/-1;text-align:center;color:#999;padding:8px 0;">No parts with markup data</div>';
  } else {
    top.forEach(function (p, i) {
      topRows +=
        '<div style="display:flex;justify-content:space-between;padding:4px 0;' +
        (i < top.length - 1
          ? 'border-bottom:1px solid #f0f0f0;'
          : '') +
        '">' +
        '<span style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px;" title="' +
        esc(p.name) +
        '">' +
        esc(p.name) +
        '</span>' +
        '<span style="font-size:13px;font-weight:600;white-space:nowrap;margin-left:8px;">' +
        Number(p.markup_pct || 0).toFixed(1) +
        '%</span>' +
        '</div>';
    });
  }

  target.innerHTML =
    '<div style="padding:12px 16px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    /* ---- summary cards ---- */
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">' +
    card('Retail Value', fmt(retail), '#2e7d32') +
    card('Stock Cost', fmt(cost), '#1565c0') +
    card('Markup', Number(markup).toFixed(1) + '%', '#e65100') +
    '</div>' +
    /* ---- top parts ---- */
    '<div style="font-size:12px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Top Parts by Markup</div>' +
    '<div style="background:#fafafa;border-radius:6px;padding:4px 10px;">' +
    topRows +
    '</div>' +
    '</div>';
}

function card(label, value, color) {
  return (
    '<div style="background:#fafafa;border-radius:6px;padding:8px 10px;text-align:center;border-left:3px solid ' +
    color +
    ';">' +
    '<div style="font-size:18px;font-weight:700;color:' +
    color +
    ';">' +
    value +
    '</div>' +
    '<div style="font-size:11px;color:#888;margin-top:2px;">' +
    label +
    '</div>' +
    '</div>'
  );
}

function esc(s) {
  if (typeof s !== 'string') return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(s));
  return div.innerHTML;
}
