"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateResponse } from "@/ai/flows/generate-response";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChibiIcon } from "@/components/icons";
import { Bot, Send, User } from "lucide-react";

const chatFormSchema = z.object({
  textInput: z.string().min(1, "Message cannot be empty."),
  responseStyle: z.enum(["Supportive", "Neutral Objective", "Psychological"]),
});

type ChatMessage = {
  id: number;
  role: "user" | "assistant" | "loading";
  content: string;
};

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof chatFormSchema>>({
    resolver: zodResolver(chatFormSchema),
    defaultValues: {
      textInput: "",
      responseStyle: "Supportive",
    },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  async function onSubmit(values: z.infer<typeof chatFormSchema>) {
    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: values.textInput,
    };
    const loadingMessage: ChatMessage = {
      id: Date.now() + 1,
      role: "loading",
      content: "",
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    form.resetField("textInput");

    try {
      const result = await generateResponse(values);
      const assistantMessage: ChatMessage = {
        id: Date.now() + 2,
        role: "assistant",
        content: result.responseText,
      };
      setMessages((prev) =>
        prev.filter((m) => m.role !== "loading").concat(assistantMessage)
      );
    } catch (error) {
      console.error("Error generating response:", error);
      const errorMessage: ChatMessage = {
        id: Date.now() + 2,
        role: "assistant",
        content: "I'm sorry, I'm having a bit of trouble right now. Please try again in a moment.",
      };
      setMessages((prev) =>
        prev.filter((m) => m.role !== "loading").concat(errorMessage)
      );
    }
  }

  return (
    <div className="flex flex-col h-full p-4 md:p-6 bg-primary/20">
      <div className="flex-1 flex flex-col gap-4">
        <header className="text-center">
            <h2 className="text-2xl md:text-3xl font-headline text-stone-800">How are you feeling today?</h2>
            <p className="text-muted-foreground">Share your thoughts and let's talk it through.</p>
        </header>
        <ScrollArea className="flex-1 -mx-4" ref={scrollAreaRef}>
          <div className="px-4 space-y-6 py-4">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-20">
                    <ChibiIcon className="w-32 h-32 text-accent/80" />
                    <p className="font-headline text-xl mt-4">I'm here to listen.</p>
                    <p>Type your first message below to begin.</p>
                </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-3",
                  message.role === "user" && "justify-end"
                )}
              >
                {message.role !== "user" && (
                  <Avatar className="h-9 w-9 border-2 border-accent">
                    <div className="bg-accent/50 w-full h-full flex items-center justify-center">
                        <Bot className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                <Card
                  className={cn(
                    "max-w-md rounded-2xl shadow-sm",
                    message.role === "user"
                      ? "bg-accent text-accent-foreground rounded-br-none"
                      : "bg-white text-foreground rounded-bl-none"
                  )}
                >
                  <CardContent className="p-3">
                    {message.role === "loading" ? (
                      <div className="flex items-center space-x-2">
                        <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse"></span>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </CardContent>
                </Card>
                {message.role === "user" && (
                  <Avatar className="h-9 w-9 border-2 border-accent">
                     <div className="bg-accent/50 w-full h-full flex items-center justify-center">
                        <User className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <AvatarFallback>You</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div className="mt-auto pt-4">
        <Card className="rounded-xl shadow-lg">
          <CardContent className="p-2">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex items-start gap-2"
              >
                <FormField
                  control={form.control}
                  name="textInput"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Textarea
                          placeholder="Type your message here..."
                          className="h-24 resize-none border-0 focus-visible:ring-0 shadow-none p-3"
                          {...field}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              form.handleSubmit(onSubmit)();
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex flex-col gap-2 p-1">
                  <FormField
                    control={form.control}
                    name="responseStyle"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-[150px]">
                              <SelectValue placeholder="Response Style" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Supportive">Supportive</SelectItem>
                            <SelectItem value="Neutral Objective">Neutral Objective</SelectItem>
                            <SelectItem value="Psychological">Psychological</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="h-full bg-accent hover:bg-accent/80"
                    disabled={form.formState.isSubmitting}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
