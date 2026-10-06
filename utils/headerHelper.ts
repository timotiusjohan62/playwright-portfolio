export interface HeaderOptions {
  customHeaders?: Record<string, string> | string; // Can handle JSON string from SQLite or native object
}

export function buildHeaders(options: HeaderOptions = {}): Record<string, string> {
  // 1. Start with standard default headers
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  // 4. Merge custom headers if they were passed (handling both SQLite JSON strings and objects)
  if (options.customHeaders) {
    let parsedCustomHeaders = options.customHeaders;
    
    // If SQLite stored it as a text JSON string, parse it safely
    if (typeof options.customHeaders === 'string') {
      try {
        parsedCustomHeaders = JSON.parse(options.customHeaders);
      } catch (e) {
        console.warn('Failed to parse custom headers from database string:', e);
        parsedCustomHeaders = {};
      }
    }

    // Merge them into the main headers object
    Object.assign(headers, parsedCustomHeaders);
  }

  return headers;
}