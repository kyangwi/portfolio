import { getCurrentUser } from './auth.js';
import { getAllCourses, logCourseAccess } from './db.js';

const state = {
    courses: [],
    selectedCourseIndex: -1,
    selectedChapterIndex: -1
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

function safeText(value) {
    return typeof value === 'string' ? value : '';
}

function getCourseImage(course) {
    return typeof course?.image_base64 === 'string' && course.image_base64.trim().length > 0
        ? course.image_base64
        : '';
}

function normalizeCourseChapters(chapters) {
    if (!Array.isArray(chapters)) return [];
    return chapters.map((chapter) => {
        if (Array.isArray(chapter.topics)) return chapter;
        return {
            ...chapter,
            topics: [{
                id: `legacy_topic_${Math.random().toString(36).slice(2)}`,
                title: 'Notes',
                description: '',
                content: `<p>${safeText(chapter.notes)}</p>`,
                read_time: 1
            }]
        };
    });
}

function getSelectedCourse() {
    if (state.selectedCourseIndex < 0) return null;
    return state.courses[state.selectedCourseIndex] || null;
}

function getSelectedChapter() {
    const course = getSelectedCourse();
    if (!course) return null;
    const chapters = normalizeCourseChapters(course.chapters);
    if (state.selectedChapterIndex < 0) return null;
    return chapters[state.selectedChapterIndex] || null;
}

function renderCoursesStrip() {
    const container = document.getElementById('courses-strip');
    if (!container) return;

    if (state.courses.length === 0) {
        container.innerHTML = '<p class="text-slate-400">No published courses yet.</p>';
        return;
    }

    container.innerHTML = state.courses.map((course, index) => {
        const chapters = normalizeCourseChapters(course.chapters);
        const topicCount = chapters.reduce((sum, ch) => sum + (Array.isArray(ch.topics) ? ch.topics.length : 0), 0);
        const isActive = index === state.selectedCourseIndex;
        const image = getCourseImage(course);

        return `
        <button data-course-index="${index}" class="text-left bg-slate-900/80 border rounded-xl p-5 transition ${isActive ? 'border-emerald-400 shadow-lg shadow-emerald-900/30' : 'border-slate-700 hover:border-slate-500'}">
            <div class="relative h-32 mb-4 rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
                ${image
                ? `<img src="${image}" alt="${safeText(course.title)}" class="w-full h-full object-cover">`
                : `<div class="w-full h-full flex items-center justify-center"><i data-feather="image" class="w-8 h-8 text-slate-500"></i></div>`
            }
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>
                <div class="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                    <h3 class="text-sm font-bold text-slate-100 line-clamp-1">${safeText(course.title)}</h3>
                    <span class="text-[11px] px-2 py-1 rounded bg-slate-900/80 text-slate-200">${formatDate(course.published_at || course.created_at)}</span>
                </div>
            </div>
            <p class="text-slate-400 text-sm line-clamp-2 mb-3">${safeText(course.description)}</p>
            <div class="flex gap-2 text-xs">
                <span class="px-2 py-1 rounded bg-emerald-900/40 text-emerald-200">${chapters.length} chapters</span>
                <span class="px-2 py-1 rounded bg-emerald-900/40 text-emerald-200">${topicCount} notes</span>
            </div>
        </button>`;
    }).join('');

    container.querySelectorAll('[data-course-index]').forEach((btn) => {
        btn.addEventListener('click', () => {
            state.selectedCourseIndex = Number(btn.dataset.courseIndex);
            state.selectedChapterIndex = 0;
            renderAll();
        });
    });
}

function renderChaptersTree() {
    const container = document.getElementById('chapters-tree');
    const structureCount = document.getElementById('structure-count');
    if (!container || !structureCount) return;

    const course = getSelectedCourse();
    if (!course) {
        container.innerHTML = '<p class="text-slate-400 text-sm">Choose a course to see chapters.</p>';
        structureCount.textContent = '0 chapters';
        return;
    }

    const chapters = normalizeCourseChapters(course.chapters);
    structureCount.textContent = `${chapters.length} chapters`;

    if (chapters.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-sm">No chapters available.</p>';
        return;
    }

    container.innerHTML = chapters.map((chapter, cIndex) => {
        const selected = cIndex === state.selectedChapterIndex;
        const topics = Array.isArray(chapter.topics) ? chapter.topics : [];
        return `
        <div class="border rounded-lg ${selected ? 'border-emerald-400 bg-emerald-900/10' : 'border-slate-700 bg-slate-950/30'}">
            <button data-chapter-index="${cIndex}" class="w-full px-4 py-3 text-left flex items-center justify-between">
                <span class="font-semibold text-slate-100">Chapter ${cIndex + 1}: ${safeText(chapter.title) || 'Untitled Chapter'}</span>
                <span class="text-xs text-slate-400">${topics.length} notes</span>
            </button>
            <div class="px-4 pb-3 space-y-1">
                ${topics.map((topic, tIndex) => `
                    <p class="text-xs ${selected ? 'text-emerald-200' : 'text-slate-400'}">- Topic ${tIndex + 1}: ${safeText(topic.title) || 'Untitled Note'}</p>
                `).join('')}
            </div>
        </div>`;
    }).join('');

    container.querySelectorAll('[data-chapter-index]').forEach((btn) => {
        btn.addEventListener('click', () => {
            state.selectedChapterIndex = Number(btn.dataset.chapterIndex);
            renderAll();
        });
    });
}

function renderNotesGrid() {
    const notesGrid = document.getElementById('notes-grid');
    const header = document.getElementById('notes-header');
    const subHeader = document.getElementById('notes-subheader');
    if (!notesGrid || !header || !subHeader) return;

    const course = getSelectedCourse();
    const chapter = getSelectedChapter();

    if (!course || !chapter) {
        header.textContent = 'Notes';
        subHeader.textContent = 'Select a chapter to view its notes.';
        notesGrid.innerHTML = '<p class="text-slate-400">No chapter selected.</p>';
        return;
    }

    const topics = Array.isArray(chapter.topics) ? chapter.topics : [];
    const chapterTitle = safeText(chapter.title) || `Chapter ${state.selectedChapterIndex + 1}`;

    header.textContent = `${chapterTitle} Notes`;
    subHeader.textContent = `Course: ${safeText(course.title)} - ${topics.length} note articles`;

    if (topics.length === 0) {
        notesGrid.innerHTML = '<p class="text-slate-400">No notes in this chapter yet.</p>';
        return;
    }

    notesGrid.innerHTML = topics.map((topic, tIndex) => `
        <article class="bg-slate-900/80 border border-slate-700 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition">
            <div class="h-2 bg-gradient-to-r from-emerald-500 to-green-500"></div>
            <div class="p-5">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300">Topic ${tIndex + 1}</span>
                    <span class="text-xs text-slate-400">${topic.read_time || 1} min read</span>
                </div>
                <h4 class="text-lg font-bold text-slate-100 mb-2">${safeText(topic.title) || 'Untitled Note'}</h4>
                <p class="text-slate-400 text-sm line-clamp-3 mb-4">${safeText(topic.description) || 'No description provided.'}</p>
                <a href="/course_post.html?id=${course.course_id || course.id}&chapter=${state.selectedChapterIndex}&topic=${tIndex}"
                   class="inline-flex items-center text-emerald-300 hover:text-emerald-200 font-semibold">
                    Read Note <i data-feather="arrow-right" class="w-4 h-4 ml-2"></i>
                </a>
            </div>
        </article>
    `).join('');
}

function renderAll() {
    renderCoursesStrip();
    renderChaptersTree();
    renderNotesGrid();
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
        state.courses = courses.filter((c) => (c.status || 'draft') === 'published');

        if (state.courses.length > 0) {
            state.selectedCourseIndex = 0;
            state.selectedChapterIndex = 0;
        }

        renderAll();
    } catch (error) {
        console.error('Error loading courses:', error);
        const container = document.getElementById('courses-strip');
        if (container) {
            container.innerHTML = '<p class="text-red-400">Failed to load courses.</p>';
        }
    }
}

document.addEventListener('DOMContentLoaded', init);
