import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ModelsService } from './models.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('models')
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Post('/image')
  @UseInterceptors(FileInterceptor('file'))
  analyze(
    @Body('additionalInformation') additionalInformation: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.modelsService.create(additionalInformation, file);
  }
  @Post('/text')
  @Get()
  findAll() {
    return this.modelsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modelsService.findOne(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateModelDto: UpdateModelDto) {
  //   return this.modelsService.update(+id, updateModelDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.modelsService.remove(+id);
  }
}
