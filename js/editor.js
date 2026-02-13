import { getCurrentUser } from './auth.js';
import { addBlogPost, updateBlogPost, getBlogPost, getAllBlogs } from './db.js';
import { compressImage, getBase64Size } from './imageCompressor.js';

const state = {
    quill: null,
    currentPostId: null,
    featuredImageBase64: null,
    isSaving: false
};

function byId(id) {
    return document.getElementById(id);
}

function getEditIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function isEffectivelyEmptyPost(post) {
    if (!post) return true;
    if (isNonEmptyString(post.title)) return false;
    if (isNonEmptyString(post.description)) return false;
    if (isNonEmptyString(post.content)) return false;
    if (post.image_base64 || post.featured_image_base64) return false;
    return true;
}

function pickBestPostCandidate(candidates) {
    const score = (post) => {
        let s = 0;
        if (isNonEmptyString(post?.title)) s += 3;
        if (isNonEmptyString(post?.content)) s += 3;
        if (isNonEmptyString(post?.description)) s += 2;
        if (post?.image_base64 || post?.featured_image_base64) s += 1;
        if (post?.status === 'published') s += 1;
        return s;
    };

    return candidates.slice().sort((a, b) => score(b) - score(a))[0] || null;
}

function initializeQuill() {
    if (typeof Quill === 'undefined') {
        throw new Error('Quill failed to load');
    }

    state.quill = new Quill('#quill-editor', {
        theme: 'snow',
        placeholder: 'Start writing your article...',
        modules: {
            syntax: typeof hljs !== 'undefined' ? { hljs } : true,
            toolbar: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['blockquote', 'link', 'image'],
                ['code', 'code-block'],
                [{ color: [] }, { background: [] }],
                ['clean']
            ]
        }
    });

    const toolbar = state.quill.getModule('toolbar');
    if (toolbar) {
        toolbar.addHandler('image', () => openInlineImagePicker());
    }
}

async function openInlineImagePicker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();

    input.onchange = async () => {
        const file = input.files && input.files[0];
        if (!file) return;

        try {
            const base64 = await compressImage(file);
            const range = state.quill.getSelection(true);
            const index = range ? range.index : state.quill.getLength();
            state.quill.insertEmbed(index, 'image', base64, 'user');
            state.quill.setSelection(index + 1, 0, 'user');
        } catch (error) {
            alert(`Failed to insert image: ${error?.message || error}`);
        }
    };
}

function showImagePreview(src) {
    const container = byId('featured-image-preview');
    const img = container ? container.querySelector('img') : null;
    if (!container || !img) return;
    img.src = src;
    container.classList.remove('hidden');
}

function clearImagePreview() {
    const container = byId('featured-image-preview');
    if (container) container.classList.add('hidden');
}

function setButtonsDisabled(disabled) {
    byId('save-draft-btn').disabled = disabled;
    byId('publish-btn').disabled = disabled;
}

function bindImageHandlers() {
    const input = byId('featured-image-input');
    const removeBtn = byId('remove-image-btn');
    if (!input || !removeBtn) return;

    input.addEventListener('change', async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        try {
            state.featuredImageBase64 = await compressImage(file);
            showImagePreview(state.featuredImageBase64);

            const sizeInfo = getBase64Size(state.featuredImageBase64);
            console.info(`Featured image compressed to ${sizeInfo}`);
        } catch (error) {
            state.featuredImageBase64 = null;
            input.value = '';
            clearImagePreview();
            alert(`Failed to compress featured image: ${error?.message || error}`);
        }
    });

    removeBtn.addEventListener('click', () => {
        state.featuredImageBase64 = null;
        input.value = '';
        clearImagePreview();
    });
}

function bindActionHandlers() {
    byId('save-draft-btn').addEventListener('click', () => savePost('draft'));
    byId('publish-btn').addEventListener('click', () => savePost('published'));
}

async function fetchPostForEdit(editId) {
    let post = await getBlogPost(editId, true);
    if (!isEffectivelyEmptyPost(post)) return post;

    const allBlogs = await getAllBlogs();
    const exactIdMatches = allBlogs.filter((p) => p.id === editId);
    const postIdMatches = allBlogs.filter((p) => p.post_id === editId);
    return pickBestPostCandidate([...exactIdMatches, ...postIdMatches]);
}

function applyPostToForm(post) {
    state.currentPostId = post.id;
    byId('post-title').value = post.title || '';
    byId('post-description').value = post.description || '';

    state.quill.setContents([]);
    if (isNonEmptyString(post.content)) {
        state.quill.clipboard.dangerouslyPasteHTML(post.content);
    }

    const image = post.image_base64 || post.featured_image_base64 || null;
    state.featuredImageBase64 = image;
    if (image) {
        showImagePreview(image);
    } else {
        clearImagePreview();
    }
}

async function maybeLoadExistingPost() {
    const editId = getEditIdFromUrl();
    if (!editId) return;

    const post = await fetchPostForEdit(editId);
    if (!post) {
        throw new Error(`No blog post found for id "${editId}"`);
    }

    applyPostToForm(post);
}

function getReadTimeMinutes(text) {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.ceil(words / 200);
    return minutes > 0 ? minutes : 1;
}

function serializeEditorContent() {
    const editorRootClone = state.quill.root.cloneNode(true);

    editorRootClone.querySelectorAll('.ql-ui').forEach((el) => el.remove());

    editorRootClone.querySelectorAll('.ql-code-block-container').forEach((container) => {
        const blocks = Array.from(container.querySelectorAll('.ql-code-block'));
        if (blocks.length === 0) return;

        const codeText = blocks.map((block) => block.textContent || '').join('\n');
        const languageBlock = blocks.find((block) => block.dataset.language);
        const language = languageBlock?.dataset.language || '';

        const pre = document.createElement('pre');
        const code = document.createElement('code');

        if (language && language !== 'plain') {
            code.classList.add(`language-${language}`);
            pre.dataset.language = language.toUpperCase();
        }

        code.textContent = codeText;
        pre.appendChild(code);
        container.replaceWith(pre);
    });

    return editorRootClone.innerHTML;
}

async function savePost(status) {
    if (state.isSaving) return;
    if (!state.quill) {
        alert('Editor is not ready yet. Please refresh and try again.');
        return;
    }

    const title = byId('post-title').value.trim();
    const description = byId('post-description').value.trim();
    const content = serializeEditorContent();
    const plainText = state.quill.getText() || '';

    if (!title) {
        alert('Title is required.');
        return;
    }

    const payload = {
        title,
        description,
        content,
        image_base64: state.featuredImageBase64,
        status,
        read_time: getReadTimeMinutes(plainText)
    };

    if (status === 'published') {
        payload.published_at = new Date().toISOString();
    }

    try {
        state.isSaving = true;
        setButtonsDisabled(true);

        if (state.currentPostId) {
            await updateBlogPost(state.currentPostId, payload);
        } else {
            await addBlogPost(payload);
        }

        alert(status === 'published' ? 'Post published!' : 'Draft saved!');
        window.location.href = '/admin.html';
    } catch (error) {
        console.error('Error saving post:', error);
        alert(`Error saving post: ${error?.message || error}`);
    } finally {
        state.isSaving = false;
        setButtonsDisabled(false);
    }
}

async function init() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    initializeQuill();
    bindImageHandlers();
    bindActionHandlers();
    await maybeLoadExistingPost();

    if (typeof feather !== 'undefined') {
        feather.replace();
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await init();
    } catch (error) {
        console.error('Editor initialization failed:', error);
        alert(`Editor failed to initialize: ${error?.message || error}`);
    }
});
