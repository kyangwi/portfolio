import { getBlogPost } from './db.js';

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

function normalizePostContent(content) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div id="post-content-root">${content || ''}</div>`, 'text/html');
    const root = doc.getElementById('post-content-root');

    if (!root) return content || '';

    root.querySelectorAll('.ql-ui').forEach((el) => el.remove());

    root.querySelectorAll('.ql-code-block-container').forEach((container) => {
        const blocks = Array.from(container.querySelectorAll('.ql-code-block'));
        if (blocks.length === 0) return;

        const codeText = blocks.map((block) => block.textContent || '').join('\n');
        const languageBlock = blocks.find((block) => block.dataset.language);
        const language = languageBlock?.dataset.language || '';

        const pre = doc.createElement('pre');
        const code = doc.createElement('code');

        if (language && language !== 'plain') {
            code.classList.add(`language-${language}`);
            pre.dataset.language = language.toUpperCase();
        }

        code.textContent = codeText;
        pre.appendChild(code);
        container.replaceWith(pre);
    });

    root.querySelectorAll('pre.ql-syntax').forEach((pre) => {
        if (pre.querySelector('code')) return;
        const code = doc.createElement('code');
        code.textContent = pre.textContent || '';
        pre.textContent = '';
        pre.appendChild(code);
        pre.classList.remove('ql-syntax');
    });

    return root.innerHTML;
}

async function init() {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    if (!postId) {
        document.getElementById('post-container').innerHTML = '<div class="text-center text-red-500">Post not found. ID missing.</div>';
        return;
    }

    try {
        const post = await getBlogPost(postId);
        if (post) {
            renderPost(post);
        } else {
            document.getElementById('post-container').innerHTML = '<div class="text-center text-red-500">Post not found.</div>';
        }
    } catch (error) {
        console.error('Error loading post:', error);
        document.getElementById('post-container').innerHTML = '<div class="text-center text-red-500">Error loading post.</div>';
    }
}

function renderPost(post) {
    document.title = `${post.title} | Bwenge Kyangwi`;
    document.getElementById('page-title').textContent = `${post.title} | Bwenge Kyangwi`;
    const normalizedContent = normalizePostContent(post.content);

    const container = document.getElementById('post-container');
    container.innerHTML = `
        <div class="text-center mb-8">
            <h1 class="text-4xl md:text-5xl font-bold mb-4" data-aos="fade-up">${post.title}</h1>
            <div class="flex flex-wrap items-center justify-center text-gray-600 space-x-4" data-aos="fade-up" data-aos-delay="100">
                <span>${formatDate(post.published_at)}</span>
                <span>&bull;</span>
                <span>${post.read_time || 5} min read</span>
            </div>
        </div>

        ${post.image_base64 || post.featured_image_base64 ? `
        <div class="mb-8 rounded-xl overflow-hidden shadow-2xl" data-aos="fade-up" data-aos-delay="200">
            <img src="${post.image_base64 || post.featured_image_base64}" alt="${post.title}" class="w-full h-96 object-cover">
        </div>
        ` : ''}

        <div class="prose prose-lg max-w-none">
            ${normalizedContent}
        </div>

        <div class="mt-12 pt-8 border-t border-gray-200">
            <h3 class="text-lg font-semibold mb-4">Share this article</h3>
            <div class="flex space-x-4">
                <button onclick="copyToClipboard('${window.location.href}')" class="bg-gray-100 p-3 rounded-full text-gray-700 hover:bg-gray-200 transition" aria-label="Copy link">
                    <i data-feather="link" class="w-5 h-5"></i>
                </button>
            </div>
        </div>
    `;

    if (typeof feather !== 'undefined') feather.replace();
    if (typeof hljs !== 'undefined') {
        container.querySelectorAll('.prose pre code').forEach((codeBlock) => {
            hljs.highlightElement(codeBlock);
        });
    }

    window.copyToClipboard = function (text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Link copied!');
        }).catch((err) => console.error('Failed to copy', err));
    };
}

document.addEventListener('DOMContentLoaded', init);
