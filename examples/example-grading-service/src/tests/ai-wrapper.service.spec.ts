import { ServiceBroker } from 'moleculer';
import { ZodValidator } from 'moleculer-zod-validator';
import supertest from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import AIWrapperService from '../services/ai-wrapper.service';

describe('ai-wrapper Moleculer service', () => {
  let broker: ServiceBroker;
  let request: ReturnType<typeof supertest>;

  beforeAll(async () => {    
    broker = new ServiceBroker({
      nodeID: 'test-node',
      logger: false,
      validator: new ZodValidator(),
    });
    broker.createService(AIWrapperService);
    await broker.start();
    request = supertest(`http://localhost:${process.env.API_PORT}`);
  });

  afterAll(async () => {
    await broker.stop();
  });

  it('should return a result for a valid chat request', async () => {
    const res = await request
      .post('/api/chat')
      .send({
        modelName: 'gemini-2.0-flash',
        systemPrompt: 'You are a helpful AI assistant.',
        prompt: 'Say hello!',
        structuredOutput: false,
      })
      .set('Accept', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('result');
  });
});
