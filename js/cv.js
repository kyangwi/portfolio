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
        <div class="bg-slate-900/80 border border-slate-700 p-8 rounded-xl shadow-sm mb-8" data-aos="fade-up">
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold mb-2">${profile.name}</h2>
                <p class="text-lg text-emerald-400 font-medium mb-6">${profile.title}</p>

                <div class="flex justify-center gap-6 text-sm text-slate-300 mb-6 flex-wrap">
                    ${profile.email ? `<span class="flex items-center"><i data-feather="mail" class="w-4 h-4 mr-2"></i><a href="mailto:${profile.email}" class="hover:text-emerald-400">${profile.email}</a></span>` : ''}
                    ${profile.phone ? `<span class="flex items-center"><i data-feather="phone" class="w-4 h-4 mr-2"></i>${profile.phone}</span>` : ''}
                    ${profile.location ? `<span class="flex items-center"><i data-feather="map-pin" class="w-4 h-4 mr-2"></i>${profile.location}</span>` : ''}
                </div>

                <div class="flex justify-center gap-4">
                    ${profile.github_url ? `<a href="${profile.github_url}" target="_blank" class="text-slate-300 hover:text-emerald-400 transition"><i data-feather="github" class="w-5 h-5"></i></a>` : ''}
                    ${profile.linkedin_url ? `<a href="${profile.linkedin_url}" target="_blank" class="text-slate-300 hover:text-emerald-400 transition"><i data-feather="linkedin" class="w-5 h-5"></i></a>` : ''}
                    ${profile.portfolio_url ? `<a href="${profile.portfolio_url}" target="_blank" class="text-slate-300 hover:text-emerald-400 transition"><i data-feather="globe" class="w-5 h-5"></i></a>` : ''}
                </div>
            </div>
            <div class="border-t border-slate-700 pt-8">
                <h3 class="text-2xl font-semibold mb-4 section-title">Professional Summary</h3>
                <p class="text-slate-200 leading-relaxed">${profile.summary ? profile.summary.replace(/\n/g, '<br>') : ''}</p>
            </div>
        </div>
    `;
}

function renderSkills(skills) {
    const container = document.getElementById('cv-skills');
    container.innerHTML = `
        <div class="bg-slate-900/80 border border-slate-700 p-8 rounded-xl shadow-sm mb-8" data-aos="fade-up">
            <h3 class="text-2xl font-semibold mb-6 section-title">Skills & Expertise</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                ${skills.map(skill => `
                <div>
                     <h4 class="font-semibold mb-3 text-slate-100 flex items-center">
                        <i data-feather="${skill.icon || 'check-circle'}" class="w-4 h-4 mr-2 text-emerald-400"></i>
                        ${skill.category}
                    </h4>
                    <div class="flex flex-wrap gap-2">
                        ${skill.skills ? skill.skills.map(s => `<span class="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-sm border border-emerald-500/30">${s.trim()}</span>`).join('') : ''}
                    </div>
                    ${skill.proficiency ? `
                    <p class="text-xs text-slate-400 mt-3">
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
        <div class="bg-slate-900/80 border border-slate-700 p-8 rounded-xl shadow-sm mb-8" data-aos="fade-up">
            <h3 class="text-2xl font-semibold mb-6 section-title">Education</h3>
            <div class="space-y-6">
                ${education.map(edu => `
                <div class="pb-6 border-b border-slate-700 last:border-b-0">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h4 class="font-semibold text-lg text-slate-100">${edu.degree}</h4>
                             ${edu.field_of_study ? `<p class="text-emerald-400 text-sm">${edu.field_of_study}</p>` : ''}
                            <p class="text-slate-300">${edu.institution}</p>
                        </div>
                        <span class="text-slate-300 text-sm whitespace-nowrap ml-4 bg-slate-800 px-3 py-1 rounded border border-slate-700">
                            ${edu.start_year} – ${edu.end_year}
                        </span>
                    </div>
                     ${edu.description ? `<p class="text-slate-300 mt-2 text-sm">${edu.description}</p>` : ''}
                </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderExperience(experience) {
    const container = document.getElementById('cv-experience');
    container.innerHTML = `
        <div class="bg-slate-900/80 border border-slate-700 p-8 rounded-xl shadow-sm mb-8" data-aos="fade-up">
            <h3 class="text-2xl font-semibold mb-6 section-title">Professional Experience</h3>
            <div class="space-y-8">
                ${experience.map(exp => `
                <div class="pb-8 border-b border-slate-700 last:border-b-0">
                     <div class="flex justify-between items-start mb-3">
                        <div>
                            <h4 class="font-semibold text-lg text-slate-100">${exp.job_title}</h4>
                            <p class="text-emerald-400 font-medium">${exp.company}</p>
                             ${exp.is_current ? `<span class="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-1 rounded-full inline-block mt-2 border border-emerald-500/30">Currently Employed</span>` : ''}
                        </div>
                        <span class="text-slate-300 text-sm whitespace-nowrap ml-4 bg-slate-800 px-3 py-1 rounded border border-slate-700">
                            ${exp.start_date} – ${exp.end_date || 'Present'}
                        </span>
                    </div>
                     <p class="text-slate-200 mt-3 leading-relaxed">${exp.description}</p>
                </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderCertifications(certifications) {
    const container = document.getElementById('cv-certifications');
    container.innerHTML = `
        <div class="bg-slate-900/80 border border-slate-700 p-8 rounded-xl shadow-sm mb-8" data-aos="fade-up">
            <h3 class="text-2xl font-semibold mb-6 section-title">Certifications</h3>
            <div class="space-y-4">
                ${certifications.map(cert => `
                <div class="flex items-start pb-4 border-b border-slate-700 last:border-b-0">
                    <div class="bg-emerald-500/20 p-2 rounded-full mr-4 mt-1 border border-emerald-500/30">
                        <i data-feather="award" class="w-4 h-4 text-emerald-400"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-semibold text-slate-100">${cert.title}</h4>
                        <p class="text-slate-300 text-sm">${cert.issuer}</p>
                        <p class="text-slate-400 text-xs mt-1">
                             <i data-feather="calendar" class="w-3 h-3 inline mr-1"></i>
                            Issued: ${cert.issue_date}
                            ${cert.expiration_date ? `| Expires: ${cert.expiration_date}` : '| No expiration'}
                        </p>
                        ${cert.credential_url ? `
                        <a href="${cert.credential_url}" target="_blank" class="text-emerald-400 text-sm hover:underline inline-block mt-2">
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

    // Build a stable off-screen clone to avoid viewport/scroll truncation.
    const tempWrap = document.createElement('div');
    tempWrap.style.position = 'fixed';
    tempWrap.style.left = '-10000px';
    tempWrap.style.top = '0';
    tempWrap.style.width = '794px'; // A4 width at ~96dpi
    tempWrap.style.background = '#f9fafb';
    tempWrap.style.zIndex = '-1';

    const clone = element.cloneNode(true);
    const inner = clone.querySelector('.max-w-4xl');
    if (inner) {
        inner.style.maxWidth = '100%';
        inner.style.width = '100%';
        inner.style.margin = '0';
    }
    tempWrap.appendChild(clone);
    document.body.appendChild(tempWrap);

    // Wait one frame for layout/fonts to settle before rendering.
    if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
    }
    await new Promise(resolve => requestAnimationFrame(() => resolve()));

    const opt = {
        margin: [8, 8, 8, 8],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: '#f9fafb',
            windowWidth: 794,
            windowHeight: tempWrap.scrollHeight,
            scrollY: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
    };

    try {
        await html2pdf().set(opt).from(clone).save();
    } catch (error) {
        console.error('PDF Generation failed:', error);
        alert('Failed to generate PDF. See console.');
    } finally {
        tempWrap.remove();
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
