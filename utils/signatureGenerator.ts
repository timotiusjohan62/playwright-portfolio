import * as CryptoJS from 'crypto-js';

export function getSignedHeaders(method: string, urlPath: string, requestBody?: any) {
    const apiKey = process.env.API_KEY;
    const signatureKey = process.env.SIGNATURE_KEY;

    if (!apiKey || !signatureKey) {
        throw new Error('API_KEY or SIGNATURE_KEY is missing from environment variables.');
    }

    // 1. Generate timestamp
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    const timezoneOffset = -now.getTimezoneOffset();
    const sign = timezoneOffset >= 0 ? '+' : '-';
    const offsetHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
    const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');
    const timezone = `${sign}${offsetHours}:${offsetMinutes}`;

    const timestamp = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${timezone}`;
    
    // 2. Handle request body (minify JSON if present)
    let minifiedBody = '';
    if (requestBody) {
        try {
            const parsedBody = typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody;
            minifiedBody = JSON.stringify(parsedBody);
        } catch (e) {
            minifiedBody = typeof requestBody === 'string' ? requestBody : '';
        }
    }

    // 3. Concatenate request data (matches Postman: Method:Endpoint:Body:Timestamp)
    const text_str = `${method}:${urlPath}:${minifiedBody}:${timestamp}`;
    console.log('String to sign:', text_str);

    // 4. Generate HMAC SHA256 signature
    const hash = CryptoJS.HmacSHA256(text_str, signatureKey);
    const signature = CryptoJS.enc.Base64.stringify(hash);

    return {
        'x-timestamp': timestamp,
        'x-signature': signature,
        'apiKey': apiKey
    };
}