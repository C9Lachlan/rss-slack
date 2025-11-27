// Global state
let feeds = [];
let articles = [];
let settings = {};
let publishedIds = new Set();

// Initialize app on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadAllData();
    renderFeeds();
    renderArticles();
    renderSettings();
});

// ====================
// Data Loading
// ====================

async function loadAllData() {
    try {
        await Promise.all([
            loadFeeds(),
            loadArticles(),
            loadSettings(),
            loadPublished()
        ]);
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading data', 'error');
    }
}

async function loadFeeds() {
    const response = await fetch(`https://raw.githubusercontent.com/${CONFIG.owner}/${CONFIG.repo}/main/feeds.json`);
    const data = await response.json();
    feeds = data.feeds || [];
}

async function loadArticles() {
    const response = await fetch(`https://raw.githubusercontent.com/${CONFIG.owner}/${CONFIG.repo}/main/data/articles.json`);
    const data = await response.json();
    articles = data.articles || [];

    // Update last updated time
    if (data.last_updated) {
        const date = new Date(data.last_updated);
        document.getElementById('last-updated').textContent =
            `Last updated: ${date.toLocaleString()}`;
    }
}

async function loadSettings() {
    const response = await fetch(`https://raw.githubusercontent.com/${CONFIG.owner}/${CONFIG.repo}/main/data/settings.json`);
    settings = await response.json();
}

async function loadPublished() {
    const response = await fetch(`https://raw.githubusercontent.com/${CONFIG.owner}/${CONFIG.repo}/main/data/published.json`);
    const data = await response.json();
    publishedIds = new Set(data.published_articles || []);
}

// ====================
// Tab Switching
// ====================

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(el => el.classList.remove('active'));

    // Show selected tab
    document.getElementById(`content-${tabName}`).classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// ====================
// Feeds Tab
// ====================

