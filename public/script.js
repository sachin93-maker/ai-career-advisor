// DOM elements
const careerForm = document.getElementById('careerForm');
const submitBtn = document.getElementById('submitBtn');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const error = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');

// Form submission handler
careerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const skills = document.getElementById('skills').value.trim();
    const interests = document.getElementById('interests').value.trim();
    
    if (!skills || !interests) {
        showError('Please fill in both skills and interests fields.');
        return;
    }
    
    await getCareerRecommendations(skills, interests);
});

// Get career recommendations
async function getCareerRecommendations(skills, interests) {
    try {
        showLoading();
        
        const response = await fetch('/api/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skills, interests })
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get recommendations');
        }
        
        displayResults(data);
    } catch (err) {
        console.error('Error:', err);
        showError(err.message || 'Unable to get career recommendations. Please try again.');
    } finally {
        hideLoading();
    }
}

// Display results
function displayResults(data) {
    document.getElementById('careerPaths').innerHTML = '';
    document.getElementById('requiredSkills').innerHTML = '';
    document.getElementById('courses').innerHTML = '';
    
    data.careerPaths?.forEach(path => {
        const pathElement = document.createElement('div');
        pathElement.className = 'career-path';
        pathElement.innerHTML = `
            <h4>${path.title || 'N/A'}</h4>
            <p><strong>Description:</strong> ${path.description || 'No description available.'}</p>
            <p><strong>Why it matches you:</strong> ${path.matchReason || 'No reason available.'}</p>
        `;
        document.getElementById('careerPaths').appendChild(pathElement);
    });
    
    // --- MODIFIED SECTION START ---
    data.requiredSkills?.forEach(skill => {
        const skillElement = document.createElement('div');
        skillElement.className = 'skill-item';

        // Safely handle missing importance property
        const importance = skill.importance ?? 'Low'; // Default to 'Low' if missing
        const importanceClass = `importance-${importance.toLowerCase()}`;

        skillElement.innerHTML = `
            <h4>${skill.skill || 'N/A'}</h4>
            <span class="skill-importance ${importanceClass}">${importance} Priority</span>
            <p>${skill.description || 'No description available.'}</p>
        `;
        document.getElementById('requiredSkills').appendChild(skillElement);
    });
    // --- MODIFIED SECTION END ---

    data.courses?.forEach(course => {
        const courseElement = document.createElement('div');
        courseElement.className = 'course-item';
        courseElement.innerHTML = `
            <h4>${course.title || 'N/A'}</h4>
            <div class="course-provider">Provider: ${course.provider || 'N/A'}</div>
            <p>${course.description || 'No description available.'}</p>
            <a href="${course.url || '#'}" target="_blank" class="course-link">View Course</a>
        `;
        document.getElementById('courses').appendChild(courseElement);
    });
    
    results.classList.remove('hidden');
    results.scrollIntoView({ behavior: 'smooth' });
}

function showLoading() {
    loading.classList.remove('hidden');
    results.classList.add('hidden');
    error.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Generating...';
}

function hideLoading() {
    loading.classList.add('hidden');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Get Career Recommendations';
}

function showError(message) {
    errorMessage.textContent = message;
    error.classList.remove('hidden');
    results.classList.add('hidden');
    error.scrollIntoView({ behavior: 'smooth' });
}

function hideError() {
    error.classList.add('hidden');
}

window.addEventListener('load', async () => {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        console.log('✅ API Status:', data.message);
    } catch (err) {
        console.error('❌ API Health Check Failed:', err);
    }
});
