import { getCurrentUser } from './auth.js';
import { addAchievement, updateAchievement, getAchievements } from './db.js';

let currentId = null;

async function init() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const editId = params.get('id');
    if (editId) {
        loadData(editId);
    }

    document.getElementById('achievement-form').addEventListener('submit', handleSave);
}

async function loadData(id) {
    const items = await getAchievements(); // Inefficient but simple
    const item = items.find(i => i.id === id);

    if (item) {
        currentId = item.id;
        document.getElementById('ach-title').value = item.title;
        document.getElementById('ach-description').value = item.description;
        document.getElementById('ach-rank').value = item.rank || '';
        document.getElementById('ach-category').value = item.category || 'hackathon';
        document.getElementById('ach-date').value = item.date ? item.date.split('T')[0] : ''; // Simple date handling
        document.getElementById('ach-icon').value = item.icon_name || 'award';
    }
}

async function handleSave(e) {
    e.preventDefault();

    const data = {
        title: document.getElementById('ach-title').value,
        description: document.getElementById('ach-description').value,
        rank: document.getElementById('ach-rank').value,
        category: document.getElementById('ach-category').value,
        date: document.getElementById('ach-date').value,
        icon_name: document.getElementById('ach-icon').value
    };

    try {
        if (currentId) {
            await updateAchievement(currentId, data);
            alert("Achievement updated!");
        } else {
            await addAchievement(data);
            alert("Achievement added!");
        }
        window.location.href = '/admin.html';
    } catch (err) {
        console.error("Error saving", err);
        alert("Error saving: " + err.message);
    }
}

document.addEventListener('DOMContentLoaded', init);
