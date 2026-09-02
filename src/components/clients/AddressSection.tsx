"use client";
import {
  Autocomplete,
  Checkbox,
  EmptyState,
  FieldError,
  Input,
  type Key,
  Label,
  ListBox,
  SearchField,
  TextField,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { CreateClientSchemaType } from "@/app/(protected)/clientes/schemas/clientAddress";
import {
  fetchCep,
  fetchCities,
  fetchUfs,
} from "@/app/(protected)/clientes/services/address";
import { SectionHeading } from "@/components/ui/page";
import type { ViaCepResponse } from "@/lib/via-cep/types";
import { Country } from "@/utils/country/country";

interface UF {
  id: number;
  nome: string;
}

interface Municipio {
  id: number;
  nome: string;
  ufId: number;
}

const _BRAZIL_UF_SIGLA_TO_NAME: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

export const AddressSection = () => {
  const {
    control,
    setValue,
    resetField,
    formState: { errors },
  } = useFormContext<CreateClientSchemaType>();

  const [ufSearchQuery, setUfSearchQuery] = useState("");
  const deferredUfSearch = useDeferredValue(ufSearchQuery);
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const deferredCitySearch = useDeferredValue(citySearchQuery);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const deferredCountrySearch = useDeferredValue(countrySearchQuery);

  const isBrazil = useWatch({ control, name: "isBrazil" });

  const postalCode = useWatch({ control, name: "postalCode" });

  const cleanCep = postalCode.replace(/\D/g, "");

  const isCepValid = cleanCep.length === 8 && isBrazil;

  // Initial Data Fetch
  const { data: ufs = [] } = useQuery<UF[]>({
    queryKey: ["ufs"],
    queryFn: fetchUfs,
    staleTime: Infinity,
  });

  const selectedUF = useWatch({ control, name: "state" });

  const { data: municipios = [], isLoading: isLoadingCities } = useQuery<
    Municipio[]
  >({
    queryKey: ["cities", selectedUF],
    queryFn: async () => {
      if (!isBrazil) return [];
      if (!selectedUF) {
        return [];
      }

      const ufID = ufs.find((uf) => uf.nome === selectedUF)?.id;
      if (!ufID) return [];

      return fetchCities(ufID);
    },
    enabled: !!selectedUF,
    staleTime: Infinity,
  });

  const { data: cepData, isFetching: isFetchingCep } = useQuery<ViaCepResponse>(
    {
      queryKey: ["cep", cleanCep],
      queryFn: () => fetchCep(cleanCep),
      enabled: isCepValid,
      staleTime: 1000 * 60 * 60,
      retry: false,
    },
  );

  // Reset country when toggling back to Brazil
  useEffect(() => {
    if (isBrazil) {
      setValue("country", "Brasil"); // Or clear it: setValue("country", "")
    }
  }, [isBrazil, setValue]);

  useEffect(() => {
    if (cepData && !cepData.erro) {
      setValue("street", cepData.logradouro || "", {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("neighborhood", cepData.bairro || "", {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("state", cepData.uf, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("city", cepData.localidade || "", {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [cepData, setValue]);

  const filteredUfs = useMemo(() => {
    if (!deferredUfSearch) return ufs;
    return ufs.filter((u) =>
      u.nome.toUpperCase().includes(deferredUfSearch.toUpperCase()),
    );
  }, [ufs, deferredUfSearch]);

  const filteredCities = useMemo(() => {
    if (!deferredCitySearch) return municipios;
    return municipios.filter((m) =>
      m.nome.toUpperCase().includes(deferredCitySearch.toUpperCase()),
    );
  }, [municipios, deferredCitySearch]);

  const filteredCountries = useMemo(() => {
    if (!deferredCountrySearch) return Country;
    return Country.filter((c) =>
      c.name.toUpperCase().includes(deferredCountrySearch.toUpperCase()),
    );
  }, [deferredCountrySearch]);

  return (
    <div className="flex flex-col gap-6">
      <div className="mb-2">
        <SectionHeading
          description={
            isBrazil
              ? "Preencha endereço, cidade e estado do cliente."
              : "Fill in the customer address details."
          }
          title={isBrazil ? "Endereço" : "Client address"}
          actions={
            <Controller
              control={control}
              name="isBrazil"
              render={({ field }) => (
                <Checkbox
                  isSelected={field.value}
                  onChange={(e) => {
                    field.onChange(e);
                    resetField("postalCode");
                    resetField("street");
                    resetField("neighborhood");
                    resetField("city");
                    resetField("state");
                    resetField("complement");
                  }}
                >
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Content>
                    <Label>Endereço no Brasil</Label>
                  </Checkbox.Content>
                </Checkbox>
              )}
            />
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
        {!isBrazil && (
          <Controller
            control={control}
            name="country"
            render={({ field }) => (
              <Autocomplete
                className="w-full md:col-span-1"
                isInvalid={!!errors.country}
                value={field.value}
                onChange={(key: Key | null) => {
                  field.onChange(key ? String(key) : null);
                }}
                variant="secondary"
              >
                <Label>Country</Label>
                <Autocomplete.Trigger>
                  <Autocomplete.Value />
                  <Autocomplete.ClearButton />
                  <Autocomplete.Indicator />
                </Autocomplete.Trigger>
                <Autocomplete.Popover>
                  <Autocomplete.Filter
                    inputValue={countrySearchQuery}
                    onInputChange={setCountrySearchQuery}
                  >
                    <SearchField
                      autoFocus
                      name="searchCountry"
                      variant="secondary"
                    >
                      <SearchField.Group>
                        <SearchField.SearchIcon />
                        <SearchField.Input placeholder="Buscar pais..." />
                        <SearchField.ClearButton />
                      </SearchField.Group>
                    </SearchField>
                    <ListBox
                      items={filteredCountries}
                      renderEmptyState={() => (
                        <EmptyState>Nenhum país encontrado.</EmptyState>
                      )}
                    >
                      {(country) => (
                        <ListBox.Item
                          id={country.name}
                          key={country.id}
                          textValue={country.name}
                        >
                          <span className="font-medium">{country.name}</span>
                        </ListBox.Item>
                      )}
                    </ListBox>
                  </Autocomplete.Filter>
                </Autocomplete.Popover>
                {errors.country && (
                  <FieldError>{errors.country.message}</FieldError>
                )}
              </Autocomplete>
            )}
          />
        )}

        {/* Postal Code */}
        <Controller
          control={control}
          name="postalCode"
          render={({ field }) => (
            <TextField
              className={`${isBrazil ? "md:col-span-1" : "md:col-span-1"}`}
              isInvalid={!!errors.postalCode}
            >
              <Label>{isBrazil ? "CEP" : "Zip-Code"}</Label>
              <Input
                {...field}
                inputMode="numeric"
                placeholder={isBrazil ? "Informe o cep" : "Enter Zip-Code"}
                variant="secondary"
                disabled={isFetchingCep}
                onChange={(e) => {
                  const onlyNumbers = e.target.value.replace(/\D/g, "");
                  field.onChange(onlyNumbers);
                }}
              />
              {/* {errors.postalCode && <FieldError>{errors.postalCode.message}</FieldError>} */}
            </TextField>
          )}
        />

        {/* Street */}
        <Controller
          control={control}
          name="street"
          render={({ field }) => (
            <TextField className="md:col-span-4" isInvalid={!!errors.street}>
              <Label>{isBrazil ? "Logradouro" : "Street"}</Label>
              <Input {...field} variant="secondary" disabled={isFetchingCep} />
              {errors.street && (
                <FieldError>{errors.street.message}</FieldError>
              )}
            </TextField>
          )}
        />

        {/* Stret Number */}
        <Controller
          control={control}
          name="streetNumber"
          render={({ field }) => (
            <TextField
              className="md:col-span-1"
              isInvalid={!!errors.streetNumber}
            >
              <Label>{isBrazil ? "Número" : "Street Number"}</Label>
              <Input {...field} variant="secondary" />
              {errors.streetNumber && (
                <FieldError>{errors.streetNumber.message}</FieldError>
              )}
            </TextField>
          )}
        />

        {/* Neighborhood */}
        <Controller
          control={control}
          name="neighborhood"
          render={({ field }) => (
            <TextField
              className="w-full md:col-span-2"
              isInvalid={!!errors.neighborhood}
            >
              <Label>{isBrazil ? "Bairro" : "Neighborhood"}</Label>
              <Input {...field} variant="secondary" disabled={isFetchingCep} />
              {errors.neighborhood && (
                <FieldError>{errors.neighborhood.message}</FieldError>
              )}
            </TextField>
          )}
        />

        {/* State / UF */}
        <Controller
          control={control}
          name="state"
          render={({ field }) =>
            isBrazil ? (
              <Autocomplete
                className="w-full md:col-span-1"
                placeholder="Selecione uma UF"
                isInvalid={!!errors.state}
                value={field.value}
                onChange={(key: Key | null) => {
                  field.onChange(key ? String(key) : null);
                }}
                variant="secondary"
              >
                <Label>Estado (UF)</Label>
                <Autocomplete.Trigger>
                  <Autocomplete.Value />
                  <Autocomplete.Indicator />
                </Autocomplete.Trigger>
                <Autocomplete.Popover>
                  <Autocomplete.Filter
                    inputValue={ufSearchQuery}
                    onInputChange={setUfSearchQuery}
                  >
                    <SearchField autoFocus name="searchUf" variant="secondary">
                      <SearchField.Group>
                        <SearchField.SearchIcon />
                        <SearchField.Input placeholder="Buscar estado..." />
                        <SearchField.ClearButton />
                      </SearchField.Group>
                    </SearchField>
                    <ListBox
                      items={filteredUfs}
                      renderEmptyState={() => (
                        <EmptyState>Nenhum estado encontrado.</EmptyState>
                      )}
                    >
                      {(uf) => (
                        <ListBox.Item
                          id={uf.nome}
                          key={uf.nome}
                          textValue={uf.nome}
                        >
                          <span className="font-medium">{uf.nome}</span>
                        </ListBox.Item>
                      )}
                    </ListBox>
                  </Autocomplete.Filter>
                </Autocomplete.Popover>
                {errors.state && (
                  <FieldError>{errors.state.message}</FieldError>
                )}
              </Autocomplete>
            ) : (
              <TextField
                className="w-full md:col-span-1"
                isInvalid={!!errors.state}
              >
                <Label>State</Label>
                <Input {...field} variant="secondary" />
                {errors.state && (
                  <FieldError>{errors.state.message}</FieldError>
                )}
              </TextField>
            )
          }
        />

        {/* City / Municipio */}
        <Controller
          control={control}
          name="city"
          render={({ field }) =>
            isBrazil ? (
              <Autocomplete
                className="w-full md:col-span-2"
                placeholder={
                  isLoadingCities ? "Carregando..." : "Selecione uma cidade"
                }
                isInvalid={!!errors.city}
                value={field.value}
                onChange={(key: Key | null) => {
                  field.onChange(key ? String(key) : null);
                }}
                variant="secondary"
                isDisabled={!isLoadingCities}
              >
                <Label>Cidade</Label>
                <Autocomplete.Trigger>
                  <Autocomplete.Value />
                  <Autocomplete.ClearButton />
                  <Autocomplete.Indicator />
                </Autocomplete.Trigger>
                <Autocomplete.Popover>
                  <Autocomplete.Filter
                    inputValue={citySearchQuery}
                    onInputChange={setCitySearchQuery}
                  >
                    <SearchField
                      autoFocus
                      name="searchCity"
                      variant="secondary"
                    >
                      <SearchField.Group>
                        <SearchField.SearchIcon />
                        <SearchField.Input placeholder="Buscar cidade..." />
                        <SearchField.ClearButton />
                      </SearchField.Group>
                    </SearchField>
                    <ListBox
                      items={filteredCities}
                      renderEmptyState={() => (
                        <EmptyState>Nenhuma cidade encontrada.</EmptyState>
                      )}
                    >
                      {(city) => (
                        <ListBox.Item
                          id={city.nome}
                          key={city.nome}
                          textValue={city.nome}
                        >
                          <span className="font-medium">{city.nome}</span>
                        </ListBox.Item>
                      )}
                    </ListBox>
                  </Autocomplete.Filter>
                </Autocomplete.Popover>
                {errors.city && <FieldError>{errors.city.message}</FieldError>}
              </Autocomplete>
            ) : (
              <TextField
                className="w-full md:col-span-1"
                isInvalid={!!errors.city}
              >
                <Label>City</Label>
                <Input {...field} variant="secondary" />
                {errors.city && <FieldError>{errors.city.message}</FieldError>}
              </TextField>
            )
          }
        />

        {/* Complement */}
        <Controller
          control={control}
          name="complement"
          render={({ field }) => (
            <TextField
              className="w-full md:col-span-1"
              isInvalid={!!errors.complement}
            >
              <Label>{isBrazil ? "Complemento" : "Complement"}</Label>
              <Input {...field} variant="secondary" disabled={isFetchingCep} />
              {errors.complement && (
                <FieldError>{errors.complement.message}</FieldError>
              )}
            </TextField>
          )}
        />
      </div>
    </div>
  );
};

export default AddressSection;
