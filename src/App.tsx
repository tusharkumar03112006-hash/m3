/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, Play, ChevronLeft, ChevronRight, Star, Sparkles, ArrowLeft } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Movie {
  title: string;
  genres: string[];
  year: number;
  duration: string;
  description: string;
  rating: number;
}

const POPULAR_MOVIES = [
  "Inception", "The Dark Knight", "Interstellar", "Avatar", "The Matrix",
  "Gladiator", "Titanic", "Jurassic Park", "The Avengers", "Joker",
  "Dune", "Oppenheimer", "Spider-Man", "The Godfather", "Pulp Fiction",
  "Forrest Gump", "The Shawshank Redemption", "Goodfellas", "Se7en", "The Silence of the Lambs"
];

export default function App() {
  const [appMode, setAppMode] = useState<'home' | 'recommender'>('home');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovieIndex, setSelectedMovieIndex] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchMovies = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Recommend exactly 5 movies based on this search query: "${query}". If the query is empty or generic, recommend 5 highly acclaimed popular movies. Provide diverse options if the query is broad.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                genres: { type: Type.ARRAY, items: { type: Type.STRING } },
                year: { type: Type.NUMBER },
                duration: { type: Type.STRING },
                description: { type: Type.STRING },
                rating: { type: Type.NUMBER },
              },
              required: ["title", "genres", "year", "duration", "description", "rating"]
            }
          }
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMovies(parsed.slice(0, 5));
          setSelectedMovieIndex(0);
        }
      }
    } catch (error) {
      console.error("Failed to fetch movies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      if (appMode === 'home') {
        setAppMode('recommender');
      }
      fetchMovies(searchInput);
    }
  };

  const handleGetRecommendations = () => {
    setAppMode('recommender');
    if (movies.length === 0) {
      fetchMovies("Cinematic Masterpieces");
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`}
        />
      );
    }
    return <div className="flex gap-1">{stars}</div>;
  };

  return (
    <div className="h-screen bg-[#050505] text-white font-sans overflow-hidden relative flex flex-col">
      {/* Background Image - Only in Recommender Mode */}
      <AnimatePresence mode="wait">
        {appMode === 'recommender' && movies.length > 0 && !isLoading && (
          <motion.div
            key={selectedMovieIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 z-0"
          >
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(https://picsum.photos/seed/${encodeURIComponent(movies[selectedMovieIndex].title + ' bg')}/1920/1080)`
              }}
            />
            {/* Gradients for readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/90 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-6">
          {appMode === 'recommender' && (
            <button 
              onClick={() => setAppMode('home')} 
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wider hidden sm:inline">Back</span>
            </button>
          )}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setAppMode('home')}>
            <div className="w-12 h-12 bg-gradient-to-br from-[#E50914] to-[#8b0000] text-white rounded-full flex items-center justify-center shadow-lg shadow-red-900/50">
              <Play className="w-6 h-6 fill-current ml-1" />
            </div>
            <span className="text-2xl font-black tracking-widest uppercase text-white drop-shadow-md hidden sm:inline">
              Cine<span className="text-[#E50914]">Suggest</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <form onSubmit={handleSearchSubmit} className="relative group">
            <input
              type="text"
              placeholder="Search movies, genres, directors..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-full py-3 pl-6 pr-14 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E50914]/80 focus:border-transparent w-64 md:w-80 transition-all backdrop-blur-md shadow-lg"
            />
            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      {appMode === 'home' ? (
        <main className="relative z-10 flex-1 overflow-y-auto pb-20">
          {/* Hero Section */}
          <div className="flex flex-col items-center justify-center text-center pt-16 pb-24 px-4 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight">
              Discover Your Next <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E50914] to-[#ff4d4d]">
                Cinematic Obsession
              </span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl leading-relaxed">
              Browse our extensive catalog of timeless classics and modern hits. 
              Not sure what to watch? Let our advanced AI tailor a perfect movie night just for you.
            </p>
            <button 
              onClick={handleGetRecommendations}
              className="bg-[#E50914] hover:bg-[#b80710] text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-[0_0_30px_rgba(229,9,20,0.4)] flex items-center gap-3"
            >
              <Sparkles className="w-6 h-6" />
              Ask AI for a Movie
            </button>
          </div>

          {/* Popular Movies Grid */}
          <div className="px-6 md:px-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-2 h-8 bg-[#E50914] rounded-full"></div>
              <h2 className="text-2xl font-bold uppercase tracking-wider">Popular Movies</h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {POPULAR_MOVIES.map((movieTitle) => (
                <div 
                  key={movieTitle} 
                  className="aspect-[2/3] rounded-xl overflow-hidden relative group cursor-pointer bg-white/5"
                  onClick={() => {
                    setSearchInput(movieTitle);
                    setAppMode('recommender');
                    fetchMovies(movieTitle);
                  }}
                >
                  <img 
                    src={`https://picsum.photos/seed/${encodeURIComponent(movieTitle + ' poster')}/400/600`} 
                    alt={movieTitle}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="font-bold text-white text-sm md:text-base leading-tight">
                      {movieTitle}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      ) : (
        <main className="relative z-10 flex-1 flex flex-col overflow-y-auto px-6 md:px-12 pb-12">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#050505]/50 backdrop-blur-sm z-50">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#E50914]"></div>
                <p className="text-gray-400 font-medium animate-pulse">Analyzing your request...</p>
              </div>
            </div>
          ) : movies.length > 0 ? (
            <div className="flex flex-col flex-1 justify-end pt-8 mt-auto">
              {/* Top: Movie Details */}
              <div className="max-w-3xl mb-12">
                <motion.div
                  key={`details-${selectedMovieIndex}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex flex-wrap gap-3 mb-6">
                    <span className="bg-[#E50914] px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase shadow-lg shadow-red-900/30">
                      AI Match
                    </span>
                    {movies[selectedMovieIndex].genres.slice(0, 2).map((genre, idx) => (
                      <span key={idx} className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide">
                        {genre}
                      </span>
                    ))}
                  </div>

                  <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-2 pb-2 uppercase tracking-tighter leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
                    {movies[selectedMovieIndex].title}
                  </h1>

                  <div className="flex items-center gap-4 mb-4">
                    {renderStars(movies[selectedMovieIndex].rating)}
                    <span className="text-yellow-500 font-bold text-sm">{movies[selectedMovieIndex].rating}/5</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm font-medium text-gray-300 mb-6">
                    <span className="bg-white/10 px-2 py-0.5 rounded text-xs">{movies[selectedMovieIndex].year}</span>
                    <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                    <span>{movies[selectedMovieIndex].duration}</span>
                    <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                    <span>{movies[selectedMovieIndex].genres.join(', ')}</span>
                  </div>

                  <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-8 line-clamp-3 max-w-xl drop-shadow-md">
                    {movies[selectedMovieIndex].description}
                  </p>

                  <div className="flex items-center gap-4">
                    <button className="bg-white hover:bg-gray-200 text-black px-8 py-3 rounded-full flex items-center gap-2 font-bold tracking-wide transition-colors">
                      <Play className="w-5 h-5 fill-current" />
                      WATCH NOW
                    </button>
                    <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white px-8 py-3 rounded-full font-bold tracking-wide transition-colors">
                      MORE INFO
                    </button>
                  </div>
                </motion.div>
              </div>

              {/* Bottom: Carousel */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedMovieIndex(prev => (prev > 0 ? prev - 1 : movies.length - 1))}
                  className="w-12 h-12 shrink-0 bg-black/50 hover:bg-[#E50914] border border-white/10 hover:border-transparent rounded-full flex items-center justify-center backdrop-blur-md transition-all group"
                >
                  <ChevronLeft className="w-6 h-6 text-white group-hover:-translate-x-0.5 transition-transform" />
                </button>

                <div className="flex gap-4 items-center h-[240px] px-2 overflow-x-auto hide-scrollbar py-4">
                  {movies.map((movie, idx) => {
                    const isActive = idx === selectedMovieIndex;
                    return (
                      <motion.div
                        key={idx}
                        onClick={() => setSelectedMovieIndex(idx)}
                        className={`relative shrink-0 cursor-pointer rounded-xl overflow-hidden transition-all duration-300 origin-center ${
                          isActive ? 'w-40 h-[220px] ring-2 ring-[#E50914] ring-offset-2 ring-offset-[#050505] z-10 shadow-[0_0_30px_rgba(229,9,20,0.3)]' : 'w-32 h-[180px] border border-white/10 opacity-60 hover:opacity-100 hover:border-white/30'
                        }`}
                        layout
                      >
                        <img
                          src={`https://picsum.photos/seed/${encodeURIComponent(movie.title + ' poster')}/400/600`}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                        <div className="absolute bottom-3 left-0 right-0 text-center px-2">
                           <p className={`font-bold uppercase tracking-tight leading-tight ${isActive ? 'text-sm text-white drop-shadow-md' : 'text-xs text-gray-300'}`}>
                              {movie.title}
                           </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setSelectedMovieIndex(prev => (prev < movies.length - 1 ? prev + 1 : 0))}
                  className="w-12 h-12 shrink-0 bg-black/50 hover:bg-[#E50914] border border-white/10 hover:border-transparent rounded-full flex items-center justify-center backdrop-blur-md transition-all group"
                >
                  <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              No movies found. Try another search.
            </div>
          )}
        </main>
      )}
    </div>
  );
}
