import { getCurrentUser } from './auth.js';
import { addBlogPost, updateBlogPost, getBlogPost } from './db.js';
import { compressImage, getBase64Size } from './imageCompressor.js';

let currentPostId = null;
let featuredImageBase64 = null;

let quill; // Quill editor instance

async function init() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    // Initialize Quill editor first
    initializeQuill();

    setupImageHandlers();

    // Check if editing existing post (after Quill is ready)
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('id');
    if (editId) {
        await loadPost(editId);
    }

    document.getElementById('save-draft-btn').addEventListener('click', () => savePost('draft'));
    document.getElementById('publish-btn').addEventListener('click', () => savePost('published'));
}

async function loadPost(id) {
    console.log('loadPost called with ID:', id);
    try {
        // Bypass cache to get fresh data for editing
        const post = await getBlogPost(id, true);
        console.log('Fetched post:', post);

        if (post) {
            currentPostId = post.id;
            document.getElementById('post-title').value = post.title;
            document.getElementById('post-description').value = post.description;

            console.log('About to set Quill content:', post.content ? post.content.substring(0, 50) + '...' : 'NO CONTENT');

            // Set Quill content using proper API
            if (post.content) {
                // Use Quill's clipboard API to insert HTML safely
                quill.clipboard.dangerouslyPasteHTML(post.content);
                console.log('Quill content set successfully');
            } else {
                console.warn('Post has no content to load');
            }

            if (post.image_base64 || post.featured_image_base64) {
                featuredImageBase64 = post.image_base64 || post.featured_image_base64;
                showImagePreview(featuredImageBase64);
            }
        } else {
            console.error('No post found with ID:', id);
        }
    } catch (e) {
        console.error("Error loading post", e);
    }
}

function initializeQuill() {
    // Configure Quill with modules
    quill = new Quill('#quill-editor', {
        theme: 'snow',
        placeholder: 'Start writing your article...',
        modules: {
            syntax: {
                highlight: text => hljs.highlightAuto(text).value
            },
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'indent': '-1' }, { 'indent': '+1' }],
                ['link', 'image'],
                [{ 'color': [] }, { 'background': [] }],
                ['clean']
            ]
        }
    });

    // Custom image handler with compression
    const toolbar = quill.getModule('toolbar');
    toolbar.addHandler('image', async () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');

        input.onchange = async () => {
            const file = input.files[0];
            if (file) {
                try {
                    // Compress the image
                    const compressedBase64 = await compressImage(file);

                    // Insert into editor
                    const range = quill.getSelection(true);
                    quill.insertEmbed(range.index, 'image', compressedBase64);
                    quill.setSelection(range.index + 1);
                } catch (error) {
                    console.error('Image compression error:', error);
                    alert('Failed to insert image: ' + error.message);
                }
            }
        };

        input.click();
    });
}

function setupImageHandlers() {
    const input = document.getElementById('featured-image-input');

    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // Show loading indicator
                const loadingMsg = document.createElement('div');
                loadingMsg.textContent = 'Compressing image...';
                loadingMsg.className = 'text-sm text-gray-500 mt-2';
                input.parentElement.appendChild(loadingMsg);

                // Compress the image
                featuredImageBase64 = await compressImage(file);

                // Show size info
                const sizeInfo = getBase64Size(featuredImageBase64);
                loadingMsg.textContent = `Compressed to ${sizeInfo}`;
                setTimeout(() => loadingMsg.remove(), 3000);

                showImagePreview(featuredImageBase64);
            } catch (error) {
                console.error('Compression error:', error);
                alert('Failed to compress image: ' + error.message);
                input.value = '';
            }
        }
    });

    document.getElementById('remove-image-btn').addEventListener('click', () => {
        featuredImageBase64 = null;
        document.getElementById('featured-image-preview').classList.add('hidden');
        input.value = '';
    });
}

function showImagePreview(src) {
    const container = document.getElementById('featured-image-preview');
    const img = container.querySelector('img');
    img.src = src;
    container.classList.remove('hidden');
}

async function savePost(status) {
    const title = document.getElementById('post-title').value;
    const description = document.getElementById('post-description').value;
    const content = quill.root.innerHTML; // Get HTML from Quill

    if (!title) {
        alert("Title is required");
        return;
    }

    const data = {
        title,
        description,
        content,
        image_base64: featuredImageBase64,
        status,
        read_time: Math.ceil(quill.getText().split(' ').length / 200) // Estimate using Quill's getText()
    };

    if (status === 'published') {
        data.published_at = new Date().toISOString();
    }

    try {
        if (currentPostId) {
            await updateBlogPost(currentPostId, data);
            alert("Post updated!");
        } else {
            await addBlogPost(data);
            alert("Post created!");
            window.location.href = '/admin.html';
        }
    } catch (e) {
        console.error("Error saving post", e);
        alert("Error saving post: " + e.message);
    }
}

document.addEventListener('DOMContentLoaded', init);
if (typeof feather !== 'undefined') feather.replace();
