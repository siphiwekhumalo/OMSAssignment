import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowRight, Cog, AlertCircle, CheckCircle2 } from "lucide-react";
import FileUpload from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { processDocumentRequestSchema } from "@shared/schema";

export default function UploadPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [fileError, setFileError] = useState(null);

  const form = useForm({
    resolver: zodResolver(processDocumentRequestSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      processingMethod: "standard",
    },
  });

  const processMutation = useMutation({
    mutationFn: async (data) => {
      // Clear previous errors
      setSubmitError(null);
      setFileError(null);
      
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);
      formData.append("dateOfBirth", data.dateOfBirth);
      formData.append("processingMethod", data.processingMethod);

      const response = await fetch("/api/process-document", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Create detailed error object
        const error = new Error(errorData.error || errorData.message || "Failed to process document");
        error.details = errorData.details;
        error.field = errorData.field;
        error.statusCode = response.status;
        
        throw error;
      }

      return response.json();
    },
    onSuccess: (data) => {
      setIsProcessing(false);
      toast({
        title: "Document processed successfully!",
        description: "Redirecting to results page...",
      });
      // Store result in sessionStorage for display
      sessionStorage.setItem("lastProcessingResult", JSON.stringify(data));
      setLocation("/results");
    },
    onError: (error) => {
      setIsProcessing(false);
      console.error("Processing error:", error);
      
      // Handle different types of errors with specific messages
      let errorMessage = error.message;
      
      // Handle field-specific errors
      if (error.field) {
        form.setError(error.field, { 
          type: "server",
          message: errorMessage 
        });
      } else if (error.message.includes("file") || error.message.includes("File") || 
                 error.message.includes("upload") || error.message.includes("Upload")) {
        setFileError(errorMessage);
      } else {
        setSubmitError({
          message: errorMessage,
          details: error.details,
          statusCode: error.statusCode
        });
      }
      
      toast({
        title: "Processing failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data) => {
    // Clear previous errors
    setSubmitError(null);
    setFileError(null);
    
    // Validate file selection
    if (!selectedFile) {
      setFileError("Please select a file to process");
      toast({
        title: "File required",
        description: "Please select a file to process.",
        variant: "destructive",
      });
      return;
    }

    // Client-side file validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    
    if (selectedFile.size > maxSize) {
      setFileError("File is too large. Please select a file smaller than 10MB.");
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }
    
    if (!allowedTypes.includes(selectedFile.type)) {
      setFileError("Invalid file type. Please select a PDF, JPG, JPEG, or PNG file.");
      toast({
        title: "Invalid file type",
        description: "Please select a PDF, JPG, JPEG, or PNG file.",
        variant: "destructive",
      });
      return;
    }
    
    // Additional filename validation
    if (selectedFile.name.length > 255) {
      setFileError("Filename is too long. Please rename your file to be shorter than 255 characters.");
      return;
    }

    setIsProcessing(true);
    processMutation.mutate({ ...data, file: selectedFile });
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-2">Upload Your Document</h2>
            <p className="text-muted-foreground">
              Upload a PDF or image file to extract text using standard or AI-powered methods
            </p>
          </div>

          {/* Error Display */}
          {submitError && (
            <Alert className="mb-6" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{submitError.message}</strong>
                {submitError.details && (
                  <div className="mt-1 text-sm opacity-90">
                    {submitError.details}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {fileError && (
            <Alert className="mb-6" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{fileError}</AlertDescription>
            </Alert>
          )}

          <Form {...form} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* File Upload Section */}
              <FileUpload
                onFileSelect={setSelectedFile}
                selectedFile={selectedFile}
                onFileRemove={handleFileRemove}
              />

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your first name" 
                          data-testid="input-firstName"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your last name" 
                          data-testid="input-lastName"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        data-testid="input-dateOfBirth"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Processing Method Selection */}
              <div>
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Processing Method</label>
                <div className="space-y-3 mt-2">
                  <div className="flex items-start space-x-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                    <input
                      type="radio"
                      id="standard"
                      name="processingMethod"
                      value="standard"
                      checked={form.watch("processingMethod") === "standard"}
                      onChange={() => form.setValue("processingMethod", "standard")}
                      className="aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                    />
                    <Label htmlFor="standard" className="flex-1 cursor-pointer" data-testid="radio-standard">
                      <div className="font-medium">Standard Extraction</div>
                      <div className="text-sm text-muted-foreground">
                        Uses Tesseract.js for images and pdfjs-dist for PDFs. Fast and reliable for basic text extraction.
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                    <input
                      type="radio"
                      id="ai"
                      name="processingMethod"
                      value="ai"
                      checked={form.watch("processingMethod") === "ai"}
                      onChange={() => form.setValue("processingMethod", "ai")}
                      className="aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                    />
                    <Label htmlFor="ai" className="flex-1 cursor-pointer" data-testid="radio-ai">
                      <div className="font-medium">AI Extraction</div>
                      <div className="text-sm text-muted-foreground">
                        Uses OpenAI for enhanced text extraction with better accuracy and context understanding.
                      </div>
                    </Label>
                  </div>
                </div>
                {form.formState.errors.processingMethod && (
                  <p className="text-sm text-destructive mt-2">
                    {form.formState.errors.processingMethod.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isProcessing}
                  data-testid="button-submit"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>{isProcessing ? "Processing..." : "Process Document"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
              </div>
          </Form>

          {/* Processing Status */}
          {isProcessing && (
            <Card className="mt-6">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="processing-animation mb-4">
                    <Cog className="h-8 w-8 mx-auto text-primary animate-spin" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Processing Your Document</h3>
                  <p className="text-muted-foreground">Please wait while we extract text from your document...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </main>
  );
}