import { getCurrentUser } from './auth.js';
import {
    getAllProjects,
    getAllBlogs,
    getAchievements,
    getAllCourses,
    getCourseAccessUsers,
    deleteProject,
    deleteBlogPost,
    deleteAchievement,
    deleteCourse
} from './db.js';

async function init() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    setupTabs();
    setupActions();
    loadDashboardData();
}

function setupActions() {
    document.getElementById('add-project-btn').addEventListener('click', () => window.location.href = '/project_editor.html');
    document.getElementById('add-blog-btn').addEventListener('click', () => window.location.href = '/editor.html');
    const addCourseBtn = document.getElementById('add-course-btn');
    if (addCourseBtn) addCourseBtn.addEventListener('click', () => window.location.href = '/course_editor.html');
    // We need keys for these new buttons if they exist in HTML
    const addAchBtn = document.getElementById('add-ach-btn');
    if (addAchBtn) addAchBtn.addEventListener('click', () => window.location.href = '/achievement_editor.html');

    const manageCVBtn = document.getElementById('manage-cv-btn');
    if (manageCVBtn) manageCVBtn.addEventListener('click', () => window.location.href = '/cv_manager.html');
}

window.handleDeleteProject = async (id) => {
    if (confirm("Delete Project?")) {
        await deleteProject(id);
        loadDashboardData();
    }
};

window.handleDeleteBlog = async (id) => {
    if (confirm("Delete Post?")) {
        await deleteBlogPost(id);
        loadDashboardData();
    }
};

window.handleDeleteAchievement = async (id) => {
    if (confirm("Delete Achievement?")) {
        await deleteAchievement(id);
        loadDashboardData();
    }
};

window.handleDeleteCourse = async (id) => {
    if (confirm("Delete Course?")) {
        await deleteCourse(id);
        loadDashboardData();
    }
};


function setupTabs() {
    const tabs = document.querySelectorAll('[data-tab]');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all
            tabs.forEach(t => {
                t.classList.remove('border-green-600', 'text-green-600');
                t.classList.add('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300');
            });
            document.querySelectorAll('#tab-content > div').forEach(div => div.classList.add('hidden'));

            // Activate clicked
            tab.classList.remove('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300');
            tab.classList.add('border-green-600', 'text-green-600');

            const targetId = tab.getAttribute('data-tab') + '-tab';
            document.getElementById(targetId).classList.remove('hidden');
        });
    });
}

async function loadDashboardData() {
    const [projects, blogs, achievements, courses, courseAccessUsers] = await Promise.all([
        getAllProjects(),
        getAllBlogs(),
        getAchievements(),
        getAllCourses(),
        getCourseAccessUsers()
    ]);

    // Update Stats
    document.getElementById('stat-projects').textContent = projects.length;

    document.getElementById('stat-blogs').textContent = blogs.length; // Total blogs

    document.getElementById('stat-courses').textContent = courses.length;
    document.getElementById('stat-achievements').textContent = achievements.length;
    document.getElementById('stat-course-users').textContent = courseAccessUsers.length;

    // Render Projects Table
    const projectsTable = document.getElementById('projects-table-body');
    projectsTable.innerHTML = projects.map(p => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                         ${p.image_base64 ? `<img class="h-10 w-10 rounded-full object-cover" src="${p.image_base64}">` : '<div class="h-10 w-10 rounded-full bg-gray-200"></div>'}
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${p.title}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.featured ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                    ${p.featured ? 'Featured' : 'Standard'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${new Date(p.created_at).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <a href="/project_editor.html?id=${p.id}" class="text-blue-600 hover:text-blue-900 mr-3">Edit</a>
                <a href="#" onclick="handleDeleteProject('${p.id}'); return false;" class="text-red-600 hover:text-red-900">Delete</a>
            </td>
        </tr>
    `).join('');

    // Render Blogs Table
    const blogsTable = document.getElementById('blogs-table-body');
    blogsTable.innerHTML = blogs.map(b => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${b.title}</div>
            </td>
             <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${b.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                    ${b.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${b.published_at || b.created_at ? new Date(b.published_at || b.created_at).toLocaleDateString() : '-'}
            </td>
             <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <a href="/editor.html?id=${b.id}" class="text-blue-600 hover:text-blue-900 mr-3">Edit</a>
                <a href="#" onclick="handleDeleteBlog('${b.id}'); return false;" class="text-red-600 hover:text-red-900">Delete</a>
            </td>
        </tr>
    `).join('');

    // Achievements
    const achTable = document.getElementById('achievements-table-body');
    if (achTable) {
        achTable.innerHTML = achievements.map(a => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium text-gray-900">${a.title}</div></td>
            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-500">${a.category || '-'}</div></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${a.date ? a.date : '-'}</td>
             <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <a href="/achievement_editor.html?id=${a.id}" class="text-blue-600 hover:text-blue-900 mr-3">Edit</a>
                <a href="#" onclick="handleDeleteAchievement('${a.id}'); return false;" class="text-red-600 hover:text-red-900">Delete</a>
            </td>
        </tr>`).join('');
    }

    const coursesTable = document.getElementById('courses-table-body');
    if (coursesTable) {
        coursesTable.innerHTML = courses.map(c => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium text-gray-900">${c.title || '-'}</div></td>
            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-500">${Array.isArray(c.chapters) ? c.chapters.length : 0}</div></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${c.published_at || c.created_at ? new Date(c.published_at || c.created_at).toLocaleDateString() : '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <a href="/course_editor.html?id=${c.id}" class="text-blue-600 hover:text-blue-900 mr-3">Edit</a>
                <a href="#" onclick="handleDeleteCourse('${c.id}'); return false;" class="text-red-600 hover:text-red-900">Delete</a>
            </td>
        </tr>`).join('');
    }

    const courseAccessTable = document.getElementById('course-access-table-body');
    if (courseAccessTable) {
        courseAccessTable.innerHTML = courseAccessUsers.map(u => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${u.display_name || u.email || u.uid}</div>
                <div class="text-xs text-gray-500">${u.email || '-'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${u.first_access_at ? new Date(u.first_access_at).toLocaleString() : '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${u.last_access_at ? new Date(u.last_access_at).toLocaleString() : '-'}</td>
        </tr>`).join('');
    }
}

document.addEventListener('DOMContentLoaded', init);
