import { unmaskCpfCnpj } from './masks';


export const isValidAlphanumericCnpj = (value: string) => {
  const cnpj = unmaskCpfCnpj(value);

  if (!/^[A-Z0-9]{12}\d{2}$/.test(cnpj)) return false;

  const charValue = (char: string) => char.charCodeAt(0) - 48;

  const calculateDigit = (base: string) => {
    const weights =
      base.length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    const sum = base
      .split("")
      .reduce((acc, char, index) => acc + charValue(char) * weights[index], 0);

    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const digit1 = calculateDigit(cnpj.slice(0, 12));
  const digit2 = calculateDigit(cnpj.slice(0, 12) + digit1);

  return cnpj.slice(12) === `${digit1}${digit2}`;
};

export const isValidCpf = (value: string) => {
  const cpf = value.replace(/\D/g, "");

  if (cpf.length !== 11) return false;

  // Reject repeated digits
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calculateDigit = (base: string) => {
    let sum = 0;

    for (let i = 0; i < base.length; i++) {
      sum += Number(base[i]) * (base.length + 1 - i);
    }

    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const digit1 = calculateDigit(cpf.slice(0, 9));
  const digit2 = calculateDigit(cpf.slice(0, 10));

  return cpf === cpf.slice(0, 9) + digit1 + digit2;
};