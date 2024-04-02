import {axios} from "../lib";
import {useMutation} from "@tanstack/react-query";
import download from 'downloadjs';


interface PDF {
  data: {
    template_id: string;
    body: string;
  };
  filename: string;
}

const generatePDF = async ({data, filename}: PDF) => {
  const response = await axios.post('generate-document/', data, {responseType: 'blob'});
  const content = response.headers['content-type'];
  return {data: response.data, filename, content}
}


export const useGeneratePDF = () => {
  return useMutation({
    mutationFn: generatePDF,
    onSuccess: ({data, filename, content}) => {
      download(data, filename, content)
    },
  });
}
