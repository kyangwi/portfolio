import { getCurrentUser } from './auth.js';
import { getAllCourses, logCourseAccess } from './db.js';

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

function safeText(value) {
    return typeof value === 'string' ? value : '';
}

function renderCourses(courses) {
    const container = document.getElementById('courses-grid');
    if (!container) return;

    if (courses.length === 0) {
        container.innerHTML = `
        <div class="col-span-1 md:col-span-2 lg:col-span-3 text-center py-16">
            <p class="text-slate-400 text-lg">No published courses yet.</p>
        </div>`;
        return;
    }

    container.innerHTML = courses.map((course) => `
        <div class="bg-slate-900/80 border border-slate-700 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition duration-300">
            <div class="relative overflow-hidden h-48 bg-slate-800">
                 ${course.image_base64
            ? `<img src="${course.image_base64}" alt="${safeText(course.title)}" class="w-full h-full object-cover hover:scale-105 transition duration-300">`
            : `<div class="w-full h-full flex items-center justify-center"><i data-feather="book-open" class="text-slate-500 w-12 h-12"></i></div>`
        }
            </div>
            <div class="p-6">
                <h3 class="text-xl font-bold mb-2 text-slate-100">${safeText(course.title)}</h3>
                <p class="text-slate-300 mb-4 line-clamp-3">${safeText(course.description)}</p>
                <div class="flex items-center justify-between mb-4">
                    <span class="text-slate-400 text-sm">${formatDate(course.published_at || course.created_at)}</span>
                    <span class="text-slate-400 text-sm">${Array.isArray(course.chapters) ? course.chapters.length : 0} chapters</span>
                </div>
                <a href="/course_post.html?id=${course.course_id || course.id}" class="inline-flex items-center text-blue-300 hover:text-blue-200 font-semibold">
                    Open Course <i data-feather="arrow-right" class="w-4 h-4 ml-2"></i>
                </a>
            </div>
        </div>
    `).join('');

    if (typeof feather !== 'undefined') feather.replace();
}

async function init() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    await logCourseAccess(user);

    try {
        const courses = await getAllCourses();
        const published = courses.filter((c) => (c.status || 'draft') === 'published');
        renderCourses(published);
    } catch (error) {
        console.error('Error loading courses:', error);
        const container = document.getElementById('courses-grid');
        if (container) {
            container.innerHTML = '<p class="text-center col-span-3 text-red-400">Failed to load courses.</p>';
        }
    }
}

document.addEventListener('DOMContentLoaded', init);
