import { getAllBlogs } from './db.js';

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

async function init() {
    try {
        const blogs = await getAllBlogs();
        renderBlogs(blogs);
    } catch (error) {
        console.error("Error loading blogs:", error);
    }
}

function renderBlogs(blogs) {
    const container = document.getElementById('blog-grid');
    if (!container) return;

    if (blogs.length === 0) {
        container.innerHTML = `
        <div class="col-span-1 md:col-span-2 lg:col-span-3 text-center py-16">
            <p class="text-gray-500 text-lg">No blog posts yet.</p>
        </div>`;
        return;
    }

    container.innerHTML = blogs.map(blog => `
        <div class="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition duration-300" data-aos="fade-up">
            <div class="relative overflow-hidden h-48 bg-gray-200">
                 ${blog.image_base64 ?
            `<img src="${blog.image_base64}" alt="${blog.title}" class="w-full h-full object-cover hover:scale-105 transition duration-300">` :
            `<div class="w-full h-full flex items-center justify-center"><i data-feather="file-text" class="text-gray-400 w-12 h-12"></i></div>`
        }
            </div>
            <div class="p-6">
                <h3 class="text-xl font-bold mb-2">${blog.title}</h3>
                <p class="text-gray-600 mb-4 line-clamp-3">${blog.description}</p>
                <div class="flex items-center justify-between mb-4">
                    <span class="text-gray-500 text-sm">${formatDate(blog.published_at)}</span>
                    <span class="text-gray-500 text-sm">${blog.read_time || '5'} min read</span>
                </div>
                <a href="/post.html?id=${blog.post_id}" class="inline-flex items-center text-green-600 hover:text-green-800 font-semibold">
                    Read More <i data-feather="arrow-right" class="w-4 h-4 ml-2"></i>
                </a>
            </div>
        </div>
    `).join('');

    if (typeof feather !== 'undefined') feather.replace();
}

document.addEventListener('DOMContentLoaded', init);
