import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Quote, ArrowLeft, ArrowRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import Image from 'next/image';

const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "AI Researcher",
    company: "Tech Innovations Lab",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80",
    content: "This platform has revolutionized how we discover and implement AI tools. The curation and recommendations are spot on!",
    rating: 5
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Product Manager",
    company: "Digital Solutions Inc",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80",
    content: "The quality of AI tools available here is exceptional. It's saved us countless hours in finding the right solutions for our projects.",
    rating: 5
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Creative Director",
    company: "Design Studio Pro",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80",
    content: "As a designer, finding the right AI tools is crucial. This platform makes it incredibly easy to discover and compare different options.",
    rating: 5
  },
  {
    id: 4,
    name: "David Kim",
    role: "Software Engineer",
    company: "Tech Startups Co",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80",
    content: "The integration guides and community feedback have been invaluable in our AI implementation journey. Highly recommended!",
    rating: 5
  }
];

export const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const nextSlide = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  }, [isAnimating]);

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, [activeIndex]);

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-purple-50/30 to-white" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(139,92,246,0.1),transparent_50%)]" />
      
      <div className="relative container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            What Our Users Say
          </h2>
          <p className="text-gray-600">
            Discover how our platform is helping professionals leverage AI tools effectively.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            {/* Testimonial Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testimonials.slice(activeIndex, activeIndex + 2).map((testimonial, index) => (
                <Card
                  key={testimonial.id}
                  className={`group relative overflow-hidden bg-white/70 backdrop-blur-sm border border-gray-200/50 hover:border-purple-200/50 transition-all duration-300 ${
                    isAnimating ? "opacity-0" : "opacity-100"
                  } transition-opacity duration-500`}
                >
                  {/* Quote Icon */}
                  <div className="absolute top-4 right-4 text-purple-200">
                    <Quote className="w-8 h-8" />
                  </div>

                  <div className="p-8 space-y-6">
                    {/* Content */}
                    <p className="text-gray-600 italic relative">
                      "{testimonial.content}"
                    </p>

                    {/* Rating */}
                    <div className="flex gap-1">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 text-yellow-400 fill-current"
                        />
                      ))}
                    </div>

                    {/* Author */}
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden">
                        <Image
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {testimonial.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {testimonial.role} at {testimonial.company}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Hover Border */}
                  <div className="absolute inset-x-0 bottom-0 h-0.5">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 w-0 group-hover:w-full transition-all duration-500" />
                  </div>
                </Card>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={prevSlide}
                className="rounded-full hover:bg-purple-50"
                disabled={isAnimating}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextSlide}
                className="rounded-full hover:bg-purple-50"
                disabled={isAnimating}
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mt-4">
              {testimonials.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    Math.floor(activeIndex / 2) === Math.floor(index / 2)
                      ? "bg-purple-600 w-4"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}; 