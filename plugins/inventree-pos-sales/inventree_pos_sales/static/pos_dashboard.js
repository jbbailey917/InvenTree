/* POS Sales Dashboard Widget
 * Renders a summary card showing POS webhook configuration status.
 * Function: renderPosDashboard(context)
 */
function renderPosDashboard(context) {
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
        /* Configured state — show details */
        html += '<div style="flex: 1; padding: 14px 16px; overflow-y: auto;">';

        /* Endpoint */
        html += '<div style="margin-bottom: 12px;">';
        html += '  <div style="font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Receipt API Endpoint</div>';
        html += '  <div style="font-size: 13px; color: #333; font-family: \'SFMono-Regular\', Consolas, \'Liberation Mono\', Menlo, monospace; word-break: break-all;">https://&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;</div>';
        html += '</div>';

        /* Service User */
        html += '<div style="margin-bottom: 12px;">';
        html += '  <div style="font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Service User</div>';
        html += '  <div style="font-size: 13px; color: #333;">' + escapeHtml(serviceUser) + '</div>';
        html += '</div>';

        /* Webhook URL (copyable) */
        html += '<div style="margin-bottom: 12px;">';
        html += '  <div style="font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Webhook Endpoint</div>';
        html += '  <div style="background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 6px; padding: 10px 12px; font-family: \'SFMono-Regular\', Consolas, \'Liberation Mono\', Menlo, monospace; font-size: 12px; display: flex; align-items: center; gap: 8px;">';
        html += '    <span style="background: #1565c0; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 3px; text-transform: uppercase;">POST</span>';
        html += '    <code style="flex: 1; color: #333; word-break: break-all;">' + escapeHtml(webhookUrl) + '</code>';
        html += '    <button onclick="copyToClipboard(\'' + escapeHtml(webhookUrl) + '\')" style="background: none; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; font-size: 14px; padding: 2px 6px; line-height: 1;" title="Copy URL">&square;</button>';
        html += '  </div>';
        html += '</div>';

        /* Example payload */
        html += '<div>';
        html += '  <div style="font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Example Payload</div>';
        html += '  <pre style="background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 6px; padding: 10px 12px; font-family: \'SFMono-Regular\', Consolas, \'Liberation Mono\', Menlo, monospace; font-size: 11px; line-height: 1.5; color: #333; overflow-x: auto; margin: 0; white-space: pre-wrap;">';
        html += JSON.stringify({
            receipt_id: "RCP-001234",
            transaction_type: "sale",
            total: 149.99,
            items: [
                {sku: "ABC-123", qty: 2, price: 25.00},
                {sku: "DEF-456", qty: 1, price: 99.99}
            ]
        }, null, 2);
        html += '  </pre>';
        html += '</div>';

        html += '</div>';
    }

    html += '</div>';
    return html;
}

/* Utility: HTML-escape a string */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* Utility: copy text to clipboard */
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function() {});
    } else {
        var el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(el);
    }
}

/** ES module export for InvenTree RemoteComponent (page rendering). */
export function renderPage(element, context) {
  element.innerHTML = '';
  element.style.padding = '24px';
  element.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  // Build page context from the InvenTree plugin context
  var pageContext = {
    endpoint_configured: false,
    service_user: 'admin',
    webhook_url: '/plugin/pos-sales/pos-webhook/'
  };

  // Try to load plugin settings to check if endpoint is configured
  if (context && context.api) {
    context.api.get('/api/plugins/pos-sales/settings/')
      .then(function(response) {
        if (response && response.data) {
          var settings = response.data;
          for (var i = 0; i < settings.length; i++) {
            if (settings[i].key === 'RECEIPT_API_ENDPOINT' && settings[i].value) {
              pageContext.endpoint_configured = true;
            }
            if (settings[i].key === 'SERVICE_USERNAME' && settings[i].value) {
              pageContext.service_user = settings[i].value;
            }
          }
        }
        element.innerHTML = renderPosDashboard(pageContext);
      })
      .catch(function() {
        element.innerHTML = renderPosDashboard(pageContext);
      });
  } else {
    element.innerHTML = renderPosDashboard(pageContext);
  }
}
