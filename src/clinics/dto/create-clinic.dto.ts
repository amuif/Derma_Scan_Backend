import { Status } from "@prisma/client";

export class CreateClinicDto {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  specialties: string[];
  status: Status;
}
