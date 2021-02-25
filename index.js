import got from 'got';

const TOKEN_ENDPOINT = `https://github.com/login/oauth/access_token`;

function getAccessControlAllowedOrigin(reqOrigin) {
  // We expect ALLOWED_ORIGINS to be a semicolon-separated string of origins
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(';')
    : [];

  if (allowedOrigins.includes(reqOrigin)) {
    return reqOrigin;
  }

  return '';
}

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
    // ----- Handle CORS ----- //

    const allowedOrigin = getAccessControlAllowedOrigin(req.get('Origin'));
    if (allowedOrigin) {
      res.set('Access-Control-Allow-Origin', allowedOrigin);
    }

    // Send back appropriate response for OPTIONS requests
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'GET');
      res.set('Access-Control-Allow-Headers', 'Content-Type');

      return res.status(204).send('');
    }

    // The request's credentials mode will be 'include' so this header is needed
    res.set('Access-Control-Allow-Credentials', 'true');

    // ----- Main execution ----- //

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

    res.cookie('accessToken', body.access_token, {
      httpOnly: true,
      maxAge: 86400000, // 1 day,
      secure: true,
      sameSite: 'None',
    });

    res.json(body);
  } catch (error) {
    console.log(error);

    res.status(500).send({
      message: error.message,
    });
  }
}
