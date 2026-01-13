import { getAllProjects } from './db.js';

async function init() {
    try {
        const projects = await getAllProjects();
        renderProjects(projects);
    } catch (error) {
        console.error("Error loading projects:", error);
    }
}

function renderProjects(projects) {
    const container = document.getElementById('projects-grid');
    if (!container) return;

    if (projects.length === 0) {
        container.innerHTML = '<p class="text-center col-span-3 text-gray-500">No projects found.</p>';
        return;
    }

    container.innerHTML = projects.map(project => `
        <div class="bg-white rounded-xl overflow-hidden shadow-md" data-aos="fade-up">
            <div class="relative">
                 ${project.image_base64 ?
            `<img src="${project.image_base64}" alt="${project.title}" class="w-full h-48 object-cover">` :
            `<div class="w-full h-48 bg-gray-200 flex items-center justify-center"><i data-feather="image" class="text-gray-400 w-12 h-12"></i></div>`
        }
                <div class="project-overlay absolute inset-0 bg-blue-600/90 flex items-center justify-center opacity-0 transition duration-300">
                    ${project.link ?
            `<a href="${project.link}" target="_blank" class="text-white font-medium flex items-center">
                        <i data-feather="eye" class="mr-2"></i> View Details
                    </a>` :
            `<span class="text-white font-medium">No Link Available</span>`
        }
                </div>
            </div>
            <div class="p-6">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-lg">${project.title}</h3>
                    ${project.badge ? `<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">${project.badge}</span>` : ''}
                </div>
                <p class="text-gray-600 mb-4 line-clamp-3">${project.description}</p>
                <div class="flex flex-wrap gap-2">
                     ${project.technologies ? project.technologies.map(tech =>
            `<span class="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">${tech.trim()}</span>`
        ).join('') : ''}
                </div>
            </div>
        </div>
    `).join('');

    if (typeof feather !== 'undefined') feather.replace();
}

document.addEventListener('DOMContentLoaded', init);
