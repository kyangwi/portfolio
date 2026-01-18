import { getCurrentUser } from './auth.js';
import { addProject, updateProject, getAllProjects } from './db.js';
import { compressImage, getBase64Size } from './imageCompressor.js';

let currentProjectId = null;
let imageBase64 = null;

async function init() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const editId = params.get('id');
    if (editId) {
        loadProject(editId);
    }

    setupImageHandlers();

    document.getElementById('project-form').addEventListener('submit', handleSave);
}

async function loadProject(id) {
    // We don't have getProjectById exposed in db.js separate from getFeatured/getAll.
    // Ideally we should add getProject(id). 
    // For now, let's fetch all and find. inefficient but works for small portfolio.
    // Or I'll just add getProject(id) to db.js ? No, I can't keep context switching.
    // Note: I added getAllProjects. I can filter manually.

    // Actually, I should probably add getProject(id) to db.js for cleanliness, 
    // but to save tool calls I will just fetch all.
    const projects = await getAllProjects();
    const project = projects.find(p => p.id === id);

    if (project) {
        currentProjectId = project.id;
        document.getElementById('project-title').value = project.title;
        document.getElementById('project-description').value = project.description;
        document.getElementById('project-tech').value = project.technologies ? project.technologies.join(', ') : '';
        document.getElementById('project-badge').value = project.badge || '';
        document.getElementById('project-link').value = project.link || '';
        document.getElementById('project-featured').checked = project.featured || false;

        if (project.image_base64) {
            imageBase64 = project.image_base64;
            showImagePreview(imageBase64);
        }
    }
}

function setupImageHandlers() {
    const input = document.getElementById('project-image-input');

    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // Show loading indicator
                const loadingMsg = document.createElement('div');
                loadingMsg.textContent = 'Compressing image...';
                loadingMsg.className = 'text-sm text-gray-500 mt-2';
                input.parentElement.appendChild(loadingMsg);

                // Compress the image
                imageBase64 = await compressImage(file);

                // Show size info
                const sizeInfo = getBase64Size(imageBase64);
                loadingMsg.textContent = `Compressed to ${sizeInfo}`;
                setTimeout(() => loadingMsg.remove(), 3000);

                showImagePreview(imageBase64);
            } catch (error) {
                console.error('Compression error:', error);
                alert('Failed to compress image: ' + error.message);
                input.value = '';
            }
        }
    });

    document.getElementById('remove-image-btn').addEventListener('click', () => {
        imageBase64 = null;
        document.getElementById('project-image-preview').classList.add('hidden');
        input.value = '';
    });
}

function showImagePreview(src) {
    const container = document.getElementById('project-image-preview');
    const img = container.querySelector('img');
    img.src = src;
    container.classList.remove('hidden');
}

async function handleSave(e) {
    e.preventDefault();

    const title = document.getElementById('project-title').value;
    const description = document.getElementById('project-description').value;
    const techStr = document.getElementById('project-tech').value;
    const badge = document.getElementById('project-badge').value;
    const link = document.getElementById('project-link').value;
    const featured = document.getElementById('project-featured').checked;

    const technologies = techStr.split(',').map(t => t.trim()).filter(t => t);

    const data = {
        title,
        description,
        technologies,
        badge,
        link,
        featured,
        image_base64: imageBase64
    };

    try {
        if (currentProjectId) {
            await updateProject(currentProjectId, data);
            alert("Project updated!");
        } else {
            await addProject(data);
            alert("Project added!");
        }
        window.location.href = '/admin.html';
    } catch (err) {
        console.error("Error saving project", err);
        alert("Error saving: " + err.message);
    }
}

document.addEventListener('DOMContentLoaded', init);
if (typeof feather !== 'undefined') feather.replace();
