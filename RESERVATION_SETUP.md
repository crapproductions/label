# CRAP PRODUCTIONS Reservation Setup

The contact page now has a RESERVATION popup.

Files added:

- `contact.html` — button, modal, form markup
- `reservation.css` — popup styling
- `reservation.js` — popup open/close and form submit state
- `google-apps-script/reservation-web-app.js` — Google Apps Script code for saving submissions to Google Sheets

## Finish the Google Sheets connection

1. Create a new Google Sheet.
2. In the sheet, open `Extensions` > `Apps Script`.
3. Copy the full code from `google-apps-script/reservation-web-app.js` into Apps Script.
4. Click `Deploy` > `New deployment`.
5. Select type: `Web app`.
6. Use these settings:
   - Execute as: `Me`
   - Who has access: `Anyone`
7. Copy the deployed Web app URL.
8. In `contact.html`, replace:

```html
action="PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE"
```

with the deployed Web app URL.

After that, submissions from the CONTACT page reservation popup will be saved into the `Reservations` sheet.
