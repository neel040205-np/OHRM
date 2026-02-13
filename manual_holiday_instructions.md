# How to Manually Add Holidays

If the automatic seeding doesn't work or you want to add more holidays, you can use the API directly.

## Option 1: Use the UI (If Implemented)

Currently, the UI for adding holidays is not implemented in the HR dashboard. You would need to add a form in `DashboardHR.jsx` to call the `/api/holidays/add` endpoint.

## Option 2: Use CURL (Command Line)

You can run this command in your terminal to add Holi manually. You need the HR's authentication token.

1.  **Login as HR** and retrieve the token from LocalStorage (DevTools -> Application -> Local Storage). or simply use the seed command which is easier.

2.  **Run Seed Command** (simplest):
    The server has a seed endpoint that adds Holi. If it's not showing, try restarting the server and running:
    `curl -X POST http://localhost:5001/api/holidays/seed`

## Verification

After running the seed command, check if the holiday exists:
`curl http://localhost:5001/api/holidays?upcoming=true`
