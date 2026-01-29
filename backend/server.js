const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();

// ==========================================
// CORS CONFIGURATION
// ==========================================
const allowedOrigins = [
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://192.168.100.21:8080',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://sharaywhiskandwillow.netlify.app'
];

// Add environment variable origins if specified
if (process.env.FRONTEND_URL) {
  const envOrigins = process.env.FRONTEND_URL.split(',');
  envOrigins.forEach(origin => {
    if (trimmedOrigin && !allowedOrigins.includes(trimmedOrigin)) {
      allowedOrigins.push(trimmedOrigin);
    }
  });
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(express.json({
  limit: '10mb', // Increased limit for potential file uploads
  extended: true
}));

app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// ==========================================
// STATIC FILE SERVING
// ==========================================
app.use('/favicon.ico', express.static(path.join(__dirname, '../frontend/images/favicon.ico')));
app.use('/favicon.png', express.static(path.join(__dirname, '../frontend/images/favicon.png')));

// Serve uploaded images if needed
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// DATABASE CONNECTION
// ==========================================
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('❌ MONGODB_URI is not defined in environment variables');
      process.exit(1);
    }
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
    // Event listeners for MongoDB connection
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    
    // In production, we might want to retry connection
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Retrying connection in 5 seconds...');
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1);
    }
  }
};

connectDB();

// ==========================================
// DATABASE SCHEMAS & MODELS
// ==========================================

// Contact Schema with enhanced validation
const contactSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
  },
  phone: { 
    type: String, 
    trim: true,
    match: [/^[\d\s+\-()]{10,}$/, 'Please enter a valid phone number']
  },
  orderType: { 
    type: String, 
    enum: ['wedding-cake', 'birthday-cake', 'pastries', 'bread', 'corporate', 'other', 'custom', ''],
    default: ''
  },
  message: { 
    type: String, 
    required: [true, 'Message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters'],
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  status: { 
    type: String, 
    enum: ['new', 'read', 'replied', 'archived', 'spam'],
    default: 'new' 
  },
  ipAddress: String,
  userAgent: String,
  referrer: String,
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
contactSchema.index({ email: 1, createdAt: -1 });
contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ orderType: 1 });

const Contact = mongoose.model('Contact', contactSchema);

// Optional: Analytics Schema for tracking form submissions
const analyticsSchema = new mongoose.Schema({
  formType: String,
  ipAddress: String,
  userAgent: String,
  referrer: String,
  submissionData: Object,
  createdAt: { type: Date, default: Date.now }
});

const Analytics = mongoose.model('Analytics', analyticsSchema);

