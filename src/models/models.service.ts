import { CreateModelDto } from './dto/create-model.dto';
import { Injectable, Logger } from '@nestjs/common';
import { InferenceClient } from '@huggingface/inference';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { readFileSync } from 'fs';

@Injectable()
export class ModelsService {
  private readonly logger = new Logger(ModelsService.name);
  private hf: InferenceClient;

  constructor(private readonly httpService: HttpService) {
    // Initialize Hugging Face inference with API key
    this.hf = new InferenceClient(process.env.HUGGINGFACE_API_KEY);
  }

  create(additionalInformation: CreateModelDto, file: Express.Multer.File) {
    console.log('additionalInformation', additionalInformation);
    console.log('file', file);

    // If you want to automatically classify the uploaded image
    if (file) {
      return this.classifySkinLesion(file.buffer, additionalInformation);
    }

    return { message: 'File received without classification' };
  }

  findAll() {
    return `This action returns all models`;
  }

  findOne(id: number) {
    return `This action returns a #${id} model`;
  }

  // update(id: number, updateModelDto: UpdateModelDto) {
  //   return `This action updates a #${id} model`;
  // }

  remove(id: number) {
    return `This action removes a #${id} model`;
  }

  // New method for skin lesion classification

  async classifySkinLesion(
    imagePath: Buffer<any>,
    metadata?: any,
  ): Promise<any> {
    try {
      this.logger.log('Starting skin lesion classification...');

      const model = 'loonister/Skin-Lesion-Detection-CNN';

      // Read file as Buffer
      const buffer = readFileSync(imagePath);

      // Convert Node.js Buffer -> ArrayBuffer
      const arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      );

      const result = await this.hf.imageClassification({
        data: arrayBuffer,
        model,
      });

      this.logger.log('Classification completed successfully');

      return {
        success: true,
        predictions: result,
        metadata: metadata || {},
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error('Error classifying skin lesion:', error);
      throw new Error(`Failed to classify skin lesion: ${error.message}`);
    }
  }
  async classifyFromUrl(imageUrl: string, metadata?: any): Promise<any> {
    try {
      this.logger.log(`Downloading image from URL: ${imageUrl}`);

      // Download image from URL
      const response = await firstValueFrom(
        this.httpService.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 30000, // 30 second timeout
        }),
      );

      const imageBuffer = Buffer.from(response.data);
      return await this.classifySkinLesion(imageBuffer, metadata);
    } catch (error) {
      this.logger.error('Error downloading image from URL:', error);
      throw new Error(`Failed to process image from URL: ${error.message}`);
    }
  }

  // Additional helper method to get model info
  // async getModelInfo() {
  //   try {
  //     const model = 'loonister/Skin-Lesion-Detection-CNN';
  //     const modelInfo = await this.hf.modelInfo({ model });
  //
  //     return {
  //       model: modelInfo.modelId,
  //       task: modelInfo.pipeline_tag,
  //       framework: modelInfo.transformersInfo?.framework,
  //       tags: modelInfo.tags,
  //     };
  //   } catch (error) {
  //     this.logger.error('Error fetching model info:', error);
  //     throw new Error('Failed to fetch model information');
  //   }
  // }
  //
  // Method to process multiple images
  async batchClassify(images: Array<{ buffer: Buffer; metadata?: any }>) {
    try {
      const results = await Promise.all(
        images.map(async (image, index) => {
          try {
            const prediction = await this.classifySkinLesion(image.buffer, {
              ...image.metadata,
              batchIndex: index,
            });
            return { success: true, ...prediction };
          } catch (error) {
            return {
              success: false,
              error: error.message,
              metadata: image.metadata,
              batchIndex: index,
            };
          }
        }),
      );

      return {
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results: results,
      };
    } catch (error) {
      this.logger.error('Error in batch classification:', error);
      throw new Error(`Batch classification failed: ${error.message}`);
    }
  }
}
