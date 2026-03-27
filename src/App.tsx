/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, Home, User, Play, ChevronLeft, ChevronRight, Star } from 'lucide-react';
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

export default function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovieIndex, setSelectedMovieIndex] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    fetchMovies("Trending Horror Movies");
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchMovies(searchInput);
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
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-hidden relative flex flex-col">
      {/* Background Image */}
      <AnimatePresence mode="wait">
        {movies.length > 0 && !isLoading && (
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
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <header className="relative z-10 flex items-center justify-between px-10 py-6">
        <div className="flex items-center gap-12">
          <button className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center">
            <Home className="w-5 h-5" />
          </button>
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-widest uppercase text-gray-400">
            <a href="#" className="text-white">Home</a>
            <a href="#" className="hover:text-white transition-colors">Movies</a>
            <a href="#" className="hover:text-white transition-colors">TV Show</a>
            <a href="#" className="hover:text-white transition-colors">My Library</a>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-white/10 border border-white/10 rounded-full py-2 pl-4 pr-10 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-white/30 w-64 transition-all"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
              <Search className="w-4 h-4" />
            </button>
          </form>
          <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
            <User className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col justify-end px-10 pb-12">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E50914]"></div>
          </div>
        ) : movies.length > 0 ? (
          <div className="flex flex-col h-full justify-end">
            {/* Top: Movie Details */}
            <div className="max-w-2xl mb-12">
              <motion.div
                key={`details-${selectedMovieIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex flex-wrap gap-3 mb-6">
                  <span className="bg-white/10 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide">
                    Movie
                  </span>
                  {movies[selectedMovieIndex].genres.slice(0, 2).map((genre, idx) => (
                    <span key={idx} className="bg-white/10 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide">
                      {genre}
                    </span>
                  ))}
                </div>

                <h1 className="text-6xl md:text-8xl font-black mb-4 uppercase tracking-tighter leading-none">
                  {movies[selectedMovieIndex].title}
                </h1>

                <div className="flex items-center gap-4 mb-4">
                  {renderStars(movies[selectedMovieIndex].rating)}
                </div>

                <div className="flex items-center gap-3 text-sm font-medium text-gray-300 mb-6">
                  <span>{movies[selectedMovieIndex].year}</span>
                  <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                  <span>{movies[selectedMovieIndex].duration}</span>
                  <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                  <span>{movies[selectedMovieIndex].genres.join(', ')}</span>
                </div>

                <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-8 line-clamp-3 max-w-xl">
                  {movies[selectedMovieIndex].description}
                </p>

                <div className="flex items-center gap-4">
                  <button className="bg-[#E50914] hover:bg-[#b80710] text-white px-8 py-3 rounded-full flex items-center gap-2 font-bold tracking-wide transition-colors">
                    <Play className="w-5 h-5 fill-current" />
                    WATCH
                  </button>
                  <button className="border border-white/30 hover:bg-white/10 text-white px-8 py-3 rounded-full font-bold tracking-wide transition-colors">
                    SEE MORE &gt;&gt;
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Bottom: Carousel */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedMovieIndex(prev => (prev > 0 ? prev - 1 : movies.length - 1))}
                className="w-10 h-10 shrink-0 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div className="flex gap-4 items-end h-[240px] px-2">
                {movies.map((movie, idx) => {
                  const isActive = idx === selectedMovieIndex;
                  return (
                    <motion.div
                      key={idx}
                      onClick={() => setSelectedMovieIndex(idx)}
                      className={`relative shrink-0 cursor-pointer rounded-xl overflow-hidden transition-all duration-300 origin-bottom ${
                        isActive ? 'w-40 h-[220px] border-2 border-[#E50914] z-10 shadow-2xl shadow-red-900/20' : 'w-32 h-[180px] border-2 border-transparent opacity-50 hover:opacity-100'
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
                         <p className={`font-bold uppercase tracking-tight leading-tight ${isActive ? 'text-sm text-[#E50914]' : 'text-xs text-white'}`}>
                            {movie.title}
                         </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <button
                onClick={() => setSelectedMovieIndex(prev => (prev < movies.length - 1 ? prev + 1 : 0))}
                className="w-10 h-10 shrink-0 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            No movies found. Try another search.
          </div>
        )}
      </main>
    </div>
  );
}
