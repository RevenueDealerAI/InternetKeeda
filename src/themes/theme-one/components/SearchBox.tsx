import React from 'react';
import { useDebounce } from 'use-debounce';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchBoxProps {
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBox({ onSearch, placeholder = "Search...", className = "" }: SearchBoxProps) {
  const [value, setValue] = React.useState("");
  const [debouncedValue] = useDebounce(value, 500);

  React.useEffect(() => {
    onSearch(debouncedValue);
  }, [debouncedValue, onSearch]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}