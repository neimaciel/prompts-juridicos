import { useState, useEffect, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { LegalPrompt } from "@shared/schema";

interface PromptsResponse {
  prompts: LegalPrompt[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export function useInfinitePrompts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(["Todos"]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["prompts", "infinite"],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(`/api/prompts?page=${pageParam}&limit=9`);
      if (!response.ok) throw new Error('Falha ao carregar prompts');
      return response.json() as Promise<PromptsResponse>;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore 
        ? lastPage.pagination.page + 1 
        : undefined;
    },
    initialPageParam: 1,
  });

  // Flatten all pages into a single array
  const allPrompts = data?.pages.flatMap(page => page.prompts) || [];

  // Filter prompts based on search and tags
  const filteredPrompts = allPrompts.filter(prompt => {
    // Filter by tags
    const matchesTag = selectedTags.includes("Todos") || 
      selectedTags.some(selectedTag => 
        prompt.areaTags.some(tag => 
          tag.toLowerCase().includes(selectedTag.toLowerCase())
        )
      );
    
    // Filter by search term
    const matchesSearch = !searchTerm || 
      prompt.userRequest.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.legalPrompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.areaTags.some(tag => 
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    return matchesTag && matchesSearch;
  });

  // Scroll detection for infinite loading
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop
      >= document.documentElement.offsetHeight - 1000 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return {
    prompts: filteredPrompts,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    error,
    searchTerm,
    setSearchTerm,
    selectedTags,
    setSelectedTags,
    fetchNextPage,
  };
}