interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  rating: number;
  reviews: number;
}

const products: Product[] = [
  {
    id: "1",
    name: "AI-Powered Smart Speaker",
    description: "Experience the future of home automation with our AI-powered smart speaker, offering seamless voice control and integration with your smart home devices.",
    price: 199.99,
    category: "Smart Home",
    imageUrl: "https://images.unsplash.com/photo-1581091870621-1a7f7f6a6f4b",
    stock: 50,
    rating: 4.5,
    reviews: 120,
  },
  {
    id: "2",
    name: "Wireless Noise-Cancelling Headphones",
    description: "Immerse yourself in high-fidelity sound with our wireless noise-cancelling headphones, designed for ultimate comfort and audio clarity.",
    price: 299.99,
    category: "Audio",
    imageUrl: "https://images.unsplash.com/photo-1512499617640-c2f999fe2f4e",
    stock: 30,
    rating: 4.7,
    reviews: 85,
  },
  {
    id: "3",
    name: "4K Ultra HD Smart TV",
    description: "Transform your living room with our 4K Ultra HD Smart TV, featuring stunning visuals and smart connectivity for endless entertainment options.",
    price: 899.99,
    category: "Television",
    imageUrl: "https://images.unsplash.com/photo-1581091870621-1a7f7f6a6f4b",
    stock: 20,
    rating: 4.8,
    reviews: 200,
  },
  // ... add more products up to 50 ...
];

export default products; 