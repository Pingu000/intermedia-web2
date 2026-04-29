import { Client } from '../models/index.js';
import { AppError } from '../utils/AppError.js';

export const createClient = async (req, res, next) => {
  try {
    if (!req.user.company) {
      throw AppError.badRequest('Debes pertenecer a una empresa para crear clientes');
    }

    const { name, cif, email, phone, address } = req.body;

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
