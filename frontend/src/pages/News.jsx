import React, { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

const News = () => {
  const { t } = useLanguage();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fcointelegraph.com%2Frss');
        const data = await response.json();
        
        if (data.status === 'ok' && data.items) {
          const formattedNews = data.items.map((item, index) => ({
            id: item.guid || index,
            url: item.link,
            imageurl: item.enclosure?.link || item.thumbnail || 'https://via.placeholder.com/400x200?text=Crypto+News',
            title: item.title,
            body: item.description.replace(/<[^>]+>/g, ''), // Strip HTML tags
            published_on: new Date(item.pubDate).getTime() / 1000,
            source_info: { name: 'CoinTelegraph' }
          }));
          setNews(formattedNews);
        } else {
          setError(t('news.fetchError'));
        }
      } catch (err) {
        setError(t('news.fetchError'));
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [t]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh] text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-4xl font-bold mb-8 text-on-background">{t('news.title')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {news.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col bg-surface rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-border/50 group"
          >
            <div className="relative h-56 overflow-hidden">
              <img 
                src={item.imageurl} 
                alt={item.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=Crypto+News' }}
              />
              <div className="absolute top-4 left-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                {item.source_info?.name || 'News'}
              </div>
            </div>
            
            <div className="p-6 flex flex-col flex-grow">
              <div className="text-sm text-gray-400 mb-2">
                {new Date(item.published_on * 1000).toLocaleDateString()}
              </div>
              <h2 className="text-xl font-bold text-on-background mb-3 line-clamp-2 leading-tight">
                {item.title}
              </h2>
              <p className="text-on-surface text-sm line-clamp-3 mb-4 flex-grow">
                {item.body}
              </p>
              
              <div className="flex justify-between items-center mt-auto pt-4 border-t border-border/30">
                <span className="text-primary text-sm font-medium group-hover:underline">
                  {t('news.readMore')} →
                </span>
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <span className="flex items-center">
                    <span className="mr-1">👍</span> {item.upvotes || 0}
                  </span>
                  <span className="flex items-center">
                    <span className="mr-1">👎</span> {item.downvotes || 0}
                  </span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default News;
