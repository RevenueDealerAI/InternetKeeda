import React, { useEffect, useState } from "react";
import Image from 'next/image';
import Link from 'next/link'
import { Star, Eye, Heart, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useToolActions } from "@/hooks/useToolActions";
import { Button } from "@/components/ui/button";
import mongoose from "mongoose";

interface PopulatedToolInfoForCard {
  _id: string;
  votes?: number;
  views?: number;
}

export interface ThemeTwoSponsoredListing {
  id: string;
  toolId: string | PopulatedToolInfoForCard;
  name: string;
  logo: string;
  description: string;
  rating: number;
  category: string;
  url: string;
  slug: string;
  views: number;
  impressions: number;
  tags: string[];
  premiumBadge?: boolean;
  startDate?: string;
  endDate?: string;
}

interface ThemeTwoSponsoredListingsProps {
  listings: ThemeTwoSponsoredListing[];
}

const GRADIENT_BACKGROUNDS = [
  'from-emerald-50 to-cyan-50',
  'from-purple-50 to-pink-50', 
  'from-cyan-50 to-blue-50',
  'from-pink-50 to-red-50'
];

export const ThemeTwoSponsoredListings: React.FC<ThemeTwoSponsoredListingsProps> = ({ listings }) => {
  const { toggleUpvote, isUpvoted, isLoading: isActionLoading } = useToolActions();

  if (!listings || listings.length === 0) {
    return null;
  }
  console.log("listings", listings);

  return (
    <section className="theme-two relative -mt-48 z-50 mb-8">
      <div className="container mx-auto px-4">
        <div 
          className="bg-white p-8"
          style={{
            borderRadius: '1.875rem',
            border: '1px solid #F3F4F6',
            background: '#FFF',
            boxShadow: '0 100px 80px 0 rgba(0, 0, 0, 0.01), 0 41.778px 33.422px 0 rgba(0, 0, 0, 0.02), 0 22.336px 17.869px 0 rgba(0, 0, 0, 0.02), 0 12.522px 10.017px 0 rgba(0, 0, 0, 0.02), 0 6.65px 5.32px 0 rgba(0, 0, 0, 0.03), 0 2.767px 2.214px 0 rgba(0, 0, 0, 0.04)'
          }}
        >
          {/* Section Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4">
            <div>
              <h2 className="text-gray-900 text-[38px] mb-3" style={{ fontWeight: '700' }}>
                Sponsored <span className="bg-gradient-to-r from-[#8039fd] to-[#f5a5ad] bg-clip-text text-transparent">Listings</span>
              </h2>
              <div className="flex items-center gap-4">
                <p className="text-gray-600 text-base">Featured AI tools and services</p>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                  Promoted
                </span>
              </div>
            </div>
            <Link href="/advertise"
              className="text-white px-5 py-2.5 rounded-full font-medium text-sm hover:opacity-90 transition-opacity shadow-md flex items-center gap-2"
              style={{
                background: 'linear-gradient(90deg, #9B999A 0%, #575254 100%)'
              }}
            >
              Advertise with us <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          {/* Sponsored Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {listings.slice(0, 4).map((listing, index) => {
              let underlyingToolInfo: PopulatedToolInfoForCard | null = null;
              if (typeof listing.toolId === 'object' && listing.toolId?._id && mongoose.Types.ObjectId.isValid(listing.toolId._id)) {
                underlyingToolInfo = listing.toolId as PopulatedToolInfoForCard;
              }
              
              const displayToolVotes = underlyingToolInfo?.votes ?? 0;
              const displayToolViews = underlyingToolInfo?.views ?? listing.views;
              const gradientBg = GRADIENT_BACKGROUNDS[index % GRADIENT_BACKGROUNDS.length];

              return (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={`bg-gradient-to-r ${gradientBg} rounded-[20px] p-6 border border-gray-100 hover:shadow-lg transition-all duration-300`}
                >
                  <Link href={`/ai-tools/${listing.slug}`} className="block">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center relative">
                          {listing.logo ? (
                            <Image 
                              src={`https://www.google.com/s2/favicons?domain=${listing.logo.split('/').pop()}&sz=128`} 
                              alt={listing.name}
                              fill
                              className="object-contain rounded-xl"
                              unoptimized
                            />
                          ) : (
                            <span className="text-white font-bold text-base">
                              {listing.name.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 
                            className="text-gray-900 text-[18px] font-semibold mb-1"
                            style={{ fontSize: '18px' }}
                          >
                            {listing.name}
                          </h3>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium text-gray-700">{listing.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                      {listing.premiumBadge && (
                        <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-200 self-start">
                          freemium
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2">
                      {listing.description}
                    </p>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2.5 py-1 bg-white text-gray-600 text-xs font-semibold rounded-full border border-gray-200">
                        {listing.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{displayToolViews > 999 ? `${(displayToolViews/1000).toFixed(1)}K` : displayToolViews}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{displayToolVotes}</span>
                        </div>
                      </div>
                      <button className="px-3 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-full border hover:bg-gray-50 transition-colors flex items-center gap-1 shadow-sm">
                        Try Now
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

