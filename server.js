const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.static('public'));

const openai = new OpenAI({
  apiKey: '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'
});

app.post('/transcrever', upload.single('audio'), async (req, res) => {
  const filePath = req.file.path;
  const isVerbose = req.query.format === 'verbose';

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1',
      response_format: isVerbose ? 'verbose_json' : 'text',
      language: 'pt'
    });

    fs.unlinkSync(filePath);

    if (isVerbose && transcription.segments) {
      const texto = transcription.segments.map(seg => {
        const tempo = new Date(seg.start * 1000).toISOString().substring(11, 19);
        return `[${tempo}] ${seg.text}`;
      }).join('\n');
      res.send(texto);
    } else {
      res.send(transcription.text || 'Transcrição não encontrada.');
    }
  } catch (error) {
    console.error('Erro na transcrição:', error);
    res.status(500).send('Erro ao transcrever o áudio.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
