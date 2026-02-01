# Article Data Loading Fix

## Issue Identified
User reported that data was not loading when trying to edit an existing blog post (e.g., `editor.html?id=20251206_003810`).

## Root Cause Analysis
The `init()` function in `editor.js` had the authentication check **commented out**.

```javascript
// const user = await getCurrentUser();
// if (!user) { ... }
```

This caused a **Race Condition**:
1. Page loads and executes `init()` immediately.
2. `init()` calls `loadPost(id)` -> `getBlogPost(id)`.
3. Firestore attempts to fetch the document.
4. **CRITICAL**: The Firebase SDK authenticates asynchronously. At the moment of the fetch request, the user's auth state might not be restored yet (or if the user wasn't strictly logged in but had a session token).
5. If Firestore Security Rules require `request.auth != null`, the read request **FAILS** (Permission Denied).
6. The error was caught and logged to console (`console.error("DEBUG: loadPost failed:", e)`), but **no UI feedback** was shown.
7. Result: Blank editor form.

## The Fix
1. **Restored Auth Check**: Uncommented the `await getCurrentUser()` block in `js/editor.js`.
   - This forces the app to **wait** for Firebase Auth to initialize and verify the user session.
   - Ensures `request.auth` is populated when the Firestore query runs.
   - Redirects unauthenticated users to login page (security best practice).

2. **Added UI Feedback**:
   - Added `alert()` calls if loading fails or post is not found.
   - Now the user will see a tangible error message instead of failing silently.

## Verification Steps
1. Wait for deployment.
2. Clear Browser Cache (Ctrl+Shift+R).
3. Attempt to edit the blog post again.
4. If it works: Data loads.
5. If it fails: You will now see an Alert box with the specific error message (e.g., "Missing permissions", "Not found").
