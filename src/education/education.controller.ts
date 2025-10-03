import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { EducationService } from './education.service';
import { CreateEducationHubDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';

@Controller('education')
export class EducationController {
  constructor(private readonly educationService: EducationService) {}

  @Post('/create')
  create(@Body() createEducationDto: CreateEducationHubDto) {
    console.log(createEducationDto);
    return this.educationService.create(createEducationDto);
  }

  @Get()
  findAll() {
    return this.educationService.findAll();
  }
  @Get('/all')
  findAllForAdmin() {
    return this.educationService.findAllForAdmin();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.educationService.findOne(+id);
  }
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEducationDto: UpdateEducationDto,
  ) {
    console.log(updateEducationDto);
    return this.educationService.update(id, updateEducationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    console.log(id);

    return this.educationService.remove(id);
  }
}
