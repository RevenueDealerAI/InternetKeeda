import React, { useEffect, useState } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { Star, Eye, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useToolActions } from "@/hooks/useToolActions";
import { Button } from "@/components/ui/button";
import mongoose from "mongoose";
import { toast } from "sonner";

interface PopulatedToolInfoForCard {
  _id: string;
  votes?: number;
  views?: number;
}

export interface SponsoredListing {
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

interface SponsoredListingsProps {
  listings: SponsoredListing[];
}

export const SponsoredListings: React.FC<SponsoredListingsProps> = ({ listings }) => {
  const { toggleUpvote, isUpvoted, isLoading: isActionLoading } = useToolActions();

  if (!listings || listings.length === 0) {
    return null;
  }

  return (
    <section className="py-2 sm:py-6 px-2 sm:px-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Sponsored Listings</h2>
              <div className="flex flex-wrap items-center mt-1">
                <span className="text-gray-500 mr-2">Featured AI tools and services</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-0 rounded-full px-2 py-0.5 text-xs">
                  Promoted
                </Badge>
              </div>
            </div>
            
            <Link href="/advertise" className="text-green-600 text-sm font-medium mt-3 sm:mt-0">
              Advertise with us →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {listings.map((listing, index) => {
              let underlyingToolInfo: PopulatedToolInfoForCard | null = null;
              if (typeof listing.toolId === 'object' && listing.toolId?._id && mongoose.Types.ObjectId.isValid(listing.toolId._id)) {
                underlyingToolInfo = listing.toolId as PopulatedToolInfoForCard;
              }
              
              const actualDbId = underlyingToolInfo?._id;
              const displayToolVotes = underlyingToolInfo?.votes ?? 0;
              const displayToolViews = underlyingToolInfo?.views ?? listing.views;
              const canUpvoteThisCard = !!actualDbId;

              return (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="bg-white rounded-lg sm:rounded-xl border border-gray-100 shadow-sm overflow-hidden relative"
                >
                  <Link href={`/ai-tools/${listing.slug}`} className="block">
                    <div className="p-3 sm:p-4">
                      <div className="flex items-start mb-3">
                        <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center overflow-hidden mr-3 flex-shrink-0 relative">
                          <Image 
                            src={`https://www.google.com/s2/favicons?domain=${listing.url}&sz=128`} 
                            alt={`${listing.name} logo`}
                            fill
                            sizes="64px"
                            className="object-contain p-1"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 break-words">{listing.name}</h3>
                          <div className="flex items-center mt-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm text-gray-700 ml-1">{listing.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm leading-relaxed mb-3 line-clamp-2 min-h-[2.5em]">
                        {listing.description}
                      </p>

                      <div className="mb-3">
                        <div className="inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                          <Badge variant="outline" className="text-xs text-gray-600 bg-gray-50 border-gray-100 rounded-full px-2">
                            {`AI for ${listing.category}`}
                          </Badge>
                        </div>
                      </div>
                      
                      {listing.premiumBadge && (
                        <div className="mb-3">
                          <Badge className="bg-green-100 text-green-700 text-xs rounded-full px-2 py-0.5 font-medium border-0">
                            freemium
                          </Badge>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <div className="flex items-center">
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          <span>{displayToolViews > 999 ? `${(displayToolViews/1000).toFixed(0)}K` : displayToolViews}</span>
                        </div>
                        <Button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (actualDbId && canUpvoteThisCard) {
                              toggleUpvote(actualDbId, displayToolVotes);
                            } else {
                              toast.info("This item cannot be upvoted directly from the card or requires sign-in.");
                            }
                          }}
                          variant="ghost" 
                          size="sm" 
                          disabled={!canUpvoteThisCard || isActionLoading}
                          className="px-2 py-1 h-auto text-xs hover:bg-transparent"
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 mr-1 ${(actualDbId && isUpvoted(actualDbId)) ? 'fill-green-500 text-green-500' : 'text-gray-500'}`} />
                          <span data-tool-id={actualDbId}>
                            {displayToolVotes}
                          </span>
                        </Button>
                      </div>
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