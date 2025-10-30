const axios = require('axios');

/**
 * Netlify Serverless Function to proxy MangaDex images
 * This bypasses hotlink protection by fetching images server-side
 *
 * Handles:
 * - Cover images: https://uploads.mangadex.org/covers/...
 * - Chapter images: MangaDex@Home servers (various domains)
 *
 * Usage: /.netlify/functions/image-proxy?url=<encoded-image-url>
 */
exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get the image URL from query parameters
    const imageUrl = event.queryStringParameters?.url;

    if (!imageUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing url parameter' })
      };
    }

    // Validate that the URL is from MangaDex (cover images or MangaDex@Home servers)
    const isMangaDexCover = imageUrl.startsWith('https://uploads.mangadex.org/');
    const isMangaDexHome = imageUrl.includes('mangadex.org') || imageUrl.match(/https?:\/\/[^\/]+\/data(-saver)?\/[a-f0-9]+\//);

    if (!isMangaDexCover && !isMangaDexHome) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Invalid image URL. Only MangaDex URLs are allowed.' })
      };
    }

    console.log(`[Image Proxy] Fetching: ${imageUrl}`);

    // Fetch the image from MangaDex
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'MangaDexReader/1.0',
        'Referer': 'https://mangadex.org/'
      }
    });

    // Determine content type from response or default to jpeg
    const contentType = response.headers['content-type'] || 'image/jpeg';

    // Return the image with appropriate headers
    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'Access-Control-Allow-Origin': '*'
      },
      body: response.data.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('[Image Proxy] Error:', error.message);

    // Handle different error scenarios
    if (error.response) {
      return {
        statusCode: error.response.status,
        body: JSON.stringify({
          error: 'Failed to fetch image from MangaDex',
          status: error.response.status
        })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error while fetching image',
        message: error.message
      })
    };
  }
};
