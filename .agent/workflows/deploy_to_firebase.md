---
description: How to host the portfolio on Firebase
---

# Deploy using Firebase Hosting

Since we have already configured the project for Firebase (Firestore/Auth), hosting it is very straightforward.

## Prerequisites
- You must have Node.js installed.
- You must be logged into the Google Account that owns the Firebase project.

## Steps

1.  **Install Firebase CLI** (if not installed)
    ```powershell
    npm install -g firebase-tools
    ```

2.  **Login to Firebase**
    ```powershell
    firebase login
    ```
    *This will open your browser to authenticate.*

3.  **Initialize Hosting**
    ```powershell
    firebase init hosting
    ```
    - **Select Project**: Choose "Use an existing project" -> Select your project ID.
    - **Public Directory**: Type `.` (current directory) or `.` if you want to host the root files. 
      *Note: Since your HTML files are in the root (`index.html`), using `.` is easiest, but usually we move files to `public`. For now, just use `.` to keep it simple.*
    - **Configure as single-page app**: **Yes** (This redirects all 404s to index.html, useful if we had client-side routing, but fine here too).
    - **Set up automatic builds and deploys with GitHub**: **No** (unless you want that).
    - **File Overwrite**: If it asks to overwrite `index.html`, say **NO**.

4.  **Deploy**
    ```powershell
    firebase deploy
    ```

## Post-Deploy
- You will get a `Hosting URL` (e.g., `https://your-project.web.app`).
- Open that URL to see your live site!
