import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import FormData from 'form-data';
import sharp from 'sharp';
import { DatabaseService } from 'src/database/database.service';

export interface SkinAnalysisResult {
  conditions: string[];
  confidence: number;
  risk: 'low' | 'medium' | 'high';
  symptomNote: string;
  timestamp: Date;
}

@Injectable()
export class DermService {
  constructor(
    private readonly httpService: HttpService,
    private readonly databaseService: DatabaseService,
  ) {}

  async checkImage(file: Express.Multer.File) {
    try {
      const instruction = `
You are an AI that looks at a skin image and returns structured JSON with conditions, confidence(between 0 and 1), message, timestamp.
Return EXACTLY this JSON format and no extra text:
{
  "conditions": ["..."],
  "confidence": 0.0,
  "message": "...",
  "timestamp": "ISO string"
}
`;

      // Compose the data URI with base64
      const b64 = file.buffer.toString('base64');
      const mimeType = file.mimetype || 'image/jpeg'; // e.g. 'image/jpeg'
      const dataUrl = `data:${mimeType};base64,${b64}`;

      const body = {
        model: 'x-ai/grok-4-fast:free', // pick a vision-capable model
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: instruction },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                  detail: 'auto',
                },
              },
            ],
          },
        ],
        max_tokens: 800,
      };

      const response = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.OPEN_ROUTER_API_URL}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'YOUR_SITE_URL',
            'X-Title': 'Skin Analysis App',
          },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenRouter error: ${err}`);
      }

      const json = await response.json();
      const content = json.choices?.[0]?.message?.content ?? '{}';

      const cleaned = content.trim().replace(/```json\s*|\s*```/g, '');
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = {
          conditions: [],
          confidence: 0,
          message: 'Failed to parse AI output',
          timestamp: new Date().toISOString(),
        };
      }

      return parsed;
    } catch (error) {
      console.error('checkImage error:', error);
      return {
        conditions: [],
        confidence: 0,
        message: 'Error analyzing image',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async analyzeSkin(
    imageBuffer: Buffer,
    userId: string,
    filename: string,
    consent: string,
    symptoms?: string,
  ): Promise<SkinAnalysisResult> {
    console.log('fetched');
    try {
      // Compress image to be under 5MB
      let compressedBuffer = await sharp(imageBuffer)
        .jpeg({ quality: 80 }) // adjust quality as needed
        .toBuffer();

      // If still too large, reduce quality further
      while (compressedBuffer.length > 5 * 1024 * 1024) {
        // 5MB
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
          { headers: form.getHeaders() },
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

      let confidence = topPrediction.confidence;

      if (confidence > 1 && confidence <= 100) {
        // looks like a percentage
        confidence = confidence / 100;
      } else if (confidence > 100) {
        // unexpected large number, scale down
        confidence = confidence / confidence; // => 1
      } else {
        // already between 0 and 1
        confidence = Math.max(0, Math.min(1, confidence));
      }

      let risk: 'low' | 'medium' | 'high' = 'low';

      if (
        confidence > 0.8 &&
        topPrediction.class.toLowerCase().includes('melanoma')
      ) {
        risk = 'high';
      } else if (confidence > 0.5) {
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

      const uniqueResults = Array.from(
        new Map(results.map((r) => [r.class.toLowerCase().trim(), r])).values(),
      );
      if (consent === 'true') {
        console.log('creating');
        await this.databaseService.scan.create({
          data: {
            userId,
            imageUrl: `uploads/${filename}`,
            confidence: topPrediction.confidence,
            risk: risk.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH',
            notes: symptomNote,
            conditions: {
              create: uniqueResults.map((r) => ({
                condition: {
                  connectOrCreate: {
                    where: { name: r.class.trim() },
                    create: { name: r.class.trim() },
                  },
                },
                confidence: r.confidence,
              })),
            },
          },
          include: {
            conditions: {
              include: {
                condition: true,
              },
            },
          },
        });
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
  async fetch() {
    return this.databaseService.scan.findMany({
      orderBy: { timestamp: 'desc' },
      include: {
        user: true,
        conditions: {
          include: {
            condition: true,
          },
        },
        symptoms: {
          include: {
            symptom: true,
          },
        },
      },
    });
  }

  async analyzeSkinViaText(prompt: string, userId: string, consent: string) {
    const textInput = `Classify the following description into possible skin-related categories. 
confidence between 0 and 1.
Return ONLY valid JSON with no additional text, using this structure:
{
  "conditions": [],
  "risk_level": "",
  "confidence": 0,
  "guidance": ""
}

case: ${prompt}`;

    try {
      const response = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.OPEN_ROUTER_API_URL}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'YOUR_SITE_URL', // Required by OpenRouter
            'X-Title': 'Skin Analysis App', // Required by OpenRouter
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.3-70b-instruct:free',
            messages: [
              {
                role: 'user',
                content: textInput,
              },
            ],
            max_tokens: 1000,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter error: ${errorText}`);
      }

      const data = await response.json();
      const analysis =
        data?.choices?.[0]?.message?.content ?? 'No analysis available.';
      console.log('Raw analysis:', analysis);

      let jsonString = analysis.trim();
      jsonString = jsonString.replace(/```json\s*|\s*```/g, '');

      const parsedAnalysis = JSON.parse(jsonString);
      console.log('Parsed analysis:', parsedAnalysis);

      // Map risk level to match your Prisma enum
      let risk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      const riskLevel = parsedAnalysis.risk_level?.toLowerCase();
      if (riskLevel?.includes('high')) {
        risk = 'HIGH';
      } else if (riskLevel?.includes('medium')) {
        risk = 'MEDIUM';
      }

      console.log(userId);
      if (consent === 'true') {
        await this.databaseService.scan.create({
          data: {
            userId,
            imageUrl: 'text-analysis',
            confidence: parsedAnalysis.confidence || 0,
            risk: risk,
            notes:
              `${parsedAnalysis.guidance || ''} ${prompt ? `Symptoms: ${prompt}` : ''}`.trim(),
            conditions: {
              create:
                parsedAnalysis.conditions?.map((condition: string) => ({
                  condition: {
                    connectOrCreate: {
                      where: { name: condition.trim() },
                      create: { name: condition.trim() },
                    },
                  },
                  confidence: parsedAnalysis.confidence || 0,
                })) || [],
            },
            ...(prompt && {
              symptoms: {
                create: {
                  symptom: {
                    connectOrCreate: {
                      where: { name: prompt.trim() },
                      create: { name: prompt.trim() },
                    },
                  },
                  severity: 5,
                },
              },
            }),
          },
          include: {
            conditions: {
              include: {
                condition: true,
              },
            },
            symptoms: {
              include: {
                symptom: true,
              },
            },
          },
        });
      }
      return {
        analysis: parsedAnalysis,
      };
    } catch (error) {
      console.log('Error at uploading text:', error);
      return { error: 'Error uploading text input, please try again.' };
    }
  }
}
