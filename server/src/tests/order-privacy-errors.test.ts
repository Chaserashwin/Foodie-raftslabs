import { afterEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../app.js';
import { OrderService } from '../services/order.service.js';

const privateValue = 'Private Customer 9123456789 at 42 Confidential Delivery Road';

afterEach(() => vi.restoreAllMocks());

describe('Private values in API failures', () => {
  it.each(['cast', 'validation', 'unhandled'])('does not expose private values in %s errors or console logs', async kind => {
    const error = kind === 'cast' ? new mongoose.Error.CastError('String', privateValue, 'customer.phone')
      : kind === 'validation' ? new mongoose.Error.ValidationError()
      : new Error(privateValue);
    if (error instanceof mongoose.Error.ValidationError) {
      error.addError('customer.address', new mongoose.Error.ValidatorError({ path: 'customer.address', value: privateValue, message: privateValue }));
    }
    vi.spyOn(OrderService, 'getOrderById').mockRejectedValueOnce(error);
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(app).get('/api/orders/123456789012345678901234');
    expect(res.status).toBe(kind === 'unhandled' ? 500 : 400);
    expect(res.body.success).toBe(false);
    expect(res.body).not.toHaveProperty('stack');
    expect(JSON.stringify(res.body)).not.toContain(privateValue);
    expect(JSON.stringify(log.mock.calls)).not.toContain(privateValue);
    if (kind === 'unhandled') expect(log).toHaveBeenCalledExactlyOnceWith('Unhandled server error');
  });
  it('does not echo invalid enum input in validation errors', async () => {
    const res = await request(app).get('/api/menu').query({ category: privateValue });
    expect(res.status).toBe(400);
    expect(res.body.details).toEqual([{ field: 'category', message: 'Invalid field value' }]);
    expect(JSON.stringify(res.body)).not.toContain(privateValue);
  });
});