function renderFeeds() {
    const container = document.getElementById('feeds-list');

    if (feeds.length === 0) {
        container.innerHTML = '<p class="text-gray-500 col-span-full text-center py-8">No feeds configured yet. Click "Add Feed" to get started.</p>';
        return;
    }

    container.innerHTML = feeds.map(feed => `
        <div class="feed-card bg-white rounded-lg shadow-sm p-4 border ${feed.enabled ? 'border-green-200' : 'border-gray-200'}">
            <div class="flex items-start gap-3">
                <img src="${getFaviconUrl(feed.url)}"
                     alt="${feed.name}"
                     class="w-8 h-8 rounded"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22><text y=%2218%22 font-size=%2218%22>📰</text></svg>'">
                <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-gray-900 truncate">${escapeHtml(feed.name)}</h3>
                    <p class="text-sm text-gray-600 mt-1">${escapeHtml(feed.description || '')}</p>
                    ${feed.keywords && feed.keywords.length > 0 ? `
                        <div class="flex flex-wrap gap-1 mt-2">
                            ${feed.keywords.map(kw => `
                                <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">${escapeHtml(kw)}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="flex gap-2 mt-4">
                <button onclick='editFeed(${JSON.stringify(feed).replace(/'/g, "\\'")})'
                        class="flex-1 text-sm border border-gray-300 px-3 py-1 rounded hover:bg-gray-50">
                    Edit
                </button>
                <button onclick="toggleFeed('${feed.id}')"
                        class="flex-1 text-sm ${feed.enabled ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'} border px-3 py-1 rounded hover:opacity-80">
                    ${feed.enabled ? 'Disable' : 'Enable'}
                </button>
                <button onclick="deleteFeed('${feed.id}')"
                        class="text-sm text-red-600 border border-red-200 px-3 py-1 rounded hover:bg-red-50">
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

function getFaviconUrl(feedUrl) {
    try {
        const domain = new URL(feedUrl).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
        return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><text y="18" font-size="18">📰</text></svg>';
    }
}

function showAddFeedModal() {
    document.getElementById('modal-title').textContent = 'Add Feed';
    document.getElementById('feed-form').reset();
    document.getElementById('feed-id').value = '';
    document.getElementById('feed-enabled').checked = true;
    document.getElementById('feed-modal').classList.remove('hidden');
}

function editFeed(feed) {
    document.getElementById('modal-title').textContent = 'Edit Feed';
    document.getElementById('feed-id').value = feed.id;
    document.getElementById('feed-name').value = feed.name;
    document.getElementById('feed-url').value = feed.url;
    document.getElementById('feed-description').value = feed.description || '';
    document.getElementById('feed-keywords').value = (feed.keywords || []).join(', ');
    document.getElementById('feed-enabled').checked = feed.enabled !== false;
    document.getElementById('feed-modal').classList.remove('hidden');
}

function closeFeedModal() {
    document.getElementById('feed-modal').classList.add('hidden');
}

async function saveFeed(event) {
    event.preventDefault();

    const feedId = document.getElementById('feed-id').value || generateUUID();
    const feedData = {
        id: feedId,
        name: document.getElementById('feed-name').value,
        url: document.getElementById('feed-url').value,
        description: document.getElementById('feed-description').value,
        keywords: document.getElementById('feed-keywords').value
            .split(',')
            .map(k => k.trim())
            .filter(k => k),
        enabled: document.getElementById('feed-enabled').checked
    };

    // Update or add feed
    const index = feeds.findIndex(f => f.id === feedId);
    if (index >= 0) {
        feeds[index] = feedData;
    } else {
        feeds.push(feedData);
    }

    await updateFeedsOnServer();
    closeFeedModal();
    renderFeeds();
}

async function toggleFeed(feedId) {
    const feed = feeds.find(f => f.id === feedId);
    if (feed) {
        feed.enabled = !feed.enabled;
        await updateFeedsOnServer();
        renderFeeds();
    }
}

async function deleteFeed(feedId) {
    if (!confirm('Are you sure you want to delete this feed?')) return;

    feeds = feeds.filter(f => f.id !== feedId);
    await updateFeedsOnServer();
    renderFeeds();
}

async function updateFeedsOnServer() {
    showLoading();
    try {
        await triggerWorkflow('update-feeds.yml', {
            feeds_json: JSON.stringify({ feeds })
        });
        showToast('Feeds updated successfully!');
        // Reload after a delay to allow GitHub to process
        setTimeout(() => loadFeeds(), 3000);
    } catch (error) {
        console.error('Error updating feeds:', error);
        showToast('Error updating feeds', 'error');
    } finally {
        hideLoading();
    }
}

// ====================
// Articles Tab
// ====================

function renderArticles() {
    const container = document.getElementById('articles-list');
    const filteredArticles = getFilteredArticles();

    if (filteredArticles.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No articles found for the selected time period.</p>';
        return;
    }

    container.innerHTML = filteredArticles.map(article => {
        const isPublished = publishedIds.has(article.id);
        const publishedDate = new Date(article.published);

        return `
            <div class="article-item bg-white rounded-lg shadow-sm p-4 border ${isPublished ? 'border-gray-200 opacity-60' : 'border-gray-300'}">
                <div class="flex items-start gap-3">
                    <input type="checkbox"
                           id="article-${article.id}"
                           ${isPublished ? 'disabled' : ''}
                           class="mt-1 rounded border-gray-300 text-blue-600"
                           onchange="updatePublishButton()">
                    <img src="${getFaviconUrl(article.feed_url)}"
                         alt="${article.feed_name}"
                         class="w-6 h-6 rounded mt-1"
                         onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22><text y=%2218%22 font-size=%2218%22>📰</text></svg>'">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between gap-2">
                            <a href="${article.link}" target="_blank" rel="noopener"
                               class="font-semibold text-gray-900 hover:text-blue-600 flex-1">
                                ${escapeHtml(article.title)}
                            </a>
                            ${isPublished ? '<span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded whitespace-nowrap">Published</span>' : ''}
                        </div>
                        <p class="text-sm text-gray-600 mt-1">
                            ${escapeHtml(article.feed_name)} • ${publishedDate.toLocaleDateString()} ${publishedDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                        ${article.summary ? `
                            <p class="text-sm text-gray-700 mt-2 line-clamp-2">${escapeHtml(article.summary)}</p>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getFilteredArticles() {
    const hoursFilter = parseInt(document.getElementById('time-filter').value);
    const cutoff = new Date(Date.now() - (hoursFilter * 60 * 60 * 1000));

    return articles.filter(article => {
        const publishedDate = new Date(article.published);
        return publishedDate >= cutoff;
    });
}

function filterArticles() {
    renderArticles();
}

function selectAllArticles() {
    document.querySelectorAll('[id^="article-"]:not(:disabled)').forEach(cb => {
        cb.checked = true;
    });
    updatePublishButton();
}

function deselectAllArticles() {
    document.querySelectorAll('[id^="article-"]').forEach(cb => {
        cb.checked = false;
    });
    updatePublishButton();
}

function updatePublishButton() {
    // Could add a count badge here if desired
}

async function publishSelected() {
    const selectedIds = Array.from(document.querySelectorAll('[id^="article-"]:checked'))
        .map(cb => cb.id.replace('article-', ''));

    if (selectedIds.length === 0) {
        alert('Please select at least one article to publish');
        return;
    }

    if (!confirm(`Publish ${selectedIds.length} article(s) to Slack?`)) {
        return;
    }

    showLoading();
    try {
        await triggerWorkflow('publish-articles.yml', {
            article_ids: JSON.stringify(selectedIds)
        });
        showToast(`Publishing ${selectedIds.length} article(s)...`);

        // Add to published set immediately for UI feedback
        selectedIds.forEach(id => publishedIds.add(id));
        renderArticles();

        // Reload published data after a delay
        setTimeout(() => loadPublished(), 5000);
    } catch (error) {
        console.error('Error publishing articles:', error);
        showToast('Error publishing articles', 'error');
    } finally {
        hideLoading();
    }
}

// ====================
// Settings Tab
// ====================

function renderSettings() {
    document.getElementById('reminder-time').value = settings.reminder_time || '08:30';
    document.getElementById('reminder-timezone').value = settings.reminder_timezone || 'Australia/Sydney';
    document.getElementById('slack-user-id').value = settings.slack_user_id || '';
    document.getElementById('news-channel-id').value = settings.news_channel_id || '';
    document.getElementById('message-template').value = settings.message_template ||
        '📰 *Daily News Digest*\n\n{articles}\n\n_Curated from {feed_count} sources_';
}

async function saveSettings(event) {
    event.preventDefault();

    const newSettings = {
        reminder_time: document.getElementById('reminder-time').value,
        reminder_timezone: document.getElementById('reminder-timezone').value,
        slack_user_id: document.getElementById('slack-user-id').value,
        news_channel_id: document.getElementById('news-channel-id').value,
        message_template: document.getElementById('message-template').value,
        github_pages_url: settings.github_pages_url || `https://${CONFIG.owner}.github.io/${CONFIG.repo}/`
    };

    showLoading();
    try {
        await triggerWorkflow('update-settings.yml', {
            settings_json: JSON.stringify(newSettings)
        });
        showToast('Settings saved successfully!');
        settings = newSettings;
        // Reload after a delay
        setTimeout(() => loadSettings(), 3000);
    } catch (error) {
        console.error('Error saving settings:', error);
        showToast('Error saving settings', 'error');
    } finally {
        hideLoading();
    }
}

// ====================
// GitHub API
// ====================

async function triggerWorkflow(workflowFile, inputs) {
    const url = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/actions/workflows/${workflowFile}/dispatches`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CONFIG.githubToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
            ref: 'main',
            inputs: inputs
        })
    });

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response;
}

// ====================
// UI Helpers
// ====================

function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    toastMessage.textContent = message;
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
        type === 'error' ? 'bg-red-600' : 'bg-green-600'
    } text-white`;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
