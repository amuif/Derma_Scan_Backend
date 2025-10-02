import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ClinicsService {
  constructor(private readonly databaseService: DatabaseService) {}
  async create(createClinicDto: CreateClinicDto) {
    try {
      const { name, website, phone, email, address, status, specialties } =
        createClinicDto;
      const clinic = await this.databaseService.clinic.create({
        data: {
          name,
          phone,
          email,
          address,
          specialties,
          website,
          status,
        },
        select: {
          name: true,
          email: true,
          phone: true,
          address: true,
          specialties: true,
          website: true,
          status: true,
        },
      });
      console.log('Clinic created succeffully');
      return clinic;
    } catch (error) {
      console.log('Error creating new clinic ', error);
      throw new BadRequestException();
    }
  }

  async findAll() {
    try {
      const clinics = await this.databaseService.clinic.findMany({
        where: { status: 'APPROVED' },
      });

      return clinics;
    } catch (error) {
      console.log('Error getting clinics', error);
      return new BadRequestException();
    }
  }

  async findAllForAdmin() {
    try {
      const clinics = await this.databaseService.clinic.findMany({});
      return clinics;
    } catch (error) {
      console.log('Error getting clinics', error);
      return new BadRequestException();
    }
  }

  async update(id: string, updateClinicDto: UpdateClinicDto) {
    try {
      const clinic = await this.databaseService.clinic.findUnique({
        where: { id },
      });
      if (!clinic) throw new NotFoundException();
      const updatedClinic = await this.databaseService.clinic.update({
        where: { id },
        data: updateClinicDto,
        select: {
          name: true,
          email: true,
          phone: true,
          address: true,
          specialties: true,
          website: true,
          status: true,
        },
      });
      return updatedClinic;
    } catch (error) {
      console.log('Error getting clinics', error);
      return new BadRequestException();
    }
  }

  async remove(id: string) {
    console.log("Deleting clinic")
    try {
      const clinic = await this.databaseService.clinic.findUnique({
        where: { id },
      });
      if (!clinic) throw new NotFoundException();
      await this.databaseService.clinic.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.log('Error getting clinics', error);
      return new BadRequestException();
    }
  }
}
