import { CreateClientSchemaType } from '@/app/(protected)/clientes/schemas/clientAddress'
import { fetchCep } from '@/app/(protected)/clientes/services/address';
import { FieldError, Input, Label, TextField } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { useWatch } from "react-hook-form";

const TestAddress = () => {

  const { control, watch, formState: { errors }, } = useFormContext<CreateClientSchemaType>();

  const isBrazil = watch("isBrazil");
  const postalCode = useWatch({ control, name: "postalCode"});

  const cleanPostalCode = postalCode?.replace(/\D/g, "");


  const { data: cepData, isFetching: isFetchingCep } = useQuery({
    queryKey: ["cep", postalCode],
    queryFn: () => fetchCep(postalCode),
    enabled: cleanPostalCode?.length === 8,
    staleTime: 1000 * 60 * 60,
    retry: false
  });


  return (
    <div className="flex flex-col gap-6">

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Controller
        name='postalCode'
        control={control}
        render={({field}) => (
          <TextField className={`w-full md:col-span-1`}>
                        <Label>CEP</Label>
                        <Input
                          {...field}
                          placeholder={"00000-000"}
                          variant="secondary"
                          // disabled={isFetchingCep}
                          // onChange={field.onChange}
                        />
          </TextField>
        )}
      />

      {/* Street */}
        <Controller
          control={control}
          name="street"
          render={({ field }) => (
            <TextField className="w-full md:col-span-3" isInvalid={!!errors.street}>
              <Label>{isBrazil ? "Logradouro" : "Street"}</Label>
              <Input {...field} variant="secondary" 
              // disabled={isFetchingCep}
               />
              {errors.street && <FieldError>{errors.street.message}</FieldError>}
            </TextField>
          )}
        />

      </div>
    </div>

    
  )
}

export default TestAddress