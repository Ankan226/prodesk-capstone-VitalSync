module.exports = (req, res, next) => {
  const json = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 400 && body && typeof body === 'object' && !Array.isArray(body)) {
      return json({ success: false, status: res.statusCode, ...body });
    }
    return json(body);
  };
  next();
};