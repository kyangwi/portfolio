import { getCurrentUser } from './auth.js';
import { getCourse, logCourseAccess } from './db.js';

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

function escapeHtml(text) {
    return (text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function normalizeRichContent(content) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div id="course-content-root">${content || ''}</div>`, 'text/html');
    const root = doc.getElementById('course-content-root');

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

function normalizeCourseChapters(chapters) {
    if (!Array.isArray(chapters)) return [];
    return chapters.map((chapter) => {
        if (Array.isArray(chapter.topics)) return chapter;
        return {
            ...chapter,
            topics: [{
                title: 'Notes',
                description: '',
                content: `<p>${escapeHtml(chapter.notes || '')}</p>`,
                read_time: 1
            }]
        };
    });
}

function renderCourse(course) {
    document.title = `${course.title} | Courses`;
    document.getElementById('page-title').textContent = `${course.title} | Courses`;

    const container = document.getElementById('course-container');
    const overview = normalizeRichContent(course.content);
    const chapters = normalizeCourseChapters(course.chapters);
    const params = new URLSearchParams(window.location.search);
    const selectedChapter = Number(params.get('chapter'));
    const selectedTopic = Number(params.get('topic'));
    const hasChapterParam = Number.isInteger(selectedChapter) && selectedChapter >= 0;
    const hasTopicParam = Number.isInteger(selectedTopic) && selectedTopic >= 0;

    container.innerHTML = `
        <div class="text-center mb-8">
            <h1 class="text-4xl md:text-5xl font-bold mb-4">${escapeHtml(course.title || '')}</h1>
            <div class="flex flex-wrap items-center justify-center text-slate-300 space-x-4">
                <span>${formatDate(course.published_at || course.created_at)}</span>
                <span>&bull;</span>
                <span>${chapters.length} chapters</span>
            </div>
        </div>

        ${course.image_base64 ? `
        <div class="mb-8 rounded-xl overflow-hidden shadow-2xl">
            <img src="${course.image_base64}" alt="${escapeHtml(course.title || '')}" class="w-full h-96 object-cover">
        </div>
        ` : ''}

        <div class="prose prose-lg max-w-none mb-10">
            ${overview}
        </div>

        <section class="space-y-4 mb-8">
            ${chapters.map((chapter, cIndex) => `
            <details id="chapter-${cIndex}" class="bg-slate-900/80 border border-slate-700 rounded-xl p-5" ${(hasChapterParam ? cIndex === selectedChapter : cIndex === 0) ? 'open' : ''}>
                <summary class="cursor-pointer flex items-center justify-between text-slate-100 font-semibold text-xl">
                    <span>Chapter ${cIndex + 1}: ${escapeHtml(chapter.title || 'Untitled Chapter')}</span>
                    <span class="text-sm text-slate-400">${(chapter.topics || []).length} topics</span>
                </summary>
                <div class="mt-5 space-y-5">
                    ${(chapter.topics || []).map((topic, tIndex) => `
                    <details id="topic-${cIndex}-${tIndex}" class="border rounded-xl p-5 ${hasChapterParam && hasTopicParam && cIndex === selectedChapter && tIndex === selectedTopic ? 'border-emerald-400 bg-emerald-950/20' : 'border-slate-700 bg-slate-950/50'}"
                        ${(hasChapterParam && hasTopicParam && cIndex === selectedChapter && tIndex === selectedTopic) || (!hasChapterParam && cIndex === 0 && tIndex === 0) ? 'open' : ''}>
                        <summary class="cursor-pointer list-none">
                            <div class="mb-1">
                                <h3 class="text-2xl font-bold text-slate-100">Topic ${tIndex + 1}: ${escapeHtml(topic.title || 'Untitled Topic')}</h3>
                                ${topic.description ? `<p class="text-slate-400 mt-1">${escapeHtml(topic.description)}</p>` : ''}
                                <p class="text-slate-500 text-sm mt-1">${topic.read_time || 1} min read</p>
                            </div>
                        </summary>
                        <div class="prose prose-lg max-w-none mt-4">${normalizeRichContent(topic.content || '')}</div>
                    </details>
                    `).join('')}
                </div>
            </details>
            `).join('')}
        </section>

        ${course.more_info_link ? `
        <div class="mt-10">
            <a href="${course.more_info_link}" target="_blank" rel="noopener noreferrer"
               class="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg transition">
                More Information <i data-feather="external-link" class="w-4 h-4 ml-2"></i>
            </a>
        </div>
        ` : ''}
    `;

    if (typeof feather !== 'undefined') feather.replace();
    if (typeof hljs !== 'undefined') {
        container.querySelectorAll('.prose pre code').forEach((codeBlock) => {
            hljs.highlightElement(codeBlock);
        });
    }

    if (hasChapterParam && hasTopicParam) {
        const el = document.getElementById(`topic-${selectedChapter}-${selectedTopic}`);
        if (el) {
            setTimeout(() => {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 120);
        }
    }
}

async function init() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    await logCourseAccess(user);

    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('id');
    if (!courseId) {
        document.getElementById('course-container').innerHTML = '<div class="text-center text-red-500">Course not found. ID missing.</div>';
        return;
    }

    try {
        const course = await getCourse(courseId);
        if (!course) {
            document.getElementById('course-container').innerHTML = '<div class="text-center text-red-500">Course not found.</div>';
            return;
        }
        renderCourse(course);
    } catch (error) {
        console.error('Error loading course:', error);
        document.getElementById('course-container').innerHTML = '<div class="text-center text-red-500">Error loading course.</div>';
    }
}

document.addEventListener('DOMContentLoaded', init);
