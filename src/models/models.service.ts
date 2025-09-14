import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InferenceClient } from '@huggingface/inference';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ModelsService {
  private readonly logger = new Logger(ModelsService.name);
  private hf: InferenceClient;

  // Primary model for skin cancer (binary: cancerous/non-cancerous)
  private readonly PRIMARY_MODEL = 'dima806/skin_cancer_detection';
  // Fallback for zero-shot with HAM10000 labels
  private readonly ZERO_SHOT_MODEL = 'openai/clip-vit-large-patch14';

  constructor(private readonly httpService: HttpService) {
    if (!process.env.HF_API_TOKEN) {
      throw new Error('HF_API_TOKEN is not set in environment variables');
    }
    // FIX 1: InferenceClient constructor takes a string (token), not an object
    this.hf = new InferenceClient(process.env.HF_API_TOKEN);
    this.logger.log('InferenceClient initialized with token');
  }

  create(additionalInformation: string, file: Express.Multer.File) {
    return this.classifySkinLesion(file);
  }

  findAll() {
    return `This action returns all models`;
  }

  findOne(id: number) {
    return `This action returns a #${id} model`;
  }

  remove(id: number) {
    return `This action removes a #${id} model`;
  }

  async classifySkinLesion(file: Express.Multer.File): Promise<any> {
    try {
      this.logger.log('Starting skin lesion classification...');
      console.log('File MIME Type:', file.mimetype);
      console.log('File Size:', file.size);
      console.log('File Buffer Start:', file.buffer.toString('hex', 0, 4)); // JPEG: ffd8

      // Validate image
      if (!file.mimetype.match(/image\/(jpeg|png)/)) {
        throw new BadRequestException('Invalid image format. Use JPEG or PNG.');
      }

      let finalResult;

      // Try direct API call
      try {
        this.logger.log('Trying direct API call...');
        finalResult = await this.classifyWithDirectAPI(file);
      } catch (apiError) {
        this.logger.warn('Direct API failed:', apiError.message);

        // Fallback to InferenceClient with primary model
        this.logger.log(`Trying model: ${this.PRIMARY_MODEL}`);
        finalResult = await this.classifyWithModel(this.PRIMARY_MODEL, file);

        if (!finalResult.success) {
          throw new Error(
            `Model ${this.PRIMARY_MODEL} failed: ${finalResult.error}`,
          );
        }
      }

      // Enhance with risk classification
      finalResult = this.enhanceWithRiskClassification(finalResult);
      console.log(
        'Final classification result:',
        JSON.stringify(finalResult, null, 2),
      );

      return finalResult;
    } catch (error) {
      this.logger.error('Classification failed:', error);
      throw new Error(`Skin lesion classification failed: ${error.message}`);
    }
  }

  private async classifyWithDirectAPI(file: Express.Multer.File): Promise<any> {
    try {
      // FIX 2: Convert Buffer to Uint8Array for fetch body
      const buffer = new Uint8Array(file.buffer);

      const response = await fetch(
        `https://api-inference.huggingface.co/models/${this.PRIMARY_MODEL}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
            'Content-Type': file.mimetype,
          },
          method: 'POST',
          body: buffer, // Use Uint8Array instead of Buffer
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`API response: ${response.status} ${errorText}`);
        throw new Error(`API error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      this.logger.log('Direct API response:', JSON.stringify(result, null, 2));

      return {
        success: true,
        model: this.PRIMARY_MODEL,
        predictions: this.getTopPredictions(result),
        rawResult: result,
      };
    } catch (error) {
      this.logger.warn('Direct API call failed:', error.message);
      throw error;
    }
  }

  private async classifyWithModel(
    modelName: string,
    file: Express.Multer.File,
  ): Promise<any> {
    try {
      // FIX 3: Convert Buffer to ArrayBuffer for Blob
      const arrayBuffer = file.buffer.buffer.slice(
        file.buffer.byteOffset,
        file.buffer.byteOffset + file.buffer.byteLength,
      );

      const blob = new Blob([arrayBuffer], { type: file.mimetype });
      const result = await this.hf.imageClassification({
        data: blob,
        model: modelName,
      });

      return {
        success: true,
        model: modelName,
        predictions: this.getTopPredictions(result),
        rawResult: result,
      };
    } catch (error) {
      this.logger.warn(`Model ${modelName} failed: ${error.message}`);
      return {
        success: false,
        model: modelName,
        error: error.message,
      };
    }
  }

  private enhanceWithRiskClassification(result: any): any {
    const predictions = result.predictions || [];

    const riskMapping = {
      high: [
        'melanoma',
        'carcinoma',
        'malignant',
        'cancer',
        'squamous',
        'basal',
      ],
      medium: [
        'psoriasis',
        'eczema',
        'vitiligo',
        'infection',
        'fungal',
        'bacterial',
      ],
      low: ['acne', 'rash', 'benign', 'mole', 'nevus', 'wart', 'allergy'],
    };

    const enhancedPredictions = predictions.map((pred) => {
      const label = pred.label.toLowerCase();
      let riskLevel = 'low';

      if (riskMapping.high.some((term) => label.includes(term))) {
        riskLevel = 'high';
      } else if (riskMapping.medium.some((term) => label.includes(term))) {
        riskLevel = 'medium';
      }

      return {
        ...pred,
        riskLevel,
        recommendation: this.getRecommendation(riskLevel, pred.score),
        urgency: this.getUrgencyLevel(riskLevel, pred.score),
      };
    });

    return {
      ...result,
      predictions: enhancedPredictions,
      overallRisk: this.calculateOverallRisk(enhancedPredictions),
      disclaimer:
        'This is an AI-assisted analysis. Please consult a healthcare professional for medical diagnosis.',
    };
  }

  private getTopPredictions(predictions: any[], topN: number = 5) {
    if (!predictions || !Array.isArray(predictions)) {
      return [];
    }

    return predictions
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, topN)
      .map((pred) => ({
        label: pred.label || 'Unknown condition',
        score: pred.score || 0,
        confidence: `${((pred.score || 0) * 100).toFixed(2)}%`,
      }));
  }

  private getRecommendation(riskLevel: string, score: number): string {
    const recommendations = {
      high:
        score > 0.7
          ? 'Urgent medical consultation within 48 hours'
          : 'Medical consultation within 1 week',
      medium: 'Schedule appointment with dermatologist within 2 weeks',
      low: 'Monitor condition and consult if symptoms persist or worsen',
    };

    return (
      recommendations[riskLevel] || 'Consult healthcare professional for advice'
    );
  }

  private getUrgencyLevel(riskLevel: string, score: number): string {
    if (riskLevel === 'high' && score > 0.7) return 'Immediate';
    if (riskLevel === 'high') return 'High';
    if (riskLevel === 'medium' && score > 0.6) return 'Moderate';
    if (riskLevel === 'medium') return 'Low';
    return 'Routine';
  }

  private calculateOverallRisk(predictions: any[]): string {
    const highRisk = predictions.find(
      (p) => p.riskLevel === 'high' && p.score > 0.6,
    );
    const mediumRisk = predictions.find(
      (p) => p.riskLevel === 'medium' && p.score > 0.7,
    );

    return highRisk ? 'high' : mediumRisk ? 'medium' : 'low';
  }

  async classifyFromUrl(imageUrl: string): Promise<any> {
    try {
      this.logger.log(`Downloading image from URL: ${imageUrl}`);
      const response = await firstValueFrom(
        this.httpService.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 30000,
        }),
      );

      const buffer = Buffer.from(response.data);
      const mockFile: Express.Multer.File = {
        fieldname: 'url-image',
        originalname: 'image.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer,
        size: buffer.length,
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      return await this.classifySkinLesion(mockFile);
    } catch (error) {
      this.logger.error('Error processing image from URL:', error);
      throw new Error(`Failed to process image from URL: ${error.message}`);
    }
  }
}
