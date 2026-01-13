import { getCurrentUser } from './auth.js';
import {
    getCVProfile, updateCVProfile,
    getEducation, addEducation, deleteEducation,
    getExperience, addExperience, deleteExperience,
    getSkills, addSkill, deleteSkill,
    getCertifications, addCertification, deleteCertification
} from './db.js';

async function init() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    loadProfile();
    loadLists();

    setupListeners();
}

async function loadProfile() {
    const profile = await getCVProfile() || {};
    document.getElementById('cp-name').value = profile.name || '';
    document.getElementById('cp-title').value = profile.title || '';
    document.getElementById('cp-email').value = profile.email || '';
    document.getElementById('cp-phone').value = profile.phone || '';
    document.getElementById('cp-location').value = profile.location || '';
    document.getElementById('cp-linkedin').value = profile.linkedin_url || '';
    document.getElementById('cp-github').value = profile.github_url || '';
    document.getElementById('cp-portfolio').value = profile.portfolio_url || '';
    document.getElementById('cp-summary').value = profile.summary || '';
    document.getElementById('cp-edu-sum').value = profile.education_summary || '';
    document.getElementById('cp-exp-sum').value = profile.experience_summary || '';
    document.getElementById('cp-cert-sum').value = profile.certifications_summary || '';
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('cp-name').value,
        title: document.getElementById('cp-title').value,
        email: document.getElementById('cp-email').value,
        phone: document.getElementById('cp-phone').value,
        location: document.getElementById('cp-location').value,
        linkedin_url: document.getElementById('cp-linkedin').value,
        github_url: document.getElementById('cp-github').value,
        portfolio_url: document.getElementById('cp-portfolio').value,
        summary: document.getElementById('cp-summary').value,
        education_summary: document.getElementById('cp-edu-sum').value,
        experience_summary: document.getElementById('cp-exp-sum').value,
        certifications_summary: document.getElementById('cp-cert-sum').value
    };

    try {
        await updateCVProfile(data);
        alert("Profile updated!");
    } catch (err) {
        alert("Error: " + err.message);
    }
}

async function loadLists() {
    // Education
    const education = await getEducation();
    document.getElementById('edu-list').innerHTML = education.map(item => `
        <div class="flex justify-between items-start bg-gray-50 p-2 rounded">
            <div>
                <div class="font-medium">${item.degree}</div>
                <div class="text-xs text-gray-500">${item.institution} (${item.start_year}-${item.end_year})</div>
            </div>
            <button onclick="deleteItem('education', '${item.id}')" class="text-red-500 hover:text-red-700"><i data-feather="trash-2" class="w-4 h-4"></i></button>
        </div>
    `).join('');

    // Experience
    const experience = await getExperience();
    document.getElementById('exp-list').innerHTML = experience.map(item => `
        <div class="flex justify-between items-start bg-gray-50 p-2 rounded">
            <div>
                <div class="font-medium">${item.job_title}</div>
                <div class="text-xs text-gray-500">${item.company}</div>
            </div>
            <button onclick="deleteItem('experience', '${item.id}')" class="text-red-500 hover:text-red-700"><i data-feather="trash-2" class="w-4 h-4"></i></button>
        </div>
    `).join('');

    // Skills
    const skills = await getSkills();
    document.getElementById('skill-list').innerHTML = skills.map(item => `
        <div class="flex justify-between items-center bg-gray-50 p-2 rounded">
            <div class="flex items-center">
                ${item.icon ? `<i data-feather="${item.icon}" class="w-5 h-5 text-green-600 mr-3"></i>` : '<i data-feather="cpu" class="w-5 h-5 text-gray-400 mr-3"></i>'}
                <div>
                    <div class="font-medium">${item.category}</div>
                    <div class="text-xs text-gray-500">${Array.isArray(item.skills) ? item.skills.join(', ') : item.skills}</div>
                </div>
            </div>
            <button onclick="deleteItem('skill', '${item.id}')" class="text-red-500 hover:text-red-700"><i data-feather="trash-2" class="w-4 h-4"></i></button>
        </div>
    `).join('');

    // Certifications
    const certs = await getCertifications();
    document.getElementById('cert-list').innerHTML = certs.map(item => `
        <div class="flex justify-between items-start bg-gray-50 p-2 rounded">
            <div>
                <div class="font-medium">${item.name || item.title || 'Certificate'}</div>
                <div class="text-xs text-gray-500">${item.issuer || ''}</div>
            </div>
            <button onclick="deleteItem('certification', '${item.id}')" class="text-red-500 hover:text-red-700"><i data-feather="trash-2" class="w-4 h-4"></i></button>
        </div>
    `).join('');

    if (typeof feather !== 'undefined') feather.replace();
}

