import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, FileText, History } from 'lucide-react';

export function AppHeader() {
  const navigate = useNavigate();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img 
            src="/assets/hans%20logo.png" 
            alt="Hans Laser Tech India" 
            className="h-10 w-10 object-contain"
          />
          <h1 className="text-xl font-bold tracking-tight">
            HAN'S LASER TECH INDIA
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-1">
            <Button
              variant="ghost"
              onClick={() => navigate({ to: '/' })}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              New Report
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate({ to: '/history' })}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              History
            </Button>
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem onClick={() => navigate({ to: '/' })}>
                <FileText className="mr-2 h-4 w-4" />
                New Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: '/history' })}>
                <History className="mr-2 h-4 w-4" />
                History
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
