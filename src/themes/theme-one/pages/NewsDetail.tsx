import { Calendar, Clock, Share2, ArrowLeft, Heart, MessageCircle, Link as LinkIcon, ArrowRight, ChevronUp } from "lucide-react";
import Image from 'next/image';
import { useParams as useNextParams } from 'next/navigation'
import { useContext } from 'react'
import { ParamsContext } from '@/lib/react-router-compat'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import { Progress } from "@/components/ui/progress";

// Define the NewsItem interface locally to avoid import errors
interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  imageUrl: string;
  date: string;
  readTime: string;
  source: string;
}

interface NewsDetailData extends NewsItem {
  content: string;
  likes: number;
  comments: number;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  relatedArticles: NewsItem[];
}

// Temporarily define a mock latestNews array until the API integration is complete
const latestNews: NewsItem[] = [
  {
    id: "1",
    title: "OpenAI Announces Development of GPT-5 with Unprecedented Reasoning Capabilities",
    excerpt: "The next-generation language model promises advanced reasoning and multimodal understanding, potentially revolutionizing AI applications.",
    category: "AI Development",
    imageUrl: "https://images.unsplash.com/photo-1677442135309-c04fdd0c9369?q=80&w=1932&auto=format&fit=crop",
    date: "June 15, 2024",
    readTime: "5 min read",
    source: "Tech Insider"
  },
  {
    id: "2",
    title: "Google DeepMind Achieves Breakthrough in Protein Structure Prediction",
    excerpt: "The new AI model demonstrates unprecedented accuracy in predicting protein folding, with major implications for drug discovery and medical research.",
    category: "Research",
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=1470&auto=format&fit=crop",
    date: "June 12, 2024",
    readTime: "4 min read",
    source: "Science Daily"
  },
  {
    id: "3",
    title: "EU Passes Comprehensive AI Act Setting Global Standards for AI Regulation",
    excerpt: "The landmark legislation establishes the world's first broad regulatory framework for artificial intelligence, balancing innovation with ethical considerations.",
    category: "Policy",
    imageUrl: "https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=1469&auto=format&fit=crop",
    date: "June 8, 2024",
    readTime: "6 min read",
    source: "EU Chronicle"
  }
];

