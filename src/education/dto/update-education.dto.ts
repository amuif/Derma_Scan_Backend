import { PartialType } from '@nestjs/mapped-types';
import { CreateEducationHubDto } from './create-education.dto';

export class UpdateEducationDto extends PartialType(CreateEducationHubDto) {}
