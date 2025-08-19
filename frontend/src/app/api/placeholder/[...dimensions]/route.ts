import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dimensions: string[] }> }
) {
  try {
    const { dimensions } = await params;
    
    // Parse dimensions from URL path
    let width = 400;
    let height = 250;
    
    if (dimensions && dimensions.length >= 1) {
      width = parseInt(dimensions[0]) || 400;
    }
    
    if (dimensions && dimensions.length >= 2) {
      height = parseInt(dimensions[1]) || 250;
    }
    
    // Limit dimensions for security
    width = Math.min(Math.max(width, 1), 2000);
    height = Math.min(Math.max(height, 1), 2000);
    
    // Generate SVG placeholder
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">
          ${width} × ${height}
        </text>
      </svg>
    `;
    
    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Placeholder image generation error:', error);
    return new NextResponse('Error generating placeholder image', { status: 500 });
  }
}