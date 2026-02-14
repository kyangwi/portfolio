import { getCurrentUser } from './auth.js';
import { addCourse, updateCourse, getCourse } from './db.js';
import { compressImage } from './imageCompressor.js';

const state = {
    currentStep: 1,
    currentCourseId: null,
    isSaving: false,
    featuredImageBase64: null,
    courseOverviewQuill: null,
    topicContentQuill: null,
    chapters: [],
    selectedChapterIndex: -1,
    selectedTopicIndex: -1
};

function byId(id) {
    return document.getElementById(id);
}

function getEditIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function makeId(prefix) {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function normalizeLegacyChapters(chapters) {
    if (!Array.isArray(chapters)) return [];
    return chapters.map((chapter) => {
        if (Array.isArray(chapter.topics)) {
            return {
                id: chapter.id || makeId('chapter'),
                title: chapter.title || '',
                topics: chapter.topics.map((topic) => ({
                    id: topic.id || makeId('topic'),
                    title: topic.title || '',
                    description: topic.description || '',
                    content: topic.content || '',
                    read_time: topic.read_time || 1
                }))
            };
        }

        const legacyNotes = chapter.notes || '';
        return {
            id: chapter.id || makeId('chapter'),
            title: chapter.title || '',
            topics: [{
                id: makeId('topic'),
                title: 'Notes',
                description: '',
                content: `<p>${legacyNotes.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`,
                read_time: 1
            }]
        };
    });
}

function computeReadTime(text) {
    const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
}

function setButtonsDisabled(disabled) {
    byId('save-draft-btn').disabled = disabled;
    byId('publish-btn').disabled = disabled;
    byId('next-step-btn').disabled = disabled;
    byId('prev-step-btn').disabled = disabled;
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

function initializeQuills() {
    if (typeof Quill === 'undefined') throw new Error('Quill failed to load');

    const modules = {
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
    };

    state.courseOverviewQuill = new Quill('#course-overview-editor', {
        theme: 'snow',
        placeholder: 'Write course overview notes...',
        modules
    });

    state.topicContentQuill = new Quill('#topic-content-editor', {
        theme: 'snow',
        placeholder: 'Write topic notes like a blog article...',
        modules
    });
}

function serializeEditorContent(quill) {
    const editorRootClone = quill.root.cloneNode(true);
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

function saveActiveTopicEditorToState() {
    if (state.selectedChapterIndex < 0 || state.selectedTopicIndex < 0) return;
    const chapter = state.chapters[state.selectedChapterIndex];
    if (!chapter) return;
    const topic = chapter.topics[state.selectedTopicIndex];
    if (!topic) return;

    topic.title = byId('topic-title').value.trim();
    topic.description = byId('topic-description').value.trim();
    topic.content = serializeEditorContent(state.topicContentQuill);
    topic.read_time = computeReadTime(state.topicContentQuill.getText());
}

function renderChaptersList() {
    const container = byId('chapters-list');
    if (!container) return;

    if (state.chapters.length === 0) {
        container.innerHTML = `<div class="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-4">No chapters yet. Add your first chapter.</div>`;
        return;
    }

    container.innerHTML = state.chapters.map((chapter, cIndex) => `
        <details class="border border-gray-200 rounded-lg bg-white" ${cIndex === state.selectedChapterIndex ? 'open' : ''}>
            <summary class="cursor-pointer px-4 py-3 font-semibold flex items-center justify-between">
                <span>${chapter.title || 'Untitled Chapter'}</span>
                <span class="text-xs text-gray-500">${chapter.topics.length} topics</span>
            </summary>
            <div class="px-4 pb-4 space-y-3">
                <input type="text" data-action="chapter-title" data-cindex="${cIndex}"
                    class="w-full border border-gray-300 rounded-lg p-2"
                    value="${chapter.title || ''}" placeholder="Chapter title">
                <div class="flex gap-2">
                    <button type="button" data-action="add-topic" data-cindex="${cIndex}"
                        class="text-sm px-3 py-1 bg-slate-800 text-white rounded-lg hover:bg-slate-900">+ Topic</button>
                    <button type="button" data-action="delete-chapter" data-cindex="${cIndex}"
                        class="text-sm px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete Chapter</button>
                </div>
                <div class="space-y-2">
                    ${chapter.topics.map((topic, tIndex) => `
                    <button type="button" data-action="select-topic" data-cindex="${cIndex}" data-tindex="${tIndex}"
                        class="w-full text-left px-3 py-2 rounded-lg border ${state.selectedChapterIndex === cIndex && state.selectedTopicIndex === tIndex ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}">
                        <p class="font-medium">${topic.title || 'Untitled Topic'}</p>
                        <p class="text-xs text-gray-500">${topic.description || 'No description'}</p>
                    </button>`).join('')}
                </div>
            </div>
        </details>
    `).join('');

    container.querySelectorAll('[data-action="chapter-title"]').forEach((input) => {
        input.addEventListener('input', (e) => {
            const cIndex = Number(e.target.dataset.cindex);
            state.chapters[cIndex].title = e.target.value;
        });
    });

    container.querySelectorAll('[data-action="add-topic"]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            saveActiveTopicEditorToState();
            const cIndex = Number(e.target.dataset.cindex);
            state.chapters[cIndex].topics.push({
                id: makeId('topic'),
                title: '',
                description: '',
                content: '',
                read_time: 1
            });
            state.selectedChapterIndex = cIndex;
            state.selectedTopicIndex = state.chapters[cIndex].topics.length - 1;
            renderChaptersList();
            loadSelectedTopicIntoEditor();
        });
    });

    container.querySelectorAll('[data-action="delete-chapter"]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const cIndex = Number(e.target.dataset.cindex);
            state.chapters.splice(cIndex, 1);
            if (state.selectedChapterIndex === cIndex) {
                state.selectedChapterIndex = -1;
                state.selectedTopicIndex = -1;
            } else if (state.selectedChapterIndex > cIndex) {
                state.selectedChapterIndex -= 1;
            }
            renderChaptersList();
            loadSelectedTopicIntoEditor();
        });
    });

    container.querySelectorAll('[data-action="select-topic"]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            saveActiveTopicEditorToState();
            const cIndex = Number(e.currentTarget.dataset.cindex);
            const tIndex = Number(e.currentTarget.dataset.tindex);
            state.selectedChapterIndex = cIndex;
            state.selectedTopicIndex = tIndex;
            renderChaptersList();
            loadSelectedTopicIntoEditor();
        });
    });
}

