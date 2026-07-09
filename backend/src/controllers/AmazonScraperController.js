const amazonScraperService = require('../services/amazonScraperService');

exports.importFromAmazon = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || !url.includes('amazon.')) {
      return res.status(400).json({ error: 'URL da Amazon inválida.' });
    }

    const bookData = await amazonScraperService.scrapeBook(url);

    res.json(bookData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
