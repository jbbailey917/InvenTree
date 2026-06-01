"""Simple view that serves the bulk scan page."""

from django.http import HttpResponse
from django.views import View


class BulkScanView(View):
    """Serves the bulk barcode scanning page as a standalone HTML document.

    The page loads the bulk_scan_page.js script which handles all UI rendering
    and logic.  The JS is served from InvenTree's plugin static file system at
    ``/static/plugins/bulk-scan/bulk_scan_page.js``.
    """

    def get(self, request):
        """Handle GET request — serve the bulk scan HTML page."""
        html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bulk Barcode Scan</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f5f5f5;
    color: #333;
    line-height: 1.5;
  }
  #bulk-scan-root { max-width: 1200px; margin: 0 auto; padding: 20px; }
</style>
</head>
<body>
  <div id="bulk-scan-root"></div>
  <script src="/static/plugins/bulk-scan/bulk_scan_page.js"></script>
  <script>if (typeof initBulkScan === 'function') initBulkScan('bulk-scan-root');</script>
</body>
</html>"""
        return HttpResponse(html)