// Modal Helpers
const overlay = document.getElementById('modal-overlay');

function openModal(id) {
    overlay.classList.remove('hidden');
    document.getElementById(id).classList.remove('hidden');
}

function closeModal() {
    overlay.classList.add('hidden');
    document.querySelectorAll('[id^="modal-"]').forEach(el => el.classList.add('hidden'));
}

function setupListeners() {
    document.getElementById('cv-profile-form').addEventListener('submit', handleProfileUpdate);

    // Modal Triggers
    document.getElementById('add-edu-btn').addEventListener('click', () => openModal('modal-education'));
    document.getElementById('add-exp-btn').addEventListener('click', () => openModal('modal-experience'));
    document.getElementById('add-skill-btn').addEventListener('click', () => openModal('modal-skill'));
    document.getElementById('add-cert-btn').addEventListener('click', () => openModal('modal-certification'));

    // Close Actions
    overlay.addEventListener('click', closeModal);
    document.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeModal));

    // Live Icon Preview
    document.getElementById('skill-icon').addEventListener('input', (e) => {
        const iconName = e.target.value.trim();
        const previewEl = document.getElementById('skill-icon-preview');

        if (iconName && feather.icons[iconName]) {
            previewEl.innerHTML = feather.icons[iconName].toSvg({ class: 'text-green-600' });
        } else {
            previewEl.innerHTML = '<i data-feather="help-circle" class="text-gray-400"></i>';
            feather.replace();
        }
    });

    // Save Handlers
    document.getElementById('save-edu-btn').addEventListener('click', async () => {
        const degree = document.getElementById('edu-degree').value;
        const institution = document.getElementById('edu-institution').value;
        const start = document.getElementById('edu-start').value;
        const end = document.getElementById('edu-end').value;

        if (!degree || !institution) return alert("Degree and Institution required");

        await addEducation({ degree, institution, start_year: start, end_year: end });
        closeModal();
        loadLists();
        ['edu-degree', 'edu-institution', 'edu-start', 'edu-end'].forEach(id => document.getElementById(id).value = '');
    });

    document.getElementById('save-exp-btn').addEventListener('click', async () => {
        const title = document.getElementById('exp-title').value;
        const company = document.getElementById('exp-company').value;
        const start = document.getElementById('exp-start').value;
        const end = document.getElementById('exp-end').value;
        const desc = document.getElementById('exp-desc').value;

        if (!title || !company) return alert("Title and Company required");

        await addExperience({ job_title: title, company, start_date: start, end_date: end, description: desc });
        closeModal();
        loadLists();
        ['exp-title', 'exp-company', 'exp-start', 'exp-end', 'exp-desc'].forEach(id => document.getElementById(id).value = '');
    });

    document.getElementById('save-skill-btn').addEventListener('click', async () => {
        const category = document.getElementById('skill-category').value;
        const skillsStr = document.getElementById('skill-items').value;
        const icon = document.getElementById('skill-icon').value;

        if (!category || !skillsStr) return alert("Category and Skill Name required");

        const skillsArray = skillsStr.split(',').map(s => s.trim());
        await addSkill({ category, skills: skillsArray, icon });

        closeModal();
        loadLists();
        ['skill-category', 'skill-items', 'skill-icon'].forEach(id => document.getElementById(id).value = '');
    });

    document.getElementById('save-cert-btn').addEventListener('click', async () => {
        const name = document.getElementById('cert-name').value;
        const issuer = document.getElementById('cert-issuer').value;
        const date = document.getElementById('cert-date').value;
        const url = document.getElementById('cert-url').value;

        if (!name) return alert("Certification Name required");

        await addCertification({ name, issuer, issue_date: date, url });
        closeModal();
        loadLists();
        ['cert-name', 'cert-issuer', 'cert-date', 'cert-url'].forEach(id => document.getElementById(id).value = '');
    });
}

// Global delete handler
window.deleteItem = async (type, id) => {
    if (!confirm("Are you sure?")) return;
    try {
        if (type === 'education') await deleteEducation(id);
        if (type === 'experience') await deleteExperience(id);
        if (type === 'skill') await deleteSkill(id);
        if (type === 'certification') await deleteCertification(id);
        loadLists();
    } catch (e) {
        alert("Error: " + e.message);
    }
};

document.addEventListener('DOMContentLoaded', init);
