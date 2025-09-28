import { EducationCategory, Status } from '@prisma/client';

export class CreateEducationHubDto {
  title: string;
  content: string;
  category: EducationCategory;
  language: string;
  authorId: string;
  status: Status;
}
