import { DeliveryNote, Project, Client } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { uploadBufferToCloudinary } from '../services/storage.service.js';

export const createDeliveryNote = async (req, res, next) => {
  try {
    if (!req.user.company) {
      throw AppError.badRequest('Debes pertenecer a una empresa para crear albaranes');
    }

    const { client, project, format, material, hours, description, workdate } = req.body;

    // Verificar que el proyecto pertenece a la empresa
    const existingProject = await Project.findOne({ _id: project, company: req.user.company, deleted: false });
    if (!existingProject) {
      throw AppError.notFound('El proyecto no existe o no pertenece a tu empresa');
    }

    // Verificar que el cliente pertenece a la empresa
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

    // Permitimos filtrar por proyecto, cliente o estado desde la URL
    if (req.query.project) filter.project = req.query.project;
    if (req.query.client) filter.client = req.query.client;
    if (req.query.status) filter.status = req.query.status;

    const deliveryNotes = await DeliveryNote.find(filter)
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
      .populate('user', 'name lastName email'); // El usuario que ha creado el albarán

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
      throw AppError.badRequest('Este albarán ya ha sido firmado');
    }

    // Subimos la firma a Cloudinary (usando Upload Stream)
    const signatureUrl = await uploadBufferToCloudinary(req.file.buffer, 'signatures');

    // Actualizamos el documento en base de datos
    deliveryNote.signature = signatureUrl;
    deliveryNote.status = 'signed';
    await deliveryNote.save();

    res.json(deliveryNote);
  } catch (error) {
    next(error);
  }
};
