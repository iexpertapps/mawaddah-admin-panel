import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

const SETTINGS_QUERY_KEY = ['settings'];

export function useSettings() {
  const queryClient = useQueryClient();

  const fetchSettings = async () => {
    const { data } = await api.get('/api/settings/');
    return data;
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: fetchSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const mutation = useMutation({
    mutationFn: async (patch) => {
      const { data } = await api.patch('/api/settings/', patch);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
    },
  });

  return {
    settings: data,
    isLoading,
    isError,
    error,
    refetch,
    updateSettings: mutation.mutateAsync,
    isUpdating: mutation.isLoading,
    updateError: mutation.isError ? mutation.error : null,
  };
} 