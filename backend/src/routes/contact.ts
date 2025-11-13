import { Router, Request, Response } from 'express';
import { z } from 'zod';
import nodemailer from 'nodemailer';

export const router = Router();

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject is too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000, 'Message is too long'),
});

// Create transporter for sending emails
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'mail.crossify.io',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: 'webapp@crossify.io',
      pass: '~SqTis20uvRq89N,',
    },
  });
};

// POST /contact
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('📧 Contact form received:', {
      body: req.body,
      headers: req.headers['content-type'],
      method: req.method,
    });
    
    const data = contactSchema.parse(req.body);

    // Return success immediately - don't wait for emails
    res.json({
      success: true,
      message: 'Message sent successfully',
    });

    // Send emails in background (non-blocking)
    const transporter = createTransporter();

    // Email content
    const mailOptions = {
      from: 'webapp@crossify.io',
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
      text: `
New Contact Form Submission

Name: ${data.name}
Email: ${data.email}
Subject: ${data.subject}

Message:
${data.message}
      `,
    };

    // Send contact email (non-blocking)
    transporter.sendMail(mailOptions)
      .then(() => console.log('✅ Contact email sent successfully'))
      .catch((err) => console.error('❌ Failed to send contact email:', err));

    // Send confirmation email to user (non-blocking)
    const confirmationMailOptions = {
      from: 'webapp@crossify.io',
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
      text: `
Thank you for contacting us!

Hi ${data.name},

We've received your message and will get back to you as soon as possible.

Your message:
${data.message}

Best regards,
The Crossify.io Team
      `,
    };

    transporter.sendMail(confirmationMailOptions)
      .then(() => console.log('✅ Confirmation email sent successfully'))
      .catch((err) => console.error('❌ Failed to send confirmation email:', err));
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




