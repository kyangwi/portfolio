import {
    getFeaturedProjects,
    getAllProjects, // Added for "last 6 uploaded"
    getRecentBlogs,
    getAchievements,
    getCVProfile,
    getSkills,
    getEducation,
    getExperience,
    getCertifications
} from './db.js';

// Helpers
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getImageSrc = (item, defaultIcon = 'image') => {
    if (item.image_base64) return item.image_base64;
    // Fallback if we kept URL in migration (we primarily used base64)
    // If no image, return null to show placeholder
    return null;
};

// Render Functions

async function renderHeroProjects(projects) {
    const container = document.getElementById('hero-projects-container');
    if (!container) return;

    container.innerHTML = projects.slice(0, 2).map(project => `
        <div class="relative w-full h-72 rounded-xl overflow-hidden group shadow-2xl border border-white/10 hover:border-green-400/30 transition-all duration-300">
            <div class="absolute inset-0">
                ${project.image_base64 ?
            `<img src="${project.image_base64}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="${project.title}">` :
            `<div class="w-full h-full bg-gray-700 flex items-center justify-center"><i data-feather="image" class="text-gray-500 w-12 h-12"></i></div>`
        }
                <div class="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/60 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-95"></div>
            </div>
            <div class="absolute bottom-0 left-0 w-full p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <h4 class="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">${project.title}</h4>
                <p class="text-gray-300 text-sm line-clamp-2 leading-relaxed mb-0">${project.description}</p>
            </div>
        </div>
    `).join('');

    if (typeof feather !== 'undefined') feather.replace();
}

async function renderHeroBlog(blogs) {
    const container = document.getElementById('hero-blog-container');
    if (!container || blogs.length === 0) return;

    const post = blogs[0];

    container.innerHTML = `
        <div>
            <div class="bg-white/10 backdrop-blur-sm p-8 rounded-xl border border-white/20 animate-slide-up stagger-1">
                <div class="flex items-center mb-4">
                    <i data-feather="book" class="w-8 h-8 text-green-400 mr-3"></i>
                    <h3 class="text-2xl font-bold text-white">${post.title}</h3>
                </div>
                <p class="text-gray-100 mb-4 line-clamp-3">${post.description}</p>
                <a href="/blog.html" class="inline-flex items-center text-green-400 hover:text-green-300 font-semibold">
                    Read Articles <i data-feather="arrow-right" class="w-4 h-4 ml-2"></i>
                </a>
            </div>
        </div>
        <div class="space-y-4 animate-slide-up stagger-2">
            <a href="/post.html?id=${post.post_id}" class="block bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/15 transition overflow-hidden group">
                <div class="flex gap-4 h-64">
                    ${post.image_base64 ?
            `<img src="${post.image_base64}" alt="${post.title}" class="w-full h-full object-cover fill group-hover:scale-105 transition duration-300">` :
            `<div class="w-full h-full flex items-center justify-center text-gray-400"><i data-feather="image"></i></div>`
        }
                </div>
            </a>
        </div>
    `;
    if (typeof feather !== 'undefined') feather.replace();
}

async function renderProjectsGrid(projects) {
    const container = document.getElementById('projects-grid');
    if (!container) return;

    container.innerHTML = projects.map(project => `
        <div class="project-card overflow-hidden transition duration-300 group rounded-xl shadow-md bg-slate-900/80 border border-slate-700" data-aos="fade-up">
            <div class="relative overflow-hidden h-48 bg-slate-800">
                 ${project.image_base64 ?
            `<img src="${project.image_base64}" alt="${project.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">` :
            `<div class="w-full h-full flex items-center justify-center"><i data-feather="image" class="text-gray-400 w-12 h-12"></i></div>`
        }
                ${project.badge ?
            `<div class="absolute top-4 right-4"><span class="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">${project.badge}</span></div>` : ''
        }
            </div>

            <div class="p-6">
                <h3 class="font-bold text-lg mb-2 text-slate-100 group-hover:text-emerald-400 transition">${project.title}</h3>
                <p class="text-slate-300 mb-4 text-sm line-clamp-2">${project.description}</p>
                
                ${project.technologies && project.technologies.length > 0 ? `
                <div class="mb-4 flex flex-wrap gap-2">
                    ${project.technologies.slice(0, 4).map(tech => `<span class="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-1 rounded border border-emerald-500/30">${tech}</span>`).join('')}
                    ${project.technologies.length > 4 ? `<span class="text-slate-400 text-xs px-2 py-1">+${project.technologies.length - 4} more</span>` : ''}
                </div>` : ''}

                ${project.link ? `
                <a href="${project.link}" target="_blank" class="inline-flex items-center text-emerald-400 hover:text-emerald-300 font-semibold text-sm hover:underline">
                    View Project <i data-feather="external-link" class="w-4 h-4 ml-2"></i>
                </a>` : ''}
            </div>
        </div>
    `).join('');
    if (typeof feather !== 'undefined') feather.replace();
}

async function renderAchievements(achievements) {
    const hackathonContainer = document.getElementById('achievements-hackathon');
    const recognitionContainer = document.getElementById('achievements-recognition');

    if (!hackathonContainer || !recognitionContainer) return;

    const hackathons = achievements.filter(a => a.category === 'hackathon');
    const recognitions = achievements.filter(a => a.category !== 'hackathon'); // Default or recognition

    const renderList = (items, emptyText) => {
        if (items.length === 0) return `<li class="text-slate-400">${emptyText}</li>`;
        return items.map(item => `
            <li class="flex items-start">
                <div class="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-1 rounded-full mr-3 mt-1 whitespace-nowrap border border-emerald-500/30">${item.rank}</div>
                <div>
                    <h4 class="font-medium text-slate-100">${item.title}</h4>
                    <p class="text-slate-300 text-sm">${item.description}</p>
                </div>
            </li>
        `).join('');
    };

    hackathonContainer.innerHTML = renderList(hackathons, "No hackathon wins yet.");
    recognitionContainer.innerHTML = renderList(recognitions, "No recognitions yet.");
}

async function renderBlogGrid(blogs) {
    const container = document.getElementById('blog-grid');
    if (!container) return;

    if (blogs.length === 0) {
        container.innerHTML = `
        <div class="col-span-1 md:col-span-3 text-center py-16">
            <p class="text-slate-400 text-lg">No blog posts yet.</p>
        </div>`;
        return;
    }

    container.innerHTML = blogs.map(blog => `
        <div class="bg-slate-900/80 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition duration-300 border border-slate-700" data-aos="fade-up">
            <div class="relative overflow-hidden h-48 bg-slate-800">
                 ${blog.image_base64 ?
            `<img src="${blog.image_base64}" alt="${blog.title}" class="w-full h-full object-cover hover:scale-105 transition duration-300">` :
            `<div class="w-full h-full flex items-center justify-center"><i data-feather="file-text" class="text-gray-400 w-12 h-12"></i></div>`
        }
            </div>
            <div class="p-6">
                <h3 class="text-xl font-bold mb-2 line-clamp-1 text-slate-100">${blog.title}</h3>
                <p class="text-slate-300 mb-4 line-clamp-3">${blog.description}</p>
                <div class="flex items-center justify-between mb-4">
                    <span class="text-slate-400 text-sm">${formatDate(blog.published_at)}</span>
                    <span class="text-slate-400 text-sm">${blog.read_time || '5'} min read</span>
                </div>
                <a href="/post.html?id=${blog.post_id}" class="inline-flex items-center text-emerald-400 hover:text-emerald-300 font-semibold">
                    Read More <i data-feather="arrow-right" class="w-4 h-4 ml-2"></i>
                </a>
            </div>
        </div>
    `).join('');
    if (typeof feather !== 'undefined') feather.replace();
}

async function renderProfileAndCV(profile, skills) {
    // 1. Profile Summary
    const summaryContainer = document.getElementById('profile-summary');
    if (summaryContainer) {
        summaryContainer.innerHTML = profile && profile.summary ?
            profile.summary.split('\n').map(line => `<p class="mb-2">${line}</p>`).join('') :
            '<p>Enthusiastic Data Scientist...</p>';
    }

    // 2. Skills
    const skillsContainer = document.getElementById('skills-container');
    if (skillsContainer) {
        if (skills.length === 0) {
            skillsContainer.innerHTML = '<p class="text-slate-400">No skills listed yet.</p>';
        } else {
            // Reverse order to match template logic
            skillsContainer.innerHTML = skills.reverse().map(skill => `
                <div class="skill-card bg-slate-900/80 p-6 rounded-xl transition duration-300 shadow-sm border border-slate-700 group hover:shadow-md">
                    <div class="flex items-center mb-3">
                        <div class="bg-emerald-500/20 p-2 rounded-full mr-3 group-hover:bg-emerald-500/30 transition border border-emerald-500/30">
                            <i data-feather="${skill.icon || 'check-circle'}" class="text-emerald-400"></i>
                        </div>
                        <h4 class="font-semibold text-slate-100 group-hover:text-emerald-300 transition">${skill.category}</h4>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        ${skill.skills ? (Array.isArray(skill.skills) ? skill.skills : [skill.skills]).map(tech => `
                            <span class="bg-slate-800 text-slate-200 text-sm px-3 py-1 rounded-full hover:bg-emerald-500/20 hover:text-emerald-300 transition cursor-default border border-slate-700">
                                ${tech.trim()}
                            </span>
                        `).join('') : ''}
                    </div>
                </div>
            `).join('');
        }
    }

    // 3. CV Cards (Education, Experience, Certs)
    const cvContainer = document.getElementById('cv-cards-container');
    if (cvContainer) {
        // We need to determine summary text.
        // Try profile first, else fetch count.
        let eduText = profile.education_summary;
        let expText = profile.experience_summary;
        let certText = profile.certifications_summary;

        if (!eduText || eduText === "View academic background") {
            const edu = await getEducation();
            if (edu.length > 0) {
                eduText = `${edu[0].degree}`;
                if (edu.length > 1) eduText += ` and ${edu.length - 1} other${edu.length > 2 ? 's' : ''}`;
            } else {
                eduText = "View academic background";
            }
        }

        if (!expText || expText === "Professional work history") {
            const exp = await getExperience();
            if (exp.length > 0) {
                let role = exp[0].job_title;
                if (exp.length > 1) {
                    expText = `${role} + ${exp.length - 1} role${exp.length > 2 ? 's' : ''}`;
                } else {
                    expText = `${role} at ${exp[0].company}`;
                }
            } else {
                expText = "Professional work history";
            }
        }

        if (!certText || certText === "Professional credentials") {
            const certs = await getCertifications();
            if (certs.length > 0) {
                certText = `${certs.length} Professional Certification${certs.length > 1 ? 's' : ''}`;
            } else {
                certText = "Professional credentials";
            }
        }

        cvContainer.innerHTML = `
            <!-- Education Card -->
            <div class="bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 p-6 rounded-xl shadow-md border border-emerald-700/30">
                <div class="flex items-center mb-3">
                    <div class="bg-emerald-500 p-3 rounded-full mr-3"><i data-feather="book-open" class="text-white w-5 h-5"></i></div>
                    <h3 class="text-lg font-semibold text-slate-100">Education</h3>
                </div>
                <p class="text-slate-200 text-sm">${eduText}</p>
            </div>

            <!-- Experience Card -->
             <div class="bg-gradient-to-br from-sky-900/50 to-blue-800/30 p-6 rounded-xl shadow-md border border-blue-700/30">
                <div class="flex items-center mb-3">
                    <div class="bg-blue-500 p-3 rounded-full mr-3"><i data-feather="briefcase" class="text-white w-5 h-5"></i></div>
                    <h3 class="text-lg font-semibold text-slate-100">Experience</h3>
                </div>
                <p class="text-slate-200 text-sm">${expText}</p>
            </div>

            <!-- Certifications Card -->
            <div class="bg-gradient-to-br from-amber-900/50 to-orange-800/30 p-6 rounded-xl shadow-md border border-orange-700/30">
                <div class="flex items-center mb-3">
                    <div class="bg-orange-500 p-3 rounded-full mr-3"><i data-feather="award" class="text-white w-5 h-5"></i></div>
                    <h3 class="text-lg font-semibold text-slate-100">Certifications</h3>
                </div>
                <p class="text-slate-200 text-sm">${certText}</p>
            </div>

            <!-- View Full CV Button -->
            <div class="text-center pt-4">
                <a href="/cv.html" class="inline-flex items-center bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition w-full justify-center">
                    View Full CV <i data-feather="arrow-right" class="ml-2 w-4 h-4"></i>
                </a>
            </div>
        `;
    }
    if (typeof feather !== 'undefined') feather.replace();
}


// Main Init
async function init() {
    try {
        const [allProjects, blogs, achievements, profile, skills] = await Promise.all([
            getAllProjects(), // User wants last uploaded projects
            getRecentBlogs(6), // User wants 6 blogs
            getAchievements(),
            getCVProfile(),
            getSkills()
        ]);

        // Filter for hero if needed, but for now just pass allProjects to hero and grid
        // Hero usually needs featured, but we can just use top 2 recent if no featured logic desires?
        // Let's manually filter featured for Hero, but use recent 6 for Grid.

        const featuredForHero = allProjects.filter(p => p.featured); // Or just slice 0,2 if none featured
        const recent6Projects = allProjects.slice(0, 6); // Last 6 uploaded

        await renderHeroProjects(featuredForHero.length > 0 ? featuredForHero : allProjects.slice(0, 2));
        await renderHeroBlog(blogs); // Already limited to 6, likely slice for hero inside renderHeroBlog logic uses [0]
        await renderProjectsGrid(recent6Projects);
        await renderBlogGrid(blogs);
        await renderAchievements(achievements);
        await renderProfileAndCV(profile || {}, skills);

        if (typeof feather !== 'undefined') feather.replace();
        if (typeof AOS !== 'undefined') AOS.refresh();

    } catch (error) {
        console.error("Error loading data:", error);
    }
}

document.addEventListener('DOMContentLoaded', init);
