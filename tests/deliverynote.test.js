import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import express from 'express';

let mongoServer;
let app;
let companyAId, companyBId, userAId, userBId;
let clientAId, projectAId;
let tokenA, tokenB;

// Helper to create a minimal Express app that bypasses auth with a given user
function createTestApp(getUserFn) {
  const testApp = express();
  testApp.use(express.json());

  // Fake auth middleware that injects req.user
  testApp.use((req, res, next) => {
    req.user = getUserFn();
    next();
  });

  return testApp;
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Create companies
  const Company = (await import('../src/models/Company.js')).Company;
  const companyA = await Company.create({ name: 'Empresa A', cif: 'A11111111', owner: new mongoose.Types.ObjectId() });
  const companyB = await Company.create({ name: 'Empresa B', cif: 'B22222222', owner: new mongoose.Types.ObjectId() });
  companyAId = companyA._id;
  companyBId = companyB._id;

  // Create users
  const User = (await import('../src/models/User.js')).User;
  const bcrypt = (await import('bcryptjs')).default;
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('Test1234!', salt);

  const userA = await User.create({
    email: 'usera@test.com',
    password: hash,
    name: 'User',
    lastName: 'A',
    company: companyAId,
    role: 'admin',
    verificationCode: '123456'
  });
  const userB = await User.create({
    email: 'userb@test.com',
    password: hash,
    name: 'User',
    lastName: 'B',
    company: companyBId,
    role: 'admin',
    verificationCode: '654321'
  });
  userAId = userA._id;
  userBId = userB._id;

  // Create client & project for company A
  const Client = (await import('../src/models/Client.js')).Client;
  const Project = (await import('../src/models/Project.js')).Project;

  const clientA = await Client.create({
    user: userAId,
    company: companyAId,
    name: 'Cliente Test',
    cif: 'A12345678'
  });
  clientAId = clientA._id;

  const projectA = await Project.create({
    user: userAId,
    company: companyAId,
    client: clientAId,
    name: 'Proyecto Test',
    projectCode: 'PT-001'
  });
  projectAId = projectA._id;

  // Create test apps with different users
  const { validateSchema } = await import('../src/middleware/validate.js');
  const { updateDeliveryNoteSchema } = await import('../src/validators/deliverynote.validator.js');
  const {
    updateDeliveryNote,
    deleteDeliveryNote
  } = await import('../src/controllers/deliverynote.controller.js');
  const { errorHandler } = await import('../src/middleware/error-handler.js');

  // App for user A
  app = createTestApp(() => ({
    _id: userAId,
    company: companyAId,
    role: 'admin'
  }));
  app.patch('/api/deliverynote/:id', validateSchema(updateDeliveryNoteSchema), updateDeliveryNote);
  app.delete('/api/deliverynote/:id', deleteDeliveryNote);
  app.use(errorHandler);

  // Separate app for user B (for multi-tenant test)
  global.appB = createTestApp(() => ({
    _id: userBId,
    company: companyBId,
    role: 'admin'
  }));
  global.appB.patch('/api/deliverynote/:id', validateSchema(updateDeliveryNoteSchema), updateDeliveryNote);
  global.appB.use(errorHandler);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('DeliveryNote — updateDeliveryNote', () => {
  let pendingNoteId;
  let signedNoteId;

  beforeEach(async () => {
    const DeliveryNote = (await import('../src/models/DeliveryNote.js')).DeliveryNote;
    await DeliveryNote.deleteMany({});

    const pending = await DeliveryNote.create({
      user: userAId,
      company: companyAId,
      client: clientAId,
      project: projectAId,
      format: 'hours',
      hours: 8,
      description: 'Trabajo de prueba pendiente',
      workdate: new Date('2026-05-01'),
      status: 'pending'
    });
    pendingNoteId = pending._id.toString();

    const signed = await DeliveryNote.create({
      user: userAId,
      company: companyAId,
      client: clientAId,
      project: projectAId,
      format: 'material',
      material: 'Cemento',
      description: 'Trabajo de prueba firmado',
      workdate: new Date('2026-05-02'),
      status: 'signed',
      signature: 'https://cloudinary.com/fake-signature.png'
    });
    signedNoteId = signed._id.toString();
  });

  it('Test 1: Actualizar albarán no firmado devuelve 200', async () => {
    const res = await request(app)
      .patch(`/api/deliverynote/${pendingNoteId}`)
      .send({ description: 'Descripción actualizada correctamente', hours: 10 });

    expect(res.status).toBe(200);
    expect(res.body.description).toBe('Descripción actualizada correctamente');
    expect(res.body.hours).toBe(10);
  });

  it('Test 2: 409 al intentar actualizar un albarán firmado', async () => {
    const res = await request(app)
      .patch(`/api/deliverynote/${signedNoteId}`)
      .send({ description: 'Intento de edición ilegal' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });

  it('Test 3: 409 al intentar eliminar un albarán firmado', async () => {
    const res = await request(app)
      .delete(`/api/deliverynote/${signedNoteId}`);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });

  it('Test 4: Multi-tenant — usuario de compañía B no puede actualizar albarán de compañía A (404)', async () => {
    const res = await request(global.appB)
      .patch(`/api/deliverynote/${pendingNoteId}`)
      .send({ description: 'Intento de acceso cross-tenant' });

    expect(res.status).toBe(404);
  });
});
