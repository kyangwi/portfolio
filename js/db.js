import { db } from './firebase-config.js';
import {
    collection,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const CACHE_TTL = 60 * 60 * 1000; // 1 Hour

// Helper to convert Timestamp to ISO String for consistent caching
function normalizeFirestoreData(doc) {
    const data = doc.data();
    const normalized = { id: doc.id };

    for (const [key, value] of Object.entries(data)) {
        // Check for Firestore Timestamp (has toDate method)
        if (value && typeof value.toDate === 'function') {
            normalized[key] = value.toDate().toISOString();
        } else {
            normalized[key] = value;
        }
    }
    return normalized;
}

// --- Caching Helpers ---
async function cachedFetch(key, fetchFn) {
    const cached = localStorage.getItem(key);
    if (cached) {
        try {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL) {
                // Verify data is array if expected (simple check)
                if (Array.isArray(data) && data.length > 0) return data;
                // If data is empty array, it might be valid, but if strictly checking...
                // Let's assume valid.
                return data;
            }
        } catch (e) {
            console.warn("Cache parse error", e);
            localStorage.removeItem(key);
        }
    }

    try {
        const data = await fetchFn();
        try {
            // Check output size before caching to avoid quota errors spamming
            const jsonString = JSON.stringify({ data, timestamp: Date.now() });
            if (jsonString.length < 4 * 1024 * 1024) { // Limit cache to items < 4MB
                localStorage.setItem(key, jsonString);
            } else {
                console.warn(`[Cache Skip] Data for ${key} too large (${jsonString.length} bytes)`);
            }
        } catch (e) {
            console.warn("Quota exceeded or storage error", e);
        }
        return data;
    } catch (err) {
        console.error(`Fetch failed for ${key}`, err);
        throw err; // Propagate error so UI shows loading failure or empty state
    }
}

function invalidateCache(key) {
    localStorage.removeItem(key);
}

// Update keys to v2 to force refresh
function invalidateProjects() { invalidateCache('cache_v2_projects'); }
function invalidateBlogs() { invalidateCache('cache_v2_blogs'); }
function invalidateAchievements() { invalidateCache('cache_v2_achievements'); }
function invalidateCVProfile() { invalidateCache('cache_v2_cv_profile'); }
function invalidateSkills() { invalidateCache('cache_v2_cv_skills'); }
function invalidateEducation() { invalidateCache('cache_v2_cv_education'); }
function invalidateExperience() { invalidateCache('cache_v2_cv_experience'); }
function invalidateCertifications() { invalidateCache('cache_v2_cv_certifications'); }


// --- Projects ---

async function fetchAllProjectsRaw() {
    const q = query(collection(db, "projects"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(normalizeFirestoreData);
}

export async function getFeaturedProjects() {
    const projects = await cachedFetch('cache_v2_projects', fetchAllProjectsRaw);
    return projects
        .filter(p => p.featured === true)
        .sort((a, b) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return dateB - dateA;
        });
}

export async function getAllProjects() {
    const projects = await cachedFetch('cache_v2_projects', fetchAllProjectsRaw);
    return projects.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
    });
}

export async function addProject(data) {
    const docRef = await addDoc(collection(db, "projects"), {
        ...data,
        created_at: new Date().toISOString()
    });
    invalidateProjects();
    return docRef.id;
}

export async function updateProject(id, data) {
    const docRef = doc(db, "projects", id);
    await updateDoc(docRef, data);
    invalidateProjects();
}

export async function deleteProject(id) {
    await deleteDoc(doc(db, "projects", id));
    invalidateProjects();
}


// --- Blogs ---

async function fetchAllBlogsRaw() {
    const q = query(collection(db, "blog_posts"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(normalizeFirestoreData);
}

export async function getRecentBlogs(limitCount = 3) {
    const blogs = await cachedFetch('cache_v2_blogs', fetchAllBlogsRaw);

    return blogs
        .filter(b => b.status === "published")
        .sort((a, b) => {
            const dateA = new Date(a.published_at || 0);
            const dateB = new Date(b.published_at || 0);
            return dateB - dateA;
        })
        .slice(0, limitCount);
}

export async function getAllBlogs() {
    const blogs = await cachedFetch('cache_v2_blogs', fetchAllBlogsRaw);
    return blogs.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
    });
}

export async function getBlogPost(id) {
    // Cache individual posts too
    return cachedFetch(`cache_post_${id}`, async () => {
        // Try Doc ID first
        try {
            const docRef = doc(db, "blog_posts", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
        } catch (e) {
            // Ignore, might not be valid doc ID
        }

        // Try post_id query
        const q = query(collection(db, "blog_posts"), where("post_id", "==", id));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        }
        return null;
    });
}