function clearTopicEditor() {
    byId('topic-title').value = '';
    byId('topic-description').value = '';
    state.topicContentQuill.setContents([]);
    byId('topic-editor-hint').textContent = 'Pick a chapter/topic from the left.';
}

function loadSelectedTopicIntoEditor() {
    if (state.selectedChapterIndex < 0 || state.selectedTopicIndex < 0) {
        clearTopicEditor();
        return;
    }
    const chapter = state.chapters[state.selectedChapterIndex];
    const topic = chapter?.topics?.[state.selectedTopicIndex];
    if (!topic) {
        clearTopicEditor();
        return;
    }

    byId('topic-editor-hint').textContent = `Editing: ${chapter.title || 'Chapter'} / ${topic.title || 'Topic'}`;
    byId('topic-title').value = topic.title || '';
    byId('topic-description').value = topic.description || '';

    state.topicContentQuill.setContents([]);
    if (topic.content) state.topicContentQuill.clipboard.dangerouslyPasteHTML(topic.content);
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
        } catch (error) {
            state.featuredImageBase64 = null;
            input.value = '';
            clearImagePreview();
            alert(`Failed to compress image: ${error?.message || error}`);
        }
    });

    removeBtn.addEventListener('click', () => {
        state.featuredImageBase64 = null;
        input.value = '';
        clearImagePreview();
    });
}

