import { getCVProfile, getSkills, getEducation, getExperience, getCertifications } from './db.js';

let loadedProfileName = "CV";

async function init() {
    try {
        const [profile, skills, education, experience, certifications] = await Promise.all([
            getCVProfile(),
            getSkills(),
            getEducation(),
            getExperience(),
            getCertifications()
        ]);

        document.getElementById('cv-loading').style.display = 'none';

        if (profile) {
            loadedProfileName = profile.name || "CV";
            renderProfile(profile);
            document.title = `${profile.name} - CV`;
        }

        if (skills.length) renderSkills(skills);
        if (education.length) renderEducation(education);
        if (experience.length) renderExperience(experience);
        if (certifications.length) renderCertifications(certifications);

        if (typeof feather !== 'undefined') feather.replace();

    } catch (error) {
        console.error("Error loading CV:", error);
        document.getElementById('cv-loading').textContent = "Error loading CV data.";
    }
}

function renderProfile(profile) {
    const container = document.getElementById('cv-profile');
    container.innerHTML = `
        <div class="bg-white p-8 rounded-xl shadow-sm mb-8" data-aos="fade-up">
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold mb-2">${profile.name}</h2>
                <p class="text-lg text-green-600 font-medium mb-6">${profile.title}</p>

                <div class="flex justify-center gap-6 text-sm text-gray-600 mb-6 flex-wrap">
                    ${profile.email ? `<span class="flex items-center"><i data-feather="mail" class="w-4 h-4 mr-2"></i><a href="mailto:${profile.email}" class="hover:text-green-600">${profile.email}</a></span>` : ''}
                    ${profile.phone ? `<span class="flex items-center"><i data-feather="phone" class="w-4 h-4 mr-2"></i>${profile.phone}</span>` : ''}
                    ${profile.location ? `<span class="flex items-center"><i data-feather="map-pin" class="w-4 h-4 mr-2"></i>${profile.location}</span>` : ''}
                </div>

                <div class="flex justify-center gap-4">
                    ${profile.github_url ? `<a href="${profile.github_url}" target="_blank" class="text-gray-600 hover:text-green-600 transition"><i data-feather="github" class="w-5 h-5"></i></a>` : ''}
                    ${profile.linkedin_url ? `<a href="${profile.linkedin_url}" target="_blank" class="text-gray-600 hover:text-green-600 transition"><i data-feather="linkedin" class="w-5 h-5"></i></a>` : ''}
                    ${profile.portfolio_url ? `<a href="${profile.portfolio_url}" target="_blank" class="text-gray-600 hover:text-green-600 transition"><i data-feather="globe" class="w-5 h-5"></i></a>` : ''}
                </div>
            </div>
            <div class="border-t pt-8">
                <h3 class="text-2xl font-semibold mb-4 section-title">Professional Summary</h3>
                <p class="text-gray-700 leading-relaxed">${profile.summary ? profile.summary.replace(/\n/g, '<br>') : ''}</p>
            </div>
        </div>
    `;
}

