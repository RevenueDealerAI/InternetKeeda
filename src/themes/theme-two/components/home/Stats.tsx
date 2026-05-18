import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Wrench, Users, Star, Activity } from "lucide-react";

const API_URL = '';

const Stats = () => {
  const [toolsCount, setToolsCount] = useState(12114); // Default fallback

  // Fetch tools count from API
  useEffect(() => {
    const fetchToolsCount = async () => {
      try {
        const response = await fetch(`${API_URL}/api/tools/stats`);
        if (response.ok) {
          const data = await response.json();
          setToolsCount(data.totalTools || 12114);
        }
      } catch (error) {
        console.log('Using fallback tools count'); // Fallback to default if API fails
      }
    };

    fetchToolsCount();
  }, []);

  const stats = [
    {
      id: 1,
      title: "AI Tools",
      value: toolsCount,
      suffix: "+",
      description: "Curated AI tools and services",
      icon: Wrench,
      color: "purple"
    },
    {
      id: 2,
      title: "Active Users",
      value: 50000,
      suffix: "+",
      description: "Monthly active users",
      icon: Users,
      color: "blue"
    },
    {
      id: 3,
      title: "Average Rating",
      value: 4.8,
      suffix: "",
      description: "From verified users",
      icon: Star,
      color: "yellow"
    },
    {
      id: 4,
      title: "Daily Updates",
      value: 25,
      suffix: "+",
      description: "New tools added daily",
      icon: Activity,
      color: "green"
    }
  ];

  const AnimatedCounter = ({ value, suffix }: { value: number; suffix: string }) => {
    const [count, setCount] = useState(0);
    const duration = 2000; // Animation duration in milliseconds
    const steps = 60; // Number of steps in the animation
    const stepDuration = duration / steps;

    useEffect(() => {
      let currentStep = 0;
      const increment = value / steps;
      
      const timer = setInterval(() => {
        currentStep++;
        if (currentStep === steps) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount((prev) => Math.min(value, prev + increment));
        }
      }, stepDuration);

      return () => clearInterval(timer);
    }, [value, steps, stepDuration]);

    return (
      <span>
        {count.toLocaleString(undefined, { maximumFractionDigits: 1 })}
        {suffix}
      </span>
    );
  };

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-50/30 via-white to-white" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]" />
      
      <div className="relative container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Platform Statistics
          </h2>
          <p className="text-gray-600">
            Discover the impact of our growing AI tools platform.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card
              key={stat.id}
              className="group relative overflow-hidden bg-white/70 backdrop-blur-sm border border-gray-200/50 hover:border-purple-200/50 transition-all duration-300"
            >
              {/* Hover Background */}
              <div className={`absolute inset-0 bg-gradient-to-r from-${stat.color}-500/5 to-${stat.color}-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className="p-6 space-y-4">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-${stat.color}-50 text-${stat.color}-500 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                    {stat.title}
                  </h3>
                  <p className="text-3xl font-bold text-gray-900">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-sm text-gray-600">
                    {stat.description}
                  </p>
                </div>
              </div>

              {/* Hover Border */}
              <div className="absolute inset-x-0 bottom-0 h-0.5">
                <div className={`h-full bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-400 w-0 group-hover:w-full transition-all duration-500`} />
              </div>
            </Card>
          ))}
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
      </div>
    </section>
  );
};

export default Stats; 