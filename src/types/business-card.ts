export interface BusinessCard {
  id: string;
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  company: string;
  department: string;
  position: string;
  email: string;
  phone: string;
  mobile: string;
  postalCode: string;
  address: string;
  website: string;
  notes: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export type BusinessCardFormData = Omit<
  BusinessCard,
  "id" | "createdAt" | "updatedAt"
>;

export const emptyFormData: BusinessCardFormData = {
  lastName: "",
  firstName: "",
  lastNameKana: "",
  firstNameKana: "",
  company: "",
  department: "",
  position: "",
  email: "",
  phone: "",
  mobile: "",
  postalCode: "",
  address: "",
  website: "",
  notes: "",
  imageUrl: "",
};