function renderSkills(skills) {
    const container = document.getElementById('cv-skills');
    container.innerHTML = `
        <div class="bg-white p-8 rounded-xl shadow-sm mb-8" data-aos="fade-up">
            <h3 class="text-2xl font-semibold mb-6 section-title">Skills & Expertise</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                ${skills.map(skill => `
                <div>
                     <h4 class="font-semibold mb-3 text-gray-800 flex items-center">
                        <i data-feather="${skill.icon || 'check-circle'}" class="w-4 h-4 mr-2 text-green-600"></i>
                        ${skill.category}
                    </h4>
                    <div class="flex flex-wrap gap-2">
                        ${skill.skills ? skill.skills.map(s => `<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">${s.trim()}</span>`).join('') : ''}
                    </div>
                    ${skill.proficiency ? `
                    <p class="text-xs text-gray-500 mt-3">
                        <i data-feather="trending-up" class="w-3 h-3 inline mr-1"></i>
                        Level: <span class="font-medium capitalize">${skill.proficiency}</span>
                    </p>` : ''}
                </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderEducation(education) {
    const container = document.getElementById('cv-education');
    container.innerHTML = `
        <div class="bg-white p-8 rounded-xl shadow-sm mb-8" data-aos="fade-up">
            <h3 class="text-2xl font-semibold mb-6 section-title">Education</h3>
            <div class="space-y-6">
                ${education.map(edu => `
                <div class="pb-6 border-b last:border-b-0">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h4 class="font-semibold text-lg">${edu.degree}</h4>
                             ${edu.field_of_study ? `<p class="text-green-600 text-sm">${edu.field_of_study}</p>` : ''}
                            <p class="text-gray-600">${edu.institution}</p>
                        </div>
                        <span class="text-gray-500 text-sm whitespace-nowrap ml-4 bg-gray-100 px-3 py-1 rounded">
                            ${edu.start_year} – ${edu.end_year}
                        </span>
                    </div>
                     ${edu.description ? `<p class="text-gray-600 mt-2 text-sm">${edu.description}</p>` : ''}
                </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderExperience(experience) {
    const container = document.getElementById('cv-experience');
    container.innerHTML = `
        <div class="bg-white p-8 rounded-xl shadow-sm mb-8" data-aos="fade-up">
            <h3 class="text-2xl font-semibold mb-6 section-title">Professional Experience</h3>
            <div class="space-y-8">
                ${experience.map(exp => `
                <div class="pb-8 border-b last:border-b-0">
                     <div class="flex justify-between items-start mb-3">
                        <div>
                            <h4 class="font-semibold text-lg">${exp.job_title}</h4>
                            <p class="text-green-600 font-medium">${exp.company}</p>
                             ${exp.is_current ? `<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full inline-block mt-2">Currently Employed</span>` : ''}
                        </div>
                        <span class="text-gray-500 text-sm whitespace-nowrap ml-4 bg-gray-100 px-3 py-1 rounded">
                            ${exp.start_date} – ${exp.end_date || 'Present'}
                        </span>
                    </div>
                     <p class="text-gray-700 mt-3 leading-relaxed">${exp.description}</p>
                </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderCertifications(certifications) {
    const container = document.getElementById('cv-certifications');
    container.innerHTML = `
        <div class="bg-white p-8 rounded-xl shadow-sm mb-8" data-aos="fade-up">
            <h3 class="text-2xl font-semibold mb-6 section-title">Certifications</h3>
            <div class="space-y-4">
                ${certifications.map(cert => `
                <div class="flex items-start pb-4 border-b last:border-b-0">
                    <div class="bg-green-100 p-2 rounded-full mr-4 mt-1">
                        <i data-feather="award" class="w-4 h-4 text-green-600"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-semibold">${cert.title}</h4>
                        <p class="text-gray-600 text-sm">${cert.issuer}</p>
                        <p class="text-gray-500 text-xs mt-1">
                             <i data-feather="calendar" class="w-3 h-3 inline mr-1"></i>
                            Issued: ${cert.issue_date}
                            ${cert.expiration_date ? `| Expires: ${cert.expiration_date}` : '| No expiration'}
                        </p>
                        ${cert.credential_url ? `
                        <a href="${cert.credential_url}" target="_blank" class="text-green-600 text-sm hover:underline inline-block mt-2">
                            Verify credential →
                        </a>` : ''}
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
    `;
}

// PDF Download
async function downloadCV() {
    const element = document.getElementById('cv-content-section');
    const downloadBtn = document.getElementById('download-cv-btn');

    // Hide button
    downloadBtn.style.display = 'none';

    // Temp disable AOS
    const aosElements = document.querySelectorAll('[data-aos]');
    const savedAos = [];
    aosElements.forEach(el => {
        savedAos.push({ el, attr: el.getAttribute('data-aos') });
        el.removeAttribute('data-aos');
        el.classList.remove('aos-animate'); // Ensure visibility
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.visibility = 'visible';
    });

    const filename = loadedProfileName.replace(/\s+/g, '_') + '_CV.pdf';

    const opt = {
        margin: [10, 5, 10, 10],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, windowWidth: 1200 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
        await html2pdf().set(opt).from(element).save();
    } catch (error) {
        console.error('PDF Generation failed:', error);
        alert('Failed to generate PDF. See console.');
    } finally {
        downloadBtn.style.display = 'flex';
        // Restore AOS
        savedAos.forEach(item => {
            item.el.setAttribute('data-aos', item.attr);
        });
        if (typeof AOS !== 'undefined') AOS.refresh();
    }
}

document.getElementById('download-cv-btn').addEventListener('click', downloadCV);
document.addEventListener('DOMContentLoaded', init);
