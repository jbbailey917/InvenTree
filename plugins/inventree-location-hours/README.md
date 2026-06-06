# Location Hours Plugin

Manage operating hours per stock location and push updates to Google Business Profile via OAuth.

## Setup

1. Enable the plugin in **Settings → Plugins → Location Hours Manager**
2. Configure:
   - **Google Account ID** — `accounts/123` format
   - **Google OAuth Client ID / Secret** — from Google API Console (see below)
   - **Default Timezone** — IANA timezone string (default: `America/Chicago`)

## Connecting Google

The plugin uses OAuth 2.0 — no manual token management needed.

**One-time setup by your administrator:**

1. Go to the [Google API Console](https://console.cloud.google.com/apis/credentials)
2. Create a project, then enable the [Business Information API](https://console.cloud.google.com/apis/library/mybusinessbusinessinformation.googleapis.com) and [Account Management API](https://console.cloud.google.com/apis/library/mybusinessaccountmanagement.googleapis.com)
3. Go to **Credentials → Create Credentials → OAuth client ID → Web application**
4. Add `https://<your-inventree-domain>/plugin/location-hours/google-auth/callback/` as an authorized redirect URI
5. Copy the **Client ID** and **Client Secret** into the plugin settings

**Each business owner just clicks once:**

1. Open **Location Hours** from the navigation sidebar
2. Click **Connect Google** → sign in with the Google account that manages their Business Profile
3. Done. The bar shows "Connected as [email]" and they're ready to push

Tokens refresh automatically. If a connection expires, just click Connect Google again.

**Full Google docs:** [Basic setup](https://developers.google.com/my-business/content/basic-setup) · [OAuth guide](https://developers.google.com/my-business/content/implement-oauth)

## Managing API Keys (manual fallback)

If OAuth isn't configured, you can store API keys manually:

1. Expand the **API Keys** section at the top of the page
2. Click **+ Add Key**, give it a name and paste the token
3. Keys are encrypted in the database and **cannot be retrieved after creation**

The push action uses the OAuth connection if available, falling back to a stored API key.

## Setting Location Hours

1. Open **Location Hours** from the navigation sidebar
2. Click any day cell to open the time editor
3. Set open/close times or check **Closed**
4. Click **Save** on the row, then **Push** to send to Google

Structural locations, external locations, and locations with "lost" or "stolen" in the name are hidden.

## API Endpoints

All endpoints require InvenTree authentication.

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/plugin/location-hours/hours/` | List or create hours entries |
| GET/PUT/DELETE | `/plugin/location-hours/hours/<pk>/` | Get, update, or delete an entry |
| POST | `/plugin/location-hours/hours/bulk/` | Bulk upsert hours for a location |
| GET | `/plugin/location-hours/hours/overview/` | All locations with hours summary |
| POST | `/plugin/location-hours/push/<location_pk>/` | Push hours to Google for a location |
| GET/POST | `/plugin/location-hours/endpoints/` | List or create webhook endpoints |
| GET/PUT/DELETE | `/plugin/location-hours/endpoints/<pk>/` | Get, update, or delete an endpoint |
| GET | `/plugin/location-hours/logs/` | Push dispatch audit log |
| GET/POST | `/plugin/location-hours/api-keys/` | List or create stored API keys |
| GET/PUT/DELETE | `/plugin/location-hours/api-keys/<pk>/` | Get, update, or delete a stored key |
| GET | `/plugin/location-hours/google-auth/` | Initiate Google OAuth flow |
| GET | `/plugin/location-hours/google-auth/callback/` | OAuth callback handler |
| GET | `/plugin/location-hours/google-auth/status/` | Connection status |
| POST | `/plugin/location-hours/google-disconnect/` | Disconnect Google account |

## Push Payload

```json
{
  "event": "hours_updated",
  "location_id": 11,
  "location_name": "Front Store",
  "google_location_id": "locations/123456789",
  "timezone": "America/Chicago",
  "hours": [
    {"day": 0, "day_name": "Monday", "open": "09:00", "close": "17:00", "closed": false},
    {"day": 6, "day_name": "Sunday", "open": null, "close": null, "closed": true}
  ]
}
```
