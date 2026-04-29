import { Project, Client } from '../models/index.js';
import { AppError } from '../utils/AppError.js';

export const createProject = async (req, res, next) => {
  try {
    if (!req.user.company) {
      throw AppError.badRequest('Debes pertenecer a una empresa para crear proyectos');
    }

    const { client, name, projectCode, status } = req.body;

    // Verificar que el cliente existe y pertenece a la misma empresa
    const existingClient = await Client.findOne({ _id: client, company: req.user.company, deleted: false });
    if (!existingClient) {
      throw AppError.notFound('Cliente no encontrado o no pertenece a tu empresa');
    }

    const newProject = await Project.create({
      user: req.user._id,
      company: req.user.company,
      client,
      name,
      projectCode,
      status: status || 'pending',
    });

    res.status(201).json(newProject);
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    if (!req.user.company) {
      throw AppError.badRequest('Debes pertenecer a una empresa para listar proyectos');
    }

    // Preparar el filtro base
    const filter = {
      company: req.user.company,
      deleted: false,
    };

    // Aplicar filtros adicionales desde query params si existen
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.client) {
      filter.client = req.query.client;
    }

    // Se recomienda poblar el cliente para devolver datos completos
    const projects = await Project.find(filter).populate('client', 'name cif email');

    res.json(projects);
  } catch (error) {
    next(error);
  }
};
