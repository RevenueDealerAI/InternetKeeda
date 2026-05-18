import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Image, 
  Code2, 
  Pencil, 
  Music, 
  Video,
  Sparkles,
  Hash
} from "lucide-react";

interface CategoriesProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case "chatbot":
      return <MessageSquare className="w-4 h-4" />;
    case "image generation":
      return <Image className="w-4 h-4" />;
    case "code assistant":
      return <Code2 className="w-4 h-4" />;
    case "writing":
      return <Pencil className="w-4 h-4" />;
    case "audio":
      return <Music className="w-4 h-4" />;
    case "video":
      return <Video className="w-4 h-4" />;
    default:
      return <Hash className="w-4 h-4" />;
  }
};

const getCategoryColor = (category: string): { light: string; dark: string } => {
  switch (category.toLowerCase()) {
    case "chatbot":
      return { light: "from-blue-500/10 to-blue-600/10", dark: "from-blue-500 to-blue-600" };
    case "image generation":
      return { light: "from-fuchsia-500/10 to-pink-600/10", dark: "from-fuchsia-500 to-pink-600" };
    case "code assistant":
      return { light: "from-emerald-500/10 to-teal-600/10", dark: "from-emerald-500 to-teal-600" };
    case "writing":
      return { light: "from-violet-500/10 to-purple-600/10", dark: "from-violet-500 to-purple-600" };
    case "audio":
      return { light: "from-orange-500/10 to-amber-600/10", dark: "from-orange-500 to-amber-600" };
    case "video":
      return { light: "from-rose-500/10 to-red-600/10", dark: "from-rose-500 to-red-600" };
    default:
      return { light: "from-gray-500/10 to-gray-600/10", dark: "from-gray-500 to-gray-600" };
  }
};

export const Categories = ({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoriesProps) => {
  return (
    <div className="mb-12">
      <div className="flex flex-wrap justify-center gap-3">
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          onClick={() => onSelectCategory("all")}
          className={`
            group relative overflow-hidden rounded-full transition-all duration-300 shadow-sm hover:shadow-md
            ${selectedCategory === "all" 
              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700" 
              : "hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50"
            }
          `}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Sparkles className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
          <span className="relative">All Tools</span>
        </Button>

        {categories.map((category) => {
          const colors = getCategoryColor(category);
          return (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => onSelectCategory(category)}
              className={`
                group relative overflow-hidden rounded-full transition-all duration-300 shadow-sm hover:shadow-md
                ${selectedCategory === category 
                  ? `bg-gradient-to-r ${colors.dark} text-white` 
                  : `hover:bg-gradient-to-r ${colors.light}`
                }
              `}
            >
              <div className={`
                absolute inset-0 bg-gradient-to-r ${colors.light}
                opacity-0 group-hover:opacity-100 transition-opacity duration-300
              `} />
              <span className="relative flex items-center">
                <span className="mr-2 transition-transform duration-300 group-hover:scale-110">
                  {getCategoryIcon(category)}
                </span>
                <span className="relative">{category}</span>
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};