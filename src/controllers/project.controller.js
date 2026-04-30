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

export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findOne({
      _id: id,
      company: req.user.company,
      deleted: false,
    }).populate('client', 'name cif email');

    if (!project) {
      throw AppError.notFound('Proyecto no encontrado');
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Si se envía el cliente, validar que exista en la empresa
    if (req.body.client) {
      const existingClient = await Client.findOne({ _id: req.body.client, company: req.user.company, deleted: false });
      if (!existingClient) {
        throw AppError.notFound('El nuevo cliente no existe o no pertenece a tu empresa');
      }
    }

    const project = await Project.findOneAndUpdate(
      { _id: id, company: req.user.company, deleted: false },
      req.body,
      { new: true, runValidators: true }
    ).populate('client', 'name cif');

    if (!project) {
      throw AppError.notFound('Proyecto no encontrado o eliminado');
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Soft delete
    const project = await Project.findOneAndUpdate(
      { _id: id, company: req.user.company, deleted: false },
      { deleted: true },
      { new: true }
    );

    if (!project) {
      throw AppError.notFound('Proyecto no encontrado o ya estaba eliminado');
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const archiveProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Cambiamos el estado a completed (archivado)
    const project = await Project.findOneAndUpdate(
      { _id: id, company: req.user.company, deleted: false },
      { status: 'completed' },
      { new: true }
    );

    if (!project) {
      throw AppError.notFound('Proyecto no encontrado');
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
};
