import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import FormData from 'form-data';
import sharp from 'sharp'; // <-- add this

export interface SkinAnalysisResult {
  conditions: string[];
  confidence: number;
  risk: 'low' | 'medium' | 'high';
  symptomNote: string;
  timestamp: Date;
}

@Injectable()
export class DermService {
  constructor(private readonly httpService: HttpService) {}

  async analyzeSkin(
    imageBuffer: Buffer,
    symptoms?: string,
  ): Promise<SkinAnalysisResult> {
    console.log('fetched');
    try {
      // Compress image to be under 5MB
      let compressedBuffer = await sharp(imageBuffer)
        .jpeg({ quality: 80 }) // adjust quality as needed
        .toBuffer();

      // If still too large, reduce quality further
      while (compressedBuffer.length > 5 * 1024 * 1024) { // 5MB
        compressedBuffer = await sharp(compressedBuffer)
          .jpeg({ quality: 70 }) // keep lowering until under 5MB
          .toBuffer();
      }

      const form = new FormData();
      form.append('file', compressedBuffer, {
        filename: 'lesion.jpg',
        contentType: 'image/jpeg',
      });

      const response = await firstValueFrom(
        this.httpService.post<{
          predictions: { class: string; confidence: number }[];
        }>(
          `https://detect.roboflow.com/skin-cancer-recogniser/1?api_key=${process.env.ROBOFLOW_API_KEY}`,
          form as any,
          {
            headers: form.getHeaders(),
          },
        ),
      );

      const results = response.data?.predictions;
      console.log('Roboflow predictions:', results);

      if (!results || results.length === 0) {
        return {
          conditions: [],
          confidence: 0,
          risk: 'low',
          symptomNote: 'No clear prediction returned by model.',
          timestamp: new Date(),
        };
      }

      const topPrediction = results[0];

      // Risk logic
      let risk: 'low' | 'medium' | 'high' = 'low';
      if (
        topPrediction.confidence > 0.8 &&
        topPrediction.class.toLowerCase().includes('melanoma')
      ) {
        risk = 'high';
      } else if (topPrediction.confidence > 0.5) {
        risk = 'medium';
      }

      // Symptom mapping
      let symptomNote = '';
      if (symptoms) {
        const lower = symptoms.toLowerCase();
        if (lower.includes('pain')) {
          symptomNote =
            'Symptoms suggest possible severe condition; consult a doctor.';
        } else if (lower.includes('itching')) {
          symptomNote = 'Symptoms may indicate eczema or fungal infection.';
        }
      }

      return {
        conditions: results.map((r) => r.class),
        confidence: topPrediction.confidence,
        risk,
        symptomNote,
        timestamp: new Date(),
      };
    } catch (error: any) {
      console.error(
        'Roboflow API error:',
        error.response?.data || error.message,
      );
      throw new Error(
        'Analysis failed: ' +
          (error.response?.data?.message || error.message || 'Unknown error'),
      );
    }
  }
}

