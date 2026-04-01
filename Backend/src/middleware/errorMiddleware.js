/**
 * Global Error Handling Middleware
 */
export const errorMiddleware = (err, req, res, next) => {
  console.error(`🔥 ERROR: ${err.message}`);
  
  const status = err.statusCode || 500;
  const message = err.message || 'Something went wrong';
  
  res.status(status).json({
    status,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
