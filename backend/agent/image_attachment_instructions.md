# Image Attachment Feature Instructions for AI Agent

## Overview
The LeakerFlow platform now supports image attachment functionality in article creation. This document provides comprehensive instructions for the AI agent on how to utilize this new feature when creating articles.

## Feature Capabilities

### 1. Image Upload Methods
The ArticleEditor component supports two methods for adding images:

#### A. File Upload
- Users can upload image files directly (JPG, PNG, GIF)
- Maximum file size: 5MB
- Files are converted to Base64 format for API transmission
- Automatic image preview generation

#### B. Image URL
- Users can provide direct URLs to images
- URL validation is performed
- Supports external image hosting services

### 2. Image Metadata
For each image, the following metadata can be provided:
- **Alt Text**: Required for accessibility (screen readers)
- **Caption**: Optional descriptive text displayed with the image
- **Image Data**: Base64 encoded image content (for uploads)

### 3. API Integration
The image data is sent to the backend through these fields:
- `image_data`: Base64 encoded image content
- `image_alt`: Alternative text for accessibility
- `image_caption`: Optional caption text

## Instructions for AI Agent

### When Creating Articles with Images

1. **Always Include Relevant Images**
   - For technology articles, include screenshots, product images, or relevant graphics
   - For news articles, include related photos or illustrations
   - For tutorials, include step-by-step visual guides

2. **Image Selection Guidelines**
   - Choose high-quality, relevant images
   - Prefer official sources when available
   - Ensure images are appropriate for the article content
   - Consider copyright and licensing requirements

3. **Alt Text Best Practices**
   - Write descriptive alt text for accessibility
   - Keep it concise but informative (50-125 characters)
   - Describe what's in the image, not just the topic
   - Example: "Screenshot of GTA 6 showing Vice City skyline at sunset"

4. **Caption Guidelines**
   - Provide context or additional information
   - Can be longer than alt text
   - Include source attribution when necessary
   - Example: "Official screenshot from Rockstar Games showcasing the updated Vice City in Grand Theft Auto VI"

### Implementation Examples

#### Example 1: Technology Article
```
Title: "New iPhone 15 Features Revealed"
Image URL: "https://apple.com/iphone15/hero-image.jpg"
Alt Text: "iPhone 15 Pro in titanium finish showing Dynamic Island"
Caption: "The new iPhone 15 Pro features a titanium design and enhanced Dynamic Island functionality"
```

#### Example 2: Gaming Article
```
Title: "GTA 6 Release Date Confirmed"
Image URL: "https://rockstargames.com/gta6/screenshot1.jpg"
Alt Text: "GTA 6 gameplay screenshot showing Vice City streets"
Caption: "First official gameplay footage from Grand Theft Auto VI, set in a reimagined Vice City"
```

### Technical Implementation

When the AI agent creates articles, it should:

1. **Search for Appropriate Images**
   - Use web search to find relevant, high-quality images
   - Prefer official sources (company websites, press releases)
   - Verify image URLs are accessible

2. **Generate Proper Metadata**
   - Create descriptive alt text for accessibility
   - Write informative captions that add value
   - Ensure metadata is relevant to the article content

3. **Include in Article Creation**
   - Add image URL to the `image_url` field
   - Provide alt text in the `image_alt` field
   - Include caption in the `image_caption` field

### Current Implementation Status

The ArticleEditor component includes:
- ✅ Image upload functionality with drag-and-drop
- ✅ Image URL input with validation
- ✅ Alt text and caption fields
- ✅ Image preview with remove option
- ✅ Base64 conversion for file uploads
- ✅ Integration with article creation/update APIs
- ✅ Validation for file size and type
- ✅ Loading states during image processing

### Sample Article Creation Flow

1. **Research Phase**
   - Search for article topic
   - Identify relevant images from reliable sources
   - Verify image accessibility and quality

2. **Content Creation**
   - Write article title, content, and metadata
   - Select the most appropriate image
   - Generate descriptive alt text
   - Create informative caption

3. **Article Submission**
   - Include image URL in article data
   - Provide alt text and caption
   - Submit complete article with image metadata

### Quality Standards

#### Image Quality
- Minimum resolution: 800x600 pixels
- Prefer high-resolution images when available
- Ensure images are clear and relevant

#### Accessibility
- Always provide meaningful alt text
- Describe the image content, not just the topic
- Keep alt text concise but descriptive

#### Content Relevance
- Images must be directly related to article content
- Avoid generic stock photos when specific images are available
- Prefer official sources for product/company articles

### Error Handling

The agent should handle these scenarios:
- **Invalid Image URLs**: Verify URLs are accessible before submission
- **Large File Sizes**: Ensure uploaded files are under 5MB
- **Missing Alt Text**: Always provide alt text for accessibility
- **Copyright Issues**: Use only appropriately licensed images

### Integration with Existing Workflow

The image attachment feature integrates seamlessly with:
- Article creation and editing workflows
- Auto-save functionality
- Form validation
- Preview generation
- Publishing process

## Conclusion

The image attachment feature significantly enhances the article creation experience by allowing rich visual content. The AI agent should leverage this functionality to create more engaging and informative articles while maintaining high standards for accessibility and content quality.

When creating articles, always consider whether an image would enhance the reader's understanding and experience, and include appropriate visual content with proper metadata.