function goToStep(step) {
    const clamped = Math.min(3, Math.max(1, step));
    state.currentStep = clamped;

    [1, 2, 3].forEach((n) => {
        const stepEl = byId(`step-${n}`);
        const indicator = byId(`step-indicator-${n}`);
        const active = n === clamped;
        stepEl.classList.toggle('active', active);
        indicator.className = active
            ? 'rounded-lg px-3 py-2 bg-blue-600 text-white'
            : 'rounded-lg px-3 py-2 bg-gray-200 text-gray-700';
    });

    byId('prev-step-btn').style.visibility = clamped === 1 ? 'hidden' : 'visible';
    byId('next-step-btn').classList.toggle('hidden', clamped === 3);
    byId('save-draft-btn').classList.toggle('hidden', clamped !== 3);
    byId('publish-btn').classList.toggle('hidden', clamped !== 3);

    if (clamped === 3) {
        saveActiveTopicEditorToState();
        renderReview();
    }
}

function renderReview() {
    const title = byId('course-title').value.trim();
    const chapterCount = state.chapters.length;
    const topicCount = state.chapters.reduce((sum, chapter) => sum + chapter.topics.length, 0);

    byId('review-title').textContent = title || '-';
    byId('review-chapters').textContent = String(chapterCount);
    byId('review-topics').textContent = String(topicCount);
}

function bindWizardButtons() {
    byId('prev-step-btn').addEventListener('click', () => {
        if (state.currentStep === 2) saveActiveTopicEditorToState();
        goToStep(state.currentStep - 1);
    });

    byId('next-step-btn').addEventListener('click', () => {
        if (state.currentStep === 1) {
            const title = byId('course-title').value.trim();
            if (!title) {
                alert('Course title is required.');
                return;
            }
        }
        if (state.currentStep === 2) {
            saveActiveTopicEditorToState();
            if (state.chapters.length === 0) {
                alert('Add at least one chapter.');
                return;
            }
            const hasTopics = state.chapters.some((chapter) => chapter.topics.length > 0);
            if (!hasTopics) {
                alert('Add at least one topic.');
                return;
            }
        }
        goToStep(state.currentStep + 1);
    });
}

function bindStructureButtons() {
    byId('add-chapter-btn').addEventListener('click', () => {
        saveActiveTopicEditorToState();
        state.chapters.push({
            id: makeId('chapter'),
            title: '',
            topics: []
        });
        state.selectedChapterIndex = state.chapters.length - 1;
        state.selectedTopicIndex = -1;
        renderChaptersList();
        loadSelectedTopicIntoEditor();
    });

    byId('add-topic-btn').addEventListener('click', () => {
        if (state.selectedChapterIndex < 0) {
            alert('Select a chapter first.');
            return;
        }
        saveActiveTopicEditorToState();
        const chapter = state.chapters[state.selectedChapterIndex];
        chapter.topics.push({
            id: makeId('topic'),
            title: '',
            description: '',
            content: '',
            read_time: 1
        });
        state.selectedTopicIndex = chapter.topics.length - 1;
        renderChaptersList();
        loadSelectedTopicIntoEditor();
    });

    byId('delete-topic-btn').addEventListener('click', () => {
        if (state.selectedChapterIndex < 0 || state.selectedTopicIndex < 0) return;
        const chapter = state.chapters[state.selectedChapterIndex];
        chapter.topics.splice(state.selectedTopicIndex, 1);
        state.selectedTopicIndex = chapter.topics.length ? 0 : -1;
        renderChaptersList();
        loadSelectedTopicIntoEditor();
    });
}