// ==========================================
// EMAIL NOTIFICATION SERVICE
// ==========================================
async function sendEmailNotification(data, req) {
  // Check if Resend is configured
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith('re_xxxx')) {
    console.log('⚠️  Resend API key not configured or using placeholder. Skipping email notification.');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const orderTypeLabels = {
      'wedding-cake': 'Wedding Cake',
      'birthday-cake': 'Birthday Cake',
      'pastries': 'Pastries',
      'bread': 'Bread',
      'corporate': 'Corporate Order',
      'custom': 'Custom Order',
      'other': 'Other',
      '': 'General Inquiry'
    };

    const clientIP = req?.ip || req?.connection?.remoteAddress || 'Unknown';
    const userAgent = req?.headers['user-agent'] || 'Unknown';
    
    const emailData = {
      from: process.env.FROM_EMAIL || 'ShaRay Whisk&Willow <contact@sharaybakery.com>',
      to: process.env.NOTIFICATION_EMAIL?.split(',') || 'admin@sharaybakery.com',
      subject: `New Inquiry: ${data.orderType ? orderTypeLabels[data.orderType] : 'Contact'} from ${data.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    background: #f5f5f5;
                    margin: 0;
                    padding: 0;
                }
                .container { 
                    max-width: 600px; 
                    margin: 20px auto; 
                    background: white;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }
                .header { 
                    background: linear-gradient(135deg, #D4AF37, #C9A961); 
                    color: white; 
                    padding: 30px; 
                    text-align: center; 
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 300;
                    letter-spacing: 2px;
                }
                .content { 
                    padding: 30px; 
                }
                .field { 
                    margin-bottom: 20px; 
                    padding-bottom: 20px;
                    border-bottom: 1px solid #f0f0f0;
                }
                .field:last-child {
                    border-bottom: none;
                }
                .label { 
                    font-weight: 600; 
                    color: #D4AF37; 
                    text-transform: uppercase;
                    font-size: 12px;
                    letter-spacing: 1px;
                    margin-bottom: 8px;
                }
                .value { 
                    color: #333;
                    font-size: 15px;
                    line-height: 1.6;
                }
                .value a {
                    color: #D4AF37;
                    text-decoration: none;
                }
                .footer { 
                    text-align: center; 
                    padding: 20px; 
                    background: #f9f9f9;
                    color: #666; 
                    font-size: 12px; 
                }
                .badge {
                    display: inline-block;
                    padding: 6px 12px;
                    background: #D4AF37;
                    color: white;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                .meta {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 5px;
                    margin-top: 20px;
                    font-size: 12px;
                    color: #666;
                }
                .meta div {
                    margin-bottom: 5px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🍰 SHARAY WHISK&WILLOW</h1>
                    <p style="margin: 10px 0 0 0; font-size: 14px;">New Contact Form Submission</p>
                </div>
                <div class="content">
                    ${data.orderType ? `
                    <div class="field">
                        <div class="label">Order Type</div>
                        <div class="value">
                            <span class="badge">${orderTypeLabels[data.orderType]}</span>
                        </div>
                    </div>
                    ` : ''}
                    <div class="field">
                        <div class="label">Name</div>
                        <div class="value">${data.name}</div>
                    </div>
                    <div class="field">
                        <div class="label">Email</div>
                        <div class="value"><a href="mailto:${data.email}">${data.email}</a></div>
                    </div>
                    <div class="field">
                        <div class="label">Phone</div>
                        <div class="value">${data.phone || 'Not provided'}</div>
                    </div>
                    <div class="field">
                        <div class="label">Message</div>
                        <div class="value">${data.message.replace(/\n/g, '<br>')}</div>
                    </div>
                    <div class="meta">
                        <div><strong>Submitted:</strong> ${new Date().toLocaleString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</div>
                        <div><strong>IP Address:</strong> ${clientIP}</div>
                        <div><strong>User Agent:</strong> ${userAgent}</div>
                    </div>
                </div>
                <div class="footer">
                    <p>This email was automatically generated from your website contact form.</p>
                    <p style="margin-top: 10px;">
                        <a href="${process.env.FRONTEND_URL || 'https://sharaywhiskandwillow.netlify.app'}/admin.html" style="color: #D4AF37; text-decoration: none;">
                            👨‍💻 View in Admin Dashboard
                        </a>
                    </p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    const result = await resend.emails.send(emailData);
    console.log('📧 Email notification sent successfully:', result.id);
    return { success: true, id: result.id };
    
  } catch (error) {
    console.error('❌ Email notification error:', error.message);
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
}

// ==========================================
// ROUTE HANDLERS
// ==========================================

// POST /api/contact - Submit contact form
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, orderType, message } = req.body;
    
    // Enhanced validation with detailed error messages
    const errors = [];
    
    if (!name || name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }
    
    if (!email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (!message || message.trim().length < 1) {
      errors.push('Message must be at least 1 character');
    }
    
    if (phone && !/^[\d\s+\-()]{10,}$/.test(phone.replace(/\s/g, ''))) {
      errors.push('Please enter a valid phone number');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: errors 
      });
    }

    // Get client information
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const referrer = req.headers.referer || req.headers.referrer;
    
    // Save to database with additional metadata
    const newContact = new Contact({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      orderType: orderType || '',
      message: message.trim(),
      ipAddress: clientIP,
      userAgent: userAgent,
      referrer: referrer
    });

    await newContact.save();
    console.log('✅ Contact saved to database:', newContact._id);
    
    // Track analytics
    try {
      const analyticsRecord = new Analytics({
        formType: 'contact',
        ipAddress: clientIP,
        userAgent: userAgent,
        referrer: referrer,
        submissionData: { name, email, orderType }
      });
      await analyticsRecord.save();
    } catch (analyticsError) {
      console.warn('⚠️ Analytics tracking failed:', analyticsError.message);
    }
    
    // Send email notification (non-blocking)
    sendEmailNotification({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      orderType: orderType || '',
      message: message.trim()
    }, req).then(emailResult => {
      if (emailResult.success) {
        console.log('📧 Email sent in background');
      } else {
        console.warn('⚠️ Background email failed:', emailResult.error);
      }
    }).catch(emailError => {
      console.warn('⚠️ Background email error:', emailError.message);
    });

    res.status(201).json({ 
      success: true, 
      message: 'Thank you for reaching out! We\'ll get back to you within 24 hours.',
      id: newContact._id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error processing contact form:', error);
    
    // Check for MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Duplicate submission detected' 
      });
    }
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: errors 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error. Please try again later.',
      reference: `ERR-${Date.now()}`
    });
  }
});

// GET /api/contacts - Get all contacts with pagination and filtering
app.get('/api/contacts', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      orderType,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc' 
    } = req.query;
    
    // Build query
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (orderType && orderType !== 'all') {
      query.orderType = orderType;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count
    const total = await Contact.countDocuments(query);
    
    // Get paginated results
    const contacts = await Contact.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limitNum)
      .select('-__v'); // Exclude version key
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    
    res.json({ 
      success: true, 
      data: contacts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching contacts:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/contacts/stats - Get contact statistics
app.get('/api/contacts/stats', async (req, res) => {
  try {
    const stats = await Contact.aggregate([
      {
        $facet: {
          totalContacts: [{ $count: 'count' }],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          byOrderType: [
            { $match: { orderType: { $ne: '' } } },
            { $group: { _id: '$orderType', count: { $sum: 1 } } }
          ],
          recentSubmissions: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            { $project: { name: 1, email: 1, orderType: 1, createdAt: 1 } }
          ]
        }
      }
    ]);
    
    res.json({
      success: true,
      data: stats[0]
    });
    
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/contact/:id - Get single contact
app.get('/api/contact/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }
    
    res.json({
      success: true,
      data: contact
    });
    
  } catch (error) {
    console.error('❌ Error fetching contact:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/contact/:id - Update contact
app.put('/api/contact/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const updateData = { updatedAt: Date.now() };
    
    if (status && ['new', 'read', 'replied', 'archived', 'spam'].includes(status)) {
      updateData.status = status;
    }
    
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    res.json({
      success: true,
      data: contact,
      message: 'Contact updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating contact:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/contact/:id - Delete contact
app.delete('/api/contact/:id', async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact deleted successfully',
      id: req.params.id
    });
    
  } catch (error) {
    console.error('❌ Error deleting contact:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/bulk/contacts - Bulk actions
app.post('/api/bulk/contacts', async (req, res) => {
  try {
    const { ids, action } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No contact IDs provided'
      });
    }
    
    let result;
    
    switch (action) {
      case 'archive':
        result = await Contact.updateMany(
          { _id: { $in: ids } },
          { status: 'archived', updatedAt: Date.now() }
        );
        break;
        
      case 'delete':
        result = await Contact.deleteMany({ _id: { $in: ids } });
        break;
        
      case 'mark-read':
        result = await Contact.updateMany(
          { _id: { $in: ids } },
          { status: 'read', updatedAt: Date.now() }
        );
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
    }
    
    res.json({
      success: true,
      message: `Successfully ${action}ed ${result.modifiedCount || result.deletedCount} contacts`
    });
    
  } catch (error) {
    console.error('❌ Error in bulk action:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// HEALTH CHECK & SYSTEM STATUS
// ==========================================
app.get('/health', (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    memory: process.memoryUsage(),
    mongodb: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      database: mongoose.connection.name,
      host: mongoose.connection.host
    },
    services: {
      email: process.env.RESEND_API_KEY ? 'configured' : 'not_configured'
    }
  };
  
  // Add response time
  const startTime = req._startTime || Date.now();
  healthData.responseTime = `${Date.now() - startTime}ms`;
  
  res.json(healthData);
});

app.get('/system/status', async (req, res) => {
  try {
    // Get recent stats
    const recentContacts = await Contact.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    const statusData = {
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        loadavg: process.loadavg ? process.loadavg() : 'N/A'
      },
      database: {
        connected: mongoose.connection.readyState === 1,
        collections: Object.keys(mongoose.connection.collections)
      },
      metrics: {
        totalContacts: await Contact.countDocuments(),
        contactsLast24h: recentContacts,
        newContacts: await Contact.countDocuments({ status: 'new' })
      }
    };
    
    res.json({
      success: true,
      data: statusData
    });
    
  } catch (error) {
    console.error('❌ Error getting system status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// ERROR HANDLING MIDDLEWARE
// ==========================================

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ 
    success: false, 
    error: `Route not found: ${req.method} ${req.originalUrl}` 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Global Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  const statusCode = err.status || 500;
  const errorResponse = {
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    timestamp: new Date().toISOString()
  };
  
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err.details;
  }
  
  res.status(statusCode).json(errorResponse);
});

// ==========================================
// SERVER STARTUP
// ==========================================
const PORT = process.env.PORT || 3000;

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  // Don't exit in production, let the process manager handle it
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 ShaRay Whisk&Willow Backend Server');
  console.log('='.repeat(50));
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${mongoose.connection.name || 'Connecting...'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`🖥️ Frontend Dashboard: http://localhost:8080/admin.html`);
  console.log('='.repeat(50) + '\n');
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received, starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('👋 HTTP server closed');
    
    // Close MongoDB connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('📊 MongoDB connection closed');
    }
    
    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⏰ Could not close connections in time, forcing shutdown');
    process.exit(1);
  }, 10000);
};

// Listen for shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Export for testing
module.exports = { app, server, mongoose };