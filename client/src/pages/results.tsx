import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, FileText, Brain, Cog, Clock, Download, Copy, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { ProcessedDocument } from "@shared/schema";

interface ProcessingResult extends ProcessedDocument {
  aiExtractedData?: {
    structuredData?: Record<string, any>;
    rawText?: string;
  };
}

export default function ResultsPage() {
  const { toast } = useToast();
  const [currentResult, setCurrentResult] = useState<ProcessingResult | null>(null);

  // Check for result in sessionStorage first
  useEffect(() => {
    const storedResult = sessionStorage.getItem("lastProcessingResult");
    if (storedResult) {
      try {
        setCurrentResult(JSON.parse(storedResult));
      } catch (error) {
        console.error("Failed to parse stored result:", error);
      }
    }
  }, []);

  const { data: recentResults, isLoading } = useQuery({
    queryKey: ["/api/processed-documents"],
    enabled: !currentResult,
  });

  const result = currentResult || (recentResults && recentResults[0]);

  const handleDownload = () => {
    if (!result) return;
    
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `processing-result-${result.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!result) return;
    
    try {
      const textToCopy = result.processingMethod === "ai" 
        ? result.aiExtractedData?.rawText || result.rawExtractedText || ""
        : result.standardExtractedText || "";
      
      await navigator.clipboard.writeText(textToCopy);
      toast({
        title: "Copied to clipboard",
        description: "Extracted text has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Unable to copy text to clipboard.",
        variant: "destructive",
      });
    }
  };

  const formatProcessingTime = (timeMs: number | null | undefined): string => {
    if (!timeMs) return "N/A";
    return timeMs < 1000 ? `${timeMs}ms` : `${(timeMs / 1000).toFixed(1)}s`;
  };

  if (isLoading && !currentResult) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No Results Found</h2>
              <p className="text-muted-foreground mb-6">
                Process a document to see your results here.
              </p>
              <Link href="/">
                <Button data-testid="button-process-new">
                  <Plus className="h-4 w-4 mr-2" />
                  Process New Document
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const isAiMethod = result.processingMethod === "ai";

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold">Processing Results</h2>
                <p className="text-muted-foreground">Document processed successfully</p>
              </div>
              <Link href="/">
                <Button variant="secondary" data-testid="button-process-new-header">
                  <Plus className="h-4 w-4 mr-2" />
                  Process New Document
                </Button>
              </Link>
            </div>

            {/* Personal Information Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-accent p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Full Name</div>
                <div className="text-lg font-semibold" data-testid="text-fullName">
                  {result.fullName}
                </div>
              </div>
              <div className="bg-accent p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Age</div>
                <div className="text-lg font-semibold" data-testid="text-age">
                  {result.age} years old
                </div>
              </div>
              <div className="bg-accent p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Processing Method</div>
                <div className="text-lg font-semibold" data-testid="text-method">
                  {isAiMethod ? "AI Extraction" : "Standard Extraction"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Display */}
        {!isAiMethod ? (
          /* Standard Method Only */
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <FileText className="h-6 w-6 text-primary mr-2" />
                Extracted Text
              </h3>
              <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono" data-testid="text-standard-extracted">
                  {result.standardExtractedText || "No text extracted"}
                </pre>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* AI Method - Side by Side */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Standard Extraction Results */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Cog className="h-6 w-6 text-muted-foreground mr-2" />
                  Standard Extraction
                </h3>
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg max-h-80 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm font-mono" data-testid="text-standard-comparison">
                      {result.standardExtractedText || "No text extracted"}
                    </pre>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Processing time: {formatProcessingTime(result.processingTime)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Extraction Results */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Brain className="h-6 w-6 text-primary mr-2" />
                  AI Extraction
                </h3>
                <div className="space-y-4">
                  {/* Structured Data */}
                  {result.aiExtractedData?.structuredData && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Structured Information</h4>
                      <div className="space-y-2" data-testid="ai-structured-data">
                        {Object.entries(result.aiExtractedData.structuredData).map(([key, value]) => (
                          <div key={key} className="flex justify-between py-2 px-3 bg-accent rounded text-sm">
                            <span className="font-medium capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Raw Text */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">Raw Extracted Text</h4>
                    <div className="bg-muted p-3 rounded-lg max-h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-xs font-mono" data-testid="text-ai-raw">
                        {result.aiExtractedData?.rawText || result.rawExtractedText || "No text extracted"}
                      </pre>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Processing time: {formatProcessingTime(result.processingTime)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                className="flex-1" 
                onClick={handleDownload}
                data-testid="button-download"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Results (JSON)
              </Button>
              <Button 
                variant="secondary" 
                className="flex-1" 
                onClick={handleCopy}
                data-testid="button-copy"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy to Clipboard
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                data-testid="button-export"
              >
                <Share className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
