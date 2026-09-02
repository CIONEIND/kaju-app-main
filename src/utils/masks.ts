export const maskCpfCnpj = (value: string, tipoPessoa: string) => {
  if (tipoPessoa === "2") {
    // CPF remains numeric
    const cpf = value.replace(/\D/g, "").slice(0, 11);

    return cpf
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  // CNPJ alfanumérico
  const cnpj = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 14);

  if (cnpj.length <= 2) return cnpj;
  if (cnpj.length <= 5) return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`;
  if (cnpj.length <= 8) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`;
  if (cnpj.length <= 12) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`;

  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
};

export const unmaskCpfCnpj = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "");
 