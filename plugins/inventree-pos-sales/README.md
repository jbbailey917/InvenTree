# inventree-pos-sales

InvenTree plugin that automates sales order workflow from POS webhook events.

## How it works

1. Your POS system sends a POST to `/plugin/pos-sales/pos-webhook/` with a `receipt_id` and `location_id`
2. The plugin fetches receipt line items from the configured external POS API
3. It creates/updates a customer for the POS location
4. A sales order is created, issued, stock is allocated, and the shipment is completed — all automatically

## Setup

Enable the plugin in InvenTree's plugin settings, then configure:

- **Receipt API Endpoint**: URL of your POS API that returns receipt data
- **Receipt API Key**: Bearer token for authenticating with the POS API
- **Service User**: InvenTree user that owns the created orders (default: `admin`)

## Webhook payload

```json
POST /plugin/pos-sales/pos-webhook/
{
    "receipt_id": "RECEIPT-123",
    "location_id": "STORE-5"
}
```

The `location_id` must match either the PK or name of an InvenTree StockLocation.

## Development

```bash
# Inside the InvenTree devcontainer
pip install -e /home/inventree/plugins/inventree-pos-sales/
```
