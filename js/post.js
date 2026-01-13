import { getBlogPost } from './db.js';

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

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
        console.error("Error loading post:", error);
        document.getElementById('post-container').innerHTML = '<div class="text-center text-red-500">Error loading post.</div>';
    }
}

function renderPost(post) {
    document.title = `${post.title} | Bwenge Kyangwi`;
    document.getElementById('page-title').textContent = `${post.title} | Bwenge Kyangwi`;

    const container = document.getElementById('post-container');
    container.innerHTML = `
        <div class="text-center mb-8">
            <h1 class="text-4xl md:text-5xl font-bold mb-4" data-aos="fade-up">${post.title}</h1>
            <div class="flex flex-wrap items-center justify-center text-gray-600 space-x-4" data-aos="fade-up" data-aos-delay="100">
                <span>${formatDate(post.published_at)}</span>
                 <span>•</span>
                <span>${post.read_time || 5} min read</span>
                <!-- Category if available -->
            </div>
        </div>

        ${post.image_base64 || post.featured_image_base64 ? `
        <div class="mb-8 rounded-xl overflow-hidden shadow-2xl" data-aos="fade-up" data-aos-delay="200">
             <img src="${post.image_base64 || post.featured_image_base64}" alt="${post.title}" class="w-full h-96 object-cover">
        </div>
        ` : ''}

        <div class="prose prose-lg max-w-none">
            ${post.content}
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
    if (typeof hljs !== 'undefined') hljs.highlightAll();

    // Global copy function
    window.copyToClipboard = function (text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Link copied!');
        }).catch(err => console.error('Failed to copy', err));
    };
}

document.addEventListener('DOMContentLoaded', init);
