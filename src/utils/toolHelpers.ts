import { Tool as ApiTool } from '@/types/tool';
import { Tool as MockTool, getToolLogoUrl as getMockToolLogoUrl } from '@/data/mockData';

function isValidDomain(domain: string): boolean {
  if (!domain || typeof domain !== 'string') return false;
  
  const trimmed = domain.trim().toLowerCase();
  
  if (trimmed.length === 0 || trimmed.length > 253) return false;
  
  const domainRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
  
  if (!domainRegex.test(trimmed)) return false;
  
  const parts = trimmed.split('.');
  if (parts.length < 2) return false;
  
  const tld = parts[parts.length - 1];
  
  if (tld.length < 2 || tld.length > 63) return false;
  
  const invalidPatterns = [
    'test', 'example', 'localhost', 'invalid', 'fake', 'dummy',
    'preview.codecanyon', 'staging', 'local', '127.0.0.1'
  ];
  
  const domainWithoutTld = parts.slice(0, -1).join('.');
  if (invalidPatterns.some(pattern => trimmed.includes(pattern))) {
    return false;
  }
  
  const suspiciousPatterns = [
    /^[a-z]{1,3}$/, 
    /^[0-9]+$/, 
    /^[a-z]+[0-9]+[a-z]+$/
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(domainWithoutTld))) {
    return false;
  }
  
  return true;
}

function extractDomain(url: string): string | null {
  try {
    if (!url || typeof url !== 'string') return null;
    
    let cleanUrl = url.trim();
    
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    
    const urlObj = new URL(cleanUrl);
    let domain = urlObj.hostname;
    
    domain = domain.replace(/^www\./, '');
    
    if (domain && domain.length > 0 && domain.includes('.')) {
      if (isValidDomain(domain)) {
        return domain;
      }
      return null;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

function isValidLogoUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  const trimmed = url.trim();
  if (trimmed.length === 0) return false;
  
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      new URL(trimmed);
      return true;
    } catch {
      return false;
    }
  }
  
  return false;
}

export const getToolLogo = (tool: ApiTool | MockTool | undefined): string => {
  if (!tool) {
    return `https://ui-avatars.com/api/?name=Tool&background=6366f1&color=fff&bold=true&format=svg`;
  }

  const toolName = tool.name || 'Tool';

  if ('logo' in tool && tool.logo && tool.logo.trim()) {
    const logoUrl = tool.logo.trim();
    
    if (logoUrl.includes('logo.clearbit.com')) {
      if ('websiteUrl' in tool && tool.websiteUrl) {
        
        const domain = extractDomain(tool.websiteUrl);
        if (domain && isValidDomain(domain)) {
          const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
          return googleFaviconUrl;
        }
      } else {
        // get the domain from the logo url
        const domain = logoUrl.split('/').pop();
        if (domain) {
          return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        }
      }
    } else if (isValidLogoUrl(logoUrl)) {
      return logoUrl;
    }
  }
  
  if ('imageUrl' in tool && tool.imageUrl && isValidLogoUrl(tool.imageUrl)) {
    return tool.imageUrl;
  }
  
  if ('website' in tool && tool.website) {
    const mockUrl = getMockToolLogoUrl(tool as MockTool);
    return mockUrl;
  }
  
  if ('websiteUrl' in tool && tool.websiteUrl) {
    const domain = extractDomain(tool.websiteUrl);
    if (domain && isValidDomain(domain)) {
      const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      return googleFaviconUrl;
    } else {
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(toolName)}&background=6366f1&color=fff&bold=true&format=svg`;
      return avatarUrl;
    }
  }
  const finalFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(toolName)}&background=6366f1&color=fff&bold=true&format=svg`;
  return finalFallback;
}; 