export interface School {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  principalName: string;
  studentCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSchoolInput {
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  principalName: string;
}
