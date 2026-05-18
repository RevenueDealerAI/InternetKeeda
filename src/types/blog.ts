export interface Author {
  name: string;
  avatar: string;
}

export interface BlogPost {
  id: string;
  _id: string; // MongoDB ObjectId
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: Author;
  category: string;
  readTime: string;
  imageUrl: string;
  tags: string[];
  status: 'draft' | 'published';
  likes: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
  slug: string;
} 