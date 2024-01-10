import {useQuery} from "@tanstack/react-query";
import {axios} from "../lib";


interface Template {
  id: string;
  title: string;
}

type TemplatesResponse = Array<Template>;

export const getTemplates = async () : Promise<TemplatesResponse> => {
  const response = await axios.get('templates')
  return response.data
}

export const useTemplates = () => {
  return useQuery({
    queryKey: ['templates'],
    queryFn: () => getTemplates(),
    staleTime: Infinity,
  })
}
