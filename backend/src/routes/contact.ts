import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Resend } from 'resend';

export const router = Router();

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject is too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000, 'Message is too long'),
});

// Initialize Resend (cloud email service that works from Railway)
// Get API key from: https://resend.com/api-keys
// Set RESEND_API_KEY environment variable in Railway
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key');

// POST /contact
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('📧 Contact form received:', {
      body: req.body,
      headers: req.headers['content-type'],
      method: req.method,
    });
    
    const data = contactSchema.parse(req.body);

    console.log('✅ Form validation passed, preparing to send emails...');

    // Return success immediately - don't wait for emails
    res.json({
      success: true,
      message: 'Message sent successfully',
    });

    console.log('✅ Response sent, starting email sending process...');

    // Send contact email to webapp@crossify.io (non-blocking)
    console.log('📧 Attempting to send contact email to: webapp@crossify.io');
    
    resend.emails.send({
      from: 'Crossify <onboarding@resend.dev>', // Will need to verify domain or use Resend's domain
      to: 'webapp@crossify.io',
      replyTo: data.email,
      subject: `[Crossify Contact] ${data.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">New Contact Form Submission</h2>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Subject:</strong> ${data.subject}</p>
          </div>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="color: #1f2937; margin-top: 0;">Message:</h3>
            <p style="color: #4b5563; white-space: pre-wrap;">${data.message}</p>
          </div>
          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
            This email was sent from the Crossify.io contact form.
          </p>
        </div>
      `,
    })
      .then((response) => {
        console.log('✅ Contact email sent successfully');
        console.log('📧 Email response:', response);
      })
      .catch((err: any) => {
        console.error('❌ Failed to send contact email:', err);
        console.error('📧 Error details:', err);
      });

    // Send confirmation email to user (non-blocking)
    console.log('📧 Attempting to send confirmation email to:', data.email);
    
    resend.emails.send({
      from: 'Crossify <onboarding@resend.dev>',
      to: data.email,
      subject: 'Thank you for contacting Crossify.io',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Thank you for contacting us!</h2>
          <p>Hi ${data.name},</p>
          <p>We've received your message and will get back to you as soon as possible.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Your message:</strong></p>
            <p style="color: #4b5563; white-space: pre-wrap;">${data.message}</p>
          </div>
          <p>Best regards,<br>The Crossify.io Team</p>
        </div>
      `,
    })
      .then((response) => {
        console.log('✅ Confirmation email sent successfully');
        console.log('📧 Confirmation response:', response);
      })
      .catch((err: any) => {
        console.error('❌ Failed to send confirmation email:', err);
        console.error('📧 Confirmation error details:', err);
      });
  } catch (error: any) {
    console.error('Contact form error:', error);
    
    if (error instanceof z.ZodError) {
      // Get the first error message for simplicity
      const firstError = error.errors[0];
      const errorMessage = firstError ? `${firstError.path.join('.')}: ${firstError.message}` : 'Please check all fields and try again';
      return res.status(400).json({
        error: errorMessage,
      });
    }

    res.status(500).json({
      error: 'Failed to send message. Please try again later.',
    });
  }
});




