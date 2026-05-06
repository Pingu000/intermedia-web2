import { Client } from '../models/index.js';
import { AppError } from '../utils/AppError.js';

export const createClient = async (req, res, next) => {
  try {
    if (!req.user.company) {
      throw AppError.badRequest('Debes pertenecer a una empresa para crear clientes');
    }

    const { name, cif, email, phone, address } = req.body;

    const existingCif = await Client.findOne({ cif, company: req.user.company });
    if (existingCif) {
      throw AppError.conflict('Ya existe un cliente con ese CIF en tu empresa');
    }

    const client = await Client.create({
      user: req.user._id,
      company: req.user.company,
      name,
      cif,
      email,
      phone,
      address,
    });

    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
};

export const getClients = async (req, res, next) => {
  try {
    if (!req.user.company) {
      throw AppError.badRequest('Debes pertenecer a una empresa para listar clientes');
    }

    const clients = await Client.find({
      company: req.user.company,
      deleted: false,
    });

    res.json(clients);
  } catch (error) {
    next(error);
  }
};

export const getClientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = await Client.findOne({
      _id: id,
      company: req.user.company,
    });

    if (!client) {
      throw AppError.notFound('Cliente no encontrado');
    }

    res.json(client);
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;

    const client = await Client.findOneAndUpdate(
      { _id: id, company: req.user.company, deleted: false },
      req.body,
      { new: true, runValidators: true }
    );

    if (!client) {
      throw AppError.notFound('Cliente no encontrado o eliminado');
    }

    res.json(client);
  } catch (error) {
    next(error);
  }
};

export const deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { soft } = req.query;

    if (soft === 'true') {
      const client = await Client.findOneAndUpdate(
        { _id: id, company: req.user.company, deleted: false },
        { deleted: true },
        { new: true }
      );
      if (!client) throw AppError.notFound('Cliente no encontrado o ya eliminado');
      return res.json(client);
    }

    const client = await Client.findOneAndDelete({ _id: id, company: req.user.company });
    if (!client) throw AppError.notFound('Cliente no encontrado');
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const restoreClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = await Client.findOneAndUpdate(
      { _id: id, company: req.user.company, deleted: true },
      { deleted: false },
      { new: true }
    );

    if (!client) throw AppError.notFound('Cliente no encontrado o no estaba eliminado');

    res.json(client);
  } catch (error) {
    next(error);
  }
};

export const getArchivedClients = async (req, res, next) => {
  try {
    if (!req.user.company) {
      throw AppError.badRequest('Debes pertenecer a una empresa para listar clientes archivados');
    }

    const clients = await Client.find({
      company: req.user.company,
      deleted: true,
    });

    res.json(clients);
  } catch (error) {
    next(error);
  }
};
