import { ProductForm } from "../components/products/ProductForm";
import Link from 'next/link'
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
const AddProduct = () => {
  return (
    <div className="container mx-auto px-4 py-8 mt-20">
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="mb-6">
            <Button variant="ghost" asChild className="mb-6">
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent mb-2">
              Add New AI Tool
            </h1>
            <p className="text-gray-600">
              Share your AI tool with the community. Fill out the form below with your tool's details.
            </p>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-100">
            <ProductForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;