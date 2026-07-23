

import CloudQueueIcon      from '@mui/icons-material/CloudQueue';
import WorkspacesIcon      from '@mui/icons-material/Workspaces';
import WindowIcon          from '@mui/icons-material/Window';
import BadgeIcon           from '@mui/icons-material/Badge';
import LockIcon            from '@mui/icons-material/Lock';
import DevicesOtherIcon    from '@mui/icons-material/DevicesOther';
import GppMaybeIcon        from '@mui/icons-material/GppMaybe';
import PhishingIcon        from '@mui/icons-material/Phishing';
import BugReportIcon       from '@mui/icons-material/BugReport';
import ShieldIcon          from '@mui/icons-material/Shield';
import ArticleIcon         from '@mui/icons-material/Article';
import VisibilityIcon      from '@mui/icons-material/Visibility';

// `logoUrl` can be either:
//   - a local path served from /public, e.g. '/logos/aws.svg'  (recommended — see note below)
//   - a full remote URL, e.g. 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/aws.svg'
//   - '' / undefined, in which case ProviderCard falls back to the MUI `Icon`
//
// Recommended: download the real SVG once (from dashboardicons.com or the
// vendor's own brand/press page) and drop it in public/logos/<key>.svg, then
// just set logoUrl: '/logos/<key>.svg' below. That avoids depending on a
// third-party CDN staying online/unchanged for a product your clients rely on.
export const BUILT_IN_PROVIDERS = [
  {
    key: 'aws',
    label: 'Amazon Web Services',
    shortLabel: 'AWS',
    accent: '#FF9900',
    Icon: CloudQueueIcon,
    logoUrl: '/logos/aws.svg',
    description: 'IAM, S3, CloudTrail, GuardDuty',
  },
  {
    key: 'gws',
    label: 'Google Workspace',
    shortLabel: 'Google WS',
    accent: '#4285F4',
    Icon: WorkspacesIcon,
    logoUrl: '/logos/google-workspace.svg',
    description: 'Admin SDK, Drive, Audit Logs',
  },
  {
    key: 'm365',
    label: 'Microsoft 365',
    shortLabel: 'M365',
    accent: '#0078D4',
    Icon: WindowIcon,
    logoUrl: '/logos/microsoft-365.svg',
    description: 'Azure AD, SharePoint, Defender',
  },
  {
    key: 'keka',
    label: 'Keka HR',
    shortLabel: 'Keka',
    accent: '#E84C3D',
    Icon: BadgeIcon,
    logoUrl: '/logos/keka.svg',
    description: 'Core HR, Leave, Attendance',
  },
  {
    key: 'vault',
    label: 'HashiCorp Vault',
    shortLabel: 'Vault',
    accent: '#000000',
    Icon: LockIcon,
    logoUrl: '/logos/hashicorp-vault.svg',
    description: 'Secrets, dynamic credentials, PKI',
  },
  {
    key: 'jumpcloud',
    configKey: 'jumpCloud',
    label: 'JumpCloud',
    shortLabel: 'JumpCloud',
    accent: '#14283D',
    Icon: DevicesOtherIcon,
    logoUrl: '/logos/jumpcloud.svg',
    description: 'Device & identity management',
  },
  {
    key: 'otx',
    label: 'OTX AlienVault',
    shortLabel: 'OTX',
    accent: '#00A8E0',
    Icon: GppMaybeIcon,
    logoUrl: '/logos/otx-alienvault.svg',
    description: 'Threat intelligence feed',
  },
  {
    key: 'gophish',
    label: 'GoPhish',
    shortLabel: 'GoPhish',
    accent: '#5D4E8C',
    Icon: PhishingIcon,
    logoUrl: '/logos/gophish.svg',
    description: 'Phishing simulation & training',
  },
  {
    key: 'snyk',
    label: 'Snyk',
    shortLabel: 'Snyk',
    accent: '#4C4A73',
    Icon: BugReportIcon,
    logoUrl: '/logos/snyk.svg',
    description: 'Code & dependency scanning',
  },
  {
    key: 'cloudflare',
    label: 'Cloudflare',
    shortLabel: 'Cloudflare',
    accent: '#F38020',
    Icon: ShieldIcon,
    logoUrl: '/logos/cloudflare.svg',
    description: 'WAF, firewall, TLS enforcement',
  },
  {
    key: 'notion',
    label: 'Notion',
    shortLabel: 'Notion',
    accent: '#000000',
    Icon: ArticleIcon,
    logoUrl: '/logos/notion.svg',
    description: 'Policy & documentation tracking',
  },
  {
    key: 'wazuh',
    label: 'Wazuh',
    shortLabel: 'Wazuh',
    accent: '#3253DC',
    Icon: VisibilityIcon,
    logoUrl: '/logos/wazuh.svg',
    description: 'Vulnerability & log monitoring',
  },
  {
  key: 'confluence',
  label: 'Confluence',
  description: 'Policy & documentation tracking',
  Icon: ShieldIcon, // or whatever fallback icon import you use elsewhere
  logoUrl: '/logos/confluence.svg',
  accent: '#172B4D',
},
{
  key: 'pfsense',
  label: 'pfSense',
  description: 'Firewall rules & network segmentation',
  Icon: VisibilityIcon, // fallback icon
  logoUrl: '/logos/pfsense.svg',
  accent: '#212121',
},
{
  key: 'crowdstrike',
  label: 'CrowdStrike Falcon',
  accent: '#E01F27',
  description: 'Endpoint protection, vulnerability exposure, and threat detections.',
  Icon: ShieldIcon,
  logoUrl: '/logos/crowdstrike.svg', 
},
{
  key: 'owaspzap',
  label: 'OWASP ZAP',
  accent: '#4B0082',
  description: 'Dynamic application security testing (DAST) findings by risk.',
  Icon: BugReportIcon,
  logoUrl: '/logos/owaspzap.svg', // optional — falls back to Icon if missing
  configKey: 'owaspZap', 
},
{
  key: 'keycloak',
  label: 'Keycloak',
  description: 'Open-source identity & access management',
  Icon: ShieldIcon, // or whatever fallback icon import you use elsewhere — SecurityIcon, LockIcon, etc.
  logoUrl: '/logos/keycloak.svg',
  accent: '#4D4D4D',
},
];

export const TYPE_COLORS = {
  CLOUD: 'primary', HRMS: 'secondary', IAM: 'warning',
  TICKETING: 'info', COMMUNICATION: 'success', CUSTOM: 'default',
};