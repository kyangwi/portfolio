# Article Editor Bug Fixes

## Issues Identified and Fixed

### 1. ✅ Publishing/Updating Articles Not Working Properly
**Location:** `js/editor.js` (lines 195-207)

**Problem:**
- When editing an existing article and clicking "Publish" or "Save Draft", the post would update in the database but the page would NOT redirect
- Users would remain on the editor page with only an alert, making it unclear if the changes were saved
- Only NEW posts would redirect to the admin dashboard

**Root Cause:**
The `savePost()` function had this logic:
```javascript
if (currentPostId) {
    await updateBlogPost(currentPostId, data);
    alert("Post updated!");
    // ❌ Missing redirect here!
} else {
    await addBlogPost(data);
    alert("Post created!");
    window.location.href = '/admin.html'; // ✅ Only new posts redirected
}
```

**Solution:**
Added redirect after updating existing posts and improved feedback messages:
```javascript
if (currentPostId) {
    await updateBlogPost(currentPostId, data);
    alert(`Post ${status === 'published' ? 'published' : 'saved as draft'}!`);
    window.location.href = '/admin.html'; // ✅ Now redirects
} else {
    await addBlogPost(data);
    alert(`Post ${status === 'published' ? 'published' : 'saved as draft'}!`);
    window.location.href = '/admin.html';
}
```

---

### 2. ✅ Blog Data Not Loading in Dashboard (Date Display Error)
**Location:** `js/admin.js` (line 138)

**Problem:**
- Draft articles don't have a `published_at` field (it's null/undefined)
- Code tried to format null as a date: `new Date(b.published_at).toLocaleDateString()`
- This caused JavaScript errors that could break the entire blog table display

**Root Cause:**
```javascript
${new Date(b.published_at).toLocaleDateString()} // ❌ Fails when published_at is null
```

**Solution:**
Added fallback logic to handle missing dates:
```javascript
${b.published_at || b.created_at ? new Date(b.published_at || b.created_at).toLocaleDateString() : '-'}
```

This now:
1. Uses `published_at` if available
2. Falls back to `created_at` if `published_at` is null
3. Displays '-' if both are missing
4. Prevents JavaScript Date errors

---

## Files Modified

1. **`c:\Users\Josh\Desktop\portfolio\js\editor.js`**
   - Added redirect after updating posts
   - Improved alert messages to show publish/draft status

2. **`c:\Users\Josh\Desktop\portfolio\js\admin.js`**
   - Fixed date display to handle null/undefined dates
   - Prevents JavaScript errors in blog table

---

## Testing Recommendations

### Manual Testing Steps:
1. **Test Loading Existing Article:**
   - Go to admin dashboard
   - Click "Blog Posts" tab
   - Click "Edit" on an existing article
   - ✅ Verify: Article title, description, content, and image load correctly

2. **Test Publishing Article:**
   - Edit an existing article
   - Make some changes
   - Click "Publish"
   - ✅ Verify: Shows "Post published!" alert
   - ✅ Verify: Redirects to admin dashboard
   - ✅ Verify: Changes are reflected in the dashboard

3. **Test Saving Draft:**
   - Edit an article
   - Click "Save Draft"
   - ✅ Verify: Shows "Post saved as draft!" alert
   - ✅ Verify: Redirects to admin dashboard
   - ✅ Verify: Status shows "draft" badge

4. **Test Dashboard Display:**
   - View blog posts in admin dashboard
   - ✅ Verify: Draft posts show their creation date or '-'
   - ✅ Verify: Published posts show their publication date
   - ✅ Verify: No JavaScript errors in console

---

## Code Quality Notes

The existing `getBlogPost()` function in `db.js` is well-implemented with:
- ✅ Cache bypass option for editing
- ✅ Proper error handling
- ✅ Debug logging
- ✅ Fallback from document ID to post_id query
- ✅ Data normalization for Firestore timestamps

The issues were specifically in the editor's save flow and the admin dashboard's date rendering, both of which have now been fixed.

---

## Additional Context

**Why Projects Work But Blogs Didn't:**
- Projects don't have a status field (draft/published), so they don't have conditional date logic
- The project editor likely had the redirect implemented from the start
- Blogs have more complex state management (draft vs published) which revealed these edge cases
