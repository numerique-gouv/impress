'use client';

import Image from 'next/image'
import {Button} from "@/components/ui/button";
import React, {useEffect, useState} from "react";
import {Textarea} from "@/components/ui/textarea";
import {Input} from "@/components/ui/input";
import {Form} from "@/components/ui/form";


import * as z from "zod"
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Toaster} from "@/components/ui/sonner";
import {toast} from "sonner";

const formSchema = z.object({
  body: z.string(),
  template_id: z.string()
})

export default function Home() {


  const [templates, setTemplates] = useState([]);
  const [isFetching, setIsFetching] = useState(false);

  const fetchTemplates = async () => {
    const res= await fetch('http://localhost:8071/api/templates');
    if (!res.ok) {
      // This will activate the closest `error.js` Error Boundary
      throw new Error('Failed to fetch data')
    }
    const templates = await res.json()
    setTemplates(templates);
  };

  useEffect( () => {
    fetchTemplates();
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      body: "",
      template_id: "",
    },
  })

  function download(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    // the filename you want
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  const generateDocument = async (values: any) => {
    const res = await fetch('http://localhost:8071/api/generate-document/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

    if (!res.ok) {
      // This will activate the closest `error.js` Error Boundary
      throw new Error('Failed to generate document')
    }

    return await res.blob()
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    setIsFetching(true)

    try {
      const document = await generateDocument(values)
      download(document, "wip.pdf")

      toast("Fichier téléchargé.", {
        description: "Nous avons généré votre document à partir du template sélectionné.",
      })
      setIsFetching(false)

    } catch (e) {
      setIsFetching(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 relative">
      <div className="absolute left-8 top-8 flex">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
        </svg>
        <span className="font-medium">Imprint</span>
      </div>
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenu</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Coller votre code markdown." {...field} className="min-h-96" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="template_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un model de document." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {
                        templates?.map((template) => (
                          <SelectItem value={template.id} key={template.id}>{template.title}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isFetching}>Générer votre PDF</Button>
          </form>
        </Form>
      </div>
      <Toaster />
    </main>
  )
}