export async function addBlogPost(data) {
    // Generate post_id from title if not present
    if (!data.post_id) {
        data.post_id = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const docRef = await addDoc(collection(db, "blog_posts"), {
        ...data,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        views: 0
    });
    invalidateBlogs();
    return docRef.id;
}

export async function updateBlogPost(id, data) {
    const docRef = doc(db, "blog_posts", id);
    await updateDoc(docRef, {
        ...data,
        updated_at: serverTimestamp()
    });
    invalidateBlogs();
    invalidateCache(`cache_post_${id}`);
}

export async function deleteBlogPost(id) {
    await deleteDoc(doc(db, "blog_posts", id));
    invalidateBlogs();
    invalidateCache(`cache_post_${id}`);
}


// --- CV & Achievements ---

// Achievements
export async function getAchievements() {
    return cachedFetch('cache_v2_achievements', async () => {
        const q = query(collection(db, "achievements"));
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(normalizeFirestoreData)
            .sort((a, b) => {
                const dateA = new Date(a.date || 0);
                const dateB = new Date(b.date || 0);
                return dateB - dateA;
            });
    });
}

export async function addAchievement(data) {
    const docRef = await addDoc(collection(db, "achievements"), data);
    invalidateAchievements();
    return docRef.id;
}

export async function updateAchievement(id, data) {
    await updateDoc(doc(db, "achievements", id), data);
    invalidateAchievements();
}

export async function deleteAchievement(id) {
    await deleteDoc(doc(db, "achievements", id));
    invalidateAchievements();
}

// CV Profile
export async function getCVProfile() {
    return cachedFetch('cache_v2_cv_profile', async () => {
        const docRef = doc(db, "cv_profile", "main");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return normalizeFirestoreData(docSnap);
        }
        return null;
    });
}

export async function updateCVProfile(data) {
    // Upsert
    await setDoc(doc(db, "cv_profile", "main"), data, { merge: true });
    invalidateCVProfile();
}

// CV Skills
export async function getSkills() {
    return cachedFetch('cache_v2_cv_skills', async () => {
        const snapshot = await getDocs(collection(db, "cv_skills"));
        return snapshot.docs.map(normalizeFirestoreData);
    });
}

export async function addSkill(data) {
    await addDoc(collection(db, "cv_skills"), data);
    invalidateSkills();
}

export async function updateSkill(id, data) {
    await updateDoc(doc(db, "cv_skills", id), data);
    invalidateSkills();
}

export async function deleteSkill(id) {
    await deleteDoc(doc(db, "cv_skills", id));
    invalidateSkills();
}

// CV Education
export async function getEducation() {
    return cachedFetch('cache_v2_cv_education', async () => {
        const q = query(collection(db, "cv_education"));
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(normalizeFirestoreData)
            .sort((a, b) => (b.end_year || 0) - (a.end_year || 0));
    });
}

export async function addEducation(data) {
    await addDoc(collection(db, "cv_education"), data);
    invalidateEducation();
}

export async function updateEducation(id, data) {
    await updateDoc(doc(db, "cv_education", id), data);
    invalidateEducation();
}

export async function deleteEducation(id) {
    await deleteDoc(doc(db, "cv_education", id));
    invalidateEducation();
}

// CV Experience
export async function getExperience() {
    return cachedFetch('cache_v2_cv_experience', async () => {
        const q = query(collection(db, "cv_experience"));
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(normalizeFirestoreData)
            .sort((a, b) => {
                const dateA = new Date(a.start_date || 0);
                const dateB = new Date(b.start_date || 0);
                return dateB - dateA;
            });
    });
}

export async function addExperience(data) {
    await addDoc(collection(db, "cv_experience"), data);
    invalidateExperience();
}

export async function updateExperience(id, data) {
    await updateDoc(doc(db, "cv_experience", id), data);
    invalidateExperience();
}

export async function deleteExperience(id) {
    await deleteDoc(doc(db, "cv_experience", id));
    invalidateExperience();
}

// CV Certifications
export async function getCertifications() {
    return cachedFetch('cache_v2_cv_certifications', async () => {
        const q = query(collection(db, "cv_certifications"));
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(normalizeFirestoreData)
            .sort((a, b) => {
                const dateA = new Date(a.issue_date || 0);
                const dateB = new Date(b.issue_date || 0);
                return dateB - dateA;
            });
    });
}

export async function addCertification(data) {
    await addDoc(collection(db, "cv_certifications"), data);
    invalidateCertifications();
}

export async function updateCertification(id, data) {
    await updateDoc(doc(db, "cv_certifications", id), data);
    invalidateCertifications();
}

export async function deleteCertification(id) {
    await deleteDoc(doc(db, "cv_certifications", id));
    invalidateCertifications();
}
