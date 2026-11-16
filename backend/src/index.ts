import { app } from './app';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🎓 Campus Lost & Found backend listening on http://localhost:${PORT}`);
  console.log(`📁 Static uploads available at http://localhost:${PORT}/uploads/`);
});

