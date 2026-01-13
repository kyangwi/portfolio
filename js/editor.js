import { getCurrentUser } from './auth.js';
import { addBlogPost, updateBlogPost, getBlogPost } from './db.js';

let currentPostId = null;
let featuredImageBase64 = null;

async function init() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    // Check if editing existing post
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('id');
    if (editId) {
        loadPost(editId);
    }

    setupToolbar();
    setupImageHandlers();

    document.getElementById('save-draft-btn').addEventListener('click', () => savePost('draft'));
    document.getElementById('publish-btn').addEventListener('click', () => savePost('published'));
}

async function loadPost(id) {
    try {
        const post = await getBlogPost(id);
        if (post) {
            currentPostId = post.id; // Store doc ID
            document.getElementById('post-title').value = post.title;
            document.getElementById('post-description').value = post.description;
            document.getElementById('editor-content').innerHTML = post.content;

            if (post.image_base64 || post.featured_image_base64) {
                featuredImageBase64 = post.image_base64 || post.featured_image_base64;
                showImagePreview(featuredImageBase64);
            }
        }
    } catch (e) {
        console.error("Error loading post", e);
    }
}

function setupToolbar() {
    document.querySelectorAll('[data-cmd]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const cmd = btn.dataset.cmd;
            const val = btn.dataset.val;
            document.execCommand(cmd, false, val);
            document.getElementById('editor-content').focus();
        });
    });

    document.getElementById('create-link-btn').addEventListener('click', () => {
        const url = prompt("Enter URL:", "https://");
        if (url) document.execCommand("createLink", false, url);
    });

    document.getElementById('insert-img-btn').addEventListener('click', () => {
        const url = prompt("Enter Image URL:", "https://");
        if (url) document.execCommand("insertImage", false, url);
    });
}

function setupImageHandlers() {
    const input = document.getElementById('featured-image-input');

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                featuredImageBase64 = evt.target.result;
                showImagePreview(featuredImageBase64);
            };
            reader.readAsDataURL(file);
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
    const content = document.getElementById('editor-content').innerHTML;

    if (!title) {
        alert("Title is required");
        return;
    }

    const data = {
        title,
        description,
        content,
        image_base64: featuredImageBase64, // Use image_base64 to be consistent
        status,
        read_time: Math.ceil(content.split(' ').length / 200) // Simple estimate
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
