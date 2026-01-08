# Recipe Planner Browser Extension - Installation Guide

Save recipes from any website directly to your Recipe Planner account!

## Installation Steps

### 1. Extract the ZIP File
- Unzip `recipe-planner-extension.zip` to a folder on your computer
- Remember where you saved it (e.g., `Documents/recipe-planner-extension`)
- **Important:** Don't delete this folder - Chrome needs it to run the extension

### 2. Install in Chrome
1. Open Google Chrome
2. Go to `chrome://extensions/` (copy/paste this into the address bar)
3. Turn ON "Developer mode" (toggle switch in top-right corner)
4. Click "Load unpacked"
5. Navigate to the folder where you extracted the ZIP
6. Select the `dist` folder
7. Click "Select" - the extension should now appear!

### 3. Get Your API Key
1. Go to https://recipe-planner-api-fk36.onrender.com
2. Log in with your account
3. Click "Settings" in the navigation menu
4. Enter a name for your API key (e.g., "Chrome Extension")
5. Click "Create API Key"
6. **IMPORTANT:** Copy the full API key immediately - you won't see it again!
   - It looks like: `rp_live_abc123...`

### 4. Configure the Extension
1. Click the extension icon in Chrome (puzzle piece icon → Recipe Planner)
2. Go to the "Settings" tab
3. Paste your API key
4. Select "Production (Render)" from the dropdown
5. Click "Save Settings"
6. Click "Test Connection" - you should see "Connection successful!"

## Using the Extension

1. Navigate to any recipe website (e.g., allrecipes.com, foodnetwork.com)
2. Click the Recipe Planner extension icon
3. The recipe will auto-extract (or you can fill it in manually)
4. Review and edit if needed
5. Click "Save Recipe"
6. Check your Recipe Planner app - it should appear instantly!

## Troubleshooting

**"Connection failed: 404"**
- Make sure you selected "Production (Render)" in the environment dropdown

**"Invalid API key"**
- Copy the API key again from the Settings page
- Make sure you pasted the entire key (starts with `rp_live_` or `rp_dev_`)

**Extension disappeared after restarting Chrome**
- This is normal for unpacked extensions
- Go back to `chrome://extensions/` - it should still be there
- If not, just reload it using the same steps

**Recipe not extracting**
- Some websites don't use standard recipe formats
- Use the "Re-extract from Page" button, or
- Fill in the recipe details manually

## Need Help?
Contact Uma for support!

---
Version 1.0.0 | Built with Claude Code
