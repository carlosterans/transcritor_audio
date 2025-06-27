
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const { OpenAI } = require('openai');

const app = express();
const upload = multer({ dest: 'uploads/' });

const openai = new OpenAI({
  apiKey: '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'
});

app.use(express.static('public'));

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

    if (isVerbose) {
      const texto = transcription.segments.map(seg => {
        const tempo = new Date(seg.start * 1000).toISOString().substring(11, 19);
        return `[${tempo}] ${seg.text}`;
      }).join('\n');
      res.send(texto);
    } else {
      res.send(transcription);
    }
  } catch (error) {
    console.error('Erro no backend (upload):', error);
    res.status(500).send('Erro ao transcrever o áudio.');
  }
});

app.get('/transcrever-link', async (req, res) => {
  const audioUrl = req.query.url;
  const isVerbose = req.query.format === 'verbose';

  try {
    const response = await axios.get(audioUrl, { responseType: 'stream' });

    const transcription = await openai.audio.transcriptions.create({
      file: response.data,
      model: 'whisper-1',
      response_format: isVerbose ? 'verbose_json' : 'text',
      language: 'pt'
    });

    if (isVerbose) {
      const texto = transcription.segments.map(seg => {
        const tempo = new Date(seg.start * 1000).toISOString().substring(11, 19);
        return `[${tempo}] ${seg.text}`;
      }).join('\n');
      res.send(texto);
    } else {
      res.send(transcription);
    }
  } catch (error) {
    console.error('Erro no backend (link):', error);
    res.status(500).send('Erro ao transcrever o link de áudio.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