const newsDetails: Record<string, Partial<NewsDetailData>> = {
  "1": {
    content: `
      <p class="text-xl leading-relaxed mb-8">
        OpenAI's announcement of GPT-5 development marks a significant milestone in artificial intelligence evolution. The next-generation language model promises to bring unprecedented capabilities in reasoning and multimodal understanding, potentially revolutionizing how we interact with AI systems.
      </p>

      <h2>Key Features and Improvements</h2>
      <p>The upcoming GPT-5 model is expected to introduce several groundbreaking features:</p>
      <ul>
        <li>Enhanced reasoning capabilities with improved logical understanding</li>
        <li>Advanced multimodal processing, combining text, image, and audio inputs</li>
        <li>More sophisticated context understanding and retention</li>
        <li>Improved factual accuracy and reduced hallucinations</li>
      </ul>

      <h2>Industry Impact</h2>
      <p>The announcement has sent waves through the tech industry, with experts predicting significant implications across various sectors:</p>
      <ul>
        <li>Healthcare: Enhanced medical diagnosis and research capabilities</li>
        <li>Education: More personalized and adaptive learning systems</li>
        <li>Business: Advanced analytics and decision-making tools</li>
        <li>Research: Accelerated scientific discovery and analysis</li>
      </ul>

      <blockquote>
        "GPT-5 represents a quantum leap in AI capabilities. We're not just improving existing features; we're introducing entirely new ways of understanding and processing information." - Sam Altman, CEO of OpenAI
      </blockquote>

      <h2>Development Timeline</h2>
      <p>OpenAI has outlined an ambitious development schedule:</p>
      <ul>
        <li>Initial testing phase: Q2 2024</li>
        <li>Limited beta release: Q3 2024</li>
        <li>Public API access: Q4 2024</li>
        <li>Full public release: Early 2025</li>
      </ul>
    `,
    author: {
      name: "Alex Thompson",
      role: "AI Technology Reporter",
      avatar: "https://i.pravatar.cc/150?u=alex"
    },
    likes: 342,
    comments: 56
  },
  "2": {
    content: `
      <p class="text-xl leading-relaxed mb-8">
        In a groundbreaking development, Google's DeepMind has announced a significant advancement in protein structure prediction, potentially revolutionizing drug discovery and medical research. The new AI model demonstrates unprecedented accuracy in predicting how proteins fold into their three-dimensional structures.
      </p>

      <h2>Technical Breakthrough</h2>
      <p>The new system represents a quantum leap in protein structure prediction:</p>
      <ul>
        <li>Achieves atomic-level accuracy in predictions</li>
        <li>Processes complex protein structures in minutes instead of months</li>
        <li>Handles previously impossible-to-model protein configurations</li>
        <li>Integrates multiple AI approaches for improved accuracy</li>
      </ul>

      <blockquote>
        "This advancement in protein structure prediction will fundamentally change how we approach drug discovery and protein research. It's not just an incremental improvement; it's a paradigm shift." - Dr. Sarah Chen, Lead Researcher at DeepMind
      </blockquote>

      <h2>Medical Applications</h2>
      <p>The breakthrough has immediate applications in medicine:</p>
      <ul>
        <li>Accelerated drug development for complex diseases</li>
        <li>Better understanding of genetic disorders</li>
        <li>Improved vaccine development capabilities</li>
        <li>More effective protein-based therapeutics</li>
      </ul>
    `,
    author: {
      name: "Dr. Michael Chen",
      role: "Science and Technology Reporter",
      avatar: "https://i.pravatar.cc/150?u=michael"
    },
    likes: 285,
    comments: 42
  },
  "3": {
    content: `
      <p class="text-xl leading-relaxed mb-8">
        The European Union has made history by passing the comprehensive AI Act, establishing the world's first broad regulatory framework for artificial intelligence. This landmark legislation sets global standards for AI development and deployment, balancing innovation with ethical considerations and public safety.
      </p>

      <h2>Key Regulations</h2>
      <p>The AI Act introduces several crucial regulations:</p>
      <ul>
        <li>Mandatory risk assessments for high-risk AI systems</li>
        <li>Transparency requirements for AI-generated content</li>
        <li>Strict limits on facial recognition technology</li>
        <li>Protection of personal data in AI training</li>
      </ul>

      <blockquote>
        "The AI Act represents a balanced approach between fostering innovation and ensuring ethical AI development. It will serve as a model for global AI regulation." - Margrethe Vestager, EU Commissioner
      </blockquote>

      <h2>Implementation Timeline</h2>
      <p>The rollout will occur in phases:</p>
      <ul>
        <li>Initial adoption period: 6 months</li>
        <li>Grace period for businesses: 24 months</li>
        <li>Full enforcement: January 2026</li>
        <li>Regular reviews and updates planned</li>
      </ul>
    `,
    author: {
      name: "Emma Roberts",
      role: "EU Policy Correspondent",
      avatar: "https://i.pravatar.cc/150?u=emma"
    },
    likes: 423,
    comments: 89
  },
  "4": {
    content: `
      <p class="text-xl leading-relaxed mb-8">
        Microsoft has unveiled a comprehensive suite of AI-powered features across its Office applications, marking a significant evolution in productivity software. These new features promise to transform how users interact with Microsoft 365 applications, enhancing creativity, efficiency, and collaboration.
      </p>

      <h2>New Features</h2>
      <p>Key improvements include:</p>
      <ul>
        <li>AI-powered writing assistance in Word</li>
        <li>Intelligent data analysis in Excel</li>
        <li>Smart presentation design in PowerPoint</li>
        <li>Advanced email composition in Outlook</li>
      </ul>

      <blockquote>
        "These AI features represent the future of productivity software. We're not just adding features; we're reimagining how people work." - Satya Nadella, CEO of Microsoft
      </blockquote>

      <h2>Business Impact</h2>
      <p>Benefits for organizations include:</p>
      <ul>
        <li>30% increase in productivity</li>
        <li>Reduced time spent on routine tasks</li>
        <li>Enhanced document quality</li>
        <li>Improved team collaboration</li>
      </ul>
    `,
    author: {
      name: "James Wilson",
      role: "Technology Editor",
      avatar: "https://i.pravatar.cc/150?u=james"
    },
    likes: 312,
    comments: 45
  },
  "5": {
    content: `
      <p class="text-xl leading-relaxed mb-8">
        Meta's latest AI translation model has achieved a remarkable breakthrough in breaking down language barriers, offering real-time translation across 200 languages with unprecedented accuracy. This development marks a significant step toward universal communication.
      </p>

      <h2>Technical Achievements</h2>
      <p>The new system offers several key improvements:</p>
      <ul>
        <li>Real-time translation with minimal latency</li>
        <li>Support for 200+ languages, including rare dialects</li>
        <li>Context-aware translations</li>
        <li>Preservation of cultural nuances</li>
      </ul>

      <blockquote>
        "This breakthrough in translation technology brings us closer to a world where language is no longer a barrier to human connection and understanding." - Mark Zuckerberg, CEO of Meta
      </blockquote>

      <h2>Applications</h2>
      <p>The technology will be implemented across:</p>
      <ul>
        <li>Social media platforms</li>
        <li>Business communication tools</li>
        <li>Educational platforms</li>
        <li>Global commerce systems</li>
      </ul>
    `,
    author: {
      name: "Sarah Lee",
      role: "AI & Technology Reporter",
      avatar: "https://i.pravatar.cc/150?u=sarah"
    },
    likes: 278,
    comments: 63
  },
  "6": {
    content: `
      <p class="text-xl leading-relaxed mb-8">
        The field of quantum computing has reached a pivotal milestone with IBM's announcement of their 1000-qubit quantum processor. This breakthrough development promises to accelerate the practical applications of quantum computing across various industries.
      </p>

      <h2>Technical Achievement</h2>
      <p>The new quantum processor represents several key advancements:</p>
      <ul>
        <li>Unprecedented qubit stability and coherence times</li>
        <li>Reduced error rates in quantum operations</li>
        <li>Improved scalability of quantum architecture</li>
        <li>Enhanced quantum error correction capabilities</li>
      </ul>

      <blockquote>
        "This achievement marks a turning point in quantum computing. We're now entering an era where practical quantum applications become a reality." - Dr. Robert Johnson, IBM Quantum Research Lead
      </blockquote>

      <h2>Industry Applications</h2>
      <p>The implications of this development span multiple sectors:</p>
      <ul>
        <li>Financial modeling and risk assessment</li>
        <li>Drug discovery and molecular simulation</li>
        <li>Climate change modeling and prediction</li>
        <li>Optimization of supply chain logistics</li>
      </ul>

      <h2>Future Roadmap</h2>
      <p>IBM has outlined their vision for quantum computing development:</p>
      <ul>
        <li>Commercial availability: Early 2024</li>
        <li>Cloud access for developers: Q2 2024</li>
        <li>Industry-specific solutions: Throughout 2024</li>
        <li>Integration with classical computing systems</li>
      </ul>
    `,
    author: {
      name: "Dr. Thomas Wright",
      role: "Quantum Computing Specialist",
      avatar: "https://i.pravatar.cc/150?u=thomas"
    },
    likes: 456,
    comments: 78
  },
  "7": {
    content: `
      <p class="text-xl leading-relaxed mb-8">
        A revolutionary breakthrough in renewable energy storage has been achieved by researchers at MIT, potentially solving one of the biggest challenges in sustainable energy adoption. The new technology promises to make renewable energy more reliable and accessible than ever before.
      </p>

      <h2>Innovation Details</h2>
      <p>The new storage technology offers several groundbreaking features:</p>
      <ul>
        <li>10x higher energy density than current batteries</li>
        <li>Significantly lower production costs</li>
        <li>Environmentally friendly materials</li>
        <li>Extended lifecycle of over 20 years</li>
      </ul>

      <blockquote>
        "This innovation could be the missing piece in the renewable energy puzzle, making sustainable power a viable option for everyone." - Prof. Maria Garcia, Lead Researcher
      </blockquote>

      <h2>Environmental Impact</h2>
      <p>The technology promises significant environmental benefits:</p>
      <ul>
        <li>Reduced carbon emissions from energy storage</li>
        <li>Minimal environmental impact in production</li>
        <li>Fully recyclable components</li>
        <li>Integration with existing renewable infrastructure</li>
      </ul>

      <h2>Market Implementation</h2>
      <p>The rollout plan includes several phases:</p>
      <ul>
        <li>Initial pilot programs: Late 2024</li>
        <li>Industrial scale implementation: 2025</li>
        <li>Consumer market entry: 2026</li>
        <li>Global availability: 2027</li>
      </ul>
    `,
    author: {
      name: "Sarah Martinez",
      role: "Clean Energy Correspondent",
      avatar: "https://i.pravatar.cc/150?u=sarah"
    },
    likes: 534,
    comments: 92
  },
  "8": {
    content: `
      <p class="text-xl leading-relaxed mb-8">
        A Silicon Valley-based AI startup has secured a record-breaking $2 billion in funding to develop quantum-powered AI systems, marking one of the largest investments in quantum computing technology to date. This unprecedented funding round signals a major shift in the industry's approach to next-generation computing solutions.
      </p>

      <h2>Investment Details</h2>
      <p>The funding round includes participation from major players:</p>
      <ul>
        <li>Leading tech venture capital firms</li>
        <li>Major technology corporations</li>
        <li>International investment groups</li>
        <li>Government innovation funds</li>
      </ul>

      <h2>Technology Focus</h2>
      <p>The company's development roadmap includes:</p>
      <ul>
        <li>Quantum-accelerated machine learning algorithms</li>
        <li>Hybrid quantum-classical computing systems</li>
        <li>Error-correction quantum processors</li>
        <li>Quantum-resistant cryptography solutions</li>
      </ul>

      <blockquote>
        "This investment represents a watershed moment in quantum computing. We're not just developing new technology; we're creating the foundation for the next computing revolution." - Dr. David Chang, CEO of Quantum AI Solutions
      </blockquote>

      <h2>Market Impact</h2>
      <p>The funding is expected to accelerate several key developments:</p>
      <ul>
        <li>Commercialization of quantum computing solutions</li>
        <li>Integration with existing AI infrastructure</li>
        <li>Development of practical quantum applications</li>
        <li>Creation of new industry partnerships</li>
      </ul>

      <h2>Future Implications</h2>
      <p>The company's innovations could transform multiple sectors:</p>
      <ul>
        <li>Financial modeling and risk assessment</li>
        <li>Drug discovery and development</li>
        <li>Climate change simulation</li>
        <li>Cybersecurity and encryption</li>
      </ul>
    `,
    author: {
      name: "Victoria Reynolds",
      role: "Technology Investment Analyst",
      avatar: "https://i.pravatar.cc/150?u=victoria"
    },
    likes: 389,
    comments: 76
  },
  "9": {
    content: `
      <p class="text-xl leading-relaxed mb-8">
        Major publishing organizations have jointly released comprehensive guidelines for AI-generated content, establishing industry-wide standards for creation, disclosure, and ethical considerations. This landmark development addresses growing concerns about transparency and authenticity in digital media.
      </p>

      <h2>Core Guidelines</h2>
      <p>The new standards establish clear requirements for publishers:</p>
      <ul>
        <li>Mandatory disclosure of AI-generated or AI-enhanced content</li>
        <li>Clear labeling systems for different levels of AI involvement</li>
        <li>Ethical guidelines for AI content generation</li>
        <li>Quality control standards for AI-assisted journalism</li>
      </ul>

      <h2>Implementation Framework</h2>
      <p>Publishers will follow a structured approach:</p>
      <ul>
        <li>AI content identification systems</li>
        <li>Automated disclosure mechanisms</li>
        <li>Human oversight requirements</li>
        <li>Regular auditing processes</li>
      </ul>

      <blockquote>
        "These guidelines represent a crucial step toward maintaining trust in digital media. We're ensuring transparency while embracing innovation in content creation." - Katherine Martinez, President of Global Publishers Association
      </blockquote>

      <h2>Technical Standards</h2>
      <p>The guidelines include specific technical requirements:</p>
      <ul>
        <li>Metadata tagging for AI-generated content</li>
        <li>Blockchain-based content verification</li>
        <li>AI detection tool integration</li>
        <li>Version control for edited content</li>
      </ul>

      <h2>Industry Impact</h2>
      <p>The guidelines are expected to influence:</p>
      <ul>
        <li>Content creation workflows</li>
        <li>Editorial policies</li>
        <li>Platform development</li>
        <li>Reader trust and engagement</li>
      </ul>
    `,
    author: {
      name: "Diana Foster",
      role: "Digital Media Analyst",
      avatar: "https://i.pravatar.cc/150?u=diana"
    },
    likes: 245,
    comments: 83
  },
  "10": {
    content: `
      <p class="text-xl leading-relaxed mb-8">
        A revolutionary AI art generation system has achieved a significant milestone by creating museum-quality artworks that art experts struggle to distinguish from human-created pieces. This breakthrough raises intriguing questions about creativity, authenticity, and the future of artistic expression.
      </p>

      <h2>Technical Innovation</h2>
      <p>The system incorporates several advanced features:</p>
      <ul>
        <li>Neural networks trained on centuries of art history</li>
        <li>Style transfer algorithms with unprecedented precision</li>
        <li>Texture and brushstroke simulation</li>
        <li>Advanced color theory implementation</li>
      </ul>

      <h2>Artistic Capabilities</h2>
      <p>The AI demonstrates remarkable artistic abilities:</p>
      <ul>
        <li>Multiple artistic style mastery</li>
        <li>Original composition creation</li>
        <li>Complex emotional expression</li>
        <li>Cultural context integration</li>
      </ul>

      <blockquote>
        "This AI system isn't just replicating art; it's understanding and interpreting artistic principles in ways we never thought possible. It's both exciting and challenging for the art world." - Prof. Isabella Chen, Art History Department, Metropolitan Museum
      </blockquote>

      <h2>Market Impact</h2>
      <p>The technology is influencing various sectors:</p>
      <ul>
        <li>Art market valuations and authentication</li>
        <li>Digital art platforms and NFTs</li>
        <li>Museum curation and conservation</li>
        <li>Art education and research</li>
      </ul>

      <h2>Future Implications</h2>
      <p>The development raises important considerations:</p>
      <ul>
        <li>Artist-AI collaboration possibilities</li>
        <li>Copyright and ownership questions</li>
        <li>Art authentication challenges</li>
        <li>Cultural preservation opportunities</li>
      </ul>
    `,
    author: {
      name: "Robert Martinez",
      role: "Art & Technology Correspondent",
      avatar: "https://i.pravatar.cc/150?u=robert"
    },
    likes: 567,
    comments: 124
  },
  "11": {
    content: `
      <p class="text-xl leading-relaxed mb-8">
        A revolutionary AI-powered healthcare system has demonstrated unprecedented accuracy in early cancer detection, marking a significant advancement in medical diagnostics. The system's ability to identify multiple types of cancer at early stages could revolutionize cancer treatment outcomes.
      </p>

      <h2>Detection Capabilities</h2>
      <p>The system shows remarkable accuracy across multiple cancer types:</p>
      <ul>
        <li>95% accuracy in early-stage detection</li>
        <li>Multi-cancer screening capabilities</li>
        <li>Reduced false positive rates</li>
        <li>Real-time analysis and results</li>
      </ul>

      <h2>Technical Framework</h2>
      <p>The system utilizes advanced technologies:</p>
      <ul>
        <li>Deep learning image analysis</li>
        <li>Molecular pattern recognition</li>
        <li>Genetic marker identification</li>
        <li>Predictive risk assessment</li>
      </ul>

      <blockquote>
        "This technology represents a paradigm shift in cancer diagnostics. We're not just detecting cancer earlier; we're potentially saving millions of lives through preventive intervention." - Dr. Sarah Williams, Lead Oncology Researcher
      </blockquote>

      <h2>Clinical Implementation</h2>
      <p>The system is being integrated into healthcare settings:</p>
      <ul>
        <li>Hospital diagnostic departments</li>
        <li>Primary care facilities</li>
        <li>Mobile screening units</li>
        <li>Remote healthcare centers</li>
      </ul>

      <h2>Patient Benefits</h2>
      <p>The technology offers significant advantages:</p>
      <ul>
        <li>Earlier treatment initiation</li>
        <li>Reduced invasive testing</li>
        <li>Improved survival rates</li>
        <li>Lower treatment costs</li>
      </ul>
    `,
    author: {
      name: "Dr. Jennifer Kumar",
      role: "Medical Technology Specialist",
      avatar: "https://i.pravatar.cc/150?u=jennifer"
    },
    likes: 892,
    comments: 156
  }
};