function getPayload(status) {
    saveActiveTopicEditorToState();

    const title = byId('course-title').value.trim();
    const description = byId('course-description').value.trim();
    const moreInfoLink = byId('more-info-link').value.trim();
    const overviewContent = serializeEditorContent(state.courseOverviewQuill);

    const chapters = state.chapters
        .map((chapter) => ({
            id: chapter.id,
            title: (chapter.title || '').trim(),
            topics: (chapter.topics || [])
                .map((topic) => ({
                    id: topic.id,
                    title: (topic.title || '').trim(),
                    description: (topic.description || '').trim(),
                    content: topic.content || '',
                    read_time: topic.read_time || 1
                }))
                .filter((topic) => topic.title || topic.content)
        }))
        .filter((chapter) => chapter.title || chapter.topics.length > 0);

    const topicReadTime = chapters.reduce((sum, chapter) => {
        return sum + chapter.topics.reduce((tSum, topic) => tSum + (topic.read_time || 1), 0);
    }, 0);

    const payload = {
        title,
        description,
        more_info_link: moreInfoLink,
        image_base64: state.featuredImageBase64,
        content: overviewContent,
        chapters,
        status,
        read_time: Math.max(1, topicReadTime)
    };

    if (status === 'published') {
        payload.published_at = new Date().toISOString();
    }

    return payload;
}

async function saveCourse(status) {
    if (state.isSaving) return;
    const payload = getPayload(status);

    if (!payload.title) {
        alert('Course title is required.');
        goToStep(1);
        return;
    }
    if (payload.chapters.length === 0) {
        alert('Add at least one chapter.');
        goToStep(2);
        return;
    }
    if (!payload.chapters.some((chapter) => chapter.topics.length > 0)) {
        alert('Add at least one topic.');
        goToStep(2);
        return;
    }

    try {
        state.isSaving = true;
        setButtonsDisabled(true);

        if (state.currentCourseId) {
            await updateCourse(state.currentCourseId, payload);
        } else {
            await addCourse(payload);
        }

        alert(status === 'published' ? 'Course published!' : 'Course draft saved!');
        window.location.href = '/admin.html';
    } catch (error) {
        console.error('Error saving course:', error);
        alert(`Error saving course: ${error?.message || error}`);
    } finally {
        state.isSaving = false;
        setButtonsDisabled(false);
    }
}

function bindSaveButtons() {
    byId('save-draft-btn').addEventListener('click', () => saveCourse('draft'));
    byId('publish-btn').addEventListener('click', () => saveCourse('published'));
}

function applyCourseToForm(course) {
    state.currentCourseId = course.id;

    byId('course-title').value = course.title || '';
    byId('course-description').value = course.description || '';
    byId('more-info-link').value = course.more_info_link || '';

    state.courseOverviewQuill.setContents([]);
    if (course.content) state.courseOverviewQuill.clipboard.dangerouslyPasteHTML(course.content);

    state.featuredImageBase64 = course.image_base64 || null;
    if (state.featuredImageBase64) showImagePreview(state.featuredImageBase64);
    else clearImagePreview();

    state.chapters = normalizeLegacyChapters(course.chapters);
    if (state.chapters.length > 0 && state.chapters[0].topics.length > 0) {
        state.selectedChapterIndex = 0;
        state.selectedTopicIndex = 0;
    } else {
        state.selectedChapterIndex = -1;
        state.selectedTopicIndex = -1;
    }
    renderChaptersList();
    loadSelectedTopicIntoEditor();
}

async function maybeLoadExistingCourse() {
    const editId = getEditIdFromUrl();
    if (!editId) {
        state.chapters = [{
            id: makeId('chapter'),
            title: '',
            topics: [{
                id: makeId('topic'),
                title: '',
                description: '',
                content: '',
                read_time: 1
            }]
        }];
        state.selectedChapterIndex = 0;
        state.selectedTopicIndex = 0;
        renderChaptersList();
        loadSelectedTopicIntoEditor();
        return;
    }

    const course = await getCourse(editId, true);
    if (!course) throw new Error(`No course found for id "${editId}"`);
    applyCourseToForm(course);
}

async function init() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    initializeQuills();
    bindImageHandlers();
    bindWizardButtons();
    bindStructureButtons();
    bindSaveButtons();
    await maybeLoadExistingCourse();
    goToStep(1);

    if (typeof feather !== 'undefined') feather.replace();
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await init();
    } catch (error) {
        console.error('Course editor initialization failed:', error);
        alert(`Course editor failed to initialize: ${error?.message || error}`);
    }
});
