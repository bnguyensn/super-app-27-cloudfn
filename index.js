import got from 'got';

const TOKEN_ENDPOINT = `https://github.com/login/oauth/access_token`;

/**
 * https://cloud.google.com/functions/docs/writing/http
 *
 * An HTTP cloud function to exchange a code value for a GitHub access token.
 * This is the last step of the OAuth flow for web applications.
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
export async function getAccessToken(req, res) {
  try {
    // Set CORS
    res.set('Access-Control-Allow-Origin', '*');

    // Send back appropriate response for OPTIONS requests
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'GET');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.set('Access-Control-Max-Age', '3600');
      return res.status(204).send('');
    }

    const { code } = req.query;

    if (!code) {
      return res.status(400).send({
        message: `The code value was not provided`,
      });
    }

    const url = `${TOKEN_ENDPOINT}?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&code=${code}`;

    const { body } = await got(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      responseType: 'json',
    });

    if (body.error) {
      return res.status(400).json(body);
    }

    res.cookie('accessToken', body.access_token);

    res.json(body);
  } catch (error) {
    console.log(error);

    res.status(500).send({
      message: error.message,
    });
  }
}
