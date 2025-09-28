import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateEducationHubDto } from './dto/create-education.dto';
import { DatabaseService } from 'src/database/database.service';
import { UpdateEducationDto } from './dto/update-education.dto';

@Injectable()
export class EducationService {
  constructor(private readonly databaseService: DatabaseService) {}
  async create(createEducationDto: CreateEducationHubDto) {
    const { title, content, category, language, authorId, status } =
      createEducationDto;
    try {
      const education = await this.databaseService.educationHub.create({
        data: {
          title,
          content,
          category,
          language,
          authorId,
          status,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true,
            },
          },
        },
      });
      return { education };
    } catch (error) {
      console.log('Error creating education service, ', error);
      if (error.code === 'P2002') {
        throw new BadRequestException('Unique constraint violation');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Author not found');
      }

      throw new InternalServerErrorException('Failed to create education hub');
    }
  }
  async findAllForAdmin() {
    try {
      const posts = await this.databaseService.educationHub.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      return { posts };
    } catch (error) {
      console.log('Error at fetching education service, ', error);
      throw new NotFoundException();
    }
  }
  async findAll() {
    try {
      const posts = await this.databaseService.educationHub.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      return { posts };
    } catch (error) {
      console.log('Error at fetching education service, ', error);
      throw new NotFoundException();
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} education`;
  }

  async update(id: string, updateEducationDto: UpdateEducationDto) {
    try {
      const desiredPost = await this.databaseService.educationHub.findUnique({
        where: { id },
      });
      if (!desiredPost) throw new NotFoundException();
      const { title, content, category, status } = updateEducationDto;

      const post = await this.databaseService.educationHub.update({
        where: { id },
        data: { title, content, category, status },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true,
            },
          },
        },
      });
      return { post };
    } catch (error) {
      console.log('Error updating post', error);
      throw new BadRequestException();
    }
  }

  async remove(id: string) {
    try {
      const desiredPost = await this.databaseService.educationHub.findUnique({
        where: { id },
      });
      if (!desiredPost) throw new NotFoundException();
      const isDeleted = await this.databaseService.educationHub.delete({
        where: { id },
      });
      return { isDeleted };
    } catch (error) {
      console.log('Error deleting post', error);
      throw new BadRequestException();
    }
  }
}
