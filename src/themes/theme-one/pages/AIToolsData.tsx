interface AITool {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  pricing: {
    type: "Free" | "Freemium" | "Paid" | "Enterprise";
    startingPrice?: string;
  };
  rating: number;
  reviews: number;
  features: string[];
  useCases: string[];
  website: string;
  tags: string[];
  lastUpdated: string;
  votes: number;
}

export const aiTools: AITool[] = [
  {
    id: "1",
    name: "ChatGPT",
    description: "Advanced language model capable of understanding and generating human-like text for various applications, from content creation to coding assistance.",
    category: "Language Models",
    imageUrl: "https://openai.com/favicon.ico",
    pricing: {
      type: "Freemium",
      startingPrice: "$20/month"
    },
    rating: 4.8,
    reviews: 15420,
    features: [
      "Natural language processing",
      "Code generation and debugging",
      "Content creation and editing",
      "Language translation",
      "Custom API integration"
    ],
    useCases: [
      "Content Writing",
      "Programming Assistance",
      "Educational Support",
      "Customer Service"
    ],
    website: "https://chat.openai.com",
    tags: ["AI", "NLP", "Machine Learning", "GPT"],
    lastUpdated: "2024-01-30",
    votes: 1300
  },
  {
    id: "2",
    name: "Midjourney",
    description: "AI-powered image generation tool that creates stunning artwork and visual content from text descriptions.",
    category: "Image Generation",
    imageUrl: "https://midjourney.com/favicon.ico",
    pricing: {
      type: "Paid",
      startingPrice: "$10/month"
    },
    rating: 4.7,
    reviews: 8750,
    features: [
      "Text-to-image generation",
      "Style customization",
      "High-resolution output",
      "Batch processing",
      "Commercial usage rights"
    ],
    useCases: [
      "Digital Art Creation",
      "Marketing Materials",
      "Concept Art",
      "Product Visualization"
    ],
    website: "https://midjourney.com",
    tags: ["AI Art", "Image Generation", "Creative Tools"],
    lastUpdated: "2024-01-28",
    votes: 1300
  },
  {
    id: "3",
    name: "GitHub Copilot",
    description: "AI-powered coding assistant that helps developers write better code faster with real-time suggestions and auto-completion.",
    category: "Development Tools",
    imageUrl: "https://github.com/favicon.ico",
    pricing: {
      type: "Paid",
      startingPrice: "$10/month"
    },
    rating: 4.9,
    reviews: 12300,
    features: [
      "Code completion",
      "Function suggestions",
      "Documentation generation",
      "Multi-language support",
      "IDE integration"
    ],
    useCases: [
      "Software Development",
      "Code Review",
      "Learning Programming",
      "Project Management"
    ],
    website: "https://github.com/features/copilot",
    tags: ["Programming", "AI", "Development", "Productivity"],
    lastUpdated: "2024-01-25",
    votes: 1300
  },
  {
    id: "4",
    name: "DALL·E 3",
    description: "Advanced AI system that creates realistic images and art from natural language descriptions with unprecedented quality and accuracy.",
    category: "Image Generation",
    imageUrl: "https://openai.com/favicon.ico",
    pricing: {
      type: "Paid",
      startingPrice: "Credits based"
    },
    rating: 4.8,
    reviews: 9200,
    features: [
      "Photorealistic image generation",
      "Art style variations",
      "High resolution output",
      "Edit existing images",
      "Commercial rights"
    ],
    useCases: [
      "Content Creation",
      "Product Design",
      "Marketing",
      "Entertainment"
    ],
    website: "https://openai.com/dall-e-3",
    tags: ["AI Art", "Image Generation", "Creative", "Design"],
    lastUpdated: "2024-01-27",
    votes: 1300
  },
  {
    id: "5",
    name: "Claude 2",
    description: "Advanced AI assistant focused on in-depth analysis, research, and complex problem-solving with enhanced safety features.",
    category: "Language Models",
    imageUrl: "https://anthropic.com/favicon.ico",
    pricing: {
      type: "Freemium",
      startingPrice: "$20/month"
    },
    rating: 4.7,
    reviews: 6800,
    features: [
      "Long-form content generation",
      "Research assistance",
      "Code analysis",
      "Data processing",
      "Safety alignment"
    ],
    useCases: [
      "Academic Research",
      "Content Writing",
      "Data Analysis",
      "Business Strategy"
    ],
    website: "https://anthropic.com/claude",
    tags: ["AI", "Research", "Analysis", "Writing"],
    lastUpdated: "2024-01-26",
    votes: 1300
  },
  {
    id: "6",
    name: "AutoGPT",
    description: "Autonomous AI agent capable of breaking down complex tasks into steps and executing them with minimal human intervention.",
    category: "Automation",
    imageUrl: "https://autogpt.net/favicon.ico",
    pricing: {
      type: "Free"
    },
    rating: 4.6,
    reviews: 5400,
    features: [
      "Autonomous task execution",
      "Goal-oriented processing",
      "Internet access",
      "File management",
      "Memory management"
    ],
    useCases: [
      "Process Automation",
      "Research Projects",
      "Content Creation",
      "Data Analysis"
    ],
    website: "https://autogpt.net",
    tags: ["Automation", "AI", "Productivity", "Tasks"],
    lastUpdated: "2024-01-24",
    votes: 1300
  },
  {
    id: "7",
    name: "Jasper",
    description: "AI writing assistant specialized in creating marketing content and copy with brand voice consistency.",
    category: "Content Creation",
    imageUrl: "https://jasper.ai/favicon.ico",
    pricing: {
      type: "Paid",
      startingPrice: "$40/month"
    },
    rating: 4.7,
    reviews: 7800,
    features: [
      "Marketing copy generation",
      "Brand voice customization",
      "SEO optimization",
      "Team collaboration",
      "Multiple language support"
    ],
    useCases: [
      "Marketing Content",
      "Social Media",
      "Blog Writing",
      "Ad Copy"
    ],
    website: "https://jasper.ai",
    tags: ["Writing", "Marketing", "Content", "AI"],
    lastUpdated: "2024-01-23",
    votes: 1300
  },
  {
    id: "8",
    name: "Stable Diffusion XL",
    description: "Open-source image generation model known for its high-quality outputs and customization capabilities.",
    category: "Image Generation",
    imageUrl: "https://stability.ai/favicon.ico",
    pricing: {
      type: "Free"
    },
    rating: 4.8,
    reviews: 8900,
    features: [
      "High-quality image generation",
      "Custom model training",
      "Local deployment option",
      "Community models",
      "API integration"
    ],
    useCases: [
      "Art Creation",
      "Design Projects",
      "Content Generation",
      "Research"
    ],
    website: "https://stability.ai",
    tags: ["AI Art", "Open Source", "Image Generation", "Machine Learning"],
    lastUpdated: "2024-01-22",
    votes: 1300
  },
  {
    id: "9",
    name: "Anthropic Claude API",
    description: "Enterprise-grade AI language model API with advanced safety features and detailed control options.",
    category: "API Services",
    imageUrl: "https://anthropic.com/favicon.ico",
    pricing: {
      type: "Enterprise",
      startingPrice: "Custom"
    },
    rating: 4.9,
    reviews: 4200,
    features: [
      "Advanced safety measures",
      "Custom model fine-tuning",
      "High-performance API",
      "Enterprise support",
      "Usage analytics"
    ],
    useCases: [
      "Enterprise Solutions",
      "Custom Applications",
      "Research Projects",
      "Data Analysis"
    ],
    website: "https://anthropic.com/api",
    tags: ["API", "Enterprise", "AI", "Development"],
    lastUpdated: "2024-01-21",
    votes: 1300
  },
  {
    id: "10",
    name: "RunwayML",
    description: "Creative suite for AI-powered video editing and generation with advanced features for content creators.",
    category: "Video Creation",
    imageUrl: "https://runway.ml/favicon.ico",
    pricing: {
      type: "Paid",
      startingPrice: "$12/month"
    },
    rating: 4.7,
    reviews: 7600,
    features: [
      "AI video editing",
      "Motion graphics generation",
      "Text-to-video",
      "Custom model training",
      "Collaboration tools"
    ],
    useCases: [
      "Video Production",
      "Content Creation",
      "Marketing",
      "Social Media"
    ],
    website: "https://runway.ml",
    tags: ["AI", "Video", "Content Creation", "Creative Tools"],
    lastUpdated: "2024-01-20",
    votes: 1300
  },
  {
    id: "11",
    name: "Notion AI",
    description: "AI-powered productivity tool for note-taking, knowledge management, and document organization with smart content suggestions.",
    category: "Productivity",
    imageUrl: "https://www.notion.so/favicon.ico",
    pricing: {
      type: "Freemium",
      startingPrice: "$8/month"
    },
    rating: 4.7,
    reviews: 4200,
    features: [
      "AI writing assistant",
      "Content summarization",
      "Note organization",
      "Task automation",
      "Collaboration features"
    ],
    useCases: [
      "Note-taking",
      "Project Management",
      "Team Collaboration",
      "Content Creation"
    ],
    website: "https://www.notion.so",
    tags: ["Productivity", "Collaboration", "AI", "Notetaking"],
    lastUpdated: "2024-01-19",
    votes: 1300
  },
  {
    id: "12",
    name: "Copy.ai",
    description: "AI-powered copywriting assistant that helps you create marketing copy, product descriptions, and more in seconds.",
    category: "Content Creation",
    imageUrl: "https://www.copy.ai/favicon.ico",
    pricing: {
      type: "Freemium",
      startingPrice: "$49/month"
    },
    rating: 4.6,
    reviews: 6800,
    features: [
      "Automated copywriting",
      "Product description generation",
      "SEO optimization",
      "Social media content",
      "Content templates"
    ],
    useCases: [
      "Marketing Copy",
      "Social Media Posts",
      "Ad Copy",
      "Blog Writing"
    ],
    website: "https://www.copy.ai",
    tags: ["Writing", "Marketing", "Content", "AI"],
    lastUpdated: "2024-01-18",
    votes: 1300
  },
  {
    id: "13",
    name: "Pictory",
    description: "AI video creation and editing platform that turns text into high-quality videos, with voiceovers, captions, and more.",
    category: "Video Creation",
    imageUrl: "https://pictory.ai/favicon.ico",
    pricing: {
      type: "Paid",
      startingPrice: "$19/month"
    },
    rating: 4.7,
    reviews: 5400,
    features: [
      "Text-to-video",
      "Automated voiceover generation",
      "AI-based editing",
      "Captioning",
      "Video customization"
    ],
    useCases: [
      "Social Media Content",
      "Marketing Videos",
      "Product Demos",
      "Educational Videos"
    ],
    website: "https://pictory.ai",
    tags: ["Video", "Content Creation", "AI", "Social Media"],
    lastUpdated: "2024-01-17",
    votes: 1300
  },
  {
    id: "14",
    name: "Replika",
    description: "AI chatbot designed to engage in deep conversations, offering emotional support and personal companionship.",
    category: "Chatbots",
    imageUrl: "https://replika.ai/favicon.ico",
    pricing: {
      type: "Freemium",
      startingPrice: "$7.99/month"
    },
    rating: 4.5,
    reviews: 11500,
    features: [
      "Emotionally intelligent conversations",
      "Personalized interactions",
      "Customizable avatar",
      "Mood tracking",
      "Therapeutic conversations"
    ],
    useCases: [
      "Emotional Support",
      "Mental Health",
      "Entertainment",
      "Personal Companion"
    ],
    website: "https://replika.ai",
    tags: ["Chatbot", "AI", "Emotional Support", "Mental Health"],
    lastUpdated: "2024-01-16",
    votes: 1300
  },
  {
    id: "15",
    name: "Runway ML Gen-2",
    description: "Next-gen video editing tool that uses AI to automate the creative process with seamless transitions, AI-driven effects, and more.",
    category: "Video Editing",
    imageUrl: "https://runwayml.com/favicon.ico",
    pricing: {
      type: "Paid",
      startingPrice: "$25/month"
    },
    rating: 4.8,
    reviews: 3300,
    features: [
      "AI-driven video editing",
      "Real-time collaboration",
      "Visual effects",
      "Text-to-video capabilities",
      "AI-based transitions"
    ],
    useCases: [
      "Video Production",
      "Content Creation",
      "Social Media",
      "Marketing"
    ],
    website: "https://runwayml.com/gen-2",
    tags: ["AI", "Video", "Editing", "Creative Tools"],
    lastUpdated: "2024-01-15",
    votes: 1300
  },
  {
    id: "16",
    name: "Lumen5",
    description: "AI video creation platform that turns text content into engaging video summaries, ideal for marketing and social media.",
    category: "Video Creation",
    imageUrl: "https://lumen5.com/favicon.ico",
    pricing: {
      type: "Freemium",
      startingPrice: "$19/month"
    },
    rating: 4.7,
    reviews: 4400,
    features: [
      "Text-to-video generation",
      "AI-powered storyboard creation",
      "Customizable themes",
      "Social media optimization",
      "Branding tools"
    ],
    useCases: [
      "Marketing Videos",
      "Social Media Content",
      "Educational Content",
      "Brand Awareness"
    ],
    website: "https://lumen5.com",
    tags: ["AI", "Video", "Content Creation", "Marketing"],
    lastUpdated: "2024-01-14",
    votes: 1300
  },
  {
    id: "17",
    name: "AI Dungeon",
    description: "AI-powered interactive storytelling platform that lets users create and participate in personalized text-based adventures.",
    category: "Entertainment",
    imageUrl: "https://play.aidungeon.io/favicon.ico",
    pricing: {
      type: "Freemium",
      startingPrice: "$5/month"
    },
    rating: 4.6,
    reviews: 11000,
    features: [
      "AI-generated stories",
      "Customizable narratives",
      "Interactive storytelling",
      "User-generated content",
      "Multiple genres"
    ],
    useCases: [
      "Interactive Fiction",
      "Game Development",
      "Creative Writing",
      "Entertainment"
    ],
    website: "https://play.aidungeon.io",
    tags: ["Entertainment", "AI", "Storytelling", "Gaming"],
    lastUpdated: "2024-01-13",
    votes: 1300
  },
  {
    id: "18",
    name: "Scribe AI",
    description: "AI-powered transcription and note-taking tool designed to improve productivity with high accuracy and real-time feedback.",
    category: "Productivity",
    imageUrl: "https://scribe.ai/favicon.ico",
    pricing: {
      type: "Paid",
      startingPrice: "$10/month"
    },
    rating: 4.7,
    reviews: 2500,
    features: [
      "Real-time transcription",
      "Multi-language support",
      "Text-to-speech",
      "Note organization",
      "Voice recognition"
    ],
    useCases: [
      "Meeting Notes",
      "Lecture Transcription",
      "Research",
      "Productivity Enhancement"
    ],
    website: "https://scribe.ai",
    tags: ["Productivity", "AI", "Transcription", "Voice Recognition"],
    lastUpdated: "2024-01-12",
    votes: 1300
  },
  {
    id: "19",
    name: "Synthezia",
    description: "AI video generation platform that converts text into personalized video content, with options for voiceovers and dynamic backgrounds.",
    category: "Video Creation",
    imageUrl: "https://synthezia.com/favicon.ico",
    pricing: {
      type: "Paid",
      startingPrice: "$39/month"
    },
    rating: 4.8,
    reviews: 2300,
    features: [
      "Text-to-video generation",
      "Personalized avatars",
      "Voiceover generation",
      "Custom backgrounds",
      "Multilingual support"
    ],
    useCases: [
      "Video Marketing",
      "Product Demos",
      "Education",
      "Customer Support"
    ],
    website: "https://synthezia.com",
    tags: ["AI", "Video", "Creation", "Marketing"],
    lastUpdated: "2024-01-11",
    votes: 1300
  },
  {
    id: "20",
    name: "AI Portraits",
    description: "AI tool that generates hyper-realistic portraits based on uploaded photos, offering various artistic styles and editing features.",
    category: "Image Generation",
    imageUrl: "https://aiportraits.com/favicon.ico",
    pricing: {
      type: "Paid",
      startingPrice: "$5/portrait"
    },
    rating: 4.7,
    reviews: 5000,
    features: [
      "Realistic portrait generation",
      "Artistic style variations",
      "Photo-to-portrait transformation",
      "High-resolution output",
      "Customizable options"
    ],
    useCases: [
      "Personal Art",
      "Gifts",
      "Social Media Content",
      "Digital Artwork"
    ],
    website: "https://aiportraits.com",
    tags: ["AI", "Art", "Portrait", "Image Generation"],
    lastUpdated: "2024-01-10",
    votes: 1300
  },
    {
      id: "31",
      name: "Runway",
      description: "AI-powered creative toolkit for video editing, motion graphics, and image generation with real-time collaboration features.",
      category: "Video Creation",
      imageUrl: "https://www.runwayml.com/favicon.ico",
      pricing: {
        type: "Freemium",
        startingPrice: "$12/month"
      },
      rating: 4.8,
      reviews: 4300,
      features: [
        "AI video editing",
        "Image generation",
        "Real-time collaboration",
        "Text-to-image synthesis",
        "Green screen effect"
      ],
      useCases: [
        "Video Editing",
        "Motion Graphics",
        "Collaborative Projects",
        "Content Creation"
      ],
      website: "https://www.runwayml.com",
      tags: ["AI", "Video Editing", "Creative Tools", "Collaboration"],
      lastUpdated: "2024-01-01",
      votes: 1400
    },
    {
      id: "32",
      name: "Copy.ai",
      description: "AI writing assistant for generating marketing copy, blog content, social media posts, and product descriptions.",
      category: "Content Creation",
      imageUrl: "https://www.copy.ai/favicon.ico",
      pricing: {
        type: "Freemium",
        startingPrice: "$49/month"
      },
      rating: 4.7,
      reviews: 7800,
      features: [
        "AI copywriting",
        "Marketing content generation",
        "Blog posts",
        "Social media copy",
        "Product descriptions"
      ],
      useCases: [
        "Marketing",
        "Content Writing",
        "Social Media Posts",
        "Email Campaigns"
      ],
      website: "https://www.copy.ai",
      tags: ["Writing", "AI", "Marketing", "Content Creation"],
      lastUpdated: "2024-01-01",
      votes: 1400
    },
    {
      id: "33",
      name: "Lumen5",
      description: "AI video creation platform that turns blog posts and articles into engaging video content using AI-powered automation.",
      category: "Video Creation",
      imageUrl: "https://www.lumen5.com/favicon.ico",
      pricing: {
        type: "Freemium",
        startingPrice: "$19/month"
      },
      rating: 4.6,
      reviews: 5400,
      features: [
        "AI video automation",
        "Text-to-video conversion",
        "Customizable video templates",
        "Stock video library",
        "Branding options"
      ],
      useCases: [
        "Social Media Videos",
        "Marketing Campaigns",
        "Video Content Creation",
        "Content Marketing"
      ],
      website: "https://www.lumen5.com",
      tags: ["Video", "AI", "Content Creation", "Marketing"],
      lastUpdated: "2024-01-02",
      votes: 1400
    },
    {
      id: "34",
      name: "Surfer SEO",
      description: "AI-based SEO tool for content optimization, keyword research, and on-page SEO analysis to improve search engine rankings.",
      category: "SEO Tools",
      imageUrl: "https://www.surferseo.com/favicon.ico",
      pricing: {
        type: "Paid",
        startingPrice: "$59/month"
      },
      rating: 4.8,
      reviews: 4000,
      features: [
        "SEO audit",
        "Keyword research",
        "On-page optimization",
        "Content optimization",
        "SERP analysis"
      ],
      useCases: [
        "SEO Strategy",
        "Content Optimization",
        "Website Ranking",
        "Search Engine Marketing"
      ],
      website: "https://www.surferseo.com",
      tags: ["SEO", "AI", "Content Optimization", "Marketing"],
      lastUpdated: "2024-01-03",
      votes: 1400
    },
    {
      id: "35",
      name: "Writesonic",
      description: "AI-powered copywriting assistant for generating high-quality blog posts, landing pages, ad copy, and social media content.",
      category: "Content Creation",
      imageUrl: "https://www.writesonic.com/favicon.ico",
      pricing: {
        type: "Freemium",
        startingPrice: "$19/month"
      },
      rating: 4.7,
      reviews: 6900,
      features: [
        "AI copywriting",
        "Blog post generation",
        "Landing page creation",
        "Social media content",
        "Ad copy generation"
      ],
      useCases: [
        "Content Creation",
        "Digital Marketing",
        "SEO",
        "Advertising"
      ],
      website: "https://www.writesonic.com",
      tags: ["AI", "Content Creation", "Copywriting", "Marketing"],
      lastUpdated: "2024-01-02",
      votes: 1400
    },
    {
      id: "36",
      name: "AI Dungeon",
      description: "AI-powered text-based adventure game that generates dynamic stories and quests based on user input.",
      category: "Entertainment",
      imageUrl: "https://www.aidungeon.io/favicon.ico",
      pricing: {
        type: "Freemium",
        startingPrice: "$9.99/month"
      },
      rating: 4.6,
      reviews: 4200,
      features: [
        "Dynamic storytelling",
        "AI-generated narratives",
        "Interactive adventure",
        "Multiplayer mode",
        "Multiple genres"
      ],
      useCases: [
        "Gaming",
        "Storytelling",
        "Creative Writing",
        "Entertainment"
      ],
      website: "https://www.aidungeon.io",
      tags: ["AI", "Gaming", "Storytelling", "Entertainment"],
      lastUpdated: "2024-01-01",
      votes: 1400
    },
    {
      id: "37",
      name: "Pictory",
      description: "AI video creation and editing platform designed to convert long-form content into shorter video clips for social media.",
      category: "Video Creation",
      imageUrl: "https://www.pictory.ai/favicon.ico",
      pricing: {
        type: "Freemium",
        startingPrice: "$19/month"
      },
      rating: 4.7,
      reviews: 5100,
      features: [
        "Text-to-video conversion",
        "Video editing automation",
        "Social media video optimization",
        "Customizable templates",
        "AI-based content summarization"
      ],
      useCases: [
        "Social Media Content",
        "Video Editing",
        "Content Repurposing",
        "Marketing"
      ],
      website: "https://www.pictory.ai",
      tags: ["Video", "AI", "Content Creation", "Marketing"],
      lastUpdated: "2024-01-01",
      votes: 1400
    },
    {
      id: "38",
      name: "Beautiful.ai",
      description: "AI-powered presentation tool for creating visually appealing slides and presentations automatically with minimal effort.",
      category: "Productivity",
      imageUrl: "https://www.beautiful.ai/favicon.ico",
      pricing: {
        type: "Freemium",
        startingPrice: "$12/month"
      },
      rating: 4.8,
      reviews: 5300,
      features: [
        "AI-driven slide design",
        "Customizable templates",
        "Real-time collaboration",
        "Presentation analytics",
        "Dynamic content integration"
      ],
      useCases: [
        "Business Presentations",
        "Sales Decks",
        "Pitch Presentations",
        "Team Collaboration"
      ],
      website: "https://www.beautiful.ai",
      tags: ["AI", "Productivity", "Presentation", "Design"],
      lastUpdated: "2024-01-01",
      votes: 1400
    },
    {
      id: "39",
      name: "Descript Overdub",
      description: "AI-driven voice cloning tool that allows users to generate synthetic voiceovers or edit audio using their own voice.",
      category: "Audio Editing",
      imageUrl: "https://www.descript.com/favicon.ico",
      pricing: {
        type: "Paid",
        startingPrice: "$24/month"
      },
      rating: 4.8,
      reviews: 3500,
      features: [
        "Voice cloning",
        "Audio editing",
        "Text-to-speech",
        "Real-time audio adjustments",
        "Multi-voice support"
      ],
      useCases: [
        "Podcasting",
        "Voiceover Creation",
        "Audio Editing",
        "Content Creation"
      ],
      website: "https://www.descript.com/overdub",
      tags: ["AI", "Audio Editing", "Voice Cloning", "Content Creation"],
      lastUpdated: "2024-01-01",
      votes: 1400
    },
    {
      id: "40",
      name: "Veed.io",
      description: "AI-based video editing tool that simplifies editing, adding effects, and creating videos for social media and marketing.",
      category: "Video Editing",
      imageUrl: "https://www.veed.io/favicon.ico",
      pricing: {
        type: "Freemium",
        startingPrice: "$12/month"
      },
      rating: 4.7,
      reviews: 5200,
      features: [
        "AI video editing",
        "Subtitles and captions",
        "Text and image overlays",
        "Audio editing",
        "Social media video templates"
      ],
      useCases: [
        "Social Media Videos",
        "Marketing Campaigns",
        "Content Creation",
        "YouTube Videos"
      ],
      website: "https://www.veed.io",
      tags: ["Video", "AI", "Content Creation", "Editing"],
      lastUpdated: "2024-01-01",
      votes: 1400
    },
    {
        id: "21",
        name: "Jasper AI",
        description: "AI content generation platform that helps users create high-quality blog posts, marketing copy, and more.",
        category: "Content Creation",
        imageUrl: "https://www.jasper.ai/favicon.ico",
        pricing: {
          type: "Paid",
          startingPrice: "$49/month"
        },
        rating: 4.8,
        reviews: 9800,
        features: [
          "AI content generation",
          "SEO optimization",
          "Plagiarism checker",
          "Multiple language support",
          "Customizable templates"
        ],
        useCases: [
          "Blog Writing",
          "Copywriting",
          "SEO Content",
          "Product Descriptions"
        ],
        website: "https://www.jasper.ai",
        tags: ["AI", "Writing", "Marketing", "Content Creation"],
        lastUpdated: "2024-01-09",
        votes: 1400
      },
      {
        id: "22",
        name: "DALL·E 2",
        description: "AI image generation tool that creates images from text prompts with an emphasis on creativity and high-quality visuals.",
        category: "Image Generation",
        imageUrl: "https://openai.com/favicon.ico",
        pricing: {
          type: "Freemium",
          startingPrice: "$15/month"
        },
        rating: 4.9,
        reviews: 12300,
        features: [
          "Text-to-image generation",
          "Image editing",
          "Creative visual styles",
          "High resolution outputs",
          "Customizable prompts"
        ],
        useCases: [
          "Marketing Materials",
          "Art and Design",
          "Product Concepting",
          "Social Media Content"
        ],
        website: "https://openai.com/dall-e-2",
        tags: ["AI", "Image Generation", "Creative Tools", "Design"],
        lastUpdated: "2024-01-08",
        votes: 1400
      },
      {
        id: "23",
        name: "ChatGPT",
        description: "A powerful AI conversational agent for real-time text-based interactions, capable of answering queries, assisting with tasks, and more.",
        category: "Chatbots",
        imageUrl: "https://openai.com/favicon.ico",
        pricing: {
          type: "Freemium",
          startingPrice: "$20/month"
        },
        rating: 4.8,
        reviews: 42000,
        features: [
          "Natural language understanding",
          "Contextual conversation",
          "Task assistance",
          "Content generation",
          "Multi-turn conversations"
        ],
        useCases: [
          "Customer Support",
          "Education",
          "Personal Assistant",
          "Research"
        ],
        website: "https://chat.openai.com",
        tags: ["AI", "Chatbot", "Conversational Agent", "Assistant"],
        lastUpdated: "2024-01-07",
        votes: 1400
      },
      {
        id: "24",
        name: "Synthesia",
        description: "AI-powered video generation platform that creates AI avatars and produces personalized video content from text input.",
        category: "Video Creation",
        imageUrl: "https://www.synthesia.io/favicon.ico",
        pricing: {
          type: "Paid",
          startingPrice: "$30/month"
        },
        rating: 4.8,
        reviews: 5600,
        features: [
          "AI video creation",
          "Customizable avatars",
          "Text-to-speech",
          "Multilingual video generation",
          "Enterprise solutions"
        ],
        useCases: [
          "Corporate Training",
          "Marketing Videos",
          "Onboarding",
          "Personalized Content"
        ],
        website: "https://www.synthesia.io",
        tags: ["Video", "AI", "Content Creation", "Corporate Training"],
        lastUpdated: "2024-01-06",
        votes: 1400
      },
      {
        id: "25",
        name: "Frase",
        description: "AI content creation tool focused on SEO, generating topic research, keyword analysis, and full-length content based on search intent.",
        category: "Content Creation",
        imageUrl: "https://www.frase.io/favicon.ico",
        pricing: {
          type: "Freemium",
          startingPrice: "$14.99/month"
        },
        rating: 4.7,
        reviews: 3200,
        features: [
          "SEO optimization",
          "Keyword research",
          "Content generation",
          "Search intent analysis",
          "Writing assistant"
        ],
        useCases: [
          "SEO Content",
          "Blog Posts",
          "Content Strategy",
          "Digital Marketing"
        ],
        website: "https://www.frase.io",
        tags: ["SEO", "AI", "Content Creation", "Marketing"],
        lastUpdated: "2024-01-05",
        votes: 1400
      },
      {
        id: "26",
        name: "Grammarly",
        description: "AI-powered writing assistant designed to improve writing by offering real-time grammar, spelling, and style suggestions.",
        category: "Productivity",
        imageUrl: "https://www.grammarly.com/favicon.ico",
        pricing: {
          type: "Freemium",
          startingPrice: "$12/month"
        },
        rating: 4.9,
        reviews: 21000,
        features: [
          "Grammar and spelling check",
          "Writing style improvement",
          "Plagiarism detection",
          "Tone detection",
          "Advanced writing suggestions"
        ],
        useCases: [
          "Writing Improvement",
          "Email Composition",
          "Academic Writing",
          "Content Creation"
        ],
        website: "https://www.grammarly.com",
        tags: ["Writing", "Grammar", "AI", "Productivity"],
        lastUpdated: "2024-01-04",
        votes: 1400
      },
      {
        id: "27",
        name: "Descript",
        description: "AI-driven video and audio editing platform that offers text-based editing, automatic transcription, and podcast production features.",
        category: "Audio/Video Editing",
        imageUrl: "https://www.descript.com/favicon.ico",
        pricing: {
          type: "Freemium",
          startingPrice: "$12/month"
        },
        rating: 4.7,
        reviews: 4200,
        features: [
          "Text-based editing",
          "Automatic transcription",
          "Screen recording",
          "Multi-voice editing",
          "Podcast production tools"
        ],
        useCases: [
          "Podcasting",
          "Video Editing",
          "Transcription",
          "Content Creation"
        ],
        website: "https://www.descript.com",
        tags: ["Audio Editing", "Video Editing", "AI", "Podcasting"],
        lastUpdated: "2024-01-03",
        votes: 1400
      },
      {
        id: "28",
        name: "Fotor AI",
        description: "AI-powered photo editing platform that offers advanced tools like background removal, image enhancement, and AI-generated effects.",
        category: "Image Editing",
        imageUrl: "https://www.fotor.com/favicon.ico",
        pricing: {
          type: "Freemium",
          startingPrice: "$8.99/month"
        },
        rating: 4.7,
        reviews: 6800,
        features: [
          "AI background removal",
          "Image enhancement",
          "Portrait retouching",
          "AI-based design tools",
          "Collage maker"
        ],
        useCases: [
          "Photo Editing",
          "Social Media Content",
          "Marketing Materials",
          "Graphic Design"
        ],
        website: "https://www.fotor.com",
        tags: ["AI", "Image Editing", "Design", "Photo Enhancement"],
        lastUpdated: "2024-01-02",
        votes: 1400
      },
      {
        id: "29",
        name: "Murf AI",
        description: "AI-powered voiceover generation tool that turns text into lifelike speech with various voice options and languages.",
        category: "Audio Creation",
        imageUrl: "https://www.murf.ai/favicon.ico",
        pricing: {
          type: "Paid",
          startingPrice: "$13.99/month"
        },
        rating: 4.8,
        reviews: 4200,
        features: [
          "Text-to-speech generation",
          "Realistic voiceovers",
          "Multiple language support",
          "Customizable voice options",
          "Podcast narration"
        ],
        useCases: [
          "Voiceovers",
          "Podcasting",
          "Marketing Videos",
          "Audio Content Creation"
        ],
        website: "https://www.murf.ai",
        tags: ["AI", "Voiceover", "Audio", "Text-to-Speech"],
        lastUpdated: "2024-01-01",
        votes: 1400
      },
      {
        id: "30",
        name: "DeepL Translator",
        description: "AI-based translation tool that offers highly accurate translations in multiple languages, with advanced context recognition.",
        category: "Language Processing",
        imageUrl: "https://www.deepl.com/favicon.ico",
        pricing: {
          type: "Freemium",
          startingPrice: "$6.99/month"
        },
        rating: 4.9,
        reviews: 21000,
        features: [
          "High-quality translations",
          "Multiple language support",
          "Contextual translation",
          "Text-to-speech",
          "Customizable translation models"
        ],
        useCases: [
          "Multilingual Communication",
          "Content Localization",
          "Business Translation",
          "Language Learning"
        ],
        website: "https://www.deepl.com",
        tags: ["Translation", "AI", "Language", "Multilingual"],
        lastUpdated: "2024-01-01",
        votes: 1400
      }
  ];
