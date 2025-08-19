import { cn } from '@/lib/utils';
import { Category } from './types';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DiscoverNavigationProps {
  categories: readonly Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export function DiscoverNavigation({ 
  categories, 
  activeCategory, 
  onCategoryChange 
}: DiscoverNavigationProps) {
  const router = useRouter();
  
  const handleCreateArticle = () => {
    router.push('/discover/create');
  };
  
  const handleManageArticles = () => {
    router.push('/discover/manage');
  };
  
  return (
    <nav className="py-6" id="discover-categories">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "relative flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 whitespace-nowrap",
                "hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20",
                activeCategory === category.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="font-medium text-sm">{category.name}</span>
              {/* Active indicator - pill style to match home navbar */}
              {activeCategory === category.id && (
                <div className="absolute inset-0 rounded-lg bg-accent/60 border border-border -z-10" />
              )}
            </button>
          ))}
        </div>
        
        {/* Article Management Actions */}
        <div className="flex items-center space-x-2 ml-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManageArticles}
            className="whitespace-nowrap"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage
          </Button>
          <Button
            size="sm"
            onClick={handleCreateArticle}
            className="whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Article
          </Button>
        </div>
      </div>
    </nav>
  );
}