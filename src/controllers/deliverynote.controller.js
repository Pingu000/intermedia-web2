import { DeliveryNote, Project, Client } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { uploadBufferToCloudinary } from '../services/storage.service.js';
import { generateBasePDF } from '../services/pdf.service.js';

export const createDeliveryNote = async (req, res, next) => {
  try {
    if (!req.user.company) {
      throw AppError.badRequest('Debes pertenecer a una empresa para crear albaranes');
    }

    const { client, project, format, material, hours, description, workdate } = req.body;

    const existingProject = await Project.findOne({ _id: project, company: req.user.company, deleted: false });
    if (!existingProject) {
      throw AppError.notFound('El proyecto no existe o no pertenece a tu empresa');
    }

    const existingClient = await Client.findOne({ _id: client, company: req.user.company, deleted: false });
    if (!existingClient) {
      throw AppError.notFound('El cliente no existe o no pertenece a tu empresa');
    }

    const newDeliveryNote = await DeliveryNote.create({
      user: req.user._id,
      company: req.user.company,
      client,
      project,
      format,
      material,
      hours,
      description,
      workdate,
    });

    res.status(201).json(newDeliveryNote);
  } catch (error) {
    next(error);
  }
};

export const getDeliveryNotes = async (req, res, next) => {
  try {
    if (!req.user.company) {
      throw AppError.badRequest('Debes pertenecer a una empresa para listar albaranes');
    }

    const filter = {
      company: req.user.company,
      deleted: false,
    };

    if (req.query.project) filter.project = req.query.project;
    if (req.query.client) filter.client = req.query.client;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.format) filter.format = req.query.format;
    if (req.query.signed !== undefined) {
      filter.status = req.query.signed === 'true' ? 'signed' : 'pending';
    }
    if (req.query.from || req.query.to) {
      filter.workdate = {};
      if (req.query.from) filter.workdate.$gte = new Date(req.query.from);
      if (req.query.to)   filter.workdate.$lte = new Date(req.query.to);
    }

    const sort = req.query.sort || '-workdate';

    const deliveryNotes = await DeliveryNote.find(filter)
      .sort(sort)
      .populate('client', 'name cif email')
      .populate('project', 'name projectCode status');

    res.json(deliveryNotes);
  } catch (error) {
    next(error);
  }
};

export const getDeliveryNoteById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deliveryNote = await DeliveryNote.findOne({
      _id: id,
      company: req.user.company,
      deleted: false,
    })
      .populate('client', 'name cif email address')
      .populate('project', 'name projectCode')
      .populate('user', 'name lastName email');

    if (!deliveryNote) {
      throw AppError.notFound('Albarán no encontrado');
    }

    res.json(deliveryNote);
  } catch (error) {
    next(error);
  }
};

export const signDeliveryNote = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      throw AppError.badRequest('Debes adjuntar una imagen con la firma');
    }

    const deliveryNote = await DeliveryNote.findOne({
      _id: id,
      company: req.user.company,
      deleted: false,
    });

    if (!deliveryNote) {
      throw AppError.notFound('Albarán no encontrado');
    }

    if (deliveryNote.status === 'signed') {
      throw AppError.conflict('Este albarán ya ha sido firmado');
    }

    const signatureUrl = await uploadBufferToCloudinary(req.file.buffer, 'signatures');

    deliveryNote.signature = signatureUrl;
    deliveryNote.status = 'signed';
    await deliveryNote.save();

    res.json(deliveryNote);
  } catch (error) {
    next(error);
  }
};

export const downloadPdf = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deliveryNote = await DeliveryNote.findOne({
      _id: id,
      company: req.user.company,
      deleted: false,
    })
      .populate('client', 'name cif email')
      .populate('project', 'name projectCode')
      .populate('user', 'name lastName email');

    if (!deliveryNote) {
      throw AppError.notFound('Albarán no encontrado');
    }

    const title = `Albarán de Proyecto: ${deliveryNote.project.name}`;
    let textContent = `Datos del Cliente:\n`;
    textContent += `- Nombre: ${deliveryNote.client.name}\n`;
    textContent += `- CIF: ${deliveryNote.client.cif}\n\n`;
    textContent += `Emitido por (Trabajador): ${deliveryNote.user.name} ${deliveryNote.user.lastName}\n`;
    textContent += `Fecha de Trabajo: ${new Date(deliveryNote.workdate).toLocaleDateString()}\n\n`;
    textContent += `Descripción del trabajo realizado:\n${deliveryNote.description}\n\n`;

    if (deliveryNote.format === 'hours') {
      textContent += `Formato: Por Horas\nHoras invertidas: ${deliveryNote.hours}\n`;
    } else {
      textContent += `Formato: Entrega de Material\nMaterial entregado: ${deliveryNote.material}\n`;
    }

    if (deliveryNote.status !== 'signed') {
      textContent += `\n[ ESTADO: PENDIENTE DE FIRMA ]\n`;
    }

    const pdfBuffer = await generateBasePDF(title, textContent, deliveryNote.signature);

    const pdfUrl = await uploadBufferToCloudinary(pdfBuffer, 'pdfs', { resourceType: 'auto' });
    deliveryNote.pdfUrl = pdfUrl;
    await deliveryNote.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="albaran_${deliveryNote.project.projectCode}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export const updateDeliveryNote = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deliveryNote = await DeliveryNote.findOne({
      _id: id,
      company: req.user.company,
      deleted: false,
    });

    if (!deliveryNote) {
      throw AppError.notFound('Albarán no encontrado');
    }

    if (deliveryNote.status === 'signed') {
      throw AppError.conflict('No se puede editar un albarán ya firmado');
    }

    const { description, hours, material, workdate } = req.body;
    if (description !== undefined) deliveryNote.description = description;
    if (hours !== undefined) deliveryNote.hours = hours;
    if (material !== undefined) deliveryNote.material = material;
    if (workdate !== undefined) deliveryNote.workdate = workdate;

    await deliveryNote.save();

    res.json(deliveryNote);
  } catch (error) {
    next(error);
  }
};

export const deleteDeliveryNote = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await DeliveryNote.findOne({ _id: id, company: req.user.company, deleted: false });
    if (!existing) {
      throw AppError.notFound('Albarán no encontrado o ya estaba eliminado');
    }

    if (existing.status === 'signed') {
      throw AppError.conflict('No se puede eliminar un albarán firmado. Es un documento legal.');
    }

    await DeliveryNote.findOneAndUpdate(
      { _id: id },
      { deleted: true },
      { new: true }
    );

    res.json({ message: 'Albarán eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};
