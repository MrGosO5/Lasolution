declare module "country-telephone-data" {
  export type CountryTelephoneEntry = {
    name: string;
    iso2: string;
    dialCode: string;
    priority?: number;
    format?: string;
    hasAreaCodes?: boolean;
  };

  export const allCountries: CountryTelephoneEntry[];
}
