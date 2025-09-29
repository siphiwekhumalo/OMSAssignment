import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FileText } from "lucide-react";
import NotFound from "@/pages/not-found";
import UploadPage from "@/pages/upload";
import ResultsPage from "@/pages/results";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

function Header() {
  const [location] = useLocation();
  
  return (
    <header className="bg-card border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Document Processing Tool</h1>
              <p className="text-sm text-muted-foreground">Extract text from PDFs and images with AI</p>
            </div>
          </div>
          <nav className="flex space-x-4">
            <Link 
              href="/"
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                location === "/" 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
              data-testid="nav-upload"
            >
              Upload
            </Link>
            <Link 
              href="/results"
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                location === "/results" 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
              data-testid="nav-results"
            >
              Results
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={UploadPage} />
      <Route path="/results" component={ResultsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Header />
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;