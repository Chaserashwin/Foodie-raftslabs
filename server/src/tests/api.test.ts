import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { env } from '../config/env.js';
import { MenuItem } from '../models/menuItem.model.js';

describe('Foodie Backend API Test Suite', () => {
  let sampleItem1: any;
  let sampleItem2: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDatabase();

    // Get sample menu items from seeded database
    const items = await MenuItem.find({ isAvailable: true }).limit(2);
    sampleItem1 = items[0];
    sampleItem2 = items[1];
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('1. Health Check Endpoint', () => {
    it('GET /api/health should return UP status with database state', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('UP');
      expect(res.body.database.readyState).toBe(1);
    });
  });

  describe('2. Menu Endpoints', () => {
    it('GET /api/menu should return all available menu items', async () => {
      const res = await request(app).get('/api/menu');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data[0]).toHaveProperty('name');
      expect(res.body.data[0]).toHaveProperty('price');
      expect(res.body.data[0]).toHaveProperty('category');
    });

    it('GET /api/menu?category=pizzas should filter only pizza items', async () => {
      const res = await request(app).get('/api/menu?category=pizzas');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((item: any) => item.category === 'pizzas')).toBe(true);
    });

    it('GET /api/menu?search=Burger should filter matching items by name/description', async () => {
      const res = await request(app).get('/api/menu?search=Burger');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      const matches = res.body.data.some((item: any) =>
        item.name.toLowerCase().includes('burger') || item.description.toLowerCase().includes('burger')
      );
      expect(matches).toBe(true);
    });

    it('GET /api/menu/:id should return single item for valid ID', async () => {
      const res = await request(app).get(`/api/menu/${sampleItem1._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(sampleItem1._id.toString());
      expect(res.body.data.name).toBe(sampleItem1.name);
    });

    it('GET /api/menu/:id should return 404 for nonexistent valid ID', async () => {
      const nonExistentId = '666666666666666666666666';
      const res = await request(app).get(`/api/menu/${nonExistentId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('not found');
    });

    it('GET /api/menu/:id should return 400 for malformed ID', async () => {
      const res = await request(app).get('/api/menu/invalid-id-123');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Order Creation & Server-side Pricing', () => {
    it('POST /api/orders should successfully create an order and calculate totals server-side', async () => {
      const orderPayload = {
        customer: {
          name: 'Jane Doe',
          phone: '9876543210',
          address: '42 MG Road, Indiranagar, Bengaluru',
        },
        items: [
          { productId: sampleItem1._id.toString(), quantity: 2 },
          { productId: sampleItem2._id.toString(), quantity: 1 },
        ],
      };

      const expectedSubtotal = sampleItem1.price * 2 + sampleItem2.price * 1;
      const expectedTotal = expectedSubtotal + env.DELIVERY_FEE;

      const res = await request(app).post('/api/orders').send(orderPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('orderNumber');
      expect(res.body.data.customer.name).toBe('Jane Doe');
      expect(res.body.data.status).toBe('ORDER_RECEIVED');
      expect(res.body.data.subtotal).toBe(expectedSubtotal);
      expect(res.body.data.deliveryFee).toBe(env.DELIVERY_FEE);
      expect(res.body.data.total).toBe(expectedTotal);
      expect(res.body.data.items.length).toBe(2);

      // Verify snapshots
      expect(res.body.data.items[0].name).toBe(sampleItem1.name);
      expect(res.body.data.items[0].price).toBe(sampleItem1.price);
      expect(res.body.data.items[0].quantity).toBe(2);
      expect(res.body.data.items[0].subtotal).toBe(sampleItem1.price * 2);

      // Verify timeline initialization
      expect(res.body.data.timeline.length).toBe(1);
      expect(res.body.data.timeline[0].status).toBe('ORDER_RECEIVED');
    });

    it('POST /api/orders should reject orders with missing customer fields', async () => {
      const invalidPayload = {
        customer: {
          name: '',
          phone: '',
          address: '',
        },
        items: [{ productId: sampleItem1._id.toString(), quantity: 1 }],
      };

      const res = await request(app).post('/api/orders').send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation Error');
      expect(Array.isArray(res.body.details)).toBe(true);
    });

    it('POST /api/orders should reject invalid phone formats', async () => {
      const invalidPayload = {
        customer: {
          name: 'John',
          phone: '12345', // invalid length & format
          address: '123 Tech Park',
        },
        items: [{ productId: sampleItem1._id.toString(), quantity: 1 }],
      };

      const res = await request(app).post('/api/orders').send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.details.some((d: any) => d.field === 'customer.phone')).toBe(true);
    });

    it('POST /api/orders should reject empty items list', async () => {
      const invalidPayload = {
        customer: {
          name: 'Valid Customer',
          phone: '9876543210',
          address: '123 Valid Street',
        },
        items: [],
      };

      const res = await request(app).post('/api/orders').send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/orders should reject invalid item quantity (<= 0 or > 50)', async () => {
      const invalidPayload = {
        customer: {
          name: 'Valid Customer',
          phone: '9876543210',
          address: '123 Valid Street',
        },
        items: [{ productId: sampleItem1._id.toString(), quantity: 0 }],
      };

      const res = await request(app).post('/api/orders').send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/orders should reject nonexistent product IDs', async () => {
      const nonExistentId = '555555555555555555555555';
      const invalidPayload = {
        customer: {
          name: 'Valid Customer',
          phone: '9876543210',
          address: '123 Valid Street',
        },
        items: [{ productId: nonExistentId, quantity: 1 }],
      };

      const res = await request(app).post('/api/orders').send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('do not exist');
    });
  });

  describe('4. Order Retrieval & Tracking', () => {
    let createdOrderId: string;
    let createdOrderNumber: string;

    beforeAll(async () => {
      const orderPayload = {
        customer: {
          name: 'Test Tracker',
          phone: '9876543210',
          address: '100 Sunset Boulevard',
        },
        items: [{ productId: sampleItem1._id.toString(), quantity: 1 }],
      };
      const res = await request(app).post('/api/orders').send(orderPayload);
      createdOrderId = res.body.data.id;
      createdOrderNumber = res.body.data.orderNumber;
    });

    it('GET /api/orders/:id should retrieve order by MongoDB ObjectId', async () => {
      const res = await request(app).get(`/api/orders/${createdOrderId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdOrderId);
      expect(res.body.data.customer.name).toBe('Test Tracker');
    });

    it('GET /api/orders/:id should retrieve order by friendly Order Number', async () => {
      const res = await request(app).get(`/api/orders/${createdOrderNumber}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdOrderId);
      expect(res.body.data.orderNumber).toBe(createdOrderNumber);
    });

    it('GET /api/orders/:id should return 404 for nonexistent order', async () => {
      const res = await request(app).get('/api/orders/FD-99999999-0000');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('5. Order Status Transitions & Administrative Authorization', () => {
    let orderToProgress: any;

    beforeAll(async () => {
      const orderPayload = {
        customer: {
          name: 'Transition Test',
          phone: '9876543210',
          address: '55 Brigade Road',
        },
        items: [{ productId: sampleItem1._id.toString(), quantity: 1 }],
      };
      const res = await request(app).post('/api/orders').send(orderPayload);
      orderToProgress = res.body.data;
    });

    it('GET /api/orders without admin key should be rejected with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/orders');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Unauthorized');
    });

    it('GET /api/orders with admin key should succeed', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('x-admin-key', env.ADMIN_API_KEY);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.total).toBeGreaterThan(0);
    });

    it('PATCH /api/orders/:id/status without admin key should return 401 Unauthorized', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderToProgress.id}/status`)
        .send({ status: 'PREPARING' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('PATCH /api/orders/:id/status should reject invalid transitions (ORDER_RECEIVED -> DELIVERED directly)', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderToProgress.id}/status`)
        .set('x-admin-key', env.ADMIN_API_KEY)
        .send({ status: 'DELIVERED' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid status transition');
    });

    it('PATCH /api/orders/:id/status should successfully progress to PREPARING', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderToProgress.id}/status`)
        .set('x-admin-key', env.ADMIN_API_KEY)
        .send({ status: 'PREPARING', note: 'Kitchen started preparation' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PREPARING');
      expect(res.body.data.timeline.length).toBe(2);
      expect(res.body.data.timeline[1].status).toBe('PREPARING');
    });

    it('PATCH /api/orders/:id/status should successfully progress from PREPARING to OUT_FOR_DELIVERY', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderToProgress.id}/status`)
        .set('x-admin-key', env.ADMIN_API_KEY)
        .send({ status: 'OUT_FOR_DELIVERY', note: 'Rider picked up the order' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('OUT_FOR_DELIVERY');
      expect(res.body.data.timeline.length).toBe(3);
    });

    it('PATCH /api/orders/:id/status should reject backward transition (OUT_FOR_DELIVERY -> PREPARING)', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderToProgress.id}/status`)
        .set('x-admin-key', env.ADMIN_API_KEY)
        .send({ status: 'PREPARING' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid status transition');
    });

    it('PATCH /api/orders/:id/status should successfully complete to DELIVERED', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderToProgress.id}/status`)
        .set('x-admin-key', env.ADMIN_API_KEY)
        .send({ status: 'DELIVERED', note: 'Order handed over to customer' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('DELIVERED');
      expect(res.body.data.timeline.length).toBe(4);
    });

    it('PATCH /api/orders/:id/status should reject any transition after DELIVERED', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderToProgress.id}/status`)
        .set('x-admin-key', env.ADMIN_API_KEY)
        .send({ status: 'OUT_FOR_DELIVERY' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/orders/:id/simulate should advance status automatically', async () => {
      // Create new order
      const newOrder = await request(app).post('/api/orders').send({
        customer: {
          name: 'Simulated Order',
          phone: '9876543210',
          address: '404 Simulation Way',
        },
        items: [{ productId: sampleItem1._id.toString(), quantity: 1 }],
      });

      const simId = newOrder.body.data.id;
      expect(newOrder.body.data.status).toBe('ORDER_RECEIVED');

      // Simulate step 1 -> PREPARING
      const step1 = await request(app).post(`/api/orders/${simId}/simulate`).set('x-admin-key', env.ADMIN_API_KEY);
      expect(step1.status).toBe(200);
      expect(step1.body.data.status).toBe('PREPARING');

      // Simulate step 2 -> OUT_FOR_DELIVERY
      const step2 = await request(app).post(`/api/orders/${simId}/simulate`).set('x-admin-key', env.ADMIN_API_KEY);
      expect(step2.status).toBe(200);
      expect(step2.body.data.status).toBe('OUT_FOR_DELIVERY');

      // Simulate step 3 -> DELIVERED
      const step3 = await request(app).post(`/api/orders/${simId}/simulate`).set('x-admin-key', env.ADMIN_API_KEY);
      expect(step3.status).toBe(200);
      expect(step3.body.data.status).toBe('DELIVERED');

      // Simulate after DELIVERED -> 400
      const step4 = await request(app).post(`/api/orders/${simId}/simulate`).set('x-admin-key', env.ADMIN_API_KEY);
      expect(step4.status).toBe(400);
    });
  });
  describe('Audit security and edge-case regressions', () => {
    const customer = { name: 'Audit Customer', phone: '9876543210', address: '42 Audit Road' };
    const payload = () => ({ customer, items: [{ productId: sampleItem1._id.toString(), quantity: 1 }] });
    it('treats regex characters as literal search input', async () => {
      for (const search of ['[', '.*', '(a+)+$']) {
        const res = await request(app).get('/api/menu').query({ search });
        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
      }
    });
    it('returns 400 without stack or request contents for malformed JSON', async () => {
      const res = await request(app).post('/api/orders').set('Content-Type', 'application/json').send('{invalid');
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ success: false, error: 'Malformed JSON body' });
    });
    it('protects simulation and rejects invalid admin credentials', async () => {
      const order = await request(app).post('/api/orders').send(payload());
      for (const suffix of ['/simulate', '/status']) {
        const res = suffix === '/simulate'
          ? await request(app).post(`/api/orders/${order.body.data.id}${suffix}`)
          : await request(app).patch(`/api/orders/${order.body.data.id}${suffix}`).set('x-admin-key', 'invalid').send({status: 'PREPARING'});
        expect(res.status).toBe(401);
      }
      const read = await request(app).get(`/api/orders/${order.body.data.id}`);
      expect(read.body.data.status).toBe('ORDER_RECEIVED');
    });
    it('ignores forged prices and totals', async () => {
      const res = await request(app).post('/api/orders').send({ ...payload(), total: 1, deliveryFee: 0, items: [{ ...payload().items[0], price: 0, subtotal: 0 }] });
      expect(res.status).toBe(201);
      expect(res.body.data.total).toBe(sampleItem1.price + env.DELIVERY_FEE);
    });
    it.each([-1, 0, 51, 1.5, '2', null])('rejects quantity %s', async quantity => {
      const res = await request(app).post('/api/orders').send({ customer, items: [{productId: sampleItem1._id.toString(), quantity}] });
      expect(res.status).toBe(400);
    });
    it('rejects duplicate lines, malformed IDs and missing bodies', async () => {
      const data = payload();
      for (const body of [{...data, items: [data.items[0], data.items[0]]}, {...data, items: [{productId: 'bad', quantity: 1}]}, {}]) {
        expect((await request(app).post('/api/orders').send(body)).status).toBe(400);
      }
    });
    it.each(['limit=-1','limit=0','limit=101','limit=abc','skip=-1','skip=1.5'])('rejects pagination %s', async query => {
      const res = await request(app).get(`/api/orders?${query}`).set('x-admin-key', env.ADMIN_API_KEY);
      expect(res.status).toBe(400);
    });
    it('rejects unavailable products', async () => {
      await MenuItem.updateOne({_id: sampleItem2._id}, {$set: {isAvailable: false}});
      try {
        const res = await request(app).post('/api/orders').send({customer, items: [{productId: sampleItem2._id.toString(), quantity: 1}]});
        expect(res.status).toBe(400);
      } finally { await MenuItem.updateOne({_id: sampleItem2._id}, {$set: {isAvailable: true}}); }
    });
    it('deduplicates concurrent retries and rejects changed payload reuse', async () => {
      const key = 'audit-idempotency-0001';
      const results = await Promise.all([1,2,3].map(() => request(app).post('/api/orders').set('Idempotency-Key',key).send(payload())));
      expect(results.map(r => r.status)).toEqual([201,201,201]);
      expect(new Set(results.map(r => r.body.data.id)).size).toBe(1);
      expect(results[0].body.data).not.toHaveProperty('idempotencyKey');
      const conflict = await request(app).post('/api/orders').set('Idempotency-Key',key).send({...payload(), customer: {...customer,name:'Different Customer'}});
      expect(conflict.status).toBe(409);
    });
    it('does not duplicate history on concurrent status updates', async () => {
      const order = await request(app).post('/api/orders').send(payload());
      const results = await Promise.all([1,2,3].map(() => request(app).patch(`/api/orders/${order.body.data.id}/status`).set('x-admin-key',env.ADMIN_API_KEY).send({status:'PREPARING'})));
      expect(results.map(r => r.status)).toEqual([200,200,200]);
      const read = await request(app).get(`/api/orders/${order.body.data.id}`);
      expect(read.body.data.timeline.map((t: any) => t.status)).toEqual(['ORDER_RECEIVED','PREPARING']);
    });
    it('exposes only public pricing configuration and restricts browser origins', async () => {
      const config = await request(app).get('/api/config');
      expect(config.body.data).toEqual({deliveryFee:env.DELIVERY_FEE});
      const res = await request(app).get('/api/menu').set('Origin','https://untrusted.invalid');
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
      expect(res.headers['access-control-allow-credentials']).toBeUndefined();
    });
    it('rejects unknown status values', async () => {
      const order = await request(app).post('/api/orders').send(payload());
      const res = await request(app).patch(`/api/orders/${order.body.data.id}/status`).set('x-admin-key',env.ADMIN_API_KEY).send({status:'CANCELLED'});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });
    it('preserves order snapshots after catalog changes and repairs only known broken images', async () => {
      const order = await request(app).post('/api/orders').send(payload());
      await MenuItem.updateOne({_id:sampleItem1._id},{$set:{price:999,name:'Changed catalog name',imageUrl:'https://example.com/custom.jpg'}});
      try {
        const read = await request(app).get(`/api/orders/${order.body.data.id}`);
        expect(read.body.data.items[0].price).toBe(sampleItem1.price);
        expect(read.body.data.items[0].name).toBe(sampleItem1.name);
        const { seedDatabaseIfEmpty } = await import('../config/db.js');
        const { LEGACY_IMAGE_REPLACEMENTS } = await import('../data/seedMenu.js');
        await MenuItem.updateOne({_id:sampleItem2._id},{$set:{imageUrl:LEGACY_IMAGE_REPLACEMENTS[0][0]}});
        const count = await MenuItem.countDocuments();
        await seedDatabaseIfEmpty();
        expect(await MenuItem.countDocuments()).toBe(count);
        expect((await MenuItem.findById(sampleItem1._id))?.imageUrl).toBe('https://example.com/custom.jpg');
        expect((await MenuItem.findById(sampleItem2._id))?.imageUrl).toBe(LEGACY_IMAGE_REPLACEMENTS[0][1]);
      } finally {
        await MenuItem.updateOne({_id:sampleItem1._id},{$set:{price:sampleItem1.price,name:sampleItem1.name,imageUrl:sampleItem1.imageUrl}});
        await MenuItem.updateOne({_id:sampleItem2._id},{$set:{imageUrl:sampleItem2.imageUrl}});
      }
    });
  });

});
