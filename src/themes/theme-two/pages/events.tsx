import { Calendar, MapPin, Clock, Users, Filter, Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from 'next/image';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: {
    type: "online" | "physical";
    name: string;
  };
  organizer: {
    name: string;
    avatar: string;
  };
  attendees: number;
  maxAttendees: number;
  imageUrl: string;
  tags: string[];
}

export const Events = () => {
  const events: Event[] = []; // This would be populated from your data source

  return (
    <div className="container mx-auto px-4 py-8 mt-20">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-100 mb-4">
          <Calendar className="w-8 h-8 text-purple-600" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
          AI Events & Meetups
        </h1>
        <p className="text-gray-600 max-w-2xl">
          Connect with the AI community through virtual and in-person events. Learn from experts, share knowledge, and network with peers.
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex flex-wrap gap-4">
          <Button variant="outline" className="rounded-xl hover:bg-purple-50">
            All Events
          </Button>
          <Button variant="outline" className="rounded-xl hover:bg-purple-50">
            Online
          </Button>
          <Button variant="outline" className="rounded-xl hover:bg-purple-50">
            In-Person
          </Button>
          <Button variant="outline" className="rounded-xl hover:bg-purple-50">
            Upcoming
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            className="rounded-xl hover:bg-purple-50 flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button 
            className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Featured Event */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 mb-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Image */}
          <div className="w-full md:w-1/2">
            <div className="aspect-video rounded-xl bg-white shadow-lg overflow-hidden relative">
              <Image 
                src="/featured-event.jpg" 
                alt="Featured Event"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium">
                Featured Event
              </span>
              <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                Online
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              AI Summit 2024: Future of Technology
            </h2>
            <p className="text-gray-600 mb-6">
              Join industry leaders and experts for a comprehensive exploration of AI's future and its impact on various sectors.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>March 15, 2024</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>9:00 AM - 5:00 PM</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 text-purple-600" />
                <span>Virtual Event</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4 text-purple-600" />
                <span>500+ Attendees</span>
              </div>
            </div>
            <Button className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700">
              Register Now
            </Button>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div 
            key={event.id}
            className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-purple-200 transition-all duration-300 hover:shadow-lg"
          >
            {/* Event Image */}
            <div className="relative h-48 overflow-hidden">
              <Image 
                src={event.imageUrl} 
                alt={event.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized
              />
              <div className="absolute top-4 left-4">
                <span className={`
                  px-3 py-1 rounded-full text-sm font-medium
                  ${event.location.type === 'online' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-green-100 text-green-600'}
                `}>
                  {event.location.type === 'online' ? 'Online' : 'In-Person'}
                </span>
              </div>
            </div>

            {/* Event Content */}
            <div className="p-6">
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {event.date}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {event.time}
                </span>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                {event.title}
              </h3>

              <p className="text-gray-600 mb-6">
                {event.description}
              </p>

              {/* Location and Attendees */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location.name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{event.attendees}/{event.maxAttendees}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {event.tags.map((tag) => (
                  <span 
                    key={tag}
                    className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full hover:bg-purple-50 hover:text-purple-600 transition-colors cursor-pointer"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button 
                  className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                >
                  Register
                </Button>
                <Button 
                  variant="outline"
                  className="rounded-xl hover:bg-purple-50"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="flex justify-center mt-12">
        <Button 
          variant="outline"
          className="rounded-xl hover:bg-purple-50 border-purple-200"
        >
          Load More Events
        </Button>
      </div>
    </div>
  );
}; 