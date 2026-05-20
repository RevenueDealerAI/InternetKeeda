import mongoose from 'mongoose';

export interface ISiteConfig extends mongoose.Document {
  siteName: string;
  siteDescription?: string;
  logo?: string;
  logoDark?: string;
  logoLight?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  showSiteNameWithLogo?: boolean;
  allowUserRegistration?: boolean;
  allowUserSubmissions?: boolean;
  requireApprovalForSubmissions?: boolean;
  contactEmail?: string;
  socialLinks?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    github?: string;
  };
  analyticsId?: string;
  customCss?: string;
  customJs?: string;
  adsenseEnabled?: boolean;
  adsensePublisherId?: string;
  adsenseAutoAds?: boolean;
  adsenseAdUnits?: Array<{
    id: string;
    adUnitId: string;
    position: 'header' | 'sidebar' | 'footer' | 'content-top' | 'content-bottom';
    enabled: boolean;
  }>;
  metaTags?: {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
  };
  defaultTheme?: 'light' | 'dark' | 'system';
  allowThemeToggle?: boolean;
  activeTheme?: 'theme-one' | 'theme-two';
  updatedAt?: Date;
  createdAt?: Date;
}

const siteConfigSchema = new mongoose.Schema({
  siteName: {
    type: String,
    required: true,
    default: 'InternetKeeda'
  },
  siteDescription: {
    type: String,
    default: 'A hand-curated directory of the best AI tools, updated daily.'
  },
  logo: {
    type: String,
    default: ''
  },
  logoDark: {
    type: String,
    default: ''
  },
  logoLight: {
    type: String,
    default: ''
  },
  favicon: { 
    type: String,
    default: '/favicon.ico'
  },
  primaryColor: {
    type: String,
    default: '#DC2626'
  },
  secondaryColor: {
    type: String,
    default: '#0F172A'
  },
  showSiteNameWithLogo: {
    type: Boolean,
    default: true
  },
  allowUserRegistration: { 
    type: Boolean,
    default: true
  },
  allowUserSubmissions: { 
    type: Boolean,
    default: true
  },
  requireApprovalForSubmissions: { 
    type: Boolean,
    default: true
  },
  requireApprovalForReviews: { 
    type: Boolean,
    default: true
  },
  footerText: {
    type: String,
    default: `© ${new Date().getFullYear()} InternetKeeda. All rights reserved.`
  },
  contactEmail: { 
    type: String,
    default: 'contact@example.com'
  },
  socialLinks: {
    twitter: { type: String, default: '' },
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' }
  },
  analyticsId: { 
    type: String,
    default: ''
  },
  customCss: {
    type: String,
    default: ''
  },
  customJs: {
    type: String,
    default: ''
  },
  adsenseEnabled: {
    type: Boolean,
    default: false
  },
  adsensePublisherId: {
    type: String,
    default: ''
  },
  adsenseAutoAds: {
    type: Boolean,
    default: true
  },
  adsenseAdUnits: {
    type: Array,
    default: []
  },
  metaTags: {
    type: Object,
    default: {
      title: 'InternetKeeda — Discover the Best AI Tools',
      description: 'A hand-curated directory of the best AI tools for builders, marketers, and creators. Updated daily.',
      keywords: 'AI tools directory, best AI tools, AI software, AI for productivity, AI for creators',
      ogImage: '/og-image.svg'
    }
  },
  defaultTheme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  allowThemeToggle: {
    type: Boolean,
    default: true
  },
  activeTheme: {
    type: String,
    default: 'theme-one',
    enum: ['theme-one', 'theme-two']
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

siteConfigSchema.statics.getSiteConfig = async function() {
  const config = await this.findOne();
  if (config) {
    return config;
  }
  return await this.create({});
};

let SiteConfigModel: mongoose.Model<ISiteConfig>;
if (mongoose.models.SiteConfig) {
  SiteConfigModel = mongoose.models.SiteConfig as unknown as mongoose.Model<ISiteConfig>;
} else {
  SiteConfigModel = mongoose.model('SiteConfig', siteConfigSchema) as unknown as mongoose.Model<ISiteConfig>;
}
export const SiteConfig = SiteConfigModel;

