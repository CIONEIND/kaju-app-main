"use client";

import { Button, Form, Input } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { z } from "zod";
import ChildInput from './child-input';

const formSchema = z.object({
  cep: z.string().min(1),
  logradouro: z.string().min(1)
});

export type FormSchemaType = z.infer<typeof formSchema>;


const TestePage = () => {

  const formMethods = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cep: "",
      logradouro: ""
    }
  });


  const onSubmit = (data: any) => console.log("FORM DATA", data);
  const onError = (errors: any) => console.log("FORM ERRORS", errors);

  const cepValue = formMethods.watch("cep");

  console.log("CEP VALUE", cepValue);

  if(cepValue?.length >= 8) {
    console.log(" triggggeeeeeeerrrrrrr")
  }


  return (
    <FormProvider {...formMethods}>
      <Form onSubmit={formMethods.handleSubmit(onSubmit, onError)}>
        <Controller
        name="cep"
        defaultValue=""
        control={formMethods.control}
        render={({field}) => (
          <Input 
            {...field}
            placeholder='CEP'
          />
        )}
      />

      <ChildInput />
        <Button type='submit'>Enviar</Button>
      </Form>
      
    </FormProvider>
  )
}

export default TestePage