export const NewsDetail = () => {
  const contextParams = useContext(ParamsContext);
  const nextParams = useNextParams();
  const params = { ...contextParams, ...nextParams } as { id?: string };
  const { id } = params;
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const news = latestNews.find(n => n.id === id);
  const newsDetail = newsDetails[id || ""];

  useEffect(() => {
    // Simulate loading to give a better user experience
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    if (!news && !isLoading) {
      toast.error("News article not found");
      router.push("/latest-news");
      return;
    }

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);

      if (contentRef.current) {
        const element = contentRef.current;
        const totalHeight = element.clientHeight;
        const windowHeight = window.innerHeight;
        const scrollTop = window.scrollY - element.offsetTop;
        const scrolled = (scrollTop / (totalHeight - windowHeight)) * 100;
        setReadingProgress(Math.min(100, Math.max(0, scrolled)));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, [news, router, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pt-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-3/4 mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="aspect-video bg-gray-200 rounded-xl mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!news) return null;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShare = async (platform: 'copy' | 'twitter' | 'facebook' | 'linkedin') => {
    const url = window.location.href;
    const text = `Check out this article: ${news.title}`;

    switch (platform) {
      case 'copy':
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
    }
  };

  // Define fallback content if newsDetail content is missing
  const fallbackContent = `
    <p class="text-xl leading-relaxed mb-8">
      ${news.excerpt}
    </p>
    <p>
      We're working on bringing you more content for this article. In the meantime, please explore our other news articles.
    </p>
  `;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Progress value={readingProgress} className="h-1 rounded-none bg-gray-100" />
      </div>

      <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-8 mt-14 sm:mt-20">
        <div className="flex items-center justify-between mb-4 sm:mb-8 max-w-3xl mx-auto">
          <Link href="/latest-news" 
            className="inline-flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 hover:text-orange-600 bg-white/80 backdrop-blur-sm px-2 sm:px-6 py-1.5 sm:py-2.5 rounded-full shadow-sm transition-all hover:shadow-md"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Back to News</span>
          </Link>
          
          <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            {news.readTime}
          </div>
        </div>

        <article className="max-w-3xl mx-auto">
          <header className="text-center mb-6 sm:mb-12">
            <div className="inline-flex items-center justify-center px-2 py-1 sm:px-4 sm:py-1.5 rounded-full bg-orange-100 text-orange-700 font-medium text-xs sm:text-sm mb-3 sm:mb-6">
              {news.category}
            </div>
            <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-6 leading-tight px-1">
              {news.title}
            </h1>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500 mb-4 sm:mb-8">
              <span className="flex items-center gap-1 sm:gap-2">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                {news.date}
              </span>
              <span className="flex items-center gap-1 sm:gap-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                {news.readTime}
              </span>
              <a 
                href={`https://${news.source.toLowerCase().replace(' ', '')}.com`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 sm:gap-2 hover:text-orange-600 transition-colors"
              >
                <LinkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                {news.source}
              </a>
            </div>
            {newsDetail?.author && (
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <div className="relative w-7 h-7 sm:w-10 sm:h-10 rounded-full overflow-hidden ring-2 ring-orange-100">
                  <Image 
                    src={newsDetail.author.avatar}
                    alt={newsDetail.author.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 text-xs sm:text-base">{newsDetail.author.name}</div>
                  <div className="text-xs text-gray-500">{newsDetail.author.role}</div>
                </div>
              </div>
            )}
          </header>

          <div className="relative aspect-video sm:aspect-[21/9] mb-6 sm:mb-16 rounded-lg sm:rounded-2xl overflow-hidden shadow-md sm:shadow-2xl">
            <Image 
              src={news.imageUrl}
              alt={news.title}
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          <div className="bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-6 md:p-12 mb-6 sm:mb-16 relative overflow-hidden w-[calc(100%+1rem)] -mx-2 sm:w-auto sm:mx-0" ref={contentRef}>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-orange-50/50 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-50/50 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            
            <div className="relative">
              <div 
                className={`
                  prose prose-sm sm:prose-base md:prose-lg max-w-none
                  prose-headings:text-gray-900 prose-headings:font-bold
                  
                  prose-h2:text-lg sm:prose-h2:text-2xl md:prose-h2:text-3xl prose-h2:font-display 
                  prose-h2:bg-gradient-to-br prose-h2:from-gray-900 prose-h2:via-gray-800 prose-h2:to-gray-600 
                  prose-h2:bg-clip-text prose-h2:text-transparent prose-h2:tracking-tight
                  prose-h2:mt-8 sm:prose-h2:mt-16 md:prose-h2:mt-24 prose-h2:mb-2 sm:prose-h2:mb-4
                  
                  prose-p:text-gray-600 prose-p:leading-relaxed prose-p:text-xs sm:prose-p:text-base md:prose-p:text-lg
                  prose-p:mt-0 prose-p:mb-3 sm:prose-p:mb-6
                  
                  prose-ul:mt-0 prose-ul:mb-4 sm:prose-ul:mb-8 md:prose-ul:mb-16 prose-ul:space-y-1 sm:prose-ul:space-y-2 
                  prose-li:text-gray-600 prose-li:text-xs sm:prose-li:text-base md:prose-li:text-lg prose-li:leading-relaxed
                  
                  prose-blockquote:text-base sm:prose-blockquote:text-xl prose-blockquote:font-medium prose-blockquote:not-italic prose-blockquote:leading-relaxed
                  prose-blockquote:border-l-4 prose-blockquote:border-orange-500 prose-blockquote:text-gray-700
                  prose-blockquote:bg-gradient-to-r prose-blockquote:from-orange-50/80 prose-blockquote:to-white
                  prose-blockquote:px-4 sm:prose-blockquote:px-10 prose-blockquote:py-4 sm:prose-blockquote:py-8 prose-blockquote:my-6 sm:prose-blockquote:my-16 prose-blockquote:rounded-r-xl
                  prose-blockquote:shadow-sm hover:prose-blockquote:shadow-md prose-blockquote:transition-shadow
                  prose-blockquote:relative prose-blockquote:mx-0 sm:prose-blockquote:mx-4
                  
                  [&>p:first-of-type]:text-sm sm:[&>p:first-of-type]:text-lg md:[&>p:first-of-type]:text-xl [&>p:first-of-type]:leading-relaxed [&>p:first-of-type]:text-gray-700 
                  [&>p:first-of-type]:font-medium [&>p:first-of-type]:mb-4 sm:[&>p:first-of-type]:mb-12 [&>p:first-of-type]:mt-0
                  
                  [&>ul]:list-none [&>ul>li]:relative [&>ul>li]:pl-5 sm:[&>ul>li]:pl-8
                  [&>ul>li]:before:content-[''] [&>ul>li]:before:absolute [&>ul>li]:before:left-0 [&>ul>li]:before:top-[0.6em]
                  [&>ul>li]:before:h-1.5 sm:[&>ul>li]:before:h-2 [&>ul>li]:before:w-1.5 sm:[&>ul>li]:before:w-2 [&>ul>li]:before:bg-orange-500 
                  [&>ul>li]:before:rounded-full
                  
                  [&>h2]:relative [&>h2]:pb-0 [&>h2]:w-fit
                  [&>h2]:after:content-[''] [&>h2]:after:absolute [&>h2]:after:bottom-0 [&>h2]:after:left-0 
                  [&>h2]:after:w-full [&>h2]:after:h-px [&>h2]:after:bg-gradient-to-r 
                  [&>h2]:after:from-orange-500 [&>h2]:after:to-transparent
                  
                  [&>p>strong]:font-semibold [&>p>strong]:text-gray-900
                  [&>p>em]:text-gray-700 [&>p>em]:font-medium
                  
                  [&>blockquote]:before:content-['"'] [&>blockquote]:before:absolute [&>blockquote]:before:-left-2 sm:[&>blockquote]:before:-left-6 
                  [&>blockquote]:before:-top-4 [&>blockquote]:before:text-3xl sm:[&>blockquote]:before:text-6xl [&>blockquote]:before:text-orange-200 
                  [&>blockquote]:before:font-serif [&>blockquote]:before:leading-none [&>blockquote]:before:z-0
                  
                  [&>blockquote>p]:relative [&>blockquote>p]:z-10
                  
                  [&>blockquote>p:last-child]:mt-2 sm:[&>blockquote>p:last-child]:mt-4 [&>blockquote>p:last-child]:text-xs sm:[&>blockquote>p:last-child]:text-base [&>blockquote>p:last-child]:text-gray-500
                  [&>blockquote>p:last-child]:before:content-['—'] [&>blockquote>p:last-child]:before:mr-2
                `}
                dangerouslySetInnerHTML={{ __html: newsDetail?.content || fallbackContent }}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 sm:py-8 border-t border-b border-gray-200 mb-6 sm:mb-16 gap-3 sm:gap-0">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-1 sm:gap-3 rounded-xl text-xs sm:text-base py-1 h-auto touch-manipulation ${isLiked ? 'text-red-500 bg-red-50' : 'text-gray-600 hover:bg-gray-100'}`}
                onClick={() => setIsLiked(!isLiked)}
              >
                <Heart className="w-3.5 h-3.5 sm:w-5 sm:h-5" fill={isLiked ? "currentColor" : "none"} />
                {(newsDetail?.likes || 0) + (isLiked ? 1 : 0)} likes
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 sm:gap-3 rounded-xl text-xs sm:text-base text-gray-600 hover:bg-gray-100 py-1 h-auto touch-manipulation"
              >
                <MessageCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                {newsDetail?.comments || 0} comments
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-7 h-7 sm:w-10 sm:h-10 p-0 touch-manipulation"
                onClick={() => handleShare('copy')}
              >
                <LinkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-7 h-7 sm:w-10 sm:h-10 p-0 text-[#1DA1F2] touch-manipulation"
                onClick={() => handleShare('twitter')}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"></path></svg>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-7 h-7 sm:w-10 sm:h-10 p-0 text-[#4267B2] touch-manipulation"
                onClick={() => handleShare('facebook')}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/></svg>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-7 h-7 sm:w-10 sm:h-10 p-0 text-[#0077B5] touch-manipulation"
                onClick={() => handleShare('linkedin')}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </Button>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 sm:pt-16">
            <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 sm:mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {latestNews
                .filter(article => article.id !== id)
                .slice(0, 3)
                .map((article) => (
                  <Link
                    key={article.id}
                    href={`/news/${article.id}`}
                    className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-gray-100 hover:border-orange-200 transition-all duration-300 hover:shadow-lg flex flex-col"
                  >
                    <div className="relative h-32 sm:h-48 overflow-hidden">
                      <Image 
                        src={article.imageUrl}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                      <div className="absolute top-2 left-2 sm:top-4 sm:left-4">
                        <span className="bg-white/90 backdrop-blur-sm text-orange-600 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium">
                          {article.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 sm:p-6 flex flex-col flex-grow">
                      <h3 className="text-sm sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-orange-600 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-xs text-gray-600 mb-2 sm:mb-4 line-clamp-2 flex-grow">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xs text-gray-500">{article.source}</span>
                        <span className="text-xs sm:text-sm text-orange-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          Read more
                          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </article>
      </div>

      <button
        onClick={scrollToTop}
        className={`fixed bottom-20 sm:bottom-8 right-4 sm:right-8 bg-orange-600 text-white p-2 sm:p-3 rounded-full shadow-lg transition-all duration-300 hover:bg-orange-700 touch-manipulation z-[999] ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        <ChevronUp className="w-4 h-4 sm:w-6 sm:h-6" />
      </button>
    </div>
  );
}; 