const cleanData = (obj) => {
  if (!obj || typeof obj !== 'object') return;

  for (const key in obj) {
    if (key.startsWith('$')) {
      delete obj[key];
    } else {
      cleanData(obj[key]);
    }
  }
};

export const manualMongoSanitize = (req, res, next) => {
  if (req.body) cleanData(req.body);
  if (req.query) cleanData(req.query);
  if (req.params) cleanData(req.params);

  next();
};
