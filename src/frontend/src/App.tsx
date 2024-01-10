import {useEffect, useMemo} from 'react'
import './App.scss'
import {FormProvider, useForm} from "react-hook-form";
import {Button} from "@openfun/cunningham-react";
import * as Yup from "yup";

import { yupResolver } from "@hookform/resolvers/yup";
import {TextArea, Select} from "./components";
import {useTemplates, useGeneratePDF} from "./api";

interface FormValues {
  body: string;
  template_id: string;
}

const FormSchema = Yup.object().shape({
  body: Yup.string().required('Veuillez saisir votre contenu markdown.'),
  template_id: Yup.string().required('Veuillez sélectionner un template.'),
});

export interface FormProps {
  values?: FormValues;
}

function App({ values }: FormProps) {

  const methods = useForm<FormValues>({
    defaultValues: {
      body: "",
      template_id: ""
    },
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: yupResolver(FormSchema),
  });

  useEffect(() => {
    methods.reset(values);
  }, [values, methods]);


  const { error, data: templates, isFetching } = useTemplates()
  const { mutate: generatePDF } = useGeneratePDF();

  const options = useMemo(() => {

    if (!templates) return [];

    return templates?.map((template) => ({
      label: template.title,
      value: template.id
    }));

  }, [templates])

  if (isFetching) return <div>Loading...</div>
  if (error) return <div>Something went wrong...</div>

  return (
    <>
        <h1 className="c__app__title">Imprint</h1>
        <div>
          <FormProvider {...methods}>
            <form
              className="c__app__form"
              onSubmit={methods.handleSubmit((values) => generatePDF({data:values, filename:"wipp.pdf"}))}
            >
              <div className="c__app__form__inputs">
                <TextArea
                  name="body"
                  label="Saisir votre contenu markdown"
                  fullWidth={true}
                  style={{minHeight: "24rem"}}
                />
                <Select
                  name="template_id"
                  label="Sélectionner un template"
                  fullWidth={true}
                  options={options}
                />
              </div>
              <Button fullWidth={true}>Générer votre PDF</Button>
            </form>
          </FormProvider>
        </div>
    </>
  )
}

export default App
