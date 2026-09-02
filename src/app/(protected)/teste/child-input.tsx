import React from 'react'
import { Controller, useFormContext } from 'react-hook-form';
import { FormSchemaType } from './page';
import { Input } from '@heroui/react';

const ChildInput = () => {

  const methods = useFormContext<FormSchemaType>();


  const logradouro = methods.watch("logradouro");

  console.log("Logradouro: ", logradouro)


  return (
    <Controller
      name="logradouro"
      control={methods.control}
      render={({field}) => (
        <Input
          {...field}
          placeholder='Logradouro'
        />
      )}
    />
  )
}

export default ChildInput