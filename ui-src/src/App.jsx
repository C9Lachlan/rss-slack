import React, { useState, useEffect } from 'react';
import {
  LayoutList,
  Rss,
  Settings,
  Plus,
  Trash2,
  ExternalLink,
  Send,
  CheckCircle,
  Clock,
  MessageSquare,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Check
} from 'lucide-react';
import { CONFIG } from './config';

export default function App() {
  const [activeTab, setActiveTab] = useState('articles');
  const [feeds, setFeeds] = useState([]);
  const [articles, setArticles] = useState([]);
  const [publishedIds, setPublishedIds] = useState(new Set());
  const [showOlder, setShowOlder] = useState(false);
  const [settings, setSettings] = useState({
    reminder_time: "08:30",
    reminder_timezone: "Australia/Sydney",
    message_template: "📰 *Daily News Digest*\n\n{articles}\n\n_Curated from {feed_count} sources_"
  });
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [newFeedName, setNewFeedName] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedArticles, setSelectedArticles] = useState(new Set());

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadFeeds(),
        loadArticles(),
        loadSettings(),
        loadPublished()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      handleToast('Error loading data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const loadFeeds = async () => {
    try {
      const response = await fetch(CONFIG.getRawUrl('feeds.json'));
      const data = await response.json();
      setFeeds(data.feeds || []);
    } catch (error) {
      console.error('Error loading feeds:', error);
    }
  };

  const loadArticles = async () => {
    try {
      const response = await fetch(CONFIG.getRawUrl('data/articles.json'));
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error('Error loading articles:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch(CONFIG.getRawUrl('data/settings.json'));
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadPublished = async () => {
    try {
      const response = await fetch(CONFIG.getRawUrl('data/published.json'));
      const data = await response.json();
      setPublishedIds(new Set(data.published_articles || []));
    } catch (error) {
      console.error('Error loading published:', error);
    }
  };

  // Filter articles by time
  const getArticlesByAge = () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recent = [];
    const older = [];

    articles.forEach(article => {
      const publishedDate = new Date(article.published);
      if (publishedDate >= yesterday) {
        recent.push(article);
      } else if (publishedDate >= oneWeekAgo) {
        older.push(article);
      }
    });

    return { recent, older };
  };

  const { recent: recentArticles, older: olderArticles } = getArticlesByAge();

  const handleToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const toggleArticle = (id) => {
    if (publishedIds.has(id)) return; // Prevent toggling published articles

    const newSelected = new Set(selectedArticles);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedArticles(newSelected);
  };

  const handlePublish = async () => {
    const selectedArray = Array.from(selectedArticles).filter(id => !publishedIds.has(id));

    if (selectedArray.length === 0) {
      handleToast("No new articles selected to publish.");
      return;
    }

    // Note: This is a mock implementation. In production, this would trigger a GitHub workflow
    // or make an API call to publish the articles
    handleToast(`Publishing ${selectedArray.length} article(s)... (This is a preview - implement GitHub workflow integration)`);

    // Simulate successful publish
    setTimeout(() => {
      const newPublished = new Set(publishedIds);
      selectedArray.forEach(id => newPublished.add(id));
      setPublishedIds(newPublished);
      setSelectedArticles(new Set());
    }, 1000);
  };

  const handleAddFeed = async (e) => {
    e.preventDefault();
    if (!newFeedUrl || !newFeedName) return;

    const newFeed = {
      id: generateUUID(),
      name: newFeedName,
      url: newFeedUrl,
      description: "Recently added feed",
      enabled: true,
      keywords: []
    };

    setFeeds([...feeds, newFeed]);
    setNewFeedUrl('');
    setNewFeedName('');
    handleToast("Feed added! (Preview only - implement GitHub workflow integration to save)");
  };

  const handleRemoveFeed = (id) => {
    if (!confirm('Are you sure you want to remove this feed?')) return;
    setFeeds(feeds.filter(f => f.id !== id));
    handleToast("Feed removed! (Preview only - implement GitHub workflow integration to save)");
  };

  const handleSaveSettings = () => {
    handleToast("Settings saved! (Preview only - implement GitHub workflow integration to save)");
  };

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday, ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getFaviconUrl = (feedUrl) => {
    try {
      const url = new URL(feedUrl);
      return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
    } catch {
      return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><text y="18" font-size="18">📰</text></svg>';
    }
  };

  // --- Components ---

  const TabButton = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        activeTab === id
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon size={18} />
      <span className="font-medium">{label}</span>
    </button>
  );

  const ArticleCard = ({ article }) => {
    const isSelected = selectedArticles.has(article.id);
    const isPublished = publishedIds.has(article.id);

    return (
      <div
        onClick={() => toggleArticle(article.id)}
        className={`group flex items-start p-4 rounded-xl border transition-all duration-200 space-x-4 ${
          isPublished
            ? 'bg-slate-50 border-slate-200 opacity-75 cursor-default'
            : isSelected
              ? 'bg-blue-50 border-blue-200 shadow-sm cursor-pointer'
              : 'bg-white border-slate-200 hover:border-blue-300 cursor-pointer'
        }`}
      >
        {/* Favicon */}
        <div className="flex-shrink-0 relative">
          <img
            src={getFaviconUrl(article.feed_url)}
            alt={article.feed_name}
            className={`w-12 h-12 rounded-lg border border-slate-200 bg-slate-50 object-cover p-2 ${isPublished ? 'grayscale' : ''}`}
            onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><text y="18" font-size="18">📰</text></svg>'; }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 py-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {article.feed_name}
              </span>
              {isPublished && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Published
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400">{formatDate(article.published)}</span>
          </div>
          <h3 className={`text-lg font-medium leading-tight mb-2 line-clamp-2 ${
            isPublished ? 'text-slate-600' : isSelected ? 'text-blue-900' : 'text-slate-900'
          }`}>
            {article.title}
          </h3>
          {article.summary && (
            <p className={`text-sm line-clamp-2 ${isPublished ? 'text-slate-500' : isSelected ? 'text-blue-700/70' : 'text-slate-600'}`}>
              {article.summary.replace(/<[^>]*>/g, '')}
            </p>
          )}
          {!isPublished && (
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity mt-2 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Read source <ExternalLink size={12} className="ml-1" />
            </a>
          )}
        </div>

        {/* Checkbox (Right Side) */}
        <div className="pt-1 pl-2">
          {isPublished ? (
            <div className="w-6 h-6 flex items-center justify-center" title="Already published">
              <Check size={20} className="text-green-500" />
            </div>
          ) : (
            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
              isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white group-hover:border-blue-400'
            }`}>
              {isSelected && <CheckCircle size={16} className="text-white" />}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading RSS Feed Manager...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Rss className="text-white h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Daily Reader</h1>
            </div>

            <nav className="flex space-x-1 sm:space-x-2">
              <TabButton id="articles" icon={LayoutList} label="Articles" />
              <TabButton id="feeds" icon={Rss} label="Feeds" />
              <TabButton id="settings" icon={Settings} label="Settings" />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ARTICLES TAB */}
        {activeTab === 'articles' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-200 pb-4 gap-4 sm:gap-0">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Article Review</h2>
                <p className="text-slate-500 mt-1">Select articles from the last 24 hours to broadcast.</p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-2 rounded-lg whitespace-nowrap">
                  {selectedArticles.size} Selected
                </div>
              </div>
            </div>

            {/* Recent Articles List */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Last 24 Hours</h3>
              {recentArticles.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-xl border border-dashed border-slate-300">
                  <p className="text-slate-400">No new articles from yesterday.</p>
                </div>
              ) : (
                recentArticles.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))
              )}
            </div>

            {/* Older Articles Section */}
            {olderArticles.length > 0 && (
              <div className="pt-4">
                <button
                  onClick={() => setShowOlder(!showOlder)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center space-x-2 text-slate-700 font-medium">
                    <span>Older Articles (Up to 1 week)</span>
                    <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full">
                      {olderArticles.length}
                    </span>
                  </div>
                  {showOlder ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </button>

                {showOlder && (
                  <div className="mt-3 space-y-3 animate-fade-in">
                    {olderArticles.map(article => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sticky Bottom Action Bar */}
            <div className="fixed bottom-6 left-0 right-0 px-4 pointer-events-none z-20">
              <div className="max-w-4xl mx-auto flex justify-end pointer-events-auto">
                <button
                  onClick={handlePublish}
                  disabled={selectedArticles.size === 0}
                  className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-full shadow-lg transform transition-transform hover:scale-105 active:scale-95 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                  <span>Publish Selected</span>
                </button>
              </div>
            </div>
            {/* Spacer for sticky button */}
            <div className="h-20"></div>
          </div>
        )}

        {/* FEEDS TAB */}
        {activeTab === 'feeds' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Manage Sources</h2>
                <p className="text-slate-500 mt-1">Add or remove RSS feeds.</p>
              </div>
            </div>

            {/* Add Feed Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Add New Feed</h3>
              <form onSubmit={handleAddFeed} className="space-y-3">
                <input
                  type="text"
                  placeholder="Feed Name (e.g., Tech Crunch)"
                  value={newFeedName}
                  onChange={(e) => setNewFeedName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/rss.xml"
                    value={newFeedUrl}
                    onChange={(e) => setNewFeedUrl(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
                  >
                    <Plus size={18} className="mr-1" /> Add
                  </button>
                </div>
              </form>
            </div>

            {/* Feeds List */}
            <div className="grid gap-4">
              {feeds.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-xl border border-dashed border-slate-300">
                  <p className="text-slate-400">No feeds configured yet. Add a feed to get started.</p>
                </div>
              ) : (
                feeds.map(feed => (
                  <div key={feed.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between group hover:shadow-sm transition-shadow">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg overflow-hidden">
                        <img
                          src={getFaviconUrl(feed.url)}
                          alt={feed.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <span className="text-sm">{feed.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{feed.name}</h4>
                        <p className="text-sm text-slate-500">{feed.description || 'No description'}</p>
                        <p className="text-xs text-slate-400 mt-1 font-mono truncate max-w-[200px] sm:max-w-md">{feed.url}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFeed(feed.id)}
                      className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove Feed"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Preferences</h2>
                <p className="text-slate-500 mt-1">Configure automation and notifications.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-6 space-y-8">

                {/* Reminder Settings */}
                <div>
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-slate-900">Daily Reminder</h3>
                      <p className="text-sm text-slate-500">When should the bot ping you to review articles?</p>
                    </div>
                  </div>
                  <div className="ml-11 flex items-center space-x-3">
                    <input
                      type="time"
                      value={settings.reminder_time || '08:30'}
                      onChange={(e) => setSettings({...settings, reminder_time: e.target.value})}
                      className="border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <select
                      value={settings.reminder_timezone || 'Australia/Sydney'}
                      onChange={(e) => setSettings({...settings, reminder_timezone: e.target.value})}
                      className="border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-100"></div>

                {/* Message Body Settings */}
                <div>
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="p-2 bg-green-50 rounded-lg text-green-600">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-slate-900">Slack Message Template</h3>
                      <p className="text-sm text-slate-500">Custom text to include with your published articles.</p>
                    </div>
                  </div>
                  <div className="ml-11">
                    <textarea
                      value={settings.message_template || ''}
                      onChange={(e) => setSettings({...settings, message_template: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg p-3 text-slate-700 min-h-[100px] focus:ring-2 focus:ring-indigo-500 outline-none resize-y font-mono text-sm"
                      placeholder="Enter message..."
                    />
                    <p className="text-xs text-slate-400 mt-2">
                      Use placeholders: {'{articles}'}, {'{feed_count}'}, {'{count}'}
                    </p>
                  </div>
                </div>

              </div>

              <div className="bg-slate-50 px-6 py-4 flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Toast Notification */}
      <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-xl flex items-center space-x-2 transition-all duration-300 z-50 ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <AlertCircle size={18} className="text-green-400" />
        <span>{toastMessage}</span>
      </div>

    </div>
  );
